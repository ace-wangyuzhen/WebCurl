import { useCallback, useEffect, useMemo, useState } from "react";
import type { Key } from "react";
import { Empty, Modal, Radio, Spin, Tree, Typography, message } from "antd";
import type {
  CollectionRecord,
  FolderRecord,
  RequestRecord,
} from "../db/database";
import {
  collectionRepository,
  folderRepository,
  requestRepository,
} from "../db/repositories";
import {
  exportWorkspace,
  exportWorkspaceSubset,
  type WorkspaceExport,
} from "../db/seed";
import { useTranslation } from "../i18n";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

type NodeKind = "collection" | "folder" | "request";

interface ExportTreeNode {
  key: string;
  title: string;
  children?: ExportTreeNode[];
}

function download(data: WorkspaceExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "web-curl-workspace.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"all" | "custom">("all");
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<Key[]>([]);
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<Key[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    // Reset to a clean slate every time the dialog opens.
    setMode("all");
    setCheckedKeys([]);
    setHalfCheckedKeys([]);
    setLoading(true);
    void (async () => {
      try {
        const cols = await collectionRepository.list();
        const [folderLists, requestLists] = await Promise.all([
          Promise.all(cols.map((c) => folderRepository.listByCollection(c.id))),
          Promise.all(cols.map((c) => requestRepository.listByCollection(c.id))),
        ]);
        setCollections(cols);
        setFolders(folderLists.flat());
        setRequests(requestLists.flat());
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const kindByKey = useMemo(() => {
    const map = new Map<string, NodeKind>();
    collections.forEach((c) => map.set(c.id, "collection"));
    folders.forEach((f) => map.set(f.id, "folder"));
    requests.forEach((r) => map.set(r.id, "request"));
    return map;
  }, [collections, folders, requests]);

  const treeData = useMemo<ExportTreeNode[]>(() => {
    const folderNodes = (
      collectionId: string,
      parentId: string | null,
    ): ExportTreeNode[] =>
      folders
        .filter(
          (f) => f.collectionId === collectionId && f.parentId === parentId,
        )
        .map((f) => ({
          key: f.id,
          title: f.name,
          children: [
            ...folderNodes(collectionId, f.id),
            ...requests
              .filter((r) => r.folderId === f.id)
              .map((r) => ({ key: r.id, title: r.name || r.method })),
          ],
        }));

    return collections.map((c) => ({
      key: c.id,
      title: c.name,
      children: [
        ...folderNodes(c.id, null),
        ...requests
          .filter((r) => r.collectionId === c.id && r.folderId === null)
          .map((r) => ({ key: r.id, title: r.name || r.method })),
      ],
    }));
  }, [collections, folders, requests]);

  const canExport = mode === "all" || checkedKeys.length > 0;

  const handleExport = useCallback(async () => {
    if (mode === "all") {
      download(await exportWorkspace());
      onClose();
      return;
    }

    const structural = [...checkedKeys, ...halfCheckedKeys].map(String);
    const data = await exportWorkspaceSubset({
      collectionIds: structural.filter(
        (key) => kindByKey.get(key) === "collection",
      ),
      folderIds: structural.filter((key) => kindByKey.get(key) === "folder"),
      requestIds: checkedKeys
        .map(String)
        .filter((key) => kindByKey.get(key) === "request"),
    });

    if (data.requests.length === 0 && data.folders.length === 0) {
      void message.warning(t("export.emptySelection"));
      return;
    }
    download(data);
    onClose();
  }, [mode, checkedKeys, halfCheckedKeys, kindByKey, onClose, t]);

  return (
    <Modal
      title={t("export.title")}
      open={open}
      onOk={() => void handleExport()}
      onCancel={onClose}
      okText={t("export.confirm")}
      okButtonProps={{ disabled: !canExport }}
      cancelText={t("common.cancel")}
    >
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value)}
        style={{ marginBottom: 12 }}
      >
        <Radio value="all">{t("export.all")}</Radio>
        <Radio value="custom">{t("export.custom")}</Radio>
      </Radio.Group>

      {mode === "custom" ? (
        loading ? (
          <Spin />
        ) : collections.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("export.empty")}
          />
        ) : (
          <div className="export-tree">
            <Tree
              checkable
              selectable={false}
              defaultExpandAll
              treeData={treeData}
              checkedKeys={checkedKeys}
              onCheck={(checked, info) => {
                setCheckedKeys(checked as Key[]);
                setHalfCheckedKeys(info.halfCheckedKeys ?? []);
              }}
            />
          </div>
        )
      ) : (
        <Typography.Paragraph type="secondary">
          {t("export.allHint")}
        </Typography.Paragraph>
      )}
    </Modal>
  );
}
