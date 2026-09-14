import { KeyValueTable } from "./KeyValueTable";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";

export function ParamsEditor() {
  const { t } = useTranslation();
  const queryParams = useEditorStore((state) => state.draft.queryParams);
  const updateDraft = useEditorStore((state) => state.updateDraft);

  return (
    <KeyValueTable
      items={queryParams}
      onChange={(items) => updateDraft({ queryParams: items })}
      addLabel={t("params.add")}
      nameLabel={(index) => t("params.name", { n: index })}
      valueLabel={(index) => t("params.value", { n: index })}
      enableLabel={(index) => t("params.enable", { n: index })}
    />
  );
}
