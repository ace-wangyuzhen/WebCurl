# Web Curl Design Specification

## 1. Overview

Web Curl is a single-user web-based HTTP request debugging tool. It runs as
one Node.js 24 service, serves the React application and API from the same
origin, and lets users compose, execute, inspect, save, import, and export
HTTP requests from a browser.

The browser owns all durable user data through IndexedDB. The server is
stateless and only validates and executes requests on demand. The application
does not use Docker, Nginx, SQLite, or any other external service.

The first version supports:

- HTTP and HTTPS request execution.
- Method, URL, query parameter, header, and body editing.
- Collection, folder, and request organization.
- Collection, folder, and request Pre-request scripts.
- Environment variables with `{{variableName}}` substitution.
- Response status, headers, body, size, and duration inspection.
- Request history, JSON import, and JSON export.
- Light and dark themes.
- Single-user local browser storage without accounts or server synchronization.

## 2. Confirmed Technology Stack

### Runtime and server

- Node.js 24.
- TypeScript.
- Fastify.
- Node.js native `fetch` for upstream HTTP requests.
- Fastify static file serving for the production frontend.
- `systemd` for Linux process management.

### Frontend

- React.
- Vite.
- Ant Design 6.x.
- `@ant-design/icons`.
- CodeMirror 6 for JSON, text, and JavaScript editing.
- Zustand for current editor and runtime state.
- Dexie for IndexedDB access.
- CSS Modules and CSS Variables for application layout and theming.

### Script runtime

- QuickJS WebAssembly.
- Web Worker isolation.
- A small, explicit `pm` API surface.

## 3. Architecture

```text
Browser
  ├── React + Ant Design UI
  ├── Zustand current editor state
  ├── Dexie / IndexedDB durable data
  ├── CodeMirror editors
  └── QuickJS Web Worker
          │
          │ POST /api/execute
          ▼
Node.js 24 + Fastify
  ├── Request validation
  ├── HTTP request execution
  ├── Response normalization
  └── Static frontend hosting
          │
          ▼
    Any HTTP/HTTPS target
```

The production process is a single Node.js process. Fastify serves the Vite
build output and the `/api/*` routes. The frontend and API use same-origin
requests, so the first version does not need an open CORS configuration.

The default listener is `127.0.0.1:8080`. `HOST` and `PORT` are configurable
for deployments that intentionally expose the service on a network interface.

## 4. UI and Interaction Design

The page is a dense developer-tool workspace rather than a marketing page or
card grid.

```text
┌──────────────────────────────────────────────────────┐
│ Top toolbar: project | environment | import | export  │
├───────────────┬──────────────────────────────────────┤
│ Request tree  │ Request workspace                    │
│               │ [Method] [URL input] [Send]           │
│ Collection    │ Params | Headers | Body | Scripts     │
│  ├─ Group A   │ Key/value editors or CodeMirror       │
│  │  ├─ Login  ├──────────────────────────────────────┤
│  │  └─ Users  │ Response: status | headers | body      │
│  └─ Group B   │                                        │
└───────────────┴──────────────────────────────────────┘
```

The main component boundaries are:

```text
AppShell
├── TopToolbar
├── CollectionSidebar
│   ├── CollectionTree
│   └── CollectionActions
├── RequestWorkspace
│   ├── RequestToolbar
│   ├── RequestTabs
│   │   ├── ParamsEditor
│   │   ├── HeadersEditor
│   │   ├── BodyEditor
│   │   └── ScriptEditor
│   └── ResponsePanel
└── SettingsDrawer
```

Ant Design supplies forms, tables, tabs, tree navigation, drawers, dialogs,
alerts, messages, tags, tooltips, and theme tokens. CodeMirror supplies
structured text editing. CSS Grid and CSS Variables define the page regions
and theme-specific layout. The initial version does not require draggable
panel resizing.

The responsive layout uses a stacked arrangement on narrow screens and is
verified at 320px, 768px, 1024px, and 1440px widths. Icon-only buttons use
`@ant-design/icons` and have tooltips and accessible labels.

