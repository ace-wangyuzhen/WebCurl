import type { RequestDefinition } from "../../shared/request-types";

export interface ScriptLimits {
  maxSourceLength: number;
  maxExecutionMs: number;
  maxLogs: number;
}

export interface ScriptExecutionInput {
  source: string;
  request: RequestDefinition;
  globals: Record<string, string>;
  environment: Record<string, string>;
  limits: ScriptLimits;
}

export interface ScriptExecutionOutput {
  request: RequestDefinition;
  globals: Record<string, string>;
  environment: Record<string, string>;
  logs: string[];
  durationMs: number;
}

export type ScriptFailureCode =
  | "SCRIPT_SOURCE_TOO_LONG"
  | "SCRIPT_TIMEOUT"
  | "SCRIPT_RUNTIME_ERROR";

export type ScriptWorkerRequest = { type: "run"; input: ScriptExecutionInput };

export type ScriptWorkerResponse =
  | { type: "result"; output: ScriptExecutionOutput }
  | { type: "error"; code: ScriptFailureCode; message: string };
