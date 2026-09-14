import {
  runPreRequestScripts,
  ScriptExecutionError,
  type ScriptExecutor,
} from "../../src/client/scripts/script-runner";
import type { RequestDefinition } from "../../src/shared/request-types";

const baseRequest: RequestDefinition = {
  method: "GET",
  url: "https://example.test",
  query: [],
  headers: [],
  body: { type: "none", content: "" },
};

it("runs scripts in order and chains their outputs", async () => {
  const calls: string[] = [];
  const executor: ScriptExecutor = {
    async run(input) {
      calls.push(input.source.trim());
      return {
        request: {
          ...input.request,
          url: `${input.request.url}/${input.source.trim()}`,
        },
        environment: { ...input.environment, [input.source.trim()]: "ran" },
        logs: [`log:${input.source.trim()}`],
        durationMs: 0,
      };
    },
  };

  const result = await runPreRequestScripts(
    ["collection-script", "folder-script", "request-script"],
    baseRequest,
    {},
    { executor },
  );

  expect(calls).toEqual([
    "collection-script",
    "folder-script",
    "request-script",
  ]);
  expect(result.request.url).toBe(
    "https://example.test/collection-script/folder-script/request-script",
  );
  expect(result.environment).toEqual({
    "collection-script": "ran",
    "folder-script": "ran",
    "request-script": "ran",
  });
  expect(result.logs).toEqual([
    "log:collection-script",
    "log:folder-script",
    "log:request-script",
  ]);
});

it("skips empty scripts", async () => {
  const calls: string[] = [];
  const executor: ScriptExecutor = {
    async run(input) {
      calls.push(input.source);
      return {
        request: input.request,
        environment: input.environment,
        logs: [],
        durationMs: 0,
      };
    },
  };

  await runPreRequestScripts(
    ["", "   ", "real-script"],
    baseRequest,
    {},
    { executor },
  );

  expect(calls).toEqual(["real-script"]);
});

it("propagates script errors without running later scripts", async () => {
  const calls: string[] = [];
  const executor: ScriptExecutor = {
    async run(input) {
      calls.push(input.source);
      if (input.source === "boom") {
        throw new ScriptExecutionError("SCRIPT_RUNTIME_ERROR", "boom");
      }
      return {
        request: input.request,
        environment: input.environment,
        logs: [],
        durationMs: 0,
      };
    },
  };

  await expect(
    runPreRequestScripts(
      ["first", "boom", "third"],
      baseRequest,
      {},
      { executor },
    ),
  ).rejects.toThrow("boom");

  expect(calls).toEqual(["first", "boom"]);
});
