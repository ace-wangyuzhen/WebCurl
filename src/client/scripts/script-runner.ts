import type { RequestDefinition } from "../../shared/request-types";
import type {
  ScriptExecutionInput,
  ScriptExecutionOutput,
  ScriptFailureCode,
  ScriptLimits,
  ScriptWorkerResponse,
} from "./script-types";

export interface ScriptExecutor {
  run(input: ScriptExecutionInput): Promise<ScriptExecutionOutput>;
}

export const DEFAULT_SCRIPT_LIMITS: ScriptLimits = {
  maxSourceLength: 16 * 1024,
  maxExecutionMs: 3000,
  maxLogs: 100,
};

export class ScriptExecutionError extends Error {
  constructor(
    public readonly code: ScriptFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "ScriptExecutionError";
  }
}

export async function runPreRequestScripts(
  scripts: string[],
  request: RequestDefinition,
  globals: Record<string, string>,
  environment: Record<string, string>,
  options: { executor: ScriptExecutor; limits?: ScriptLimits },
): Promise<ScriptExecutionOutput> {
  const limits = options.limits ?? DEFAULT_SCRIPT_LIMITS;
  let currentRequest = request;
  let currentGlobals = { ...globals };
  let currentEnvironment = { ...environment };
  const logs: string[] = [];

  for (const source of scripts) {
    if (source.trim() === "") {
      continue;
    }

    const output = await options.executor.run({
      source,
      request: currentRequest,
      globals: currentGlobals,
      environment: currentEnvironment,
      limits,
    });

    currentRequest = output.request;
    currentGlobals = output.globals;
    currentEnvironment = output.environment;
    logs.push(...output.logs);
  }

  return {
    request: currentRequest,
    globals: currentGlobals,
    environment: currentEnvironment,
    logs,
    durationMs: 0,
  };
}

export function createWorkerScriptExecutor(): ScriptExecutor {
  return {
    run(input) {
      return new Promise<ScriptExecutionOutput>((resolve, reject) => {
        if (input.source.length > input.limits.maxSourceLength) {
          reject(
            new ScriptExecutionError(
              "SCRIPT_SOURCE_TOO_LONG",
              "Script source exceeds the allowed length",
            ),
          );
          return;
        }

        const worker = new Worker(
          new URL("./quickjs.worker.ts", import.meta.url),
          { type: "module" },
        );

        const timeoutHandle = setTimeout(() => {
          worker.terminate();
          reject(
            new ScriptExecutionError(
              "SCRIPT_TIMEOUT",
              "Script execution timed out",
            ),
          );
        }, input.limits.maxExecutionMs);

        worker.onmessage = (event: MessageEvent<ScriptWorkerResponse>) => {
          clearTimeout(timeoutHandle);
          worker.terminate();

          const message = event.data;
          if (message.type === "result") {
            resolve(message.output);
          } else {
            reject(new ScriptExecutionError(message.code, message.message));
          }
        };

        worker.onerror = (event: ErrorEvent) => {
          clearTimeout(timeoutHandle);
          worker.terminate();
          reject(
            new ScriptExecutionError(
              "SCRIPT_RUNTIME_ERROR",
              event.message || "Script worker failed",
            ),
          );
        };

        worker.postMessage({ type: "run", input });
      });
    },
  };
}
