import Dexie, { type EntityTable } from "dexie";
import type { KeyValueItem, RequestBody } from "../../shared/request-types";
import type { ExecuteRequest, ExecuteResponse } from "../../shared/contracts";

export interface CollectionRecord {
  id: string;
  name: string;
  description: string;
  preRequestScript: string;
  globals: EnvironmentVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface FolderRecord {
  id: string;
  collectionId: string;
  parentId: string | null;
  name: string;
  preRequestScript: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequestRecord {
  id: string;
  collectionId: string;
  folderId: string | null;
  name: string;
  method: string;
  url: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  body: RequestBody;
  preRequestScript: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface EnvironmentRecord {
  id: string;
  collectionId: string;
  name: string;
  variables: EnvironmentVariable[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryRecord {
  id: string;
  requestId: string | null;
  requestSnapshot: ExecuteRequest;
  responseSnapshot: ExecuteResponse;
  createdAt: string;
}

export class WebCurlDatabase extends Dexie {
  collections!: EntityTable<CollectionRecord, "id">;
  folders!: EntityTable<FolderRecord, "id">;
  requests!: EntityTable<RequestRecord, "id">;
  environments!: EntityTable<EnvironmentRecord, "id">;
  history!: EntityTable<HistoryRecord, "id">;

  constructor() {
    super("web-curl-db");
    this.version(1).stores({
      collections: "id",
      folders: "id, collectionId, parentId",
      requests: "id, collectionId, folderId",
      environments: "id",
      history: "id, createdAt",
    });
    this.version(2).stores({
      environments: "id, collectionId",
    });
  }
}

export const db = new WebCurlDatabase();

export function createId(): string {
  const globalCrypto = globalThis.crypto;
  if (typeof globalCrypto?.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
