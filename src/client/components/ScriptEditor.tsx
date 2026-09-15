import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";

export function ScriptEditor() {
  const { t } = useTranslation();
  const preRequestScript = useEditorStore(
    (state) => state.draft.preRequestScript,
  );
  const updateDraft = useEditorStore((state) => state.updateDraft);

  return (
    <div className="script-editor">
      <CodeMirrorEditor
        value={preRequestScript}
        onChange={(value) => updateDraft({ preRequestScript: value })}
        language="javascript"
        ariaLabel={t("script.label")}
      />
    </div>
  );
}
