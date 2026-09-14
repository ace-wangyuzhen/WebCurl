import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { useEditorStore } from "../state/editor-store";
import { useRuntimeStore } from "../state/runtime-store";

export function ScriptEditor() {
  const preRequestScript = useEditorStore(
    (state) => state.draft.preRequestScript,
  );
  const updateDraft = useEditorStore((state) => state.updateDraft);
  const scriptLogs = useRuntimeStore((state) => state.scriptLogs);

  return (
    <div className="script-editor">
      <CodeMirrorEditor
        value={preRequestScript}
        onChange={(value) => updateDraft({ preRequestScript: value })}
        language="javascript"
        ariaLabel="Pre-request script"
      />

      <div className="script-logs" role="log" aria-label="Script logs">
        {scriptLogs.map((log, index) => (
          <div key={index} className="script-log-line">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
