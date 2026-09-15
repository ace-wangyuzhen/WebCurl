import { useCallback, useEffect, useState } from "react";
import { Button, Empty, Popconfirm, Spin, Tag } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import type { HistoryRecord } from "../db/database";
import { historyRepository } from "../db/repositories";
import { useEditorStore } from "../state/editor-store";
import { useRuntimeStore } from "../state/runtime-store";
import { useTranslation } from "../i18n";

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

export function RequestHistoryPanel() {
  const { t } = useTranslation();
  const selectedRequestId = useEditorStore((state) => state.selectedRequestId);
  // Reload whenever a new response lands so a fresh run shows up immediately.
  const activeResponse = useRuntimeStore((state) => state.activeResponse);

  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!selectedRequestId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      setRecords(await historyRepository.listByRequest(selectedRequestId, 100));
    } finally {
      setLoading(false);
    }
  }, [selectedRequestId]);

  useEffect(() => {
    void load();
  }, [load, activeResponse]);

  const view = (record: HistoryRecord) => {
    useRuntimeStore.getState().showResponse(record.responseSnapshot);
  };

  const clear = async () => {
    if (!selectedRequestId) {
      return;
    }
    await historyRepository.clearByRequest(selectedRequestId);
    await load();
  };

  if (!selectedRequestId) {
    return (
      <div className="request-history">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("history.unsavedHint")}
        />
      </div>
    );
  }

  return (
    <div className="request-history">
      {records.length > 0 ? (
        <div className="request-history-bar">
          <Popconfirm
            title={t("history.clearRequestConfirm")}
            onConfirm={() => void clear()}
          >
            <Button size="small" icon={<ClearOutlined />}>
              {t("history.clear")}
            </Button>
          </Popconfirm>
        </div>
      ) : null}

      {loading ? (
        <Spin />
      ) : records.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("history.emptyRequest")}
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
                onClick={() => view(record)}
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
    </div>
  );
}
