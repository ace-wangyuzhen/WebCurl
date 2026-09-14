import { Typography } from "antd";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import {
  collectionRepository,
  folderRepository,
} from "../db/repositories";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";

export function CollectionFolderEditor() {
  const { t } = useTranslation();
  const selectedCollectionId = useEditorStore(
    (state) => state.selectedCollectionId,
  );
  const selectedFolderId = useEditorStore((state) => state.selectedFolderId);
  const selectedEntityName = useEditorStore((state) => state.selectedEntityName);
  const scriptDraft = useEditorStore((state) => state.scriptDraft);
  const updateScriptDraft = useEditorStore((state) => state.updateScriptDraft);

  const isFolder = Boolean(selectedFolderId);
  const kind = t(isFolder ? "entity.folder" : "entity.collection");
  const preScript = t("entity.preScript", { kind });
  const runsHint = t(isFolder ? "entity.runsFolder" : "entity.runsCollection");

  const handleChange = (script: string) => {
    updateScriptDraft(script);
    if (selectedFolderId) {
      void folderRepository.update(selectedFolderId, {
        preRequestScript: script,
      });
    } else if (selectedCollectionId) {
      void collectionRepository.update(selectedCollectionId, {
        preRequestScript: script,
      });
    }
  };

  return (
    <div className="entity-editor">
      <div className="entity-editor-header">
        <Typography.Title level={4}>{selectedEntityName}</Typography.Title>
        <Typography.Text type="secondary">{preScript}</Typography.Text>
      </div>
      <CodeMirrorEditor
        value={scriptDraft}
        onChange={handleChange}
        language="javascript"
        ariaLabel={preScript}
      />
      <Typography.Text type="secondary">{runsHint}</Typography.Text>
    </div>
  );
}
