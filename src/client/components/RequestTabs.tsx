import { Tabs } from "antd";
import { ParamsEditor } from "./ParamsEditor";
import { HeadersEditor } from "./HeadersEditor";
import { BodyEditor } from "./BodyEditor";
import { ScriptEditor } from "./ScriptEditor";
import { RequestHistoryPanel } from "./RequestHistoryPanel";
import { useTranslation } from "../i18n";

export function RequestTabs() {
  const { t } = useTranslation();
  const items = [
    { key: "params", label: t("tab.params"), children: <ParamsEditor /> },
    { key: "headers", label: t("tab.headers"), children: <HeadersEditor /> },
    { key: "body", label: t("tab.body"), children: <BodyEditor /> },
    { key: "scripts", label: t("tab.script"), children: <ScriptEditor /> },
    { key: "history", label: t("history.title"), children: <RequestHistoryPanel /> },
  ];
  return <Tabs className="request-tabs" items={items} />;
}
