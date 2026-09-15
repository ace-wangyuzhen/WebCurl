import { render, screen } from "@testing-library/react";
import { ResponsePanel } from "../../src/client/components/ResponsePanel";
import { ScriptEditor } from "../../src/client/components/ScriptEditor";
import { useRuntimeStore } from "../../src/client/state/runtime-store";

const response = {
  ok: true,
  status: 200,
  statusText: "OK",
  headers: [],
  body: "ok",
  durationMs: 12,
  sizeBytes: 2,
};

function seedLogs() {
  const runtime = useRuntimeStore.getState();
  runtime.startSend();
  runtime.appendLogs(["hello from script"]);
  runtime.finishSend(response);
}

beforeEach(() => {
  seedLogs();
});

it("renders script logs in the response panel", () => {
  render(<ResponsePanel />);
  expect(screen.getByRole("log")).toBeInTheDocument();
  expect(screen.getByText("hello from script")).toBeInTheDocument();
});

it("does not render script logs in the script editor", () => {
  render(<ScriptEditor />);
  expect(screen.queryByRole("log")).toBeNull();
  expect(screen.queryByText("hello from script")).toBeNull();
});
