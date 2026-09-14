import {
  getQuickJS,
  isSuccess,
  type QuickJSContext,
  type QuickJSHandle,
  type QuickJSWASMModule,
} from "quickjs-emscripten";
import type { RequestDefinition } from "../../shared/request-types";
import type {
  ScriptExecutionOutput,
  ScriptWorkerRequest,
  ScriptWorkerResponse,
} from "./script-types";

interface WorkerScope {
  onmessage: ((event: MessageEvent<ScriptWorkerRequest>) => void) | null;
  postMessage: (message: ScriptWorkerResponse) => void;
}

const workerScope = self as unknown as WorkerScope;

let quickJSModule: QuickJSWASMModule | null = null;

// Defines the allowlisted `pm` API surface. The request and environment are
// injected as QuickJS globals before this bootstrap runs. Plain string fields
// are synchronized back via `__sync`; query and header maps mutate the
// underlying arrays directly.
const BOOTSTRAP = `
(function () {
  var request = globalThis.__request;
  var environment = globalThis.__environment;
  var logs = [];

  function makeMap(entries) {
    return {
      set: function (key, value) {
        var found = false;
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].key === key) {
            entries[i].value = value;
            entries[i].enabled = true;
            found = true;
          }
        }
        if (!found) {
          entries.push({
            id: "script-" + Math.random().toString(36).slice(2),
            key: key,
            value: value,
            enabled: true,
          });
        }
      },
      delete: function (key) {
        for (var i = entries.length - 1; i >= 0; i--) {
          if (entries[i].key === key) {
            entries.splice(i, 1);
          }
        }
      },
    };
  }

  var pm = {
    request: {
      method: request.method,
      url: request.url,
      body: request.body ? request.body.content : "",
      query: makeMap(request.query || []),
      headers: makeMap(request.headers || []),
    },
    environment: {
      get: function (name) {
        return environment[name];
      },
      set: function (name, value) {
        environment[name] = String(value);
      },
      unset: function (name) {
        delete environment[name];
      },
    },
  };

  globalThis.pm = pm;
  globalThis.__logs = logs;
  globalThis.__sync = function () {
    request.method = pm.request.method;
    request.url = pm.request.url;
    if (request.body) {
      request.body.content = String(pm.request.body);
    } else {
      request.body = { type: "text", content: String(pm.request.body) };
    }
  };
  globalThis.console = {
    log: function () {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) {
        parts.push(String(arguments[i]));
      }
      logs.push(parts.join(" "));
    },
  };
})();
`;

class WorkerScriptError extends Error {
  constructor(
    public readonly code: "SCRIPT_RUNTIME_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "WorkerScriptError";
  }
}

function evaluateJson(context: QuickJSContext, value: unknown): QuickJSHandle {
  const json = JSON.stringify(value);
  const result = context.evalCode(`(${json})`);
  if (!isSuccess(result)) {
    throw new WorkerScriptError(
      "SCRIPT_RUNTIME_ERROR",
      "Failed to inject script context",
    );
  }
  return result.value;
}

function dumpHandle(context: QuickJSContext, handle: QuickJSHandle): unknown {
  return context.dump(handle);
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

async function runScript(input: {
  source: string;
  request: RequestDefinition;
  environment: Record<string, string>;
  limits: { maxLogs: number };
}): Promise<ScriptExecutionOutput> {
  const startedAt = Date.now();
  const QuickJS = quickJSModule ?? (quickJSModule = await getQuickJS());
  const runtime = QuickJS.newRuntime();
  const context = runtime.newContext();

  try {
    const requestHandle = evaluateJson(context, input.request);
    const environmentHandle = evaluateJson(context, input.environment);
    context.setProp(context.global, "__request", requestHandle);
    context.setProp(context.global, "__environment", environmentHandle);

    const bootstrap = context.evalCode(BOOTSTRAP);
    if (!isSuccess(bootstrap)) {
      throw new WorkerScriptError(
        "SCRIPT_RUNTIME_ERROR",
        "Failed to initialize script runtime",
      );
    }

    const result = context.evalCode(input.source);
    if (!isSuccess(result)) {
      throw new WorkerScriptError(
        "SCRIPT_RUNTIME_ERROR",
        errorMessage(context.dump(result.error)),
      );
    }

    const sync = context.evalCode("__sync()");
    if (!isSuccess(sync)) {
      throw new WorkerScriptError(
        "SCRIPT_RUNTIME_ERROR",
        errorMessage(context.dump(sync.error)),
      );
    }

    const request = dumpHandle(
      context,
      context.getProp(context.global, "__request"),
    ) as RequestDefinition;
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
      environment,
      logs,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    context.dispose();
    runtime.dispose();
  }
}

workerScope.onmessage = async (event) => {
  const message = event.data;
  if (message.type !== "run") {
    return;
  }

  try {
    const output = await runScript(message.input);
    workerScope.postMessage({ type: "result", output });
  } catch (error) {
    const message_ =
      error instanceof WorkerScriptError
        ? error.message
        : "Script execution failed";
    workerScope.postMessage({
      type: "error",
      code: "SCRIPT_RUNTIME_ERROR",
      message: message_,
    });
  }
};
