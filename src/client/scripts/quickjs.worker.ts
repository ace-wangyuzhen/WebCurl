import type {
  ScriptExecutionOutput,
  ScriptWorkerRequest,
  ScriptWorkerResponse,
} from "./script-types";
import { runScript } from "./sandbox";

interface WorkerScope {
  onmessage: ((event: MessageEvent<ScriptWorkerRequest>) => void) | null;
  postMessage: (message: ScriptWorkerResponse) => void;
}

const workerScope = self as unknown as WorkerScope;

workerScope.onmessage = async (event) => {
  const message = event.data;
  if (message.type !== "run") {
    return;
  }

  try {
    const output: ScriptExecutionOutput = await runScript(message.input);
    workerScope.postMessage({ type: "result", output });
  } catch (error) {
    const message_ =
      error instanceof Error && error.message
        ? error.message
        : "Script execution failed";
    workerScope.postMessage({
      type: "error",
      code: "SCRIPT_RUNTIME_ERROR",
      message: message_,
    });
  }
};
