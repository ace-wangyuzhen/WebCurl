import { substituteVariables } from "../../src/client/scripts/variable-substitution";
import type { RequestDefinition } from "../../src/shared/request-types";

const baseRequest: RequestDefinition = {
  method: "GET",
  url: "https://example.test/{{path}}",
  query: [{ id: "q1", key: "page", value: "{{page}}", enabled: true }],
  headers: [
    { id: "h1", key: "X-Token", value: "Bearer {{token}}", enabled: true },
  ],
  body: { type: "json", content: '{"id":"{{id}}"}' },
};

it("replaces variables in url, query, headers, and body", () => {
  const result = substituteVariables(baseRequest, {
    path: "users",
    page: "2",
    token: "abc",
    id: "42",
  });

  expect(result.value.url).toBe("https://example.test/users");
  expect(result.value.query[0].value).toBe("2");
  expect(result.value.headers[0].value).toBe("Bearer abc");
  expect(result.value.body.content).toBe('{"id":"42"}');
  expect(result.unresolved).toEqual([]);
});

it("keeps unresolved variables and reports them", () => {
  const result = substituteVariables(
    {
      method: "GET",
      url: "https://example.test/{{missing}}",
      query: [],
      headers: [],
      body: { type: "none", content: "" },
    },
    {},
  );

  expect(result.value.url).toBe("https://example.test/{{missing}}");
  expect(result.unresolved).toEqual(["missing"]);
});

it("deduplicates unresolved variables and does not mutate the draft", () => {
  const request: RequestDefinition = {
    method: "GET",
    url: "https://example.test/{{a}}/{{a}}",
    query: [],
    headers: [],
    body: { type: "none", content: "" },
  };

  const result = substituteVariables(request, {});

  expect(result.value.url).toBe("https://example.test/{{a}}/{{a}}");
  expect(result.unresolved).toEqual(["a"]);
  expect(request.url).toBe("https://example.test/{{a}}/{{a}}");
  expect(result.value).not.toBe(request);
});
