import { useEffect, useState } from "react";
import { Empty, Spin, Typography } from "antd";
import type { RequestRecord } from "../db/database";
import { requestRepository } from "../db/repositories";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";

interface FolderRequestListProps {
  collectionId: string;
  folderId: string;
}

export function FolderRequestList({
  collectionId,
  folderId,
}: FolderRequestListProps) {
  const { t } = useTranslation();
  const workspaceVersion = useEditorStore((state) => state.workspaceVersion);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    requestRepository
      .listByCollection(collectionId)
      .then((all) => {
        if (cancelled) {
          return;
        }
        setRequests(all.filter((request) => request.folderId === folderId));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setRequests([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [collectionId, folderId, workspaceVersion]);

  const openRequest = (request: RequestRecord) => {
    useEditorStore.getState().selectRequest({
      collectionId: request.collectionId,
      folderId: request.folderId,
      requestId: request.id,
      request: {
        name: request.name,
        method: request.method,
        url: request.url,
        queryParams: request.queryParams,
        headers: request.headers,
        body: request.body,
        preRequestScript: request.preRequestScript,
      },
    });
  };

  return (
    <section className="folder-request-list" aria-label={t("folder.requests")}>
      <Typography.Text strong className="folder-request-list-title">
        {t("folder.requests")}
      </Typography.Text>

      {loading ? (
        <Spin />
      ) : requests.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("folder.noRequests")}
        />
      ) : (
        <ul className="folder-request-items">
          {requests.map((request) => {
            const method = request.method.toUpperCase();
            return (
              <li key={request.id}>
                <button
                  type="button"
                  className="folder-request-row"
                  onClick={() => openRequest(request)}
                >
                  <span className="folder-request-method" data-method={method}>
                    {method}
                  </span>
                  <span className="folder-request-body">
                    <span className="folder-request-name">{request.name}</span>
                    {request.url ? (
                      <span className="folder-request-url">{request.url}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
