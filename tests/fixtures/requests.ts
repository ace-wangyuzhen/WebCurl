import type {
  CollectionInput,
  FolderInput,
  RequestInput,
} from "../../src/client/db/repositories";

export function createCollectionInput(
  overrides: Partial<CollectionInput> = {},
): CollectionInput {
  return { name: "Demo", ...overrides };
}

export function createFolderInput(
  collectionId: string,
  overrides: Partial<FolderInput> = {},
): FolderInput {
  return { collectionId, name: "Group A", ...overrides };
}

export function createRequestInput(
  collectionId: string,
  overrides: Partial<RequestInput> = {},
): RequestInput {
  return {
    collectionId,
    folderId: null,
    name: "Health",
    method: "GET",
    url: "https://example.test/health",
    queryParams: [],
    headers: [],
    body: { type: "none", content: "" },
    preRequestScript: "",
    ...overrides,
  };
}
