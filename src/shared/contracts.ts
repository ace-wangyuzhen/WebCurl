import type { RequestDefinition } from "./request-types";

export interface ExecuteRequest extends RequestDefinition {
  options?: {
    timeoutMs?: number;
    followRedirects?: boolean;
    maxRedirects?: number;
  };
}

export interface ExecuteResponse {
  ok: boolean;
  status: number | null;
  statusText: string;
  headers: Array<{ name: string; value: string }>;
  body: string;
  durationMs: number;
  sizeBytes: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface HealthResponse {
  ok: true;
  service: "web-curl";
}
