import { create } from "zustand";
import type { KeyValueItem, RequestBody } from "../../shared/request-types";

export interface RequestDraft {
  name: string;
  method: string;
  url: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  body: RequestBody;
  preRequestScript: string;
}

export function createEmptyDraft(): RequestDraft {
  return {
    name: "",
    method: "GET",
    url: "",
    queryParams: [],
    headers: [],
    body: { type: "none", content: "" },
    preRequestScript: "",
  };
}

export interface RequestSelection {
  collectionId: string;
  folderId: string | null;
  requestId: string;
  request: RequestDraft;
}

interface EditorState {
  selectedCollectionId: string | null;
  selectedFolderId: string | null;
  selectedRequestId: string | null;
  draft: RequestDraft;
  workspaceVersion: number;
  selectRequest: (selection: RequestSelection) => void;
  updateDraft: (patch: Partial<RequestDraft>) => void;
  clearSelection: () => void;
  bumpWorkspaceVersion: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedCollectionId: null,
  selectedFolderId: null,
  selectedRequestId: null,
  draft: createEmptyDraft(),
  workspaceVersion: 0,

  selectRequest: ({ collectionId, folderId, requestId, request }) =>
    set({
      selectedCollectionId: collectionId,
      selectedFolderId: folderId,
      selectedRequestId: requestId,
      draft: { ...request },
    }),

  updateDraft: (patch) =>
    set((state) => ({ draft: { ...state.draft, ...patch } })),

  clearSelection: () =>
    set({
      selectedCollectionId: null,
      selectedFolderId: null,
      selectedRequestId: null,
      draft: createEmptyDraft(),
    }),

  bumpWorkspaceVersion: () =>
    set((state) => ({ workspaceVersion: state.workspaceVersion + 1 })),
}));
