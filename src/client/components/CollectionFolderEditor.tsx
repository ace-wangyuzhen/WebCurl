import { Typography } from "antd";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import {
  collectionRepository,
  folderRepository,
} from "../db/repositories";
import { useEditorStore } from "../state/editor-store";

export function CollectionFolderEditor() {
  const selectedCollectionId = useEditorStore(
    (state) => state.selectedCollectionId,
  );
  const selectedFolderId = useEditorStore((state) => state.selectedFolderId);
  const selectedEntityName = useEditorStore((state) => state.selectedEntityName);
  const scriptDraft = useEditorStore((state) => state.scriptDraft);
  const updateScriptDraft = useEditorStore((state) => state.updateScriptDraft);

  const kind = selectedFolderId ? "Folder" : "Collection";

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
        <Typography.Text type="secondary">
          {kind} Pre-request Script
        </Typography.Text>
      </div>
      <CodeMirrorEditor
        value={scriptDraft}
        onChange={handleChange}
        language="javascript"
        ariaLabel={`${kind} pre-request script`}
      />
      <Typography.Text type="secondary">
        Runs before every request in this {kind.toLowerCase()}.
      </Typography.Text>
    </div>
  );
}
