import { DEFAULT_CONFIG } from "../../src/server/config";
import { executeRequest } from "../../src/server/execute/execute-service";
import { createUpstreamServer } from "../fixtures/upstream-server";

it("executes the request with enabled query parameters and headers", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest({
    method: "POST",
    url: `${upstream.url}/echo`,
    query: [{ id: "q1", key: "page", value: "2", enabled: true }],
    headers: [{ id: "h1", key: "X-Test", value: "yes", enabled: true }],
    body: { type: "json", content: '{"ok":true}' },
  });

  expect(result.ok).toBe(true);
  expect(result.status).toBe(200);
  expect(result.body).toContain('"page":"2"');
  expect(result.body).toContain('"x-test":"yes"');

  await upstream.close();
});

it("skips disabled query parameters and headers", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest({
    method: "GET",
    url: `${upstream.url}/echo`,
    query: [
      { id: "q1", key: "page", value: "2", enabled: true },
      { id: "q2", key: "secret", value: "hidden", enabled: false },
    ],
    headers: [
      { id: "h1", key: "X-Included", value: "yes", enabled: true },
      { id: "h2", key: "X-Excluded", value: "no", enabled: false },
    ],
    body: { type: "none", content: "" },
  });

  expect(result.body).toContain('"page":"2"');
  expect(result.body).not.toContain("secret");
  expect(result.body).toContain('"x-included":"yes"');
  expect(result.body).not.toContain("x-excluded");

  await upstream.close();
});

it("returns upstream 500 as an inspectable response", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest({
    method: "GET",
    url: `${upstream.url}/status/500`,
    query: [],
    headers: [],
    body: { type: "none", content: "" },
  });

  expect(result.ok).toBe(true);
  expect(result.status).toBe(500);
  expect(result.error).toBeUndefined();

  await upstream.close();
});

it("sends json, text, and form-urlencoded bodies with the right content type", async () => {
  const upstream = await createUpstreamServer();

  const json = await executeRequest({
    method: "POST",
    url: `${upstream.url}/echo`,
    query: [],
    headers: [],
    body: { type: "json", content: '{"hello":"world"}' },
  });
  const jsonEcho = JSON.parse(json.body);
  expect(jsonEcho.headers["content-type"]).toBe("application/json");
  expect(jsonEcho.body).toBe('{"hello":"world"}');

  const text = await executeRequest({
    method: "POST",
    url: `${upstream.url}/echo`,
    query: [],
    headers: [],
    body: { type: "text", content: "plain text body" },
  });
  const textEcho = JSON.parse(text.body);
  expect(textEcho.body).toBe("plain text body");

  const form = await executeRequest({
    method: "POST",
    url: `${upstream.url}/echo`,
    query: [],
    headers: [],
    body: { type: "form-urlencoded", content: "a=1&b=two" },
  });
  const formEcho = JSON.parse(form.body);
  expect(formEcho.headers["content-type"]).toBe(
    "application/x-www-form-urlencoded",
  );
  expect(formEcho.body).toBe("a=1&b=two");

  await upstream.close();
});

it("times out when the upstream takes too long", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest({
    method: "GET",
    url: `${upstream.url}/slow?ms=500`,
    query: [],
    headers: [],
    body: { type: "none", content: "" },
    options: { timeoutMs: 30 },
  });

  expect(result.ok).toBe(false);
  expect(result.status).toBeNull();
  expect(result.error?.code).toBe("REQUEST_TIMEOUT");

  await upstream.close();
});

it("reports an aborted request", async () => {
  const upstream = await createUpstreamServer();
  const controller = new AbortController();

  const pending = executeRequest(
    {
      method: "GET",
      url: `${upstream.url}/slow?ms=500`,
      query: [],
      headers: [],
      body: { type: "none", content: "" },
      options: { timeoutMs: 5000 },
    },
    { signal: controller.signal },
  );

  await new Promise((resolve) => setTimeout(resolve, 30));
  controller.abort();

  const result = await pending;
  expect(result.ok).toBe(false);
  expect(result.error?.code).toBe("REQUEST_ABORTED");

  await upstream.close();
});

it("enforces the maximum response body size", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest(
    {
      method: "GET",
      url: `${upstream.url}/large?bytes=4096`,
      query: [],
      headers: [],
      body: { type: "none", content: "" },
    },
    { config: { ...DEFAULT_CONFIG, maxResponseBodyBytes: 64 } },
  );

  expect(result.ok).toBe(false);
  expect(result.error?.code).toBe("RESPONSE_TOO_LARGE");

  await upstream.close();
});

it("reports upstream connection failures", async () => {
  const result = await executeRequest({
    method: "GET",
    url: "http://127.0.0.1:1/unreachable",
    query: [],
    headers: [],
    body: { type: "none", content: "" },
    options: { timeoutMs: 2000 },
  });

  expect(result.ok).toBe(false);
  expect(result.error?.code).toBe("UPSTREAM_CONNECTION_ERROR");
});

it("follows redirects when enabled", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest({
    method: "GET",
    url: `${upstream.url}/redirect?to=/echo`,
    query: [],
    headers: [],
    body: { type: "none", content: "" },
    options: { followRedirects: true },
  });

  expect(result.ok).toBe(true);
  expect(result.status).toBe(200);
  expect(result.body).toContain('"method":"GET"');

  await upstream.close();
});

it("returns the redirect response when following is disabled", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest({
    method: "GET",
    url: `${upstream.url}/redirect?to=/echo`,
    query: [],
    headers: [],
    body: { type: "none", content: "" },
  });

  expect(result.ok).toBe(true);
  expect(result.status).toBe(302);

  await upstream.close();
});

it("enforces the redirect limit", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest(
    {
      method: "GET",
      url: `${upstream.url}/redirect-loop`,
      query: [],
      headers: [],
      body: { type: "none", content: "" },
      options: { followRedirects: true },
    },
    { config: { ...DEFAULT_CONFIG, maxRedirects: 3 } },
  );

  expect(result.ok).toBe(false);
  expect(result.error?.code).toBe("UPSTREAM_RESPONSE_ERROR");

  await upstream.close();
});
