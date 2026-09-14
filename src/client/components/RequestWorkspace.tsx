import { useCallback, useRef } from "react";
import { message } from "antd";
import { RequestToolbar } from "./RequestToolbar";
import { RequestTabs } from "./RequestTabs";
import { ResponsePanel } from "./ResponsePanel";
import { CollectionFolderEditor } from "./CollectionFolderEditor";
import { CollectionVariablesPanel } from "./CollectionVariablesPanel";
import { FolderRequestList } from "./FolderRequestList";
import type { RequestDefinition } from "../../shared/request-types";
import { executeRequest, ClientRequestError } from "../api/execute-client";
import { buildCurlCommand } from "../api/curl";
import {
  collectionRepository,
  environmentRepository,
  folderRepository,
  historyRepository,
  requestRepository,
} from "../db/repositories";
import { useTranslation } from "../i18n";
import {
  createWorkerScriptExecutor,
  runPreRequestScripts,
  ScriptExecutionError,
} from "../scripts/script-runner";
import {
  mergeVariables,
  substituteVariables,
} from "../scripts/variable-substitution";
import { useEditorStore } from "../state/editor-store";
import { useRuntimeStore, type RuntimeError } from "../state/runtime-store";
import { useSettingsStore } from "../state/settings-store";

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
  const { t } = useTranslation();
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedRequestId = useEditorStore((state) => state.selectedRequestId);
  const selectedCollectionId = useEditorStore(
    (state) => state.selectedCollectionId,
  );
  const selectedFolderId = useEditorStore((state) => state.selectedFolderId);

  const handleSend = useCallback(async () => {
    const runtime = useRuntimeStore.getState();
    if (runtime.isSending) {
      return;
    }

    const { draft, selectedCollectionId, selectedFolderId, selectedRequestId } =
      useEditorStore.getState();

    // Build the ordered script chain: collection → folders (outer → inner) →
    // request.
    const collection = selectedCollectionId
      ? await collectionRepository.get(selectedCollectionId)
      : undefined;

    const scriptSources: string[] = [];

    if (collection?.preRequestScript) {
      scriptSources.push(collection.preRequestScript);
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

    // Build per-collection globals and the active environment's variables.
    const globals: Record<string, string> = {};
    for (const variable of collection?.globals ?? []) {
      if (variable.enabled) {
        globals[variable.key] = variable.value;
      }
    }

    const environments = selectedCollectionId
      ? await environmentRepository.listByCollection(selectedCollectionId)
      : [];
    const activeEnvironment =
      environments.find((env) => env.isActive) ?? environments[0] ?? null;
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
      // Resolve {{...}} from the environment/globals BEFORE running the
      // pre-request script, so scripts observe the substituted request.
      const initialVariables = mergeVariables(globals, environment);
      const substitutedRequest = substituteVariables(
        request,
        initialVariables,
      ).value;

      const scriptResult = await runPreRequestScripts(
        scriptSources,
        substitutedRequest,
        globals,
        environment,
        { executor: createWorkerScriptExecutor() },
      );
      runtime.appendLogs(scriptResult.logs);

      // A script may set variables or change the request; resolve again so any
      // remaining {{...}} reflects the final state. Environment variables take
      // precedence over globals.
      const variables = mergeVariables(
        scriptResult.globals,
        scriptResult.environment,
      );
      const substitution = substituteVariables(scriptResult.request, variables);
      runtime.setUnresolvedVariables(substitution.unresolved);
      runtime.setActiveCurl(buildCurlCommand(substitution.value));

      // Apply the global request-execution defaults from settings.
      const settings = useSettingsStore.getState();
      const executed = {
        ...substitution.value,
        options: {
          timeoutMs: settings.defaultTimeoutMs,
          followRedirects: settings.followRedirects,
          maxRedirects: settings.maxRedirects,
        },
      };

      const response = await executeRequest(executed, controller.signal);
      runtime.finishSend(response);

      if (response.ok) {
        try {
          await historyRepository.add({
            requestId: selectedRequestId,
            requestSnapshot: executed,
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

  const handleSave = useCallback(async () => {
    const { draft, selectedRequestId } = useEditorStore.getState();
    if (!selectedRequestId) {
      return;
    }
    await requestRepository.update(selectedRequestId, {
      method: draft.method,
      url: draft.url,
      queryParams: draft.queryParams,
      headers: draft.headers,
      body: draft.body,
      preRequestScript: draft.preRequestScript,
    });
    void message.success(t("request.saved"));
  }, [t]);

  if (!selectedRequestId && (selectedCollectionId || selectedFolderId)) {
    return (
      <div className="request-workspace-inner">
        <CollectionFolderEditor />
        {selectedFolderId && selectedCollectionId ? (
          <FolderRequestList
            key={selectedFolderId}
            collectionId={selectedCollectionId}
            folderId={selectedFolderId}
          />
        ) : null}
        {!selectedFolderId && selectedCollectionId ? (
          <CollectionVariablesPanel
            key={selectedCollectionId}
            collectionId={selectedCollectionId}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="request-workspace-inner">
      <RequestToolbar
        onSend={() => void handleSend()}
        onCancel={handleCancel}
        onSave={() => void handleSave()}
      />
      <RequestTabs />
      <ResponsePanel />
    </div>
  );
}
