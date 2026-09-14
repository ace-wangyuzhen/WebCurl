import { useState } from "react";
import { Button, Empty, Space, Tag, Typography } from "antd";
import { CloseCircleFilled, CopyOutlined } from "@ant-design/icons";
import { useRuntimeStore } from "../state/runtime-store";
import { useTranslation } from "../i18n";
import { CodeMirrorEditor, type EditorLanguage } from "./CodeMirrorEditor";

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

function statusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return "success";
  }
  if (status >= 300 && status < 400) {
    return "warning";
  }
  return "error";
}

function languageFromContentType(contentType: string): EditorLanguage {
  const type = contentType.split(";")[0].trim().toLowerCase();
  if (type === "application/json" || type.endsWith("+json")) {
    return "json";
  }
  if (
    type === "application/javascript" ||
    type === "text/javascript" ||
    type === "application/x-javascript"
  ) {
    return "javascript";
  }
  return "text";
}

export function ResponsePanel() {
  const { t } = useTranslation();
  const activeResponse = useRuntimeStore((state) => state.activeResponse);
  const activeError = useRuntimeStore((state) => state.activeError);
  const activeCurl = useRuntimeStore((state) => state.activeCurl);
  const [pretty, setPretty] = useState(false);

  const copyBody = async () => {
    const body = activeResponse?.body ?? "";
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      // Clipboard access is unavailable; the user can still select the text.
    }
  };

  const copyCurl = async () => {
    if (!activeCurl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(activeCurl);
    } catch {
      // Clipboard access is unavailable; the user can still select the text.
    }
  };

  if (!activeResponse && !activeError) {
    return (
      <div className="response-panel" role="region" aria-label={t("response.region")}>
        <div className="response-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("response.empty")}
          />
        </div>
      </div>
    );
  }

  const error = activeError ?? activeResponse?.error;

  if (error) {
    return (
      <div className="response-panel" role="region" aria-label={t("response.region")}>
        <div className="response-error" role="alert">
          <CloseCircleFilled
            className="response-error-icon"
            aria-hidden="true"
          />
          <div className="response-error-body">
            <div className="response-error-code">{error.code}</div>
            <div className="response-error-message">{error.message}</div>
          </div>
        </div>
      </div>
    );
  }

  const status = activeResponse?.status ?? 0;
  const statusText = activeResponse?.statusText ?? "";
  const headers = activeResponse?.headers ?? [];
  const body = activeResponse?.body ?? "";

  const contentType =
    headers.find(
      (header) => header.name.toLowerCase() === "content-type",
    )?.value ?? "";
  const language = languageFromContentType(contentType);
  const shownBody = pretty ? (prettyJson(body) ?? body) : body;

  return (
    <div className="response-panel" role="region" aria-label={t("response.region")}>
      <div className="response-summary">
        <Tag color={statusColor(status)}>
          {status} {statusText}
        </Tag>
        <Typography.Text type="secondary">
          {activeResponse?.durationMs} ms
        </Typography.Text>
        <Typography.Text type="secondary">
          {activeResponse?.sizeBytes} bytes
        </Typography.Text>
      </div>

      <section className="response-section">
        <div className="response-section-header">
          <Typography.Title level={5}>Headers</Typography.Title>
          <Typography.Text type="secondary">{headers.length}</Typography.Text>
        </div>
        {headers.length === 0 ? (
          <Typography.Text type="secondary">
            {t("response.noHeaders")}
          </Typography.Text>
        ) : (
          <div className="response-headers">
            {headers.map((header, index) => (
              <div
                key={`${header.name}-${index}`}
                className="response-header-row"
              >
                <span className="response-header-name">{header.name}</span>
                <span className="response-header-value">{header.value}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="response-section">
        <div className="response-section-header">
          <Typography.Title level={5}>Body</Typography.Title>
          <Space>
            <Button
              size="small"
              icon={<CopyOutlined />}
              aria-label={t("response.copyAria")}
              onClick={() => void copyBody()}
            >
              {t("common.copy")}
            </Button>
            <Button size="small" onClick={() => setPretty((value) => !value)}>
              {pretty ? t("response.raw") : t("response.pretty")}
            </Button>
          </Space>
        </div>
        {body === "" ? (
          <Typography.Text type="secondary">{t("response.noBody")}</Typography.Text>
        ) : (
          <div className="response-body-viewer">
            <CodeMirrorEditor
              value={shownBody}
              language={language}
              ariaLabel={t("body.content")}
              readOnly
            />
          </div>
        )}
      </section>

      {activeCurl ? (
        <section className="response-section">
          <div className="response-section-header">
            <Typography.Title level={5}>cURL</Typography.Title>
            <Button
              size="small"
              icon={<CopyOutlined />}
              aria-label={t("curl.copyAria")}
              onClick={() => void copyCurl()}
            >
              {t("common.copy")}
            </Button>
          </div>
          <pre className="response-curl">{activeCurl}</pre>
        </section>
      ) : null}
    </div>
  );
}
