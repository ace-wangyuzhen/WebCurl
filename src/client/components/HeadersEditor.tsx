import { KeyValueTable } from "./KeyValueTable";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";

export function HeadersEditor() {
  const { t } = useTranslation();
  const headers = useEditorStore((state) => state.draft.headers);
  const updateDraft = useEditorStore((state) => state.updateDraft);

  return (
    <KeyValueTable
      items={headers}
      onChange={(items) => updateDraft({ headers: items })}
      addLabel={t("headers.add")}
      nameLabel={(index) => t("headers.name", { n: index })}
      valueLabel={(index) => t("headers.value", { n: index })}
      enableLabel={(index) => t("headers.enable", { n: index })}
    />
  );
}
