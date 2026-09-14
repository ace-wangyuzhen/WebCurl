import { createServer } from "node:http";

const PORT = 9090;

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (url.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/echo") {
    const body = await readBody(request);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({ method: request.method, url: request.url, body }),
    );
    return;
  }

  if (url.pathname === "/status/200") {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("ok");
    return;
  }

  response.writeHead(404, { "content-type": "text/plain" });
  response.end("not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Upstream fixture listening on http://127.0.0.1:${PORT}`);
});
