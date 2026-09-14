import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ParamsEditor } from "../../src/client/components/ParamsEditor";
import { HeadersEditor } from "../../src/client/components/HeadersEditor";
import { BodyEditor } from "../../src/client/components/BodyEditor";
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

it("adds an enabled query parameter to the draft", async () => {
  selectDraft();
  render(<ParamsEditor />);

  await userEvent.click(screen.getByRole("button", { name: /add parameter/i }));

  expect(screen.getByLabelText("Query parameter name 1")).toBeInTheDocument();
  expect(
    screen.getByRole("checkbox", { name: /enable parameter 1/i }),
  ).toBeChecked();
});

it("disables a header row", async () => {
  selectDraft({
    headers: [{ id: "h1", key: "X-Debug", value: "1", enabled: true }],
  });
  render(<HeadersEditor />);

  const checkbox = screen.getByRole("checkbox", { name: /enable header 1/i });
  expect(checkbox).toBeChecked();

  await userEvent.click(checkbox);

  expect(checkbox).not.toBeChecked();
  expect(useEditorStore.getState().draft.headers[0].enabled).toBe(false);
});

it("selects a body type", async () => {
  selectDraft();
  render(<BodyEditor />);

  fireEvent.click(screen.getByRole("radio", { name: "JSON" }));

  expect(useEditorStore.getState().draft.body.type).toBe("json");
});

it("pretty-formats a JSON body on demand", async () => {
  selectDraft({ body: { type: "json", content: '{"a":1,"b":[2,3]}' } });
  render(<BodyEditor />);

  await userEvent.click(screen.getByRole("button", { name: "Format" }));

  expect(useEditorStore.getState().draft.body.content).toBe(
    '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}',
  );
});

it("disables JSON formatting when the body is invalid", () => {
  selectDraft({ body: { type: "json", content: "{not json" } });
  render(<BodyEditor />);

  expect(screen.getByRole("button", { name: "Format" })).toBeDisabled();
});
