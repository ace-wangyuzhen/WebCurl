import { useState } from "react";
import { Button, Empty, Space, Tag, Typography, message } from "antd";
import { CloseCircleFilled, CopyOutlined } from "@ant-design/icons";
import { useRuntimeStore } from "../state/runtime-store";
import { useSettingsStore } from "../state/settings-store";
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

type CurlToken = { text: string; type: "cmd" | "flag" | "string" | "plain" };

// Lightweight highlighter for the generated curl command. There is no shell
// language in this project's CodeMirror setup, so we colour the command name,
// flags, and single-quoted arguments with a small tokenizer instead.
function tokenizeCurl(input: string): CurlToken[] {
  const tokens: CurlToken[] = [];
  const pattern = /'[^']*'|(?:^|\s)-{1,2}[A-Za-z][\w-]*|^curl\b/g;
  let last = 0;
  for (const match of input.matchAll(pattern)) {
    const start = match.index;
    if (start > last) {
      tokens.push({ text: input.slice(last, start), type: "plain" });
    }
    const raw = match[0];
    if (raw.startsWith("'")) {
      tokens.push({ text: raw, type: "string" });
    } else if (raw.trimStart().startsWith("-")) {
      const flag = raw.trimStart();
      const lead = raw.slice(0, raw.length - flag.length);
      if (lead) {
        tokens.push({ text: lead, type: "plain" });
      }
      tokens.push({ text: flag, type: "flag" });
    } else {
      tokens.push({ text: raw, type: "cmd" });
    }
    last = start + raw.length;
  }
  if (last < input.length) {
    tokens.push({ text: input.slice(last), type: "plain" });
  }
  return tokens;
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

// Writes text to the clipboard. The async Clipboard API only exists in secure
// contexts (HTTPS or localhost), so over plain HTTP — for example when this app
// is reached through a LAN IP — we fall back to a temporary textarea plus
// execCommand, which works everywhere.
async function copyText(text: string): Promise<void> {
  if (typeof navigator.clipboard?.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the legacy path below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textarea);
    if (selection) {
      selection.removeAllRanges();
      if (previousRange) {
        selection.addRange(previousRange);
      }
    }
  }
}

export function ResponsePanel() {
  const { t } = useTranslation();
  const activeResponse = useRuntimeStore((state) => state.activeResponse);
  const activeError = useRuntimeStore((state) => state.activeError);
  const activeCurl = useRuntimeStore((state) => state.activeCurl);
  const prettyByDefault = useSettingsStore((state) => state.prettyByDefault);
  const wrapLines = useSettingsStore((state) => state.wrapLines);
  const maxRenderBytes = useSettingsStore((state) => state.maxRenderBytes);
  const [pretty, setPretty] = useState(prettyByDefault);

  const copyBody = async () => {
    const body = activeResponse?.body ?? "";
    try {
      await copyText(body);
      void message.success(t("common.copied"));
    } catch {
      void message.error(t("common.copyFailed"));
    }
  };

  const copyCurl = async () => {
    if (!activeCurl) {
      return;
    }
    try {
      await copyText(activeCurl);
      void message.success(t("common.copied"));
    } catch {
      void message.error(t("common.copyFailed"));
    }
  };

  const copyTextValue = async (value: string) => {
    try {
      await copyText(value);
      void message.success(t("common.copied"));
    } catch {
      void message.error(t("common.copyFailed"));
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
  const renderedFull = pretty ? (prettyJson(body) ?? body) : body;
  // Cap what CodeMirror renders so very large bodies don't freeze the editor.
  // Copying is unaffected and always uses the full body.
  const renderedBytes = new TextEncoder().encode(renderedFull).length;
  const truncated = renderedBytes > maxRenderBytes;
  const shownBody = truncated
    ? renderedFull.slice(0, maxRenderBytes)
    : renderedFull;

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
                <div className="response-header-cell">
                  <span className="response-header-name">{header.name}</span>
                  <Button
                    type="text"
                    size="small"
                    className="response-header-copy"
                    icon={<CopyOutlined />}
                    aria-label={t("response.copyHeaderNameAria", {
                      name: header.name,
                    })}
                    onClick={() => void copyTextValue(header.name)}
                  />
                </div>
                <div className="response-header-cell">
                  <span className="response-header-value">{header.value}</span>
                  <Button
                    type="text"
                    size="small"
                    className="response-header-copy"
                    icon={<CopyOutlined />}
                    aria-label={t("response.copyHeaderValueAria", {
                      name: header.name,
                    })}
                    onClick={() => void copyTextValue(header.value)}
                  />
                </div>
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
            {truncated ? (
              <div className="response-body-truncated" role="status">
                {t("response.truncated", {
                  shown: Math.round(maxRenderBytes / 1024),
                  total: Math.round(renderedBytes / 1024),
                })}
              </div>
            ) : null}
            <CodeMirrorEditor
              value={shownBody}
              language={language}
              ariaLabel={t("body.content")}
              wrap={wrapLines}
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
          <pre className="response-curl">
            {tokenizeCurl(activeCurl).map((token, index) =>
              token.type === "plain" ? (
                token.text
              ) : (
                <span key={index} className={`curl-token-${token.type}`}>
                  {token.text}
                </span>
              ),
            )}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