## 5. IndexedDB Data Model

The browser database is named `web-curl-db` and is accessed only through a
Dexie repository layer. UI components do not call IndexedDB directly.

```text
collections
  id
  name
  description
  preRequestScript
  createdAt
  updatedAt

folders
  id
  collectionId
  parentId
  name
  preRequestScript
  sortOrder
  createdAt
  updatedAt

requests
  id
  collectionId
  folderId
  name
  method
  url
  queryParams[]
  headers[]
  body
  preRequestScript
  sortOrder
  createdAt
  updatedAt

environments
  id
  name
  variables[]
  isActive
  createdAt
  updatedAt

history
  id
  requestId
  requestSnapshot
  responseSnapshot
  createdAt
```

Parameter and header entries share this shape:

```typescript
interface KeyValueItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}
```

Supported body types are:

```typescript
type BodyType = "none" | "text" | "json" | "form-urlencoded";
```

The UI keeps transient editor, loading, error, and response state in Zustand.
IndexedDB stores user-authored data and completed history only. History is
bounded by a configurable maximum count so browser storage cannot grow
without limit.

The product provides JSON import and export. The default workspace export
includes collections, folders, requests, and environments. History is
exported separately to avoid unexpectedly large backups.

IndexedDB is origin-local. Clearing browser site data loses local data, and
different browsers or devices do not synchronize. Environment values,
including tokens, are stored in browser storage and must not be treated as
encrypted secrets.

## 6. Request Execution Contract

### 6.1 Script context

Before sending a request, the frontend creates a mutable script context:

```typescript
interface ScriptRequestContext {
  request: {
    method: string;
    url: string;
    query: KeyValueItem[];
    headers: KeyValueItem[];
    body: {
      type: BodyType;
      content: string;
    };
  };
  environment: {
    get(name: string): string | undefined;
    set(name: string, value: string): void;
    unset(name: string): void;
  };
}
```

The first script API is intentionally narrow:

```javascript
pm.environment.get("token")
pm.environment.set("token", "new-token")
pm.environment.unset("token")

pm.request.method = "POST"
pm.request.url = "https://example.com/api"
pm.request.query.set("page", "1")
pm.request.query.delete("page")
pm.request.headers.set("Authorization", "Bearer ...")
pm.request.headers.delete("X-Debug")
pm.request.body = JSON.stringify({ hello: "world" })
```

Scripts cannot access the DOM, network APIs, IndexedDB, the file system,
Node.js modules, or arbitrary host capabilities. Script source length,
execution time, and log count are bounded. An exception blocks only the
current request and leaves the rest of the application usable.

Collection, folder, and request scripts execute serially in this order:

```text
Collection script
  → Folder scripts from outermost to innermost
  → Request script
  → Variable substitution
  → Final request validation
  → POST /api/execute
```

Runtime environment mutations affect the current execution context. They are
not automatically persisted back to the saved environment, preventing a
request run from silently modifying durable configuration.

### 6.2 Variable substitution

The `{{variableName}}` syntax is applied to:

- URL.
- Query keys and values.
- Header keys and values.
- Body content.

An unresolved variable remains unchanged and produces a visible warning. It
is never silently replaced with an empty string.

### 6.3 Frontend API client

The frontend API client owns request serialization, cancellation, and
response decoding. It accepts an `AbortSignal` so the user can cancel the
active operation without coupling UI components to `fetch` details.

## 7. Server API Contract

The first version exposes only:

```text
GET  /api/health
POST /api/execute
```

The execute request is:

```typescript
interface ExecuteRequest {
  method: string;
  url: string;
  query: KeyValueItem[];
  headers: KeyValueItem[];
  body: {
    type: BodyType;
    content: string;
  };
  options?: {
    timeoutMs?: number;
    followRedirects?: boolean;
  };
}
```

The response is:

```typescript
interface ExecuteResponse {
  ok: boolean;
  status: number | null;
  statusText: string;
  headers: Array<{ name: string; value: string }>;
  body: string;
  durationMs: number;
  sizeBytes: number;
  error?: {
    code: string;
    message: string;
  };
}
```

