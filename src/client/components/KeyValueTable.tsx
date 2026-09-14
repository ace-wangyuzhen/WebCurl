import { Button, Checkbox, Input, Table } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
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
          value={record.value}
          aria-label={valueLabel(index + 1)}
          onChange={(event) =>
            updateItem(record.id, { value: event.target.value })
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
    </div>
  );
}
