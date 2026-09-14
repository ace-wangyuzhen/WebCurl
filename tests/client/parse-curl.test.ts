import { parseCurlCommand } from "../../src/client/api/parse-curl";

it("parses a POST curl with url, headers, cookie and json body", () => {
  const command = [
    "curl --url 'https://console.bce.baidu.com/api/rds/instance/list?locale=zh-cn&_=123' \\",
    "  -H 'Accept: application/json, text/plain, */*' \\",
    "  -H 'Content-Type: application/json' \\",
    "  -b 'A=1; B=2' \\",
    `  --data-raw '{"pageNo":1,"pageSize":10}'`,
  ].join("\n");

  const result = parseCurlCommand(command);

  expect(result.method).toBe("POST");
  expect(result.url).toBe("https://console.bce.baidu.com/api/rds/instance/list");
  expect(result.query.map(({ key, value }) => ({ key, value }))).toEqual([
    { key: "locale", value: "zh-cn" },
    { key: "_", value: "123" },
  ]);
  expect(result.headers.map(({ key, value }) => ({ key, value }))).toEqual([
    { key: "Accept", value: "application/json, text/plain, */*" },
    { key: "Content-Type", value: "application/json" },
    { key: "Cookie", value: "A=1; B=2" },
  ]);
  expect(result.body).toEqual({
    type: "json",
    content: '{"pageNo":1,"pageSize":10}',
  });
});

it("infers GET and no body when no data is present", () => {
  const result = parseCurlCommand("curl 'https://example.test/health?a=1'");

  expect(result.method).toBe("GET");
  expect(result.url).toBe("https://example.test/health");
  expect(result.query.map(({ key, value }) => ({ key, value }))).toEqual([
    { key: "a", value: "1" },
  ]);
  expect(result.body).toEqual({ type: "none", content: "" });
});

it("honours an explicit method and ignores unknown boolean flags", () => {
  const result = parseCurlCommand(
    "curl -X DELETE --compressed -L 'https://example.test/items/42'",
  );

  expect(result.method).toBe("DELETE");
  expect(result.url).toBe("https://example.test/items/42");
  expect(result.headers).toEqual([]);
});

it("treats a form-urlencoded content type as a form body", () => {
  const result = parseCurlCommand(
    "curl -H 'Content-Type: application/x-www-form-urlencoded' --data 'a=1&b=2' 'https://example.test/form'",
  );

  expect(result.body).toEqual({ type: "form-urlencoded", content: "a=1&b=2" });
});

it("throws when the input is empty or has no url", () => {
  expect(() => parseCurlCommand("   ")).toThrow();
  expect(() => parseCurlCommand("curl -X GET")).toThrow();
});
