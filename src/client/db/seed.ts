import {
  db,
  type CollectionRecord,
  type EnvironmentRecord,
  type FolderRecord,
  type RequestRecord,
} from "./database";
import { collectionRepository, environmentRepository } from "./repositories";

export interface WorkspaceExport {
  version: 1;
  collections: CollectionRecord[];
  folders: FolderRecord[];
  requests: RequestRecord[];
  environments: EnvironmentRecord[];
}

const EXPORT_VERSION = 1;

// Names for the two system-default environments created with every collection.
// UI-driven collection creation localizes these; data-layer backfill falls back
// to the Chinese defaults.
export const DEFAULT_PROD_ENV_NAME = "正式环境";
export const DEFAULT_TEST_ENV_NAME = "测试环境";

// Backfills collections that predate the system-default environments so every
// collection ends up with production/test. Only touches collections that have
// no environments at all, so it never disturbs user-created ones.
export async function ensureDefaultEnvironments(): Promise<void> {
  const collections = await collectionRepository.list();
  for (const collection of collections) {
    const environments = await environmentRepository.listByCollection(
      collection.id,
    );
    if (environments.length === 0) {
      await environmentRepository.createDefaults(
        collection.id,
        DEFAULT_PROD_ENV_NAME,
        DEFAULT_TEST_ENV_NAME,
      );
    }
  }
}

export async function exportWorkspace(): Promise<WorkspaceExport> {
  const [collections, folders, requests, environments] = await Promise.all([
    db.collections.toArray(),
    db.folders.toArray(),
    db.requests.toArray(),
    db.environments.toArray(),
  ]);

  return {
    version: EXPORT_VERSION,
    collections,
    folders,
    requests,
    environments,
  };
}

export interface ExportSelection {
  collectionIds: string[];
  folderIds: string[];
  requestIds: string[];
}

// Exports only the picked collections/folders/requests. Callers are expected to
// include the structural parents of anything they pick (the collection that
// owns a folder, the folder that owns a request) so the result imports cleanly.
// Environments follow their collection.
export async function exportWorkspaceSubset(
  selection: ExportSelection,
): Promise<WorkspaceExport> {
  const collectionIds = new Set(selection.collectionIds);
  const folderIds = new Set(selection.folderIds);
  const requestIds = new Set(selection.requestIds);

  const [allCollections, allFolders, allRequests, allEnvironments] =
    await Promise.all([
      db.collections.toArray(),
      db.folders.toArray(),
      db.requests.toArray(),
      db.environments.toArray(),
    ]);

  return {
    version: EXPORT_VERSION,
    collections: allCollections.filter((item) => collectionIds.has(item.id)),
    folders: allFolders.filter((item) => folderIds.has(item.id)),
    requests: allRequests.filter((item) => requestIds.has(item.id)),
    environments: allEnvironments.filter((item) =>
      collectionIds.has(item.collectionId),
    ),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertStringArray(
  value: unknown,
  field: string,
): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Malformed workspace data: "${field}" must be an array`);
  }
}

function assertNamedRecord(
  value: unknown,
  field: string,
): asserts value is Record<string, unknown> {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    throw new Error(
      `Malformed workspace data: "${field}" entries require string "id" and "name" fields`,
    );
  }
}

function validateWorkspaceExport(data: unknown): WorkspaceExport {
  if (!isRecord(data) || data.version !== EXPORT_VERSION) {
    throw new Error(`Unsupported workspace version: expected ${EXPORT_VERSION}`);
  }

  assertStringArray(data.collections, "collections");
  assertStringArray(data.folders, "folders");
  assertStringArray(data.requests, "requests");
  assertStringArray(data.environments, "environments");

  for (const collection of data.collections) {
    assertNamedRecord(collection, "collections");
  }
  for (const folder of data.folders) {
    assertNamedRecord(folder, "folders");
  }
  for (const request of data.requests) {
    assertNamedRecord(request, "requests");
  }
  for (const environment of data.environments) {
    assertNamedRecord(environment, "environments");
  }

  return data as unknown as WorkspaceExport;
}

export async function importWorkspace(data: unknown): Promise<void> {
  const validated = validateWorkspaceExport(data);

  await db.transaction(
    "rw",
    db.collections,
    db.folders,
    db.requests,
    db.environments,
    async () => {
      await db.collections.clear();
      await db.folders.clear();
      await db.requests.clear();
      await db.environments.clear();
      await db.collections.bulkPut(validated.collections);
      await db.folders.bulkPut(validated.folders);
      await db.requests.bulkPut(validated.requests);
      await db.environments.bulkPut(validated.environments);
    },
  );
}
