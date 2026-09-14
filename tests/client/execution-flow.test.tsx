import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../src/client/App";
import { db } from "../../src/client/db/database";
import { useEditorStore } from "../../src/client/state/editor-store";
import { useRuntimeStore } from "../../src/client/state/runtime-store";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
  useEditorStore.getState().clearSelection();
  useRuntimeStore.getState().clearResponse();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("runs scripts before sending and renders the response", async () => {
  useEditorStore.getState().selectRequest({
    collectionId: "c1",
    folderId: null,
    requestId: "r1",
    request: {
      name: "Example",
      method: "GET",
      url: "https://example.test/get",
      queryParams: [],
      headers: [],
      body: { type: "none", content: "" },
      preRequestScript: "",
    },
  });

  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: [],
      body: '{"ok":true}',
      durationMs: 12,
      sizeBytes: 11,
    }),
  } as unknown as Response);

  render(<App />);

  await userEvent.click(screen.getByRole("button", { name: /send/i }));

  expect(await screen.findByText('{"ok":true}')).toBeInTheDocument();
});
