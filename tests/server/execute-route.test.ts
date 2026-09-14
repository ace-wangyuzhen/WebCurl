import type { ExecuteResponse } from "../../src/shared/contracts";
import { buildApp } from "../../src/server/app";
import { createUpstreamServer } from "../fixtures/upstream-server";

function executePayload(upstreamUrl: string, request: object): string {
  return JSON.stringify({
    method: "GET",
    url: `${upstreamUrl}/echo`,
    query: [],
    headers: [],
    body: { type: "none", content: "" },
    ...request,
  });
}

it("executes a request through the API", async () => {
  const upstream = await createUpstreamServer();
  const app = await buildApp({ logger: false });

  const response = await app.inject({
    method: "POST",
    url: "/api/execute",
    headers: { "content-type": "application/json" },
    payload: executePayload(upstream.url, {
      method: "POST",
      query: [{ id: "q1", key: "page", value: "2", enabled: true }],
      headers: [{ id: "h1", key: "X-Test", value: "yes", enabled: true }],
      body: { type: "json", content: '{"ok":true}' },
    }),
  });

  expect(response.statusCode).toBe(200);
  const body = response.json() as ExecuteResponse;
  expect(body.ok).toBe(true);
  expect(body.status).toBe(200);
  expect(body.body).toContain('"page":"2"');

  await app.close();
  await upstream.close();
});

it("rejects malformed JSON with the stable error envelope", async () => {
  const app = await buildApp({ logger: false });

  const response = await app.inject({
    method: "POST",
    url: "/api/execute",
    headers: { "content-type": "application/json" },
    payload: "{not-json",
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({
    ok: false,
    error: { code: "INVALID_REQUEST", message: expect.any(String) },
  });

  await app.close();
});

it("rejects unsupported protocols", async () => {
  const app = await buildApp({ logger: false });

  const response = await app.inject({
    method: "POST",
    url: "/api/execute",
    headers: { "content-type": "application/json" },
    payload: executePayload("http://example.test", {
      url: "ftp://example.test/file",
    }),
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({
    ok: false,
    error: {
      code: "UNSUPPORTED_PROTOCOL",
      message: "Only http and https URLs are supported",
    },
  });

  await app.close();
});

it("rejects invalid URLs", async () => {
  const app = await buildApp({ logger: false });

  const response = await app.inject({
    method: "POST",
    url: "/api/execute",
    headers: { "content-type": "application/json" },
    payload: executePayload("http://example.test", {
      url: "not a url",
    }),
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({
    ok: false,
    error: { code: "INVALID_URL", message: "Invalid target URL" },
  });

  await app.close();
});

it("returns upstream 500 as an inspectable response", async () => {
  const upstream = await createUpstreamServer();
  const app = await buildApp({ logger: false });

  const response = await app.inject({
    method: "POST",
    url: "/api/execute",
    headers: { "content-type": "application/json" },
    payload: executePayload(upstream.url, {
      url: `${upstream.url}/status/500`,
    }),
  });

  expect(response.statusCode).toBe(200);
  const body = response.json() as ExecuteResponse;
  expect(body.ok).toBe(true);
  expect(body.status).toBe(500);
  expect(body.error).toBeUndefined();

  await app.close();
  await upstream.close();
});

it("returns a controlled timeout error", async () => {
  const upstream = await createUpstreamServer();
  const app = await buildApp({ logger: false });

  const response = await app.inject({
    method: "POST",
    url: "/api/execute",
    headers: { "content-type": "application/json" },
    payload: executePayload(upstream.url, {
      url: `${upstream.url}/slow?ms=500`,
      options: { timeoutMs: 30 },
    }),
  });

  expect(response.statusCode).toBe(200);
  const body = response.json() as ExecuteResponse;
  expect(body.ok).toBe(false);
  expect(body.status).toBeNull();
  expect(body.error?.code).toBe("REQUEST_TIMEOUT");

  await app.close();
  await upstream.close();
});
