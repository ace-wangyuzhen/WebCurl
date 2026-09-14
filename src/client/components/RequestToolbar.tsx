import { Button, Input, Select } from "antd";
import {
  CloseOutlined,
  SendOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useEditorStore } from "../state/editor-store";
import { useRuntimeStore } from "../state/runtime-store";

const METHOD_OPTIONS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map(
  (method) => ({ value: method, label: method }),
);

interface RequestToolbarProps {
  onSend: () => void;
  onCancel: () => void;
}

export function RequestToolbar({ onSend, onCancel }: RequestToolbarProps) {
  const draft = useEditorStore((state) => state.draft);
  const updateDraft = useEditorStore((state) => state.updateDraft);
  const isSending = useRuntimeStore((state) => state.isSending);
  const unresolvedVariables = useRuntimeStore(
    (state) => state.unresolvedVariables,
  );

  return (
    <div>
      <div className="request-toolbar">
        <Select
          className="method-select"
          value={draft.method}
          options={METHOD_OPTIONS}
          onChange={(method) => updateDraft({ method })}
          aria-label="HTTP method"
        />
        <Input
          className="url-input"
          value={draft.url}
          onChange={(event) => updateDraft({ url: event.target.value })}
          placeholder="Enter request URL"
          aria-label="Request URL"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          aria-label="Send request"
          aria-busy={isSending}
          onClick={onSend}
        >
          Send
        </Button>
        {isSending ? (
          <Button
            icon={<CloseOutlined />}
            aria-label="Cancel request"
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>

      {unresolvedVariables.length > 0 ? (
        <div className="unresolved-warning" role="alert">
          <WarningOutlined /> Unresolved variables:{" "}
          {unresolvedVariables.join(", ")}
        </div>
      ) : null}
    </div>
  );
}
