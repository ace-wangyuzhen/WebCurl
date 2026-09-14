import { useCallback, useEffect, useState } from "react";
import { Button, Drawer, Empty, Popconfirm, Spin, Tag } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import type { HistoryRecord } from "../db/database";
import { historyRepository } from "../db/repositories";
import type { ExecuteRequest } from "../../shared/contracts";
import type { RequestDraft } from "../state/editor-store";
import { useEditorStore } from "../state/editor-store";
import { useRuntimeStore } from "../state/runtime-store";
import { useTranslation } from "../i18n";

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

function statusTone(status: number | null): "success" | "warning" | "error" {
  if (status === null) {
    return "error";
  }
  if (status >= 200 && status < 300) {
    return "success";
  }
  if (status >= 300 && status < 400) {
    return "warning";
  }
  return "error";
}

function snapshotToDraft(snapshot: ExecuteRequest): RequestDraft {
  return {
    name: "",
    method: snapshot.method,
    url: snapshot.url,
    queryParams: snapshot.query,
    headers: snapshot.headers,
    body: snapshot.body,
    preRequestScript: "",
  };
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await historyRepository.list(100));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open, load]);

  const replay = (record: HistoryRecord) => {
    useEditorStore
      .getState()
      .loadRequestDraft(snapshotToDraft(record.requestSnapshot));
    useRuntimeStore.getState().showResponse(record.responseSnapshot);
    onClose();
  };

  const clear = async () => {
    await historyRepository.clear();
    await load();
  };

  return (
    <Drawer
      title={t("history.title")}
      placement="right"
      size={440}
      open={open}
      onClose={onClose}
      extra={
        records.length > 0 ? (
          <Popconfirm
            title={t("history.clearConfirm")}
            onConfirm={() => void clear()}
          >
            <Button size="small" icon={<ClearOutlined />}>
              {t("history.clear")}
            </Button>
          </Popconfirm>
        ) : null
      }
    >
      {loading ? (
        <Spin />
      ) : records.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("history.empty")}
        />
      ) : (
        <div className="history-list">
          {records.map((record) => {
            const status = record.responseSnapshot.status;
            return (
              <button
                key={record.id}
                type="button"
                className="history-item"
                onClick={() => replay(record)}
                aria-label={t("history.replayAria", {
                  url: record.requestSnapshot.url,
                })}
              >
                <span className="history-item-top">
                  <span
                    className="history-method"
                    data-method={record.requestSnapshot.method}
                  >
                    {record.requestSnapshot.method}
                  </span>
                  <span className="history-url">
                    {record.requestSnapshot.url}
                  </span>
                </span>
                <span className="history-item-meta">
                  <Tag color={statusTone(status)} className="history-status">
                    {status ?? "—"}
                  </Tag>
                  <span className="history-time">
                    {formatTime(record.createdAt)}
                  </span>
                  <span className="history-duration">
                    {record.responseSnapshot.durationMs} ms
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
