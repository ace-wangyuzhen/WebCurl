import { render, screen } from "@testing-library/react";
import { ResponsePanel } from "../../src/client/components/ResponsePanel";
import { useRuntimeStore } from "../../src/client/state/runtime-store";
import { useSettingsStore } from "../../src/client/state/settings-store";
import type { ExecuteResponse } from "../../src/shared/contracts";

function response(body: string): ExecuteResponse {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: [{ name: "content-type", value: "text/plain" }],
    body,
    durationMs: 1,
    sizeBytes: body.length,
  };
}

beforeEach(() => {
  useRuntimeStore.getState().clearResponse();
  useSettingsStore.getState().resetSettings();
});

it("shows a truncation notice when the body exceeds the render cap", () => {
  useSettingsStore.getState().updateSettings({ maxRenderBytes: 10 });
  useRuntimeStore.getState().showResponse(response("x".repeat(500)));

  render(<ResponsePanel />);

  expect(screen.getByRole("status")).toHaveTextContent(/rendering the first/i);
});

it("does not truncate a body within the render cap", () => {
  useRuntimeStore.getState().showResponse(response("small body"));

  render(<ResponsePanel />);

  expect(screen.queryByRole("status")).toBeNull();
});

it("highlights the generated curl command", () => {
  useRuntimeStore.getState().showResponse(response("{}"));
  useRuntimeStore
    .getState()
    .setActiveCurl("curl -X POST -H 'X-Test: 1' 'https://example.test/get'");

  const { container } = render(<ResponsePanel />);

  expect(container.querySelector(".curl-token-cmd")?.textContent).toBe("curl");
  expect(container.querySelector(".curl-token-flag")?.textContent).toBe("-X");
  expect(
    Array.from(container.querySelectorAll(".curl-token-string")).map(
      (node) => node.textContent,
    ),
  ).toEqual(["'X-Test: 1'", "'https://example.test/get'"]);
});
