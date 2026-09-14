import {
  getQuickJS,
  isSuccess,
  type QuickJSContext,
  type QuickJSHandle,
  type QuickJSWASMModule,
} from "quickjs-emscripten";
import type { RequestDefinition } from "../../shared/request-types";
import type {
  ScriptExecutionInput,
  ScriptExecutionOutput,
} from "./script-types";

let quickJSModule: QuickJSWASMModule | null = null;

// Exposes the `pm` API surface to user scripts. The request and environment
// are injected as QuickJS globals before this bootstrap runs. Headers and query
// mutate the underlying arrays in place; `__sync` copies scalar fields back.
// SHA-256/HMAC are implemented in JS (rather than host functions) because
// returning strings from quickjs-emscripten host functions leaks references.
const BOOTSTRAP = `
(function () {
  var request = globalThis.__request;
  var environment = globalThis.__environment;
  var globals = globalThis.__globals;
  var urlInfo = globalThis.__urlInfo || { host: "", path: [] };
  var logs = [];

  function utf8Bytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
        var next = str.charCodeAt(i + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          var cp = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
          bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
          i += 1;
          continue;
        }
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
    }
    return bytes;
  }

  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  function sha256(bytes) {
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    var H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];
    var len = bytes.length;
    var bitLow = (len << 3) >>> 0;
    var bitHigh = Math.floor(len / 0x20000000);
    var padded = bytes.slice();
    padded.push(0x80);
    while ((padded.length % 64) !== 56) { padded.push(0); }
    var lengthBytes = [
      bitHigh >>> 24, (bitHigh >>> 16) & 0xff, (bitHigh >>> 8) & 0xff, bitHigh & 0xff,
      bitLow >>> 24, (bitLow >>> 16) & 0xff, (bitLow >>> 8) & 0xff, bitLow & 0xff,
    ];
    for (var li = 0; li < 8; li++) { padded.push(lengthBytes[li]); }

    var w = new Array(64);
    for (var offset = 0; offset < padded.length; offset += 64) {
      var i;
      for (i = 0; i < 16; i++) {
        var b = offset + i * 4;
        w[i] = ((padded[b] << 24) | (padded[b + 1] << 16) | (padded[b + 2] << 8) | padded[b + 3]) >>> 0;
      }
      for (i = 16; i < 64; i++) {
        var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3];
      var e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    var out = [];
    for (var i = 0; i < 8; i++) {
      out.push((H[i] >>> 24) & 0xff, (H[i] >>> 16) & 0xff, (H[i] >>> 8) & 0xff, H[i] & 0xff);
    }
    return out;
  }

  function toHex(bytes) {
    var out = "";
    for (var i = 0; i < bytes.length; i++) {
      out += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16);
    }
    return out;
  }

  function hmacSha256Hex(key, message) {
    var keyBytes = utf8Bytes(key);
    var messageBytes = utf8Bytes(message);
    if (keyBytes.length > 64) { keyBytes = sha256(keyBytes); }
    var innerPad = [];
    var outerPad = [];
    for (var i = 0; i < 64; i++) {
      var k = i < keyBytes.length ? keyBytes[i] : 0;
      innerPad.push(k ^ 0x36);
      outerPad.push(k ^ 0x5c);
    }
    return toHex(sha256(outerPad.concat(sha256(innerPad.concat(messageBytes)))));
  }

  function makeList(entries, caseInsensitive) {
    function normalizeKey(key) {
      var value = String(key);
      return caseInsensitive ? value.toLowerCase() : value;
    }
    function indexOf(key) {
      var needle = normalizeKey(key);
      for (var i = 0; i < entries.length; i++) {
        if (normalizeKey(entries[i].key) === needle) { return i; }
      }
      return -1;
    }
    function upsert(key, value) {
      var idx = indexOf(key);
      if (idx >= 0) {
        entries[idx].value = String(value);
        entries[idx].enabled = true;
      } else {
        entries.push({
          id: "script-" + Math.random().toString(36).slice(2),
          key: String(key),
          value: String(value),
          enabled: true,
        });
      }
    }
    function removeAll(key) {
      var idx;
      while ((idx = indexOf(key)) >= 0) { entries.splice(idx, 1); }
    }
    return {
      set: function (key, value) { upsert(key, value); },
      add: function (item, value) {
        if (value !== undefined) { upsert(item, value); }
        else if (item && typeof item === "object") { upsert(item.key, item.value); }
        else { upsert(item, undefined); }
      },
      has: function (key) { return indexOf(key) >= 0; },
      get: function (key) {
        var idx = indexOf(key);
        return idx >= 0 ? entries[idx].value : undefined;
      },
      all: function () {
        var out = [];
        for (var i = 0; i < entries.length; i++) {
          out.push({ key: entries[i].key, value: entries[i].value, enabled: entries[i].enabled });
        }
        return out;
      },
      delete: function (key) { removeAll(key); },
      remove: function (key) { removeAll(key); },
      count: function () { return entries.length; },
    };
  }

  var headers = makeList(request.headers || [], true);
  var query = makeList(request.query || [], false);

  var urlObject = {
    path: urlInfo.path,
    query: query,
    getHost: function () { return urlInfo.host; },
    toString: function () { return request.url; },
  };

  function addHeader(header) {
    var str = String(header);
    var idx = str.indexOf(":");
    if (idx < 0) { return; }
    var key = str.slice(0, idx).trim();
    var value = str.slice(idx + 1).trim();
    headers.add(key, value);
  }

  var pm = {
    request: {
      method: request.method,
      url: urlObject,
      body: request.body ? request.body.content : "",
      headers: headers,
      query: query,
      addHeader: addHeader,
    },
    globals: {
      get: function (name) { return globals[name]; },
      set: function (name, value) { globals[name] = String(value); },
      unset: function (name) { delete globals[name]; },
    },
    environment: {
      get: function (name) { return environment[name]; },
      set: function (name, value) { environment[name] = String(value); },
      unset: function (name) { delete environment[name]; },
    },
  };

  function HmacResult(hex) { this.hex = hex; }
  HmacResult.prototype.toString = function () { return this.hex; };

  globalThis.CryptoJS = {
    HmacSHA256: function (message, key) {
      return new HmacResult(hmacSha256Hex(String(key), String(message)));
    },
  };

  globalThis.require = function (name) {
    if (name === "postman-collection") {
      return {
        Header: function (obj) { this.key = obj.key; this.value = obj.value; },
      };
    }
    throw new Error("Module not found: " + name);
  };

  globalThis.pm = pm;
  globalThis.__logs = logs;
  globalThis.__sync = function () {
    request.method = pm.request.method;
    var url = pm.request.url;
    if (typeof url === "string") {
      request.url = url;
    } else if (url && typeof url.toString === "function") {
      request.url = url.toString();
    }
    if (request.body) {
      request.body.content = String(pm.request.body);
    } else {
      request.body = { type: "text", content: String(pm.request.body) };
    }
  };
  globalThis.console = {
    log: function () {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) { parts.push(String(arguments[i])); }
      logs.push(parts.join(" "));
    },
  };
})();
`;

