import { buildCurlCommand } from "../../src/client/api/curl";
import type { RequestDefinition } from "../../src/shared/request-types";

it("builds a curl command with method, headers, body, and query", () => {
  const request: RequestDefinition = {
    method: "POST",
    url: "https://example.test/echo",
    query: [{ id: "q1", key: "page", value: "2", enabled: true }],
    headers: [{ id: "h1", key: "X-Test", value: "yes", enabled: true }],
    body: { type: "json", content: '{"ok":true}' },
  };

  expect(buildCurlCommand(request)).toBe(
    "curl -X POST -H 'X-Test: yes' -d '{\"ok\":true}' 'https://example.test/echo?page=2'",
  );
});

it("omits the method flag for GET and skips disabled entries", () => {
  const request: RequestDefinition = {
    method: "GET",
    url: "https://example.test/health",
    query: [
      { id: "q1", key: "a", value: "1", enabled: true },
      { id: "q2", key: "b", value: "2", enabled: false },
    ],
    headers: [{ id: "h1", key: "X-Debug", value: "1", enabled: false }],
    body: { type: "none", content: "" },
  };

  expect(buildCurlCommand(request)).toBe(
    "curl 'https://example.test/health?a=1'",
  );
});
