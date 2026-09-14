import type {
  KeyValueItem,
  RequestBody,
  RequestDefinition,
} from "../../shared/request-types";

// Local id generator so this parser stays free of the Dexie database module and
// can be unit-tested in isolation. Mirrors `createId` in db/database.ts.
function makeId(): string {
  const globalCrypto = globalThis.crypto;
  if (typeof globalCrypto?.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// Short/long flags that consume the following token as their value.
const VALUE_FLAGS = new Set([
  "-X",
  "--request",
  "-H",
  "--header",
  "-b",
  "--cookie",
  "-d",
  "--data",
  "--data-raw",
  "--data-binary",
  "--data-ascii",
  "--data-urlencode",
  "-A",
  "--user-agent",
  "-e",
  "--referer",
  "-u",
  "--user",
  "--url",
]);

// Split a curl command into shell-style tokens, honouring single quotes, double
// quotes, escapes and `\`-newline line continuations.
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let hasCurrent = false;
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i];

    if (ch === "'") {
      hasCurrent = true;
      i++;
      while (i < n && input[i] !== "'") {
        current += input[i];
        i++;
      }
      i++; // skip closing quote
      continue;
    }

    if (ch === '"') {
      hasCurrent = true;
      i++;
      while (i < n && input[i] !== '"') {
        if (input[i] === "\\" && i + 1 < n) {
          const next = input[i + 1];
          if (next === '"' || next === "\\" || next === "$" || next === "`") {
            current += next;
            i += 2;
            continue;
          }
          if (next === "\n") {
            i += 2;
            continue;
          }
        }
        current += input[i];
        i++;
      }
      i++; // skip closing quote
      continue;
    }

    if (ch === "\\" && i + 1 < n) {
      const next = input[i + 1];
      if (next === "\n") {
        i += 2;
        continue;
      }
      if (next === "\r" && input[i + 2] === "\n") {
        i += 3;
        continue;
      }
      current += next;
      hasCurrent = true;
      i += 2;
      continue;
    }

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      if (hasCurrent) {
        tokens.push(current);
        current = "";
        hasCurrent = false;
      }
      i++;
      continue;
    }

    current += ch;
    hasCurrent = true;
    i++;
  }

  if (hasCurrent) {
    tokens.push(current);
  }
  return tokens;
}

// Normalise `--flag=value` into a [flag, value] pair and split attached short
// values like `-XPOST` into ["-X", "POST"].
function splitFlag(token: string): { flag: string; inlineValue: string | null } {
  if (token.startsWith("--")) {
    const eq = token.indexOf("=");
    if (eq >= 0) {
      return { flag: token.slice(0, eq), inlineValue: token.slice(eq + 1) };
    }
    return { flag: token, inlineValue: null };
  }
  if (token.startsWith("-") && token.length > 2) {
    return { flag: token.slice(0, 2), inlineValue: token.slice(2) };
  }
  return { flag: token, inlineValue: null };
}

function detectBodyType(contentType: string, content: string): RequestBody {
  const lower = contentType.toLowerCase();
  if (lower.includes("application/json")) {
    return { type: "json", content };
  }
  if (lower.includes("application/x-www-form-urlencoded")) {
    return { type: "form-urlencoded", content };
  }
  return { type: "text", content };
}

function splitUrl(rawUrl: string): { url: string; query: KeyValueItem[] } {
  const query: KeyValueItem[] = [];
  try {
    const parsed = new URL(rawUrl);
    for (const [key, value] of parsed.searchParams.entries()) {
      query.push({ id: makeId(), key, value, enabled: true });
    }
    parsed.search = "";
    return { url: parsed.toString(), query };
  } catch {
    const qIndex = rawUrl.indexOf("?");
    if (qIndex < 0) {
      return { url: rawUrl, query };
    }
    const base = rawUrl.slice(0, qIndex);
    for (const pair of rawUrl.slice(qIndex + 1).split("&")) {
      if (pair === "") {
        continue;
      }
      const eq = pair.indexOf("=");
      const key = eq >= 0 ? pair.slice(0, eq) : pair;
      const value = eq >= 0 ? pair.slice(eq + 1) : "";
      query.push({
        id: makeId(),
        key: safeDecode(key),
        value: safeDecode(value),
        enabled: true,
      });
    }
    return { url: base, query };
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

/**
 * Parse a `curl` command string into a request definition. This is the inverse
 * of {@link buildCurlCommand}. Throws an `Error` when the input is empty or no
 * URL can be found.
 */
export function parseCurlCommand(input: string): RequestDefinition {
  const tokens = tokenize(input.trim());
  if (tokens.length === 0) {
    throw new Error("EMPTY");
  }

  let start = 0;
  if (tokens[0] === "curl") {
    start = 1;
  }

  let explicitMethod: string | null = null;
  let rawUrl: string | null = null;
  const headers: KeyValueItem[] = [];
  const dataParts: string[] = [];

  const addHeader = (key: string, value: string) => {
    headers.push({ id: makeId(), key: key.trim(), value: value.trim(), enabled: true });
  };

  for (let i = start; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.startsWith("-")) {
      if (rawUrl === null) {
        rawUrl = token;
      }
      continue;
    }

    const { flag, inlineValue } = splitFlag(token);
    const takesValue = VALUE_FLAGS.has(flag);
    let value = inlineValue;
    if (takesValue && value === null) {
      value = tokens[i + 1] ?? "";
      i++;
    }

    switch (flag) {
      case "-X":
      case "--request":
        explicitMethod = (value ?? "").toUpperCase();
        break;
      case "-H":
      case "--header": {
        const raw = value ?? "";
        const sep = raw.indexOf(":");
        if (sep >= 0) {
          addHeader(raw.slice(0, sep), raw.slice(sep + 1));
        } else if (raw.trim() !== "") {
          addHeader(raw, "");
        }
        break;
      }
      case "-b":
      case "--cookie":
        addHeader("Cookie", value ?? "");
        break;
      case "-A":
      case "--user-agent":
        addHeader("User-Agent", value ?? "");
        break;
      case "-e":
      case "--referer":
        addHeader("Referer", value ?? "");
        break;
      case "-u":
      case "--user":
        addHeader("Authorization", `Basic ${btoa(value ?? "")}`);
        break;
      case "--url":
        rawUrl = value ?? rawUrl;
        break;
      case "-d":
      case "--data":
      case "--data-raw":
      case "--data-binary":
      case "--data-ascii":
      case "--data-urlencode":
        dataParts.push(value ?? "");
        break;
      default:
        // Unknown flag: treated as a boolean switch (e.g. --compressed, -L, -k)
        // and ignored. We do not consume a following token so the URL is safe.
        break;
    }
  }

  if (rawUrl === null || rawUrl === "") {
    throw new Error("NO_URL");
  }

  const { url, query } = splitUrl(rawUrl);
  const content = dataParts.join("&");
  const hasBody = dataParts.length > 0;

  const contentTypeHeader = headers.find(
    (header) => header.key.toLowerCase() === "content-type",
  );
  const body: RequestBody = hasBody
    ? detectBodyType(contentTypeHeader?.value ?? "", content)
    : { type: "none", content: "" };

  const method = explicitMethod ?? (hasBody ? "POST" : "GET");

  return { method, url, query, headers, body };
}
