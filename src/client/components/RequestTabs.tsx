import { Tabs } from "antd";
import { ParamsEditor } from "./ParamsEditor";
import { HeadersEditor } from "./HeadersEditor";
import { BodyEditor } from "./BodyEditor";
import { ScriptEditor } from "./ScriptEditor";

const TAB_ITEMS = [
  { key: "params", label: "Params", children: <ParamsEditor /> },
  { key: "headers", label: "Headers", children: <HeadersEditor /> },
  { key: "body", label: "Body", children: <BodyEditor /> },
  { key: "scripts", label: "Pre-Request Script", children: <ScriptEditor /> },
];

export function RequestTabs() {
  return <Tabs className="request-tabs" items={TAB_ITEMS} />;
}
