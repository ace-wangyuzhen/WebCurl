import {
  createEmptyDraft,
  useEditorStore,
} from "../../src/client/state/editor-store";

beforeEach(() => {
  useEditorStore.getState().clearSelection();
});

it("starts with an empty draft and no selection", () => {
  const state = useEditorStore.getState();
  expect(state.selectedRequestId).toBeNull();
  expect(state.draft).toEqual(createEmptyDraft());
});

it("selects a request and loads its draft", () => {
  useEditorStore.getState().selectRequest({
    collectionId: "c1",
    folderId: "f1",
    requestId: "r1",
    request: {
      name: "Login",
      method: "POST",
      url: "https://example.test/login",
      queryParams: [],
      headers: [],
      body: { type: "none", content: "" },
      preRequestScript: "",
    },
  });

  const state = useEditorStore.getState();
  expect(state.selectedCollectionId).toBe("c1");
  expect(state.selectedFolderId).toBe("f1");
  expect(state.selectedRequestId).toBe("r1");
  expect(state.draft.name).toBe("Login");
  expect(state.draft.method).toBe("POST");
});

it("updates the draft without losing the selection", () => {
  useEditorStore.getState().selectRequest({
    collectionId: "c1",
    folderId: null,
    requestId: "r1",
    request: createEmptyDraft(),
  });

  useEditorStore.getState().updateDraft({ url: "https://example.test/x" });

  const state = useEditorStore.getState();
  expect(state.draft.url).toBe("https://example.test/x");
  expect(state.selectedRequestId).toBe("r1");
});

it("clears the selection and resets the draft", () => {
  useEditorStore.getState().selectRequest({
    collectionId: "c1",
    folderId: null,
    requestId: "r1",
    request: createEmptyDraft(),
  });
  useEditorStore.getState().clearSelection();

  const state = useEditorStore.getState();
  expect(state.selectedRequestId).toBeNull();
  expect(state.draft).toEqual(createEmptyDraft());
});

it("selects a collection and loads its script", () => {
  useEditorStore.getState().selectCollection({
    collectionId: "c1",
    name: "Demo",
    preRequestScript: "console.log('collection');",
  });

  const state = useEditorStore.getState();
  expect(state.selectedCollectionId).toBe("c1");
  expect(state.selectedFolderId).toBeNull();
  expect(state.selectedRequestId).toBeNull();
  expect(state.selectedEntityName).toBe("Demo");
  expect(state.scriptDraft).toBe("console.log('collection');");
});

it("selects a folder and updates its script draft", () => {
  useEditorStore.getState().selectFolder({
    collectionId: "c1",
    folderId: "f1",
    name: "Group A",
    preRequestScript: "",
  });

  useEditorStore.getState().updateScriptDraft("console.log('folder');");

  const state = useEditorStore.getState();
  expect(state.selectedCollectionId).toBe("c1");
  expect(state.selectedFolderId).toBe("f1");
  expect(state.selectedRequestId).toBeNull();
  expect(state.scriptDraft).toBe("console.log('folder');");
});
