import type { RequestDefinition } from "../../shared/request-types";

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function buildCurlCommand(request: RequestDefinition): string {
  let targetUrl = request.url;
  try {
    const url = new URL(request.url);
    for (const item of request.query) {
      if (item.enabled && item.key !== "") {
        url.searchParams.append(item.key, item.value);
      }
    }
    targetUrl = url.toString();
  } catch {
    // The URL may be invalid; keep the raw value as-is.
  }

  const args: string[] = ["curl"];

  if (request.method !== "GET") {
    args.push("-X", request.method);
  }

  for (const header of request.headers) {
    if (header.enabled && header.key !== "") {
      args.push("-H", shellQuote(`${header.key}: ${header.value}`));
    }
  }

  if (request.body.type !== "none" && request.body.content !== "") {
    args.push("-d", shellQuote(request.body.content));
  }

  args.push(shellQuote(targetUrl));

  return args.join(" ");
}