class SandboxError extends Error {
  constructor(
    public readonly code: "SCRIPT_RUNTIME_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "SandboxError";
  }
}

function evaluateJson(context: QuickJSContext, value: unknown): QuickJSHandle {
  const json = JSON.stringify(value);
  const result = context.evalCode(`(${json})`);
  if (!isSuccess(result)) {
    result.error.dispose();
    throw new SandboxError(
      "SCRIPT_RUNTIME_ERROR",
      "Failed to inject script context",
    );
  }
  return result.value;
}

function dumpHandle(context: QuickJSContext, handle: QuickJSHandle): unknown {
  // `dump` does not free the handle, so dispose it explicitly afterwards.
  const value = context.dump(handle);
  handle.dispose();
  return value;
}

function errorMessage(dumped: unknown): string {
  if (typeof dumped === "string") {
    return dumped;
  }
  if (
    dumped !== null &&
    typeof dumped === "object" &&
    typeof (dumped as { message?: unknown }).message === "string"
  ) {
    return (dumped as { message: string }).message;
  }
  return "Script execution failed";
}

function parseUrlForScript(raw: string): { host: string; path: string[] } {
  try {
    const url = new URL(raw);
    const path = url.pathname
      .split("/")
      .filter((segment) => segment !== "")
      .map((segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      });
    return { host: url.hostname, path };
  } catch {
    return { host: "", path: [] };
  }
}

export async function runScript(
  input: ScriptExecutionInput,
): Promise<ScriptExecutionOutput> {
  const startedAt = Date.now();
  const QuickJS = quickJSModule ?? (quickJSModule = await getQuickJS());
  const runtime = QuickJS.newRuntime();
  const context = runtime.newContext();

  try {
    const requestHandle = evaluateJson(context, input.request);
    const globalsHandle = evaluateJson(context, input.globals);
    const environmentHandle = evaluateJson(context, input.environment);
    const urlInfoHandle = evaluateJson(
      context,
      parseUrlForScript(input.request.url),
    );
    context.setProp(context.global, "__request", requestHandle);
    context.setProp(context.global, "__globals", globalsHandle);
    context.setProp(context.global, "__environment", environmentHandle);
    context.setProp(context.global, "__urlInfo", urlInfoHandle);
    requestHandle.dispose();
    globalsHandle.dispose();
    environmentHandle.dispose();
    urlInfoHandle.dispose();

    const bootstrap = context.evalCode(BOOTSTRAP);
    if (!isSuccess(bootstrap)) {
      const message = errorMessage(context.dump(bootstrap.error));
      throw new SandboxError(
        "SCRIPT_RUNTIME_ERROR",
        `Failed to initialize script runtime: ${message}`,
      );
    }
    bootstrap.value.dispose();

    const result = context.evalCode(input.source);
    if (!isSuccess(result)) {
      throw new SandboxError(
        "SCRIPT_RUNTIME_ERROR",
        errorMessage(context.dump(result.error)),
      );
    }
    result.value.dispose();

    const sync = context.evalCode("__sync()");
    if (!isSuccess(sync)) {
      throw new SandboxError(
        "SCRIPT_RUNTIME_ERROR",
        errorMessage(context.dump(sync.error)),
      );
    }
    sync.value.dispose();

    const request = dumpHandle(
      context,
      context.getProp(context.global, "__request"),
    ) as RequestDefinition;
    const globals = dumpHandle(
      context,
      context.getProp(context.global, "__globals"),
    ) as Record<string, string>;
    const environment = dumpHandle(
      context,
      context.getProp(context.global, "__environment"),
    ) as Record<string, string>;
    const rawLogs = dumpHandle(
      context,
      context.getProp(context.global, "__logs"),
    );

    const logs = Array.isArray(rawLogs)
      ? rawLogs.map((entry) => String(entry)).slice(0, input.limits.maxLogs)
      : [];

    return {
      request,
      globals,
      environment,
      logs,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    context.dispose();
    runtime.dispose();
  }
}
