import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export interface CollectionSelection {
  collectionId: string;
  name: string;
  preRequestScript: string;
}

export interface FolderSelection {
  collectionId: string;
  folderId: string;
  name: string;
  preRequestScript: string;
}

interface EditorState {
  selectedCollectionId: string | null;
  selectedFolderId: string | null;
  selectedRequestId: string | null;
  selectedEntityName: string;
  draft: RequestDraft;
  scriptDraft: string;
  workspaceVersion: number;
  selectRequest: (selection: RequestSelection) => void;
  selectCollection: (selection: CollectionSelection) => void;
  selectFolder: (selection: FolderSelection) => void;
  updateDraft: (patch: Partial<RequestDraft>) => void;
  loadRequestDraft: (draft: RequestDraft) => void;
  updateScriptDraft: (script: string) => void;
  updateSelectedEntityName: (name: string) => void;
  clearSelection: () => void;
  bumpWorkspaceVersion: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      selectedCollectionId: null,
      selectedFolderId: null,
      selectedRequestId: null,
      selectedEntityName: "",
      draft: createEmptyDraft(),
      scriptDraft: "",
      workspaceVersion: 0,

      selectRequest: ({ collectionId, folderId, requestId, request }) =>
        set({
          selectedCollectionId: collectionId,
          selectedFolderId: folderId,
          selectedRequestId: requestId,
          selectedEntityName: "",
          draft: { ...request },
          scriptDraft: "",
        }),

      selectCollection: ({ collectionId, name, preRequestScript }) =>
        set({
          selectedCollectionId: collectionId,
          selectedFolderId: null,
          selectedRequestId: null,
          selectedEntityName: name,
          draft: createEmptyDraft(),
          scriptDraft: preRequestScript,
        }),

      selectFolder: ({ collectionId, folderId, name, preRequestScript }) =>
        set({
          selectedCollectionId: collectionId,
          selectedFolderId: folderId,
          selectedRequestId: null,
          selectedEntityName: name,
          draft: createEmptyDraft(),
          scriptDraft: preRequestScript,
        }),

      updateDraft: (patch) =>
        set((state) => ({ draft: { ...state.draft, ...patch } })),

      loadRequestDraft: (draft) =>
        set({
          selectedCollectionId: null,
          selectedFolderId: null,
          selectedRequestId: null,
          selectedEntityName: "",
          draft: { ...draft },
          scriptDraft: "",
        }),

      updateScriptDraft: (script) => set({ scriptDraft: script }),

      updateSelectedEntityName: (name) => set({ selectedEntityName: name }),

      clearSelection: () =>
        set({
          selectedCollectionId: null,
          selectedFolderId: null,
          selectedRequestId: null,
          selectedEntityName: "",
          draft: createEmptyDraft(),
          scriptDraft: "",
        }),

      bumpWorkspaceVersion: () =>
        set((state) => ({ workspaceVersion: state.workspaceVersion + 1 })),
    }),
    {
      name: "web-curl-editor-selection",
      // Persist the selection and its editing state so a page refresh keeps the
      // user on the same collection/request.
      partialize: (state) => ({
        selectedCollectionId: state.selectedCollectionId,
        selectedFolderId: state.selectedFolderId,
        selectedRequestId: state.selectedRequestId,
        selectedEntityName: state.selectedEntityName,
        draft: state.draft,
        scriptDraft: state.scriptDraft,
      }),
    },
  ),
);
