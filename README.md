# Web Curl

A single-user HTTP request debugging tool that runs as one Node.js 24 process,
serving a React/Ant Design UI and a Fastify API from the same origin. Requests,
collections, environments, and history are stored in the browser via IndexedDB;
the server is stateless and only validates and executes one request at a time.

## Requirements

- Node.js 24 (the installer fails clearly on any other major version).
- Linux with `systemd` for the managed service install.

## Development

```bash
npm ci
npm run dev
```

`npm run dev` starts Vite and the Fastify server concurrently.

## Build

```bash
npm ci
npm run build
node dist/server/index.js
```

The server binds to `127.0.0.1:8080` by default and serves both the built
frontend (`dist/client`) and the `/api/*` routes.

## Deploy

```bash
./scripts/install.sh
sudo systemctl status web-curl
curl http://127.0.0.1:8080/api/health
```

Remove the managed service with:

```bash
./scripts/uninstall.sh
```

## Configuration

The server reads these environment variables:

- `HOST` — listener address (default `127.0.0.1`).
- `PORT` — listener port (default `8080`).
- `REQUEST_TIMEOUT_MS` — upstream request timeout (default `30000`).
- `MAX_REQUEST_BODY_BYTES` — request body limit (default `10485760`).
- `MAX_RESPONSE_BODY_BYTES` — response body limit (default `10485760`).
- `MAX_REDIRECTS` — redirect limit (default `5`).

## Data and security notes

- **IndexedDB is origin-local.** All workspace data lives in the browser.
  Clearing site data deletes it, and different browsers or devices do not
  synchronize. Export your workspace regularly (`Export workspace`) to back it
  up. Environment values, including tokens, are stored in browser storage and
  are not encrypted secrets.
- **The server is an unrestricted HTTP/HTTPS proxy.** It intentionally allows
  any target host, port, private network, and redirect destination. Bind it to
  `127.0.0.1` (the default) or place it behind your own authentication and
  network access controls before exposing it to anyone you do not trust.
