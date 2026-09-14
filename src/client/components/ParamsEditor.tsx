import { KeyValueTable } from "./KeyValueTable";
import { useEditorStore } from "../state/editor-store";

export function ParamsEditor() {
  const queryParams = useEditorStore((state) => state.draft.queryParams);
  const updateDraft = useEditorStore((state) => state.updateDraft);

  return (
    <KeyValueTable
      items={queryParams}
      onChange={(items) => updateDraft({ queryParams: items })}
      addLabel="Add parameter"
      nameLabel={(index) => `Query parameter name ${index}`}
      valueLabel={(index) => `Query parameter value ${index}`}
      enableLabel={(index) => `Enable parameter ${index}`}
    />
  );
}
