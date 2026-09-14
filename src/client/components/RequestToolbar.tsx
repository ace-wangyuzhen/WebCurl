import { Button, Input, Select } from "antd";
import {
  CloseOutlined,
  SendOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTranslation } from "../i18n";
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
  const { t } = useTranslation();
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
          aria-label={t("request.method")}
        />
        <Input
          className="url-input"
          value={draft.url}
          onChange={(event) => updateDraft({ url: event.target.value })}
          placeholder={t("request.urlPlaceholder")}
          aria-label={t("request.url")}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          aria-label={t("request.sendAria")}
          aria-busy={isSending}
          onClick={onSend}
        >
          {t("request.send")}
        </Button>
        {isSending ? (
          <Button
            icon={<CloseOutlined />}
            aria-label={t("request.cancelAria")}
            onClick={onCancel}
          >
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>

      {unresolvedVariables.length > 0 ? (
        <div className="unresolved-warning" role="alert">
          <WarningOutlined /> {t("request.unresolved")}{" "}
          {unresolvedVariables.join(", ")}
        </div>
      ) : null}
    </div>
  );
}
