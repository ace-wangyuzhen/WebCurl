import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Key } from "react";
import { Alert, Button, Empty, Space, Spin, Tooltip, Tree, Typography } from "antd";
import {
  FileAddOutlined,
  FolderAddOutlined,
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
import { useEditorStore } from "../state/editor-store";

interface TreeDataNode {
  key: string;
  title: string;
  children?: TreeDataNode[];
  isLeaf?: boolean;
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
        children: [
          ...folderNodes(collectionId, folder.id),
          ...requests
            .filter((request) => request.folderId === folder.id)
            .map((request) => ({
              key: request.id,
              title: request.name,
              isLeaf: true,
            })),
        ],
      }));

  return collections.map((collection) => ({
    key: collection.id,
    title: collection.name,
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
          isLeaf: true,
        })),
    ],
  }));
}

export function CollectionSidebar() {
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedRequestId = useEditorStore((state) => state.selectedRequestId);
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
          cause instanceof Error ? cause.message : "Failed to load workspace",
        );
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    void load();
    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  const treeData = useMemo(
    () => buildCollectionTree(collections, folders, requests),
    [collections, folders, requests],
  );

  const handleSelect = (keys: Key[]) => {
    if (keys.length === 0) {
      return;
    }
    const request = requests.find((candidate) => candidate.id === keys[0]);
    if (!request) {
      return;
    }
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

  const createCollection = async () => {
    await collectionRepository.create({ name: "New Collection" });
    await load();
  };

  const createFolder = async () => {
    const collection = collections[0];
    if (!collection) {
      return;
    }
    await folderRepository.create({
      collectionId: collection.id,
      name: "New Folder",
    });
    await load();
  };

  const createRequest = async () => {
    const collection = collections[0];
    if (!collection) {
      return;
    }
    await requestRepository.create({
      collectionId: collection.id,
      name: "New Request",
      method: "GET",
      url: "",
    });
    await load();
  };

  return (
    <aside className="collection-sidebar">
      <div className="collection-sidebar-header">
        <Typography.Text strong>Collections</Typography.Text>
        <Space size={4}>
          <Tooltip title="New collection">
            <Button
              size="small"
              icon={<PlusOutlined />}
              aria-label="New collection"
              onClick={() => void createCollection()}
            />
          </Tooltip>
          <Tooltip title="New folder">
            <Button
              size="small"
              icon={<FolderAddOutlined />}
              aria-label="New folder"
              onClick={() => void createFolder()}
            />
          </Tooltip>
          <Tooltip title="New request">
            <Button
              size="small"
              icon={<FileAddOutlined />}
              aria-label="New request"
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
            description="No collections yet"
          />
        ) : (
          <Tree
            treeData={treeData}
            selectedKeys={selectedRequestId ? [selectedRequestId] : []}
            onSelect={handleSelect}
          />
        )}
      </div>
    </aside>
  );
}
