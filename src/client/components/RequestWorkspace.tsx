import { useCallback, useRef } from "react";
import { RequestToolbar } from "./RequestToolbar";
import { RequestTabs } from "./RequestTabs";
import { ResponsePanel } from "./ResponsePanel";
import type { RequestDefinition } from "../../shared/request-types";
import { executeRequest, ClientRequestError } from "../api/execute-client";
import {
  collectionRepository,
  environmentRepository,
  folderRepository,
  historyRepository,
} from "../db/repositories";
import {
  createWorkerScriptExecutor,
  runPreRequestScripts,
  ScriptExecutionError,
} from "../scripts/script-runner";
import { substituteVariables } from "../scripts/variable-substitution";
import { useEditorStore } from "../state/editor-store";
import { useRuntimeStore, type RuntimeError } from "../state/runtime-store";

function normalizeError(error: unknown): RuntimeError {
  if (
    error instanceof ClientRequestError ||
    error instanceof ScriptExecutionError
  ) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { code: "INTERNAL_ERROR", message: error.message };
  }
  return { code: "INTERNAL_ERROR", message: "Request failed" };
}

export function RequestWorkspace() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSend = useCallback(async () => {
    const runtime = useRuntimeStore.getState();
    if (runtime.isSending) {
      return;
    }

    const { draft, selectedCollectionId, selectedFolderId, selectedRequestId } =
      useEditorStore.getState();

    // Build the ordered script chain: collection → folders (outer → inner) →
    // request.
    const scriptSources: string[] = [];

    if (selectedCollectionId) {
      const collection = await collectionRepository.get(selectedCollectionId);
      if (collection?.preRequestScript) {
        scriptSources.push(collection.preRequestScript);
      }
    }

    if (selectedFolderId) {
      const chain: string[] = [];
      let currentId: string | null = selectedFolderId;
      while (currentId) {
        const folder = await folderRepository.get(currentId);
        if (!folder) {
          break;
        }
        if (folder.preRequestScript) {
          chain.unshift(folder.preRequestScript);
        }
        currentId = folder.parentId;
      }
      scriptSources.push(...chain);
    }

    scriptSources.push(draft.preRequestScript);

    // Build the execution environment from the active environment record.
    const environments = await environmentRepository.list();
    const activeEnvironment = environments.find((env) => env.isActive) ?? null;
    const environment: Record<string, string> = {};
    for (const variable of activeEnvironment?.variables ?? []) {
      if (variable.enabled) {
        environment[variable.key] = variable.value;
      }
    }

    const request: RequestDefinition = {
      method: draft.method,
      url: draft.url,
      query: draft.queryParams,
      headers: draft.headers,
      body: draft.body,
    };

    const controller = new AbortController();
    abortControllerRef.current = controller;

    runtime.startSend();

    try {
      const scriptResult = await runPreRequestScripts(
        scriptSources,
        request,
        environment,
        { executor: createWorkerScriptExecutor() },
      );
      runtime.appendLogs(scriptResult.logs);

      const substitution = substituteVariables(
        scriptResult.request,
        scriptResult.environment,
      );
      runtime.setUnresolvedVariables(substitution.unresolved);

      const response = await executeRequest(
        substitution.value,
        controller.signal,
      );
      runtime.finishSend(response);

      if (response.ok) {
        try {
          await historyRepository.add({
            requestId: selectedRequestId,
            requestSnapshot: substitution.value,
            responseSnapshot: response,
          });
        } catch {
          // History persistence is best-effort.
        }
      }
    } catch (error) {
      runtime.failSend(normalizeError(error));
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return (
    <div className="request-workspace-inner">
      <RequestToolbar onSend={() => void handleSend()} onCancel={handleCancel} />
      <RequestTabs />
      <ResponsePanel />
    </div>
  );
}
