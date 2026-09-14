import { runScript } from "../../src/client/scripts/sandbox";
import type { ScriptExecutionInput } from "../../src/client/scripts/script-types";

function baseInput(source: string): ScriptExecutionInput {
  return {
    source,
    request: {
      method: "POST",
      url: "https://ddc.bj.baidubce.com/v1/dataset",
      query: [{ id: "q1", key: "a", value: "b", enabled: true }],
      headers: [],
      body: { type: "none", content: "" },
    },
    globals: {},
    environment: {},
    limits: { maxSourceLength: 16000, maxExecutionMs: 3000, maxLogs: 100 },
  };
}

// The Baidu BCE signing script the sandbox is expected to run. It exercises the
// richer Postman-style `pm.*` surface: header/query list helpers, the URL
// object, `pm.request.addHeader`, `require('postman-collection')` and
// `CryptoJS.HmacSHA256`.
const BCE_SCRIPT = `
function getTimestamp() {
  var timestamp = pm.environment.get("Timestamp");
  var now = timestamp ? new Date(timestamp.trim()) : new Date();
  return now.toISOString().replace(/\\.\\d+Z$/, "Z");
}
var timestamp = getTimestamp();
pm.request.headers.add({ key: "x-bce-date", value: timestamp });
pm.request.headers.add({ key: "Content-Type", value: "application/json" });
pm.request.headers.add({ key: "Host", value: "ddc.bj.baidubce.com" });

function normalize(string, encodingSlash) {
  var kEscapedMap = { "!": "%21", "'": "%27", "(": "%28", ")": "%29", "*": "%2A" };
  if (string === null) { return ""; }
  var result = encodeURIComponent(string);
  result = result.replace(/[!'\\(\\)\\*]/g, function ($1) { return kEscapedMap[$1]; });
  if (encodingSlash === false) { result = result.replace(/%2F/gi, "/"); }
  return result;
}

function generateCanonicalUri() {
  url = pm.request.url;
  resources = url.path;
  if (!resources) { return ""; }
  var normalizedResourceStr = "";
  for (var i = 0; i < resources.length; i++) {
    normalizedResourceStr += "/" + normalize(resources[i]);
  }
  return normalizedResourceStr;
}

function generateCanonicalQueryString() {
  url = pm.request.url;
  queryList = url.query.all();
  var normalizedQueryList = [];
  for (var i = 0; i < queryList.length; i++) {
    if (queryList[i].key.toLowerCase() === "authorization") { continue; }
    if (normalize(queryList[i].value) !== undefined && normalize(queryList[i].value) !== "undefined") {
      normalizedQueryList.push(normalize(queryList[i].key) + "=" + normalize(queryList[i].value));
    }
  }
  normalizedQueryList.sort();
  return normalizedQueryList.join("&");
}

var g_signed_headers = "";
function generateCanonicalHeaders() {
  var signedHeaders = pm.environment.get("SignedHeaders");
  var defaultHeaders = ["host", "content-length", "content-type", "content-md5"];
  var keyStrList = [];
  headerList = pm.request.headers;
  if (!headerList.has("host")) {
    var Header = require("postman-collection").Header;
    headerList.add(new Header({ key: "host", value: pm.request.url.getHost() }));
  }
  if (!signedHeaders) {
    for (var i = 0; i < defaultHeaders.length; i++) { keyStrList.push(defaultHeaders[i]); }
    var headerListObj = headerList.all();
    for (var j = 0; j < headerListObj.length; j++) {
      var headerKey = headerListObj[j].key;
      if (headerKey.toLowerCase().startsWith("x-bce-")) { keyStrList.push(headerKey.toLowerCase()); }
    }
  } else {
    signedHeaders = signedHeaders.trim();
    keyStrList = signedHeaders.split(";");
    for (var k = 0; k < keyStrList.length; k++) { keyStrList[k] = keyStrList[k].toLowerCase(); }
    if (!keyStrList.includes("host")) { keyStrList.push("host"); }
  }
  var usedHeaderStrList = [];
  for (var m = 0; m < keyStrList.length; m++) {
    key = keyStrList[m];
    value = headerList.get(key);
    if (!value || value === "") { continue; }
    key = key.toLowerCase();
    value = value.trim();
    usedHeaderStrList.push(normalize(key) + ":" + normalize(value));
  }
  usedHeaderStrList.sort();
  var usedHeaderKeys = [];
  usedHeaderStrList.forEach(function (item) { usedHeaderKeys.push(item.split(":")[0]); });
  var canonicalHeaderStr = usedHeaderStrList.join("\\n");
  g_signed_headers = usedHeaderKeys.join(";");
  return canonicalHeaderStr;
}

function generateAuthorization() {
  var authVersion = pm.environment.get("AuthVersion");
  var expirationInSeconds = pm.environment.get("ExpirationInSeconds");
  var accessKey = pm.environment.get("AccessKey") || pm.globals.get("AccessKey");
  var secretKey = pm.environment.get("SecretKey") || pm.globals.get("SecretKey");
  authVersion = !authVersion ? "1" : authVersion.trim();
  expirationInSeconds = !expirationInSeconds ? "1800" : expirationInSeconds.trim();
  signingKeyStr = "bce-auth-v" + authVersion + "/" + accessKey.trim() + "/" + timestamp + "/" + expirationInSeconds;
  signingKey = CryptoJS.HmacSHA256(signingKeyStr, secretKey.trim());
  canonicalUri = generateCanonicalUri();
  canonicalQueryString = generateCanonicalQueryString();
  canonicalHeaders = generateCanonicalHeaders();
  method = pm.request.method;
  canonicalRequest = method.toUpperCase() + "\\n" + canonicalUri + "\\n" + canonicalQueryString + "\\n" + canonicalHeaders;
  signature = CryptoJS.HmacSHA256(canonicalRequest, signingKey.toString());
  Authorization = signingKeyStr + "/" + g_signed_headers + "/" + signature.toString();
  return Authorization;
}

pm.request.addHeader("Authorization:" + generateAuthorization());
`;

const ACCESS_KEY = "118051d11de046ce8f6b8df42891TEST";
const SECRET_KEY = "47d4d29668ab48cf86d0a85f7f82TEST";

it("computes HMAC-SHA256 like CryptoJS", async () => {
  const output = await runScript(
    baseInput(
      'pm.environment.set("SIG", CryptoJS.HmacSHA256("The quick brown fox jumps over the lazy dog", "key").toString());',
    ),
  );

  expect(output.environment.SIG).toBe(
    "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
  );
}, 30000);

it("runs the BCE signing script and signs the request", async () => {
  const input = baseInput(BCE_SCRIPT);
  input.globals = { AccessKey: ACCESS_KEY, SecretKey: SECRET_KEY };
  input.environment = { AccessKey: ACCESS_KEY, SecretKey: SECRET_KEY };

  const output = await runScript(input);

  const headerKeys = output.request.headers.map((header) => header.key.toLowerCase());
  expect(headerKeys).toContain("x-bce-date");
  expect(headerKeys).toContain("content-type");
  expect(headerKeys).toContain("host");

  const authorization = output.request.headers.find(
    (header) => header.key.toLowerCase() === "authorization",
  );
  expect(authorization?.value.startsWith("bce-auth-v1/")).toBe(true);
  // The signature must include the signed headers and a hex signature.
  expect(authorization?.value.split("/").length).toBeGreaterThanOrEqual(5);
}, 30000);
