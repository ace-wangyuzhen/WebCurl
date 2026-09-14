import type { KeyValueItem, RequestBody } from "../../shared/request-types";
import type { ExecuteRequest, ExecuteResponse } from "../../shared/contracts";
import {
  createId,
  db,
  nowIso,
  type CollectionRecord,
  type EnvironmentRecord,
  type EnvironmentVariable,
  type FolderRecord,
  type HistoryRecord,
  type RequestRecord,
} from "./database";

export interface CollectionInput {
  name: string;
  description?: string;
  preRequestScript?: string;
}

type CollectionPatch = Partial<
  Omit<CollectionRecord, "id" | "createdAt" | "updatedAt">
>;

export const collectionRepository = {
  async create(input: CollectionInput): Promise<CollectionRecord> {
    const record: CollectionRecord = {
      id: createId(),
      name: input.name,
      description: input.description ?? "",
      preRequestScript: input.preRequestScript ?? "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.collections.add(record);
    return record;
  },

  async get(id: string): Promise<CollectionRecord | undefined> {
    return db.collections.get(id);
  },

  async update(id: string, patch: CollectionPatch): Promise<void> {
    await db.collections.update(id, { ...patch, updatedAt: nowIso() });
  },

  async remove(id: string): Promise<void> {
    await db.collections.delete(id);
  },

  async list(): Promise<CollectionRecord[]> {
    return db.collections.toArray();
  },
};

export interface FolderInput {
  collectionId: string;
  parentId?: string | null;
  name: string;
  preRequestScript?: string;
  sortOrder?: number;
}

type FolderPatch = Partial<
  Omit<FolderRecord, "id" | "createdAt" | "updatedAt">
>;

export const folderRepository = {
  async create(input: FolderInput): Promise<FolderRecord> {
    const record: FolderRecord = {
      id: createId(),
      collectionId: input.collectionId,
      parentId: input.parentId ?? null,
      name: input.name,
      preRequestScript: input.preRequestScript ?? "",
      sortOrder: input.sortOrder ?? 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.folders.add(record);
    return record;
  },

  async get(id: string): Promise<FolderRecord | undefined> {
    return db.folders.get(id);
  },

  async update(id: string, patch: FolderPatch): Promise<void> {
    await db.folders.update(id, { ...patch, updatedAt: nowIso() });
  },

  async remove(id: string): Promise<void> {
    await db.folders.delete(id);
  },

  async listByCollection(collectionId: string): Promise<FolderRecord[]> {
    return db.folders
      .where("collectionId")
      .equals(collectionId)
      .sortBy("sortOrder");
  },
};

export interface RequestInput {
  collectionId: string;
  folderId?: string | null;
  name: string;
  method: string;
  url: string;
  queryParams?: KeyValueItem[];
  headers?: KeyValueItem[];
  body?: RequestBody;
  preRequestScript?: string;
  sortOrder?: number;
}

type RequestPatch = Partial<
  Omit<RequestRecord, "id" | "createdAt" | "updatedAt">
>;

export const requestRepository = {
  async create(input: RequestInput): Promise<RequestRecord> {
    const record: RequestRecord = {
      id: createId(),
      collectionId: input.collectionId,
      folderId: input.folderId ?? null,
      name: input.name,
      method: input.method,
      url: input.url,
      queryParams: input.queryParams ?? [],
      headers: input.headers ?? [],
      body: input.body ?? { type: "none", content: "" },
      preRequestScript: input.preRequestScript ?? "",
      sortOrder: input.sortOrder ?? 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.requests.add(record);
    return record;
  },

  async get(id: string): Promise<RequestRecord | undefined> {
    return db.requests.get(id);
  },

  async update(id: string, patch: RequestPatch): Promise<void> {
    await db.requests.update(id, { ...patch, updatedAt: nowIso() });
  },

  async remove(id: string): Promise<void> {
    await db.requests.delete(id);
  },

  async listByCollection(collectionId: string): Promise<RequestRecord[]> {
    return db.requests
      .where("collectionId")
      .equals(collectionId)
      .sortBy("sortOrder");
  },
};

export interface EnvironmentInput {
  name: string;
  variables?: EnvironmentVariable[];
  isActive?: boolean;
}

type EnvironmentPatch = Partial<
  Omit<EnvironmentRecord, "id" | "createdAt" | "updatedAt">
>;

export const environmentRepository = {
  async create(input: EnvironmentInput): Promise<EnvironmentRecord> {
    const record: EnvironmentRecord = {
      id: createId(),
      name: input.name,
      variables: input.variables ?? [],
      isActive: input.isActive ?? false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.environments.add(record);
    return record;
  },

  async get(id: string): Promise<EnvironmentRecord | undefined> {
    return db.environments.get(id);
  },

  async update(id: string, patch: EnvironmentPatch): Promise<void> {
    await db.environments.update(id, { ...patch, updatedAt: nowIso() });
  },

  async remove(id: string): Promise<void> {
    await db.environments.delete(id);
  },

  async list(): Promise<EnvironmentRecord[]> {
    return db.environments.toArray();
  },

  async setActive(id: string): Promise<void> {
    await db.environments
      .toCollection()
      .modify({ isActive: false, updatedAt: nowIso() });
    await db.environments.update(id, { isActive: true, updatedAt: nowIso() });
  },
};

export interface HistoryInput {
  requestId: string | null;
  requestSnapshot: ExecuteRequest;
  responseSnapshot: ExecuteResponse;
}

export const historyRepository = {
  async add(input: HistoryInput): Promise<HistoryRecord> {
    const record: HistoryRecord = {
      id: createId(),
      requestId: input.requestId,
      requestSnapshot: input.requestSnapshot,
      responseSnapshot: input.responseSnapshot,
      createdAt: nowIso(),
    };
    await db.history.add(record);
    return record;
  },

  async list(limit: number): Promise<HistoryRecord[]> {
    return db.history.orderBy("createdAt").reverse().limit(limit).toArray();
  },

  async clear(): Promise<void> {
    await db.history.clear();
  },
};
