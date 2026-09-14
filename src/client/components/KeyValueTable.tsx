import { useState } from "react";
import { Button, Checkbox, Input, Modal, Table, Tooltip } from "antd";
import {
  DeleteOutlined,
  ExpandAltOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { KeyValueItem } from "../../shared/request-types";
import { createId } from "../db/database";
import { useTranslation } from "../i18n";

interface KeyValueTableProps {
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
  addLabel: string;
  nameLabel: (index: number) => string;
  valueLabel: (index: number) => string;
  enableLabel: (index: number) => string;
}

export function KeyValueTable({
  items,
  onChange,
  addLabel,
  nameLabel,
  valueLabel,
  enableLabel,
}: KeyValueTableProps) {
  const { t } = useTranslation();
  const [expandTarget, setExpandTarget] = useState<{
    id: string;
    value: string;
  } | null>(null);

  const updateItem = (id: string, patch: Partial<KeyValueItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const addItem = () => {
    onChange([
      ...items,
      { id: createId(), key: "", value: "", enabled: true },
    ]);
  };

  const columns = [
    {
      title: "",
      dataIndex: "enabled",
      width: 48,
      render: (_value: unknown, record: KeyValueItem, index: number) => (
        <Checkbox
          checked={record.enabled}
          aria-label={enableLabel(index + 1)}
          onChange={(event) =>
            updateItem(record.id, { enabled: event.target.checked })
          }
        />
      ),
    },
    {
      title: t("table.name"),
      dataIndex: "key",
      render: (_value: unknown, record: KeyValueItem, index: number) => (
        <Input
          value={record.key}
          aria-label={nameLabel(index + 1)}
          onChange={(event) => updateItem(record.id, { key: event.target.value })}
        />
      ),
    },
    {
      title: t("table.value"),
      dataIndex: "value",
      render: (_value: unknown, record: KeyValueItem, index: number) => (
        <Input
          className="kv-value-input"
          value={record.value}
          aria-label={valueLabel(index + 1)}
          onChange={(event) =>
            updateItem(record.id, { value: event.target.value })
          }
          suffix={
            <Tooltip title={t("table.expand")}>
              <Button
                className="kv-value-expand"
                type="text"
                size="small"
                icon={<ExpandAltOutlined />}
                aria-label={t("table.expandAria", { n: index + 1 })}
                onClick={() =>
                  setExpandTarget({ id: record.id, value: record.value })
                }
              />
            </Tooltip>
          }
        />
      ),
    },
    {
      title: "",
      width: 48,
      render: (_value: unknown, record: KeyValueItem) => (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          aria-label={t("table.deleteRow")}
          onClick={() => removeItem(record.id)}
        />
      ),
    },
  ];

  return (
    <div className="key-value-table">
      <Table
        rowKey="id"
        dataSource={items}
        columns={columns}
        pagination={false}
        size="small"
      />
      <Button
        icon={<PlusOutlined />}
        onClick={addItem}
        style={{ marginTop: 8 }}
      >
        {addLabel}
      </Button>

      <Modal
        title={t("table.expandTitle")}
        open={expandTarget !== null}
        onOk={() => {
          if (expandTarget) {
            updateItem(expandTarget.id, { value: expandTarget.value });
          }
          setExpandTarget(null);
        }}
        onCancel={() => setExpandTarget(null)}
        okText={t("common.ok")}
        cancelText={t("common.cancel")}
      >
        <Input.TextArea
          value={expandTarget?.value ?? ""}
          onChange={(event) =>
            setExpandTarget((prev) =>
              prev ? { ...prev, value: event.target.value } : prev,
            )
          }
          aria-label={t("table.expandTitle")}
          autoSize={{ minRows: 6, maxRows: 18 }}
        />
      </Modal>
    </div>
  );
}
