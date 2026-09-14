import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";
import { useRuntimeStore } from "../state/runtime-store";

export function ScriptEditor() {
  const { t } = useTranslation();
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
        ariaLabel={t("script.label")}
      />

      <div className="script-logs" role="log" aria-label={t("script.logs")}>
        {scriptLogs.map((log, index) => (
          <div key={index} className="script-log-line">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
