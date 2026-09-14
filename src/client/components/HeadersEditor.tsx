import { KeyValueTable } from "./KeyValueTable";
import { useEditorStore } from "../state/editor-store";

export function HeadersEditor() {
  const headers = useEditorStore((state) => state.draft.headers);
  const updateDraft = useEditorStore((state) => state.updateDraft);

  return (
    <KeyValueTable
      items={headers}
      onChange={(items) => updateDraft({ headers: items })}
      addLabel="Add header"
      nameLabel={(index) => `Header name ${index}`}
      valueLabel={(index) => `Header value ${index}`}
      enableLabel={(index) => `Enable header ${index}`}
    />
  );
}
