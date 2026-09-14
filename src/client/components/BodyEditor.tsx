import { Alert, Radio } from "antd";
import type { BodyType } from "../../shared/request-types";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
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
  const body = useEditorStore((state) => state.draft.body);
  const updateDraft = useEditorStore((state) => state.updateDraft);

  const handleTypeChange = (type: BodyType) => {
    updateDraft({ body: { type, content: body.content } });
  };

  const handleContentChange = (content: string) => {
    updateDraft({ body: { type: body.type, content } });
  };

  return (
    <div className="body-editor">
      <Radio.Group
        value={body.type}
        optionType="button"
        buttonStyle="solid"
        onChange={(event) => handleTypeChange(event.target.value as BodyType)}
      >
        <Radio.Button value="none">None</Radio.Button>
        <Radio.Button value="text">Text</Radio.Button>
        <Radio.Button value="json">JSON</Radio.Button>
        <Radio.Button value="form-urlencoded">Form URL Encoded</Radio.Button>
      </Radio.Group>

      {body.type !== "none" ? (
        <CodeMirrorEditor
          value={body.content}
          onChange={handleContentChange}
          language={body.type === "json" ? "json" : "text"}
          ariaLabel="Body content"
        />
      ) : null}

      {body.type === "json" && !isValidJson(body.content) ? (
        <Alert type="warning" showIcon message="Body is not valid JSON" />
      ) : null}
    </div>
  );
}
