import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Key } from "react";
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Input,
  Modal,
  Space,
  Spin,
  Tooltip,
  Tree,
  TreeSelect,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  ContainerOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  FolderOutlined,
  ImportOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
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
import { parseCurlCommand } from "../api/parse-curl";
import { useTranslation } from "../i18n";
import { useEditorStore } from "../state/editor-store";

type TreeNodeKind = "collection" | "folder" | "request";

interface TreeDataNode {
  key: string;
  title: string;
  name: string;
  kind: TreeNodeKind;
  collectionId: string;
  method?: string;
  children?: TreeDataNode[];
  isLeaf?: boolean;
}

interface TargetTreeNode {
  value: string;
  title: string;
  children?: TargetTreeNode[];
}

function buildCollectionTree(
  collections: CollectionRecord[],
  folders: FolderRecord[],
  requests: RequestRecord[],
): TreeDataNode[] {
  const folderNodes = (
    collectionId: string,
    parentId: string | null,
  ): TreeDataNode[] =>
    folders
      .filter(
        (folder) =>
          folder.collectionId === collectionId && folder.parentId === parentId,
      )
      .map((folder) => ({
        key: folder.id,
        title: folder.name,
        name: folder.name,
        kind: "folder" as const,
        collectionId: folder.collectionId,
        children: [
          ...folderNodes(collectionId, folder.id),
          ...requests
            .filter((request) => request.folderId === folder.id)
            .map((request) => ({
              key: request.id,
              title: request.name,
              name: request.name,
              kind: "request" as const,
              collectionId: request.collectionId,
              method: request.method,
              isLeaf: true,
            })),
        ],
      }));

  return collections.map((collection) => ({
    key: collection.id,
    title: collection.name,
    name: collection.name,
    kind: "collection" as const,
    collectionId: collection.id,
    children: [
      ...folderNodes(collection.id, null),
      ...requests
        .filter(
          (request) =>
            request.collectionId === collection.id && request.folderId === null,
        )
        .map((request) => ({
          key: request.id,
          title: request.name,
          name: request.name,
          kind: "request" as const,
          collectionId: request.collectionId,
          method: request.method,
          isLeaf: true,
        })),
    ],
  }));
}

interface RenameTarget {
  kind: TreeNodeKind;
  id: string;
  name: string;
}

interface DeleteTarget {
  kind: TreeNodeKind;
  id: string;
  name: string;
}

interface DeletePlan {
  collectionIds: string[];
  folderIds: string[];
  requestIds: string[];
}

interface MoveCopyTarget {
  kind: "folder" | "request";
  action: "move" | "copy";
  id: string;
  name: string;
}

interface CurlImportTarget {
  collectionId: string;
  folderId: string | null;
}

