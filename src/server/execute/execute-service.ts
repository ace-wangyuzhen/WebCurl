import type {
  ExecuteRequest,
  ExecuteResponse,
} from "../../shared/contracts";
import type {
  BodyType,
  KeyValueItem,
  RequestBody,
} from "../../shared/request-types";
import { DEFAULT_CONFIG, type ServerConfig } from "../config";
import { AppError, type ErrorCode } from "../errors";

export interface ExecuteServiceOptions {
  config?: ServerConfig;
  signal?: AbortSignal;
}

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

function isRedirectStatus(status: number): boolean {
  return REDIRECT_STATUS_CODES.has(status);
}

function buildTargetUrl(url: string, query: KeyValueItem[]): string {
  const target = new URL(url);
  for (const item of query) {
    if (item.enabled && item.key !== "") {
      target.searchParams.append(item.key, item.value);
    }
  }
  return target.toString();
}

function buildHeaders(items: KeyValueItem[], bodyType: BodyType): Headers {
  const headers = new Headers();
  for (const item of items) {
    if (item.enabled && item.key !== "") {
      headers.append(item.key, item.value);
    }
  }

  if (!headers.has("content-type")) {
    if (bodyType === "json") {
      headers.set("content-type", "application/json");
    } else if (bodyType === "form-urlencoded") {
      headers.set("content-type", "application/x-www-form-urlencoded");
    }
  }

  return headers;
}

function buildBody(body: RequestBody): string | undefined {
  return body.type === "none" ? undefined : body.content;
}

async function readBoundedBody(
  response: Response,
  maxBytes: number,
): Promise<{ body: string; sizeBytes: number }> {
  const reader = response.body?.getReader();
  if (!reader) {
    return { body: "", sizeBytes: 0 };
  }

  const decoder = new TextDecoder();
  let body = "";
  let sizeBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      sizeBytes += value.byteLength;
      if (sizeBytes > maxBytes) {
        await reader.cancel();
        throw new AppError(
          "RESPONSE_TOO_LARGE",
          `Response body exceeded the ${maxBytes} byte limit`,
          502,
        );
      }
      body += decoder.decode(value, { stream: true });
    }
  }

  body += decoder.decode();
  return { body, sizeBytes };
}

async function fetchFollowingRedirects(
  url: string,
  init: RequestInit,
  followRedirects: boolean,
  maxRedirects: number,
): Promise<Response> {
  if (!followRedirects) {
    return fetch(url, { ...init, redirect: "manual" });
  }

  let currentUrl = url;
  let remaining = maxRedirects;

  while (true) {
    const response = await fetch(currentUrl, { ...init, redirect: "manual" });
    if (!isRedirectStatus(response.status)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      return response;
    }

    await response.body?.cancel();

    if (remaining <= 0) {
      throw new AppError(
        "UPSTREAM_RESPONSE_ERROR",
        `Exceeded the ${maxRedirects} redirect limit`,
        502,
      );
    }

    remaining -= 1;

    let next: URL;
    try {
      next = new URL(location, currentUrl);
    } catch {
      throw new AppError(
        "UPSTREAM_RESPONSE_ERROR",
        "Received an invalid redirect location",
        502,
      );
    }

    if (next.protocol !== "http:" && next.protocol !== "https:") {
      throw new AppError(
        "UPSTREAM_RESPONSE_ERROR",
        "Received an unsupported redirect protocol",
        502,
      );
    }

    currentUrl = next.toString();
  }
}

function buildFailure(
  code: ErrorCode,
  message: string,
  durationMs: number,
  status: number | null = null,
  statusText = "",
  headers: Array<{ name: string; value: string }> = [],
): ExecuteResponse {
  return {
    ok: false,
    status,
    statusText,
    headers,
    body: "",
    durationMs,
    sizeBytes: 0,
    error: { code, message },
  };
}

export async function executeRequest(
  input: ExecuteRequest,
  options: ExecuteServiceOptions = {},
): Promise<ExecuteResponse> {
  const config = options.config ?? DEFAULT_CONFIG;
  const startedAt = Date.now();

  const url = buildTargetUrl(input.url, input.query);
  const headers = buildHeaders(input.headers, input.body.type);
  const body = buildBody(input.body);
  const followRedirects = input.options?.followRedirects ?? false;
  const timeoutMs = input.options?.timeoutMs ?? config.requestTimeoutMs;
  const maxRedirects = input.options?.maxRedirects ?? config.maxRedirects;

  const controller = new AbortController();
  const callerSignal = options.signal;

  if (callerSignal?.aborted) {
    return buildFailure(
      "REQUEST_ABORTED",
      "Request was aborted",
      Date.now() - startedAt,
    );
  }

  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let status: number | null = null;
  let statusText = "";
  const responseHeaders: Array<{ name: string; value: string }> = [];

  try {
    const response = await fetchFollowingRedirects(
      url,
      { method: input.method, headers, body, signal: controller.signal },
      followRedirects,
      maxRedirects,
    );

    status = response.status;
    statusText = response.statusText;
    response.headers.forEach((value, name) => {
      responseHeaders.push({ name, value });
    });

    const result = await readBoundedBody(response, config.maxResponseBodyBytes);

    return {
      ok: true,
      status,
      statusText,
      headers: responseHeaders,
      body: result.body,
      durationMs: Date.now() - startedAt,
      sizeBytes: result.sizeBytes,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    if (callerSignal?.aborted) {
      return buildFailure(
        "REQUEST_ABORTED",
        "Request was aborted",
        durationMs,
        status,
        statusText,
        responseHeaders,
      );
    }
    if (timedOut) {
      return buildFailure(
        "REQUEST_TIMEOUT",
        "Request timed out",
        durationMs,
        status,
        statusText,
        responseHeaders,
      );
    }
    if (error instanceof AppError) {
      return buildFailure(
        error.code,
        error.message,
        durationMs,
        status,
        statusText,
        responseHeaders,
      );
    }
    return buildFailure(
      "UPSTREAM_CONNECTION_ERROR",
      "Failed to reach the upstream server",
      durationMs,
      status,
      statusText,
      responseHeaders,
    );
  } finally {
    clearTimeout(timeoutHandle);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}
