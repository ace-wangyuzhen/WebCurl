import { createServer, type IncomingMessage } from "node:http";
import { once } from "node:events";

export interface UpstreamServer {
  url: string;
  close: () => Promise<void>;
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      data += chunk;
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

function queryObject(rawUrl: string | undefined): Record<string, string> {
  const query: Record<string, string> = {};
  if (!rawUrl) {
    return query;
  }

  const index = rawUrl.indexOf("?");
  if (index === -1) {
    return query;
  }

  const search = new URLSearchParams(rawUrl.slice(index + 1));
  for (const [key, value] of search) {
    query[key] = value;
  }
  return query;
}

function headerObject(
  headers: IncomingMessage["headers"],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      result[name] = value.join(", ");
    } else if (value !== undefined) {
      result[name] = value;
    }
  }
  return result;
}

export async function createUpstreamServer(): Promise<UpstreamServer> {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const path = url.pathname;

    if (path === "/echo") {
      const body = await readBody(request);
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          method: request.method,
          query: queryObject(request.url),
          headers: headerObject(request.headers),
          body,
        }),
      );
      return;
    }

    if (path.startsWith("/status/")) {
      const code = Number(path.slice("/status/".length));
      response.writeHead(code, { "content-type": "text/plain" });
      response.end(`status ${code}`);
      return;
    }

    if (path === "/slow") {
      const delayMs = Number(url.searchParams.get("ms") ?? "100");
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("slow response");
      return;
    }

    if (path === "/large") {
      const bytes = Number(url.searchParams.get("bytes") ?? "1024");
      response.writeHead(200, { "content-type": "application/octet-stream" });
      response.end("x".repeat(bytes));
      return;
    }

    if (path === "/redirect") {
      response.writeHead(302, { location: url.searchParams.get("to") ?? "/echo" });
      response.end();
      return;
    }

    if (path === "/redirect-loop") {
      response.writeHead(302, { location: "/redirect-loop" });
      response.end();
      return;
    }

    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  if (address === null || typeof address === "string") {
    server.close();
    throw new Error("Failed to bind upstream server");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  };
}
