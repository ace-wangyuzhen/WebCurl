import {
  DEFAULT_CONFIG,
  loadConfig,
} from "../../src/server/config";

it("loads the documented defaults", () => {
  expect(loadConfig({})).toEqual(DEFAULT_CONFIG);
});

it("rejects an empty or whitespace-only HOST", () => {
  expect(() => loadConfig({ HOST: "" })).toThrow(
    "Invalid HOST: expected a non-empty value",
  );
  expect(() => loadConfig({ HOST: "   " })).toThrow(
    "Invalid HOST: expected a non-empty value",
  );
});

it.each([
  ["PORT", "not-a-number"],
  ["REQUEST_TIMEOUT_MS", "0"],
  ["MAX_REQUEST_BODY_BYTES", "-1"],
  ["MAX_RESPONSE_BODY_BYTES", "1.5"],
  ["MAX_REDIRECTS", "NaN"],
])("rejects invalid %s values", (name, value) => {
  expect(() => loadConfig({ [name]: value })).toThrow(`Invalid ${name}`);
});
