import { useState } from "react";
import { Alert, Button, Empty, Space, Tag, Typography } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useRuntimeStore } from "../state/runtime-store";

function prettyJson(body: string): string | null {
  if (body.trim() === "") {
    return null;
  }
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return null;
  }
}

export function ResponsePanel() {
  const activeResponse = useRuntimeStore((state) => state.activeResponse);
  const activeError = useRuntimeStore((state) => state.activeError);
  const [pretty, setPretty] = useState(false);

  const copyBody = async () => {
    const body = activeResponse?.body ?? "";
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      // Clipboard access is unavailable; the user can still select the text.
    }
  };

  if (!activeResponse && !activeError) {
    return (
      <div className="response-panel" role="region" aria-label="Response">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No response yet"
        />
      </div>
    );
  }

  const error = activeError ?? activeResponse?.error;

  if (error) {
    return (
      <div className="response-panel" role="region" aria-label="Response">
        <Alert
          type="error"
          showIcon
          message={error.code}
          description={error.message}
        />
      </div>
    );
  }

  const status = activeResponse?.status ?? 0;
  const body = activeResponse?.body ?? "";
  const shownBody = pretty ? (prettyJson(body) ?? body) : body;

  return (
    <div className="response-panel" role="region" aria-label="Response">
      <div className="response-detail">
        <Space wrap>
          <Tag color={status >= 400 ? "error" : "success"}>
            {status} {activeResponse?.statusText}
          </Tag>
          <Typography.Text type="secondary">
            {activeResponse?.durationMs} ms
          </Typography.Text>
          <Typography.Text type="secondary">
            {activeResponse?.sizeBytes} bytes
          </Typography.Text>
        </Space>

        <div className="response-body-toolbar">
          <Typography.Title level={5}>Body</Typography.Title>
          <Space>
            <Button
              size="small"
              icon={<CopyOutlined />}
              aria-label="Copy response body"
              onClick={() => void copyBody()}
            >
              Copy
            </Button>
            <Button size="small" onClick={() => setPretty((value) => !value)}>
              {pretty ? "Raw" : "Pretty"}
            </Button>
          </Space>
        </div>

        <pre className="response-body">{shownBody}</pre>
      </div>
    </div>
  );
}
