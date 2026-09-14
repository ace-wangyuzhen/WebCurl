# Web Curl

A single-user HTTP request debugging tool that runs as one Node.js 24 process,
serving a React/Ant Design UI and a Fastify API from the same origin. Requests,
collections, environments, and history are stored in the browser via IndexedDB;
the server is stateless and only validates and executes one request at a time.

## Requirements

- Node.js 24 (the installer fails clearly on any other major version).
- `wget` and `tar` for the `scripts/install.sh` deploy.

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

`scripts/install.sh` fetches a packaged build from BOS, unpacks it, and runs the
server in the background with `nohup`. It picks the first free port starting at
`8359` (incrementing until one is free), writes logs to `app.log`, and records
the background process id in `app.pid`.

Pass the archive URL via the `BOS_URL` environment variable, or as the first
argument:

```bash
BOS_URL="https://<bucket>.bcebos.com/web-curl.tar.gz" ./scripts/install.sh
# equivalently:
./scripts/install.sh "https://<bucket>.bcebos.com/web-curl.tar.gz"
```

When the health check passes the script prints the address it is serving on
(for example `http://127.0.0.1:8359`). Check health or stop the process with:

```bash
curl http://127.0.0.1:8359/api/health
kill "$(cat app.pid)"
```

Optional environment variables:

- `BOS_URL` — URL of the `.tar.gz` build archive (required).
- `APP_HOME` — download and run directory (default: the script's own directory).
- `PORT_BASE` — first port to try (default `8359`).
- `HOST` — bind and health-check host (default `127.0.0.1`).
- `ENTRY` — server entrypoint inside the archive (default `dist/server/index.js`).
- `MAX_PORT_TRIES` — ports to try before giving up (default `100`).

The archive must contain the built app and its dependencies (`dist/` and
`node_modules`) so the script can run `node dist/server/index.js` directly.

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
