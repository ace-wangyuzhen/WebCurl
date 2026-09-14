import { Button, Checkbox, Input, Table } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { EnvironmentVariable } from "../db/database";

interface VariableTableProps {
  items: EnvironmentVariable[];
  onChange: (items: EnvironmentVariable[]) => void;
  addLabel: string;
  nameLabel: (index: number) => string;
  valueLabel: (index: number) => string;
  enableLabel: (index: number) => string;
}

export function VariableTable({
  items,
  onChange,
  addLabel,
  nameLabel,
  valueLabel,
  enableLabel,
}: VariableTableProps) {
  const updateItem = (index: number, patch: Partial<EnvironmentVariable>) => {
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, { key: "", value: "", enabled: true }]);
  };

  const columns = [
    {
      title: "",
      width: 48,
      render: (_value: unknown, record: EnvironmentVariable, index: number) => (
        <Checkbox
          checked={record.enabled}
          aria-label={enableLabel(index + 1)}
          onChange={(event) =>
            updateItem(index, { enabled: event.target.checked })
          }
        />
      ),
    },
    {
      title: "Name",
      render: (_value: unknown, record: EnvironmentVariable, index: number) => (
        <Input
          value={record.key}
          aria-label={nameLabel(index + 1)}
          onChange={(event) => updateItem(index, { key: event.target.value })}
        />
      ),
    },
    {
      title: "Value",
      render: (_value: unknown, record: EnvironmentVariable, index: number) => (
        <Input
          value={record.value}
          aria-label={valueLabel(index + 1)}
          onChange={(event) => updateItem(index, { value: event.target.value })}
        />
      ),
    },
    {
      title: "",
      width: 48,
      render: (_value: unknown, _record: EnvironmentVariable, index: number) => (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          aria-label="Delete row"
          onClick={() => removeItem(index)}
        />
      ),
    },
  ];

  return (
    <div className="variable-table">
      <Table
        rowKey={(_record, index) => index ?? 0}
        dataSource={items}
        columns={columns}
        pagination={false}
        size="small"
      />
      <Button icon={<PlusOutlined />} onClick={addItem} style={{ marginTop: 8 }}>
        {addLabel}
      </Button>
    </div>
  );
}
