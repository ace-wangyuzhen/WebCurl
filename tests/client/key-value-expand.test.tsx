import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeadersEditor } from "../../src/client/components/HeadersEditor";
import {
  createEmptyDraft,
  useEditorStore,
  type RequestDraft,
} from "../../src/client/state/editor-store";

beforeEach(() => {
  useEditorStore.getState().clearSelection();
});

function selectDraft(overrides: Partial<RequestDraft> = {}) {
  useEditorStore.getState().selectRequest({
    collectionId: "c1",
    folderId: null,
    requestId: "r1",
    request: { ...createEmptyDraft(), ...overrides },
  });
}

it("expands a value into a modal and writes edits back to the draft", async () => {
  selectDraft({
    headers: [{ id: "h1", key: "Authorization", value: "old", enabled: true }],
  });
  render(<HeadersEditor />);

  await userEvent.click(
    screen.getByRole("button", { name: /expand value editor 1/i }),
  );

  const textarea = screen.getByRole("textbox", { name: "Edit value" });
  expect(textarea).toHaveValue("old");

  await userEvent.clear(textarea);
  await userEvent.type(textarea, "new-token");
  await userEvent.click(screen.getByRole("button", { name: "OK" }));

  expect(useEditorStore.getState().draft.headers[0].value).toBe("new-token");
});

it("discards edits when the modal is cancelled", async () => {
  selectDraft({
    headers: [{ id: "h1", key: "Authorization", value: "keep", enabled: true }],
  });
  render(<HeadersEditor />);

  await userEvent.click(
    screen.getByRole("button", { name: /expand value editor 1/i }),
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "Edit value" }),
    "-changed",
  );
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

  expect(useEditorStore.getState().draft.headers[0].value).toBe("keep");
});
