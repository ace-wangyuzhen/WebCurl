import {
  db,
  type CollectionRecord,
  type EnvironmentRecord,
  type FolderRecord,
  type RequestRecord,
} from "./database";
import {
  collectionRepository,
  folderRepository,
  requestRepository,
} from "./repositories";

export interface WorkspaceExport {
  version: 1;
  collections: CollectionRecord[];
  folders: FolderRecord[];
  requests: RequestRecord[];
  environments: EnvironmentRecord[];
}

const EXPORT_VERSION = 1;

export async function seedWorkspaceIfEmpty(): Promise<void> {
  const existing = await collectionRepository.list();
  if (existing.length > 0) {
    return;
  }

  const collection = await collectionRepository.create({
    name: "Example",
    description: "Example requests created on first launch",
    preRequestScript: "",
  });

  const folder = await folderRepository.create({
    collectionId: collection.id,
    parentId: null,
    name: "Getting Started",
    preRequestScript: "",
    sortOrder: 0,
  });

  await requestRepository.create({
    collectionId: collection.id,
    folderId: folder.id,
    name: "Example",
    method: "GET",
    url: "https://httpbin.org/get",
    queryParams: [],
    headers: [],
    body: { type: "none", content: "" },
    preRequestScript: "",
    sortOrder: 0,
  });
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
