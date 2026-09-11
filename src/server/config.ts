export interface ServerConfig {
  host: string;
  port: number;
  requestTimeoutMs: number;
  maxRequestBodyBytes: number;
  maxResponseBodyBytes: number;
  maxRedirects: number;
}

export const DEFAULT_CONFIG: Readonly<ServerConfig> = {
  host: "127.0.0.1",
  port: 8080,
  requestTimeoutMs: 30_000,
  maxRequestBodyBytes: 10 * 1024 * 1024,
  maxResponseBodyBytes: 10 * 1024 * 1024,
  maxRedirects: 5,
};

function parseInteger(
  name: string,
  value: string | undefined,
  defaultValue: number,
  minimum: number,
): number {
  if (value === undefined) {
    return defaultValue;
  }

  const normalizedValue = value.trim();
  if (!/^\d+$/.test(normalizedValue)) {
    throw new Error(
      `Invalid ${name}: expected an integer greater than or equal to ${minimum}, received "${value}"`,
    );
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isSafeInteger(parsedValue) || parsedValue < minimum) {
    throw new Error(
      `Invalid ${name}: expected an integer greater than or equal to ${minimum}, received "${value}"`,
    );
  }

  return parsedValue;
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): ServerConfig {
  const host = env.HOST ?? DEFAULT_CONFIG.host;
  if (host.trim() === "") {
    throw new Error("Invalid HOST: expected a non-empty value");
  }

  const port = parseInteger("PORT", env.PORT, DEFAULT_CONFIG.port, 1);
  if (port > 65_535) {
    throw new Error(
      `Invalid PORT: expected a value between 1 and 65535, received "${env.PORT}"`,
    );
  }

  return {
    host: host.trim(),
    port,
    requestTimeoutMs: parseInteger(
      "REQUEST_TIMEOUT_MS",
      env.REQUEST_TIMEOUT_MS,
      DEFAULT_CONFIG.requestTimeoutMs,
      1,
    ),
    maxRequestBodyBytes: parseInteger(
      "MAX_REQUEST_BODY_BYTES",
      env.MAX_REQUEST_BODY_BYTES,
      DEFAULT_CONFIG.maxRequestBodyBytes,
      1,
    ),
    maxResponseBodyBytes: parseInteger(
      "MAX_RESPONSE_BODY_BYTES",
      env.MAX_RESPONSE_BODY_BYTES,
      DEFAULT_CONFIG.maxResponseBodyBytes,
      1,
    ),
    maxRedirects: parseInteger(
      "MAX_REDIRECTS",
      env.MAX_REDIRECTS,
      DEFAULT_CONFIG.maxRedirects,
      0,
    ),
  };
}
