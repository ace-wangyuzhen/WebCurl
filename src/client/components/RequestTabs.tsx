import { Tabs } from "antd";

function EditorPlaceholder({ label }: { label: string }) {
  return (
    <div className="editor-placeholder" role="group" aria-label={label}>
      {label} editor will appear here.
    </div>
  );
}

const TAB_ITEMS = [
  { key: "params", label: "Params", children: <EditorPlaceholder label="Params" /> },
  { key: "headers", label: "Headers", children: <EditorPlaceholder label="Headers" /> },
  { key: "body", label: "Body", children: <EditorPlaceholder label="Body" /> },
  { key: "scripts", label: "Scripts", children: <EditorPlaceholder label="Scripts" /> },
];

export function RequestTabs() {
  return <Tabs className="request-tabs" items={TAB_ITEMS} />;
}
