import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../src/client/App";
import { db } from "../../src/client/db/database";
import { useEditorStore } from "../../src/client/state/editor-store";
import { useRuntimeStore } from "../../src/client/state/runtime-store";
import { useSettingsStore } from "../../src/client/state/settings-store";

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
  useEditorStore.getState().clearSelection();
  useRuntimeStore.getState().clearResponse();
  useSettingsStore.getState().resetSettings();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("attaches the global request defaults to the executed request", async () => {
  useSettingsStore.getState().updateSettings({
    defaultTimeoutMs: 12_345,
    followRedirects: false,
    maxRedirects: 2,
  });
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

  const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: [],
      body: "{}",
      durationMs: 1,
      sizeBytes: 2,
    }),
  } as unknown as Response);

  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /send/i }));

  const call = fetchSpy.mock.calls.find(([url]) => url === "/api/execute");
  expect(call).toBeDefined();
  const requestBody = JSON.parse((call![1] as RequestInit).body as string);
  expect(requestBody.options).toEqual({
    timeoutMs: 12_345,
    followRedirects: false,
    maxRedirects: 2,
  });
});