export function CollectionSidebar() {
  const { t } = useTranslation();
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [moveCopyTarget, setMoveCopyTarget] = useState<MoveCopyTarget | null>(
    null,
  );
  const [targetId, setTargetId] = useState<string | null>(null);
  const [curlImportTarget, setCurlImportTarget] =
    useState<CurlImportTarget | null>(null);
  const [curlText, setCurlText] = useState("");
  const [curlName, setCurlName] = useState("");
  const [curlNameEdited, setCurlNameEdited] = useState(false);
  const [curlError, setCurlError] = useState<string | null>(null);

  const selectedRequestId = useEditorStore((state) => state.selectedRequestId);
  const selectedFolderId = useEditorStore((state) => state.selectedFolderId);
  const selectedCollectionId = useEditorStore(
    (state) => state.selectedCollectionId,
  );
  const workspaceVersion = useEditorStore((state) => state.workspaceVersion);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const collections = await collectionRepository.list();
      const folderLists = await Promise.all(
        collections.map((collection) =>
          folderRepository.listByCollection(collection.id),
        ),
      );
      const requestLists = await Promise.all(
        collections.map((collection) =>
          requestRepository.listByCollection(collection.id),
        ),
      );
      if (!cancelledRef.current) {
        setCollections(collections);
        setFolders(folderLists.flat());
        setRequests(requestLists.flat());
      }
    } catch (cause) {
      if (!cancelledRef.current) {
        setError(
          cause instanceof Error ? cause.message : t("tree.loadError"),
        );
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    cancelledRef.current = false;
    void load();
    return () => {
      cancelledRef.current = true;
    };
  }, [load, workspaceVersion]);

  // Auto-select the first request when nothing is selected yet (e.g. on first
  // launch), so the editor always has a request to edit and save.
  useEffect(() => {
    if (loading) {
      return;
    }
    const state = useEditorStore.getState();
    if (
      state.selectedRequestId ||
      state.selectedFolderId ||
      state.selectedCollectionId
    ) {
      return;
    }
    const first = requests[0];
    if (!first) {
      return;
    }
    useEditorStore.getState().selectRequest({
      collectionId: first.collectionId,
      folderId: first.folderId,
      requestId: first.id,
      request: {
        name: first.name,
        method: first.method,
        url: first.url,
        queryParams: first.queryParams,
        headers: first.headers,
        body: first.body,
        preRequestScript: first.preRequestScript,
      },
    });
  }, [loading, requests]);

  const treeData = useMemo(
    () => buildCollectionTree(collections, folders, requests),
    [collections, folders, requests],
  );

  const handleSelect = (keys: Key[]) => {
    if (keys.length === 0) {
      return;
    }
    const key = keys[0] as string;

    const request = requests.find((candidate) => candidate.id === key);
    if (request) {
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
      return;
    }

    const folder = folders.find((candidate) => candidate.id === key);
    if (folder) {
      useEditorStore.getState().selectFolder({
        collectionId: folder.collectionId,
        folderId: folder.id,
        name: folder.name,
        preRequestScript: folder.preRequestScript,
      });
      return;
    }

    const collection = collections.find((candidate) => candidate.id === key);
    if (collection) {
      useEditorStore.getState().selectCollection({
        collectionId: collection.id,
        name: collection.name,
        preRequestScript: collection.preRequestScript,
      });
    }
  };

  const openRename = (kind: TreeNodeKind, id: string, name: string) => {
    setRenameTarget({ kind, id, name });
    setRenameValue(name);
  };

  const confirmRename = async () => {
    if (!renameTarget) {
      return;
    }
    const { kind, id } = renameTarget;
    const name = renameValue.trim();
    setRenameTarget(null);
    if (name === "") {
      return;
    }
    if (kind === "collection") {
      await collectionRepository.update(id, { name });
    } else if (kind === "folder") {
      await folderRepository.update(id, { name });
    } else {
      await requestRepository.update(id, { name });
    }

    const state = useEditorStore.getState();
    if (kind === "collection" && state.selectedCollectionId === id) {
      useEditorStore.getState().updateSelectedEntityName(name);
    } else if (kind === "folder" && state.selectedFolderId === id) {
      useEditorStore.getState().updateSelectedEntityName(name);
    } else if (kind === "request" && state.selectedRequestId === id) {
      useEditorStore.getState().updateDraft({ name });
    }

    await load();
  };

  const collectFolderSubtree = (rootId: string): string[] => {
    const result: string[] = [];
    const queue = [rootId];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) {
        break;
      }
      result.push(current);
      for (const folder of folders) {
        if (folder.parentId === current) {
          queue.push(folder.id);
        }
      }
    }
    return result;
  };

  const buildDeletePlan = (kind: TreeNodeKind, id: string): DeletePlan => {
    if (kind === "request") {
      return { collectionIds: [], folderIds: [], requestIds: [id] };
    }
    if (kind === "folder") {
      const folderIds = collectFolderSubtree(id);
      const requestIds = requests
        .filter(
          (request) =>
            request.folderId !== null && folderIds.includes(request.folderId),
        )
        .map((request) => request.id);
      return { collectionIds: [], folderIds, requestIds };
    }
    const folderIds = folders
      .filter((folder) => folder.collectionId === id)
      .map((folder) => folder.id);
    const requestIds = requests
      .filter((request) => request.collectionId === id)
      .map((request) => request.id);
    return { collectionIds: [id], folderIds, requestIds };
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const { kind, id } = deleteTarget;
    setDeleteTarget(null);

    const plan = buildDeletePlan(kind, id);
    for (const folderId of plan.folderIds) {
      await folderRepository.remove(folderId);
    }
    for (const requestId of plan.requestIds) {
      await requestRepository.remove(requestId);
    }
    for (const collectionId of plan.collectionIds) {
      await collectionRepository.remove(collectionId);
    }

    const state = useEditorStore.getState();
    const selectionWasDeleted =
      (state.selectedRequestId !== null &&
        plan.requestIds.includes(state.selectedRequestId)) ||
      (state.selectedFolderId !== null &&
        plan.folderIds.includes(state.selectedFolderId)) ||
      (state.selectedCollectionId !== null &&
        plan.collectionIds.includes(state.selectedCollectionId));
    if (selectionWasDeleted) {
      useEditorStore.getState().clearSelection();
    }

    await load();
  };

  const deleteDescription = (target: DeleteTarget | null): string => {
    if (!target) {
      return "";
    }
    if (target.kind === "collection") {
      return t("tree.deleteCollectionDesc");
    }
    if (target.kind === "folder") {
      return t("tree.deleteFolderDesc");
    }
    return t("tree.deleteRequestDesc");
  };

  const createFolderIn = async (collectionId: string) => {
    await folderRepository.create({
      collectionId,
      name: t("tree.newFolderName"),
    });
    await load();
  };

  const createRequestIn = async (
    collectionId: string,
    folderId: string | null,
  ) => {
    const created = await requestRepository.create({
      collectionId,
      folderId,
      name: t("tree.newRequestName"),
      method: "GET",
      url: "",
    });
    useEditorStore.getState().selectRequest({
      collectionId: created.collectionId,
      folderId: created.folderId,
      requestId: created.id,
      request: {
        name: created.name,
        method: created.method,
        url: created.url,
        queryParams: created.queryParams,
        headers: created.headers,
        body: created.body,
        preRequestScript: created.preRequestScript,
      },
    });
    await load();
  };

  const deriveCurlName = (rawUrl: string): string => {
    try {
      const path = new URL(rawUrl).pathname;
      return path && path !== "/" ? path : rawUrl;
    } catch {
      const withoutQuery = rawUrl.split("?")[0];
      return withoutQuery || rawUrl;
    }
  };

  const openCurlImport = (collectionId: string, folderId: string | null) => {
    setCurlImportTarget({ collectionId, folderId });
    setCurlText("");
    setCurlName("");
    setCurlNameEdited(false);
    setCurlError(null);
  };

  const handleCurlTextChange = (value: string) => {
    setCurlText(value);
    setCurlError(null);
    if (!curlNameEdited) {
      try {
        const parsed = parseCurlCommand(value);
        setCurlName(deriveCurlName(parsed.url));
      } catch {
        setCurlName("");
      }
    }
  };

  const confirmCurlImport = async () => {
    if (!curlImportTarget) {
      return;
    }
    let parsed;
    try {
      parsed = parseCurlCommand(curlText);
    } catch {
      setCurlError(t("curlImport.error"));
      return;
    }

    const name = curlName.trim() || deriveCurlName(parsed.url);
    const created = await requestRepository.create({
      collectionId: curlImportTarget.collectionId,
      folderId: curlImportTarget.folderId,
      name,
      method: parsed.method,
      url: parsed.url,
      queryParams: parsed.query,
      headers: parsed.headers,
      body: parsed.body,
    });
    setCurlImportTarget(null);

    useEditorStore.getState().selectRequest({
      collectionId: created.collectionId,
      folderId: created.folderId,
      requestId: created.id,
      request: {
        name: created.name,
        method: created.method,
        url: created.url,
        queryParams: created.queryParams,
        headers: created.headers,
        body: created.body,
        preRequestScript: created.preRequestScript,
      },
    });
    await load();
  };

  const buildTargetTree = (includeFolders: boolean): TargetTreeNode[] => {
    const folderNodes = (
      collectionId: string,
      parentId: string | null,
    ): TargetTreeNode[] =>
      folders
        .filter(
          (folder) =>
            folder.collectionId === collectionId && folder.parentId === parentId,
        )
        .map((folder) => ({
          value: folder.id,
          title: folder.name,
          children: folderNodes(collectionId, folder.id),
        }));

    return collections.map((collection) => ({
      value: collection.id,
      title: collection.name,
      children: includeFolders ? folderNodes(collection.id, null) : undefined,
    }));
  };

  const resolveTarget = (
    targetId: string,
  ): { collectionId: string; folderId: string | null } => {
    const folder = folders.find((candidate) => candidate.id === targetId);
    if (folder) {
      return { collectionId: folder.collectionId, folderId: folder.id };
    }
    return { collectionId: targetId, folderId: null };
  };

  const moveFolderTo = async (folderId: string, targetCollectionId: string) => {
    const subtreeIds = collectFolderSubtree(folderId);
    for (const id of subtreeIds) {
      await folderRepository.update(id, { collectionId: targetCollectionId });
    }
    const requestIds = requests
      .filter(
        (request) =>
          request.folderId !== null && subtreeIds.includes(request.folderId),
      )
      .map((request) => request.id);
    for (const requestId of requestIds) {
      await requestRepository.update(requestId, {
        collectionId: targetCollectionId,
      });
    }
  };

  const copyFolderTo = async (folderId: string, targetCollectionId: string) => {
    const copyRecursive = async (
      sourceFolderId: string,
      parentId: string | null,
    ): Promise<string> => {
      const sourceFolder = folders.find((folder) => folder.id === sourceFolderId);
      if (!sourceFolder) {
        return "";
      }
      const newFolder = await folderRepository.create({
        collectionId: targetCollectionId,
        parentId,
        name: `${sourceFolder.name}${t("common.copySuffix")}`,
        preRequestScript: sourceFolder.preRequestScript,
        sortOrder: sourceFolder.sortOrder,
      });
      for (const child of folders.filter(
        (folder) => folder.parentId === sourceFolderId,
      )) {
        await copyRecursive(child.id, newFolder.id);
      }
      for (const request of requests.filter(
        (candidate) => candidate.folderId === sourceFolderId,
      )) {
        await requestRepository.create({
          collectionId: targetCollectionId,
          folderId: newFolder.id,
          name: request.name,
          method: request.method,
          url: request.url,
          queryParams: request.queryParams,
          headers: request.headers,
          body: request.body,
          preRequestScript: request.preRequestScript,
          sortOrder: request.sortOrder,
        });
      }
      return newFolder.id;
    };
    await copyRecursive(folderId, null);
  };

  const copyRequestTo = async (
    requestId: string,
    targetCollectionId: string,
    targetFolderId: string | null,
  ) => {
    const request = requests.find((candidate) => candidate.id === requestId);
    if (!request) {
      return;
    }
    await requestRepository.create({
      collectionId: targetCollectionId,
      folderId: targetFolderId,
      name: `${request.name}${t("common.copySuffix")}`,
      method: request.method,
      url: request.url,
      queryParams: request.queryParams,
      headers: request.headers,
      body: request.body,
      preRequestScript: request.preRequestScript,
      sortOrder: request.sortOrder,
    });
  };

  const confirmMoveCopy = async () => {
    if (!moveCopyTarget || targetId === null) {
      return;
    }
    const { kind, action, id } = moveCopyTarget;
    setMoveCopyTarget(null);
    setTargetId(null);

    if (kind === "request") {
      const target = resolveTarget(targetId);
      if (action === "move") {
        await requestRepository.update(id, {
          collectionId: target.collectionId,
          folderId: target.folderId,
        });
      } else {
        await copyRequestTo(id, target.collectionId, target.folderId);
      }
    } else {
      if (action === "move") {
        await moveFolderTo(id, targetId);
      } else {
        await copyFolderTo(id, targetId);
      }
    }

    await load();
  };

  const buildMenu = (node: TreeDataNode): MenuProps => {
    const { key, name, kind, collectionId } = node;
    const items: MenuProps["items"] = [];

    if (kind === "collection") {
      items.push({
        key: "new-folder",
        label: t("tree.newFolder"),
        icon: <FolderAddOutlined />,
      });
      items.push({
        key: "new-request",
        label: t("tree.newRequest"),
        icon: <FileAddOutlined />,
      });
      items.push({
        key: "import-curl",
        label: t("curlImport.menu"),
        icon: <ImportOutlined />,
      });
      items.push({ type: "divider" });
      items.push({ key: "rename",         label: t("common.rename"), icon: <EditOutlined /> });
    } else if (kind === "folder") {
      items.push({
        key: "new-request",
        label: t("tree.newRequest"),
        icon: <FileAddOutlined />,
      });
      items.push({
        key: "import-curl",
        label: t("curlImport.menu"),
        icon: <ImportOutlined />,
      });
      items.push({ type: "divider" });
      items.push({
        key: "move",
        label: t("tree.moveTo"),
        icon: <ExportOutlined />,
      });
      items.push({ key: "copy",         label: t("tree.copyTo"), icon: <CopyOutlined /> });
      items.push({ type: "divider" });
      items.push({ key: "rename",         label: t("common.rename"), icon: <EditOutlined /> });
    } else {
      items.push({
        key: "move",
        label: t("tree.moveTo"),
        icon: <ExportOutlined />,
      });
      items.push({ key: "copy",         label: t("tree.copyTo"), icon: <CopyOutlined /> });
      items.push({ type: "divider" });
      items.push({ key: "rename",         label: t("common.rename"), icon: <EditOutlined /> });
    }

    items.push({
      key: "delete",
      label: t("common.delete"),
      icon: <DeleteOutlined />,
      danger: true,
    });

    return {
      items,
      onClick: ({ key: actionKey }) => {
        if (actionKey === "new-folder") {
          void createFolderIn(key);
        } else if (actionKey === "new-request") {
          void createRequestIn(
            kind === "collection" ? key : collectionId,
            kind === "folder" ? key : null,
          );
        } else if (actionKey === "import-curl") {
          openCurlImport(
            kind === "collection" ? key : collectionId,
            kind === "folder" ? key : null,
          );
        } else if (actionKey === "move" || actionKey === "copy") {
          setMoveCopyTarget({
            kind: kind === "request" ? "request" : "folder",
            action: actionKey,
            id: key,
            name,
          });
          setTargetId(null);
        } else if (actionKey === "rename") {
          openRename(kind, key, name);
        } else if (actionKey === "delete") {
          setDeleteTarget({ kind, id: key, name });
        }
      },
    };
  };

  const renderNodeMarker = (node: TreeDataNode) => {
    if (node.kind === "request") {
      const method = (node.method ?? "GET").toUpperCase();
      return (
        <span className="tree-node-method" data-method={method} aria-hidden>
          {method}
        </span>
      );
    }
    const Icon = node.kind === "collection" ? ContainerOutlined : FolderOutlined;
    return <Icon className="tree-node-icon" aria-hidden />;
  };

  const renderTitle = (node: TreeDataNode) => {
    return (
      <span className="tree-node-title">
        {renderNodeMarker(node)}
        <span className="tree-node-label">{node.name}</span>
        <Dropdown menu={buildMenu(node)} trigger={["click"]}>
          <Button
            className="tree-node-actions"
            size="small"
            type="text"
            icon={<MoreOutlined />}
            aria-label={t("tree.actionsFor", { name: node.name })}
            onClick={(event) => event.stopPropagation()}
          />
        </Dropdown>
      </span>
    );
  };

  const createCollection = async () => {
    await collectionRepository.create({ name: t("tree.newCollectionName") });
    await load();
  };

  const createFolder = async () => {
    const collectionId = selectedCollectionId ?? collections[0]?.id;
    if (!collectionId) {
      return;
    }
    await createFolderIn(collectionId);
  };

  const createRequest = async () => {
    const collectionId = selectedCollectionId ?? collections[0]?.id;
    if (!collectionId) {
      return;
    }
    await createRequestIn(collectionId, null);
  };

  const selectedKey =
    selectedRequestId ?? selectedFolderId ?? selectedCollectionId;

  const renameTitle = renameTarget
    ? renameTarget.kind === "collection"
      ? t("tree.renameCollection")
      : renameTarget.kind === "folder"
        ? t("tree.renameFolder")
        : t("tree.renameRequest")
    : t("common.rename");

  return (
    <aside className="collection-sidebar">
      <div className="collection-sidebar-header">
        <Typography.Text strong>{t("tree.collections")}</Typography.Text>
        <Space size={4}>
          <Tooltip title={t("tree.newCollection")}>
            <Button
              size="small"
              icon={<PlusOutlined />}
              aria-label={t("tree.newCollection")}
              onClick={() => void createCollection()}
            />
          </Tooltip>
          <Tooltip title={t("tree.newFolder")}>
            <Button
              size="small"
              icon={<FolderAddOutlined />}
              aria-label={t("tree.newFolder")}
              onClick={() => void createFolder()}
            />
          </Tooltip>
          <Tooltip title={t("tree.newRequest")}>
            <Button
              size="small"
              icon={<FileAddOutlined />}
              aria-label={t("tree.newRequest")}
              onClick={() => void createRequest()}
            />
          </Tooltip>
        </Space>
      </div>

      <div className="collection-sidebar-content">
        {loading ? (
          <Spin />
        ) : error ? (
          <Alert type="error" message={error} showIcon />
        ) : treeData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("tree.noCollections")}
          />
        ) : (
          <Tree
            blockNode
            treeData={treeData}
            selectedKeys={selectedKey ? [selectedKey] : []}
            defaultExpandAll
            onSelect={handleSelect}
            titleRender={(node) => renderTitle(node as unknown as TreeDataNode)}
          />
        )}
      </div>

      <Modal
        title={renameTitle}
        open={renameTarget !== null}
        onOk={() => void confirmRename()}
        onCancel={() => setRenameTarget(null)}
        okText={t("common.rename")}
      >
        <Input
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          onPressEnter={() => void confirmRename()}
          aria-label={t("tree.renameInput")}
          autoFocus
        />
      </Modal>

      <Modal
        title={t("tree.deleteTitle", { name: deleteTarget?.name ?? "" })}
        open={deleteTarget !== null}
        onOk={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
        okText={t("common.delete")}
        okButtonProps={{ danger: true }}
      >
        <Typography.Paragraph>
          {deleteDescription(deleteTarget)}
        </Typography.Paragraph>
      </Modal>

      <Modal
        title={
          moveCopyTarget
            ? t(
                moveCopyTarget.action === "move"
                  ? "tree.moveTitle"
                  : "tree.copyTitle",
                { name: moveCopyTarget.name },
              )
            : ""
        }
        open={moveCopyTarget !== null}
        onOk={() => void confirmMoveCopy()}
        onCancel={() => {
          setMoveCopyTarget(null);
          setTargetId(null);
        }}
        okText={
          moveCopyTarget?.action === "move" ? t("common.move") : t("common.copy")
        }
        okButtonProps={{ disabled: targetId === null }}
      >
        <TreeSelect
          style={{ width: "100%" }}
          treeData={buildTargetTree(moveCopyTarget?.kind === "request")}
          value={targetId}
          onChange={(value) => setTargetId(value as string)}
          placeholder={t("tree.destination")}
          treeDefaultExpandAll
          aria-label={t("tree.destination")}
        />
      </Modal>

      <Modal
        title={t("curlImport.title")}
        open={curlImportTarget !== null}
        onOk={() => void confirmCurlImport()}
        onCancel={() => setCurlImportTarget(null)}
        okText={t("curlImport.confirm")}
        okButtonProps={{ disabled: curlText.trim() === "" }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Input.TextArea
            value={curlText}
            onChange={(event) => handleCurlTextChange(event.target.value)}
            placeholder={t("curlImport.placeholder")}
            aria-label={t("curlImport.inputAria")}
            autoSize={{ minRows: 6, maxRows: 14 }}
          />
          <Input
            value={curlName}
            onChange={(event) => {
              setCurlName(event.target.value);
              setCurlNameEdited(true);
            }}
            placeholder={t("curlImport.namePlaceholder")}
            aria-label={t("curlImport.nameAria")}
          />
          {curlError ? (
            <Alert type="error" message={curlError} showIcon />
          ) : null}
        </Space>
      </Modal>
    </aside>
  );
}