Error codes are stable machine-readable values:

```text
INVALID_REQUEST
INVALID_URL
UNSUPPORTED_PROTOCOL
REQUEST_TIMEOUT
REQUEST_ABORTED
RESPONSE_TOO_LARGE
UPSTREAM_CONNECTION_ERROR
UPSTREAM_RESPONSE_ERROR
INTERNAL_ERROR
```

Validation occurs at the Fastify route boundary. The server returns upstream
4xx and 5xx responses as inspectable responses, not as server failures. Only
request execution or service failures use the error field.

## 8. Security and Resource Boundaries

The product requirement is that target hosts are unrestricted by default.
The server therefore does not apply an application-level allowlist for
hosts, ports, IP addresses, private networks, or redirect destinations.
Only `http` and `https` are accepted.

Because an unrestricted server-side proxy can be abused for SSRF, the
deployment documentation must explicitly recommend binding to `127.0.0.1`
or placing the service behind an existing authentication and network access
control layer when it is not a private local tool. The application does not
silently add a destination allowlist that conflicts with the confirmed
product behavior.

Resource protections remain enabled:

- Request timeout.
- Maximum request body size.
- Maximum request header size.
- Maximum response body size.
- Maximum redirect count.
- Maximum script source length.
- Maximum script execution time.
- Maximum script log count.

Fastify applies a request body limit and security response headers. Error
responses do not expose stack traces, filesystem paths, or internal
implementation details. Server logs contain only method, target host,
status, duration, and error code; they do not record full headers, tokens,
or bodies.

## 9. Deployment

The application does not use Docker, Nginx, SQLite, or an external database.
Fastify directly serves the built frontend and API.

Expected production layout:

```text
web-curl/
├── dist/
├── server/
├── install.sh
├── uninstall.sh
├── web-curl.service.example
└── package.json
```

The production commands are:

```bash
npm ci
npm run build
node dist/server/index.js
```

`install.sh`:

1. Verifies that the active Node.js major version is 24.
2. Installs dependencies using the committed lockfile.
3. Builds the frontend and server.
4. Creates a systemd service.
5. Uses `127.0.0.1:8080` as the default listener.
6. Allows `HOST`, `PORT`, timeout, and response-size configuration.
7. Starts the service and checks `/api/health`.

The first implementation should fail with a clear installation message when
Node.js 24 is unavailable rather than silently installing a distribution-
specific runtime. The deployment guide may document the supported Node.js 24
installation methods for common Linux distributions.

## 10. Testing and Acceptance

### Unit tests

- URL, query, header, and body assembly.
- Variable substitution and unresolved-variable warnings.
- Script API behavior.
- Script ordering.
- Script timeout and exception handling.
- Request boundary validation.
- Stable server error format.
- Timeout and response-size enforcement.

### Integration tests

- `GET /api/health`.
- Successful `POST /api/execute`.
- Upstream 4xx and 5xx responses.
- Timeout, connection failure, and cancellation.
- JSON, text, and form-urlencoded bodies.
- Static asset serving and API route separation.

### Browser verification

- Create, rename, delete, and move folders and requests.
- Edit query parameters, headers, body, and scripts.
- Execute collection, folder, and request scripts.
- Send a request and inspect its response.
- Refresh and restore data from IndexedDB.
- Import and export workspace data.
- Switch light and dark themes.
- Verify 320px, 768px, 1024px, and 1440px viewports.
- Verify no runtime console errors.

The implementation is complete only when the project builds, automated tests
pass, the production server starts on Node.js 24, `/api/health` responds, and
the primary request workflow is verified in a real browser.

## 11. Explicit Non-Goals for Version One

- User accounts, authentication, authorization, or multi-user workspaces.
- Server-side persistence or cross-device synchronization.
- Nginx or another reverse proxy as an application dependency.
- SQLite or any external database.
- Arbitrary server-side script execution.
- Automatic synchronization of runtime environment mutations.
- Full Postman-compatible scripting or `pm.sendRequest()`.
- Plugin marketplace or third-party extension loading.
