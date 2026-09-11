import type { ServerConfig } from "../../src/server/config";
import { buildApp } from "../../src/server/app";

it("normalizes unknown routes into the stable error envelope", async () => {
  const app = await buildApp({ logger: false });

  const response = await app.inject({
    method: "GET",
    url: "/api/does-not-exist",
  });

  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({
    ok: false,
    error: {
      code: "INVALID_REQUEST",
      message: "Route not found",
    },
  });

  await app.close();
});

it("keeps the lifecycle open for later routes and carries runtime options", async () => {
  const config: ServerConfig = {
    host: "127.0.0.1",
    port: 9090,
    requestTimeoutMs: 1_000,
    maxRequestBodyBytes: 64 * 1024,
    maxResponseBodyBytes: 128 * 1024,
    maxRedirects: 2,
  };
  const staticRoot = "/tmp/web-curl-client";
  const app = await buildApp({ logger: false, config, staticRoot });

  app.get("/api/lifecycle", async () => ({ ok: true }));

  const response = await app.inject({
    method: "GET",
    url: "/api/lifecycle",
  });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ ok: true });
  expect(app.config).toEqual(config);
  expect(app.staticRoot).toBe(staticRoot);
  expect(app.initialConfig.bodyLimit).toBe(config.maxRequestBodyBytes);

  await app.close();
});

it.each([
  ["null", null],
  ["a number", 42],
  ["an object with a non-string message", { message: { detail: "bad" } }],
])("normalizes thrown %s safely", async (_description, thrownValue) => {
  const app = await buildApp({ logger: false });
  app.get("/api/throws", async () => {
    throw thrownValue;
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/throws",
  });

  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual({
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
  expect(typeof response.json().error.message).toBe("string");

  await app.close();
});
