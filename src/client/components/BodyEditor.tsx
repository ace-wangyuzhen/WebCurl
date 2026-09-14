import { Alert, Button, Radio, Space } from "antd";
import { FormatPainterOutlined } from "@ant-design/icons";
import type { BodyType } from "../../shared/request-types";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";

function isValidJson(value: string): boolean {
  if (value.trim() === "") {
    return true;
  }
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function BodyEditor() {
  const { t } = useTranslation();
  const body = useEditorStore((state) => state.draft.body);
  const updateDraft = useEditorStore((state) => state.updateDraft);

  const handleTypeChange = (type: BodyType) => {
    updateDraft({ body: { type, content: body.content } });
  };

  const handleContentChange = (content: string) => {
    updateDraft({ body: { type: body.type, content } });
  };

  const canFormatJson =
    body.type === "json" &&
    body.content.trim() !== "" &&
    isValidJson(body.content);

  const handleFormatJson = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(body.content), null, 2);
      updateDraft({ body: { type: body.type, content: formatted } });
    } catch {
      // Invalid JSON; the button is disabled in this case, so this is a no-op.
    }
  };

  return (
    <div className="body-editor">
      <Space className="body-editor-toolbar">
        <Radio.Group
          value={body.type}
          optionType="button"
          buttonStyle="solid"
          onChange={(event) => handleTypeChange(event.target.value as BodyType)}
        >
          <Radio.Button value="none">{t("body.none")}</Radio.Button>
          <Radio.Button value="text">{t("body.text")}</Radio.Button>
          <Radio.Button value="json">{t("body.json")}</Radio.Button>
          <Radio.Button value="form-urlencoded">
            {t("body.formUrlencoded")}
          </Radio.Button>
        </Radio.Group>

        {body.type === "json" ? (
          <Button
            icon={<FormatPainterOutlined />}
            disabled={!canFormatJson}
            aria-label={t("body.format")}
            onClick={handleFormatJson}
          >
            {t("body.format")}
          </Button>
        ) : null}
      </Space>

      {body.type !== "none" ? (
        <CodeMirrorEditor
          value={body.content}
          onChange={handleContentChange}
          language={body.type === "json" ? "json" : "text"}
          ariaLabel={t("body.content")}
        />
      ) : null}

      {body.type === "json" && !isValidJson(body.content) ? (
        <Alert type="warning" showIcon message={t("body.invalidJson")} />
      ) : null}
    </div>
  );
}
