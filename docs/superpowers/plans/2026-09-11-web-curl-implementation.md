# Web Curl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user HTTP request debugging application that runs as one Node.js 24 process, serves a React/Ant Design UI and Fastify API, executes restricted Pre-request scripts in the browser, and stores all durable user data in IndexedDB.

**Architecture:** Use a TypeScript monorepo-style source tree with `src/client`, `src/server`, and `src/shared` boundaries. Vite builds the browser application into `dist/client`; tsup builds the Fastify server into `dist/server`; the server directly serves both static assets and `/api/*`. The browser owns collections, folders, requests, environments, and history through Dexie, while the stateless server only validates and executes one request at a time.

**Tech Stack:** Node.js 24, TypeScript, React, Vite, Fastify, `@fastify/static`, `@fastify/helmet`, Zod, Ant Design 6.x, `@ant-design/icons`, CodeMirror 6, Zustand, Dexie, QuickJS WebAssembly, Vitest, React Testing Library, Playwright, systemd.

---

## File Map

The implementation should keep responsibilities separated at these paths:

```text
package.json
tsconfig.json
vite.config.ts
vitest.config.ts
playwright.config.ts
eslint.config.js
src/
  shared/
    contracts.ts
    request-types.ts
  server/
    app.ts
    index.ts
    config.ts
    errors.ts
    execute/
      execute-schema.ts
      execute-service.ts
      execute-route.ts
      execute-service.test.ts
    health/
      health-route.ts
  client/
    main.tsx
    App.tsx
    app.css
    api/
      execute-client.ts
    db/
      database.ts
      repositories.ts
      seed.ts
    state/
      editor-store.ts
      runtime-store.ts
    scripts/
      script-types.ts
      variable-substitution.ts
      script-runner.ts
      quickjs.worker.ts
    components/
      AppShell.tsx
      TopToolbar.tsx
      CollectionSidebar.tsx
      RequestWorkspace.tsx
      RequestToolbar.tsx
      RequestTabs.tsx
      ParamsEditor.tsx
      HeadersEditor.tsx
      BodyEditor.tsx
      ScriptEditor.tsx
      ResponsePanel.tsx
      SettingsDrawer.tsx
      CodeMirrorEditor.tsx
    styles/
      tokens.css
tests/
  setup.ts
  fixtures/
    requests.ts
    responses.ts
  client/
    database.test.ts
    variable-substitution.test.ts
    script-runner.test.ts
    editor-store.test.ts
    import-export.test.ts
  server/
    health-route.test.ts
    execute-route.test.ts
  e2e/
    request-flow.spec.ts
    persistence.spec.ts
scripts/
  build-server.mjs
  install.sh
  uninstall.sh
deploy/
  web-curl.service.example
README.md
```

Every task below names the files it may create or modify. Do not introduce a
second API contract or a second persistence abstraction.

## Task 1: Scaffold the TypeScript Application

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/client/main.tsx`
- Create: `src/client/App.tsx`
- Create: `src/client/app.css`
- Create: `tests/setup.ts`
- Create: `.gitignore`
- Test: `tests/client/app.test.tsx`

- [ ] **Step 1: Create the package manifest and scripts**

Use one package manifest and one lockfile. Add scripts with explicit build
boundaries:

```json
{
  "name": "web-curl",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24 <25"
  },
  "scripts": {
    "dev": "concurrently -k \"vite\" \"tsx watch src/server/index.ts\"",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsup src/server/index.ts --format esm --out-dir dist/server --sourcemap",
    "start": "node dist/server/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

Add the runtime dependencies from the confirmed stack and the development
dependencies required by these scripts. Use the repository lockfile generated
by `npm install`; do not commit a second lockfile.

Install the runtime dependencies explicitly:

```bash
npm install fastify @fastify/static @fastify/helmet zod react react-dom antd @ant-design/icons codemirror @codemirror/lang-javascript @codemirror/lang-json @codemirror/state @codemirror/view dexie zustand quickjs-emscripten
```

Install the development dependencies explicitly:

```bash
npm install --save-dev @eslint/js @playwright/test @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/node @types/react @types/react-dom @vitejs/plugin-react concurrently eslint fake-indexeddb jsdom tsup tsx typescript typescript-eslint vite vitest
```

- [ ] **Step 2: Add TypeScript, Vite, and test configuration**

Configure TypeScript for strict ESM compilation and DOM types:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

Configure Vite with React and `src/client` as the application entry. Configure
Vitest with a `jsdom` environment and `tests/setup.ts`. Configure Playwright
with the built server URL and a web server command that runs `npm run build`
followed by `npm start`.

Create `eslint.config.js` with the TypeScript ESLint recommended rules and
ignore `dist`, `coverage`, and `playwright-report`.

- [ ] **Step 3: Write the initial failing render test**

Create `tests/client/app.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { App } from "../../src/client/App";

it("renders the request workspace shell", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Web Curl" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
});
```

Run:

```bash
npm test -- tests/client/app.test.tsx
```

Expected: FAIL because `App` and the application shell do not exist yet.

- [ ] **Step 4: Implement the minimal application shell**

Create `src/client/App.tsx` and `src/client/main.tsx`:

```tsx
// src/client/App.tsx
import { Button, Layout, Typography } from "antd";

export function App() {
  return (
    <Layout className="app-shell">
      <Layout.Header className="top-toolbar">
        <Typography.Title level={3}>Web Curl</Typography.Title>
      </Layout.Header>
      <Layout.Content className="request-workspace">
        <Button type="primary" aria-label="Send request">Send</Button>
      </Layout.Content>
    </Layout>
  );
}
```

```tsx
// src/client/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import { App } from "./App";
import "./app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
```

Add `index.html` with a `root` element and add `src/client/app.css` with the
minimum full-height layout styles.

- [ ] **Step 5: Run focused verification**

Run:

```bash
npm test -- tests/client/app.test.tsx
npm run typecheck
npm run build
npm run lint
```

Expected: the render test passes, type checking exits 0, and both Vite and
tsup produce build output.

- [ ] **Step 6: Commit the scaffold**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts playwright.config.ts eslint.config.js index.html src/client tests/setup.ts tests/client/app.test.tsx .gitignore
git commit -m "chore: scaffold web curl application"
```

## Task 2: Define Shared Contracts and Fastify Application Boundaries

**Files:**
- Create: `src/shared/request-types.ts`
- Create: `src/shared/contracts.ts`
- Create: `src/server/config.ts`
- Create: `src/server/errors.ts`
- Create: `src/server/app.ts`
- Create: `src/server/index.ts`
- Create: `src/server/health/health-route.ts`
- Create: `tests/server/health-route.test.ts`

- [ ] **Step 1: Write contract tests for the health route**

Create a Fastify app test that asserts the route shape:

```ts
import { buildApp } from "../../src/server/app";

it("returns a healthy service response", async () => {
  const app = await buildApp({ logger: false });
  const response = await app.inject({ method: "GET", url: "/api/health" });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ ok: true, service: "web-curl" });
  await app.close();
});
```

Run:

```bash
npm test -- tests/server/health-route.test.ts
```

Expected: FAIL because the Fastify app and route do not exist.

- [ ] **Step 2: Define the shared request and response types**

Create `src/shared/request-types.ts`:

```ts
export type BodyType = "none" | "text" | "json" | "form-urlencoded";

export interface KeyValueItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface RequestBody {
  type: BodyType;
  content: string;
}

export interface RequestDefinition {
  method: string;
  url: string;
  query: KeyValueItem[];
  headers: KeyValueItem[];
  body: RequestBody;
}
```

Create `src/shared/contracts.ts`:

```ts
import type { RequestDefinition } from "./request-types";

export interface ExecuteRequest extends RequestDefinition {
  options?: {
    timeoutMs?: number;
    followRedirects?: boolean;
  };
}

export interface ExecuteResponse {
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

export interface HealthResponse {
  ok: true;
  service: "web-curl";
}
```

- [ ] **Step 3: Implement configuration and error primitives**

`src/server/config.ts` must parse `HOST`, `PORT`, `REQUEST_TIMEOUT_MS`,
`MAX_REQUEST_BODY_BYTES`, `MAX_RESPONSE_BODY_BYTES`, and
`MAX_REDIRECTS`, with defaults of `127.0.0.1`, `8080`, `30_000`,
`10 * 1024 * 1024`, `10 * 1024 * 1024`, and `5`.

`src/server/errors.ts` must export:

```ts
export type ErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "REQUEST_TIMEOUT"
  | "REQUEST_ABORTED"
  | "RESPONSE_TOO_LARGE"
  | "UPSTREAM_CONNECTION_ERROR"
  | "UPSTREAM_RESPONSE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}
```

- [ ] **Step 4: Implement the Fastify app and health route**

`buildApp` must register `@fastify/helmet`, JSON body limits, a generic
error handler that returns `{ ok: false, error: { code, message } }`, and the
health route. Leave a static-file registration seam in `app.ts` so Task 9 can
register `dist/client` without changing API behavior.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm test -- tests/server/health-route.test.ts
npm run typecheck
```

Expected: both commands exit 0.

```bash
git add src/shared src/server tests/server/health-route.test.ts
git commit -m "feat: add shared contracts and fastify health route"
```

## Task 3: Implement the Stateless HTTP Execution Service

**Files:**
- Create: `src/server/execute/execute-schema.ts`
- Create: `src/server/execute/execute-service.ts`
- Create: `src/server/execute/execute-route.ts`
- Create: `tests/fixtures/upstream-server.ts`
- Create: `tests/server/execute-service.test.ts`
- Create: `tests/server/execute-route.test.ts`
- Modify: `src/server/app.ts`
- Modify: `src/shared/contracts.ts`

- [ ] **Step 1: Write failing service tests**

Cover URL composition, enabled query/header entries, body modes, upstream
4xx/5xx preservation, timeout, and response-size limits:

```ts
it("executes the request with enabled query parameters and headers", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest({
    method: "POST",
    url: `${upstream.url}/echo`,
    query: [{ id: "q1", key: "page", value: "2", enabled: true }],
    headers: [{ id: "h1", key: "X-Test", value: "yes", enabled: true }],
    body: { type: "json", content: '{"ok":true}' },
  });

  expect(result.status).toBe(200);
  expect(result.body).toContain('"page":"2"');
  expect(result.body).toContain('"x-test":"yes"');
  await upstream.close();
});

it("returns upstream 500 as an inspectable response", async () => {
  const upstream = await createUpstreamServer();
  const result = await executeRequest({
    method: "GET",
    url: `${upstream.url}/status/500`,
    query: [],
    headers: [],
    body: { type: "none", content: "" },
  });

  expect(result.status).toBe(500);
  expect(result.error).toBeUndefined();
  await upstream.close();
});
```

Run:

```bash
npm test -- tests/server/execute-service.test.ts
```

Expected: FAIL because the service does not exist.

- [ ] **Step 2: Define boundary validation**

Use Zod in `execute-schema.ts` to validate non-empty methods, valid URLs,
`http`/`https` protocols, key/value entry sizes, body type, and optional
execution settings. Reject malformed input with `INVALID_REQUEST`,
`INVALID_URL`, or `UNSUPPORTED_PROTOCOL`.

- [ ] **Step 3: Implement deterministic request construction**

In `execute-service.ts`:

```ts
const url = new URL(input.url);
for (const item of input.query) {
  if (item.enabled) url.searchParams.append(item.key, item.value);
}

const headers = new Headers();
for (const item of input.headers) {
  if (item.enabled) headers.append(item.key, item.value);
}
```

Send no body for `none`, raw content for `text`, JSON content with
`Content-Type: application/json` for `json` when absent, and
`URLSearchParams` semantics for `form-urlencoded`. Use an `AbortController`
with the configured timeout and propagate a caller-provided abort signal.

- [ ] **Step 4: Implement bounded response reading**

Read the upstream body incrementally with `response.body.getReader()`. Stop
and return `RESPONSE_TOO_LARGE` once the configured byte limit is exceeded.
Normalize upstream headers into an array and return `durationMs` and
`sizeBytes`.

- [ ] **Step 5: Add the route and route tests**

Register `POST /api/execute`, validate through the Zod schema, call the
service, and return one stable `ExecuteResponse` shape for both successful
upstream responses and controlled failures. Do not expose stack traces.

Test the route with Fastify injection for malformed JSON, unsupported
protocols, upstream success, upstream 500, timeout, and cancellation.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test -- tests/server/execute-service.test.ts tests/server/execute-route.test.ts
npm run typecheck
```

Expected: all focused tests pass and type checking exits 0.

```bash
git add src/server/execute src/server/app.ts src/shared/contracts.ts tests/fixtures tests/server/execute-service.test.ts tests/server/execute-route.test.ts
git commit -m "feat: add bounded http request execution api"
```

## Task 4: Add IndexedDB Persistence and Workspace Seed Data

**Files:**
- Create: `src/client/db/database.ts`
- Create: `src/client/db/repositories.ts`
- Create: `src/client/db/seed.ts`
- Create: `tests/fixtures/requests.ts`
- Create: `tests/client/database.test.ts`
- Create: `tests/client/import-export.test.ts`
- Create: `src/client/state/editor-store.ts`
- Create: `src/client/state/runtime-store.ts`
- Create: `tests/client/editor-store.test.ts`

- [ ] **Step 1: Write repository tests against fake IndexedDB**

Configure Vitest with `fake-indexeddb` and test that a collection, folder,
request, environment, and history record can be created, updated, listed, and
deleted without touching React components:

```ts
it("persists and reloads a request workspace", async () => {
  const collection = await collectionRepository.create({ name: "Demo" });
  const request = await requestRepository.create({
    collectionId: collection.id,
    folderId: null,
    name: "Health",
    method: "GET",
    url: "https://example.test/health",
    queryParams: [],
    headers: [],
    body: { type: "none", content: "" },
    preRequestScript: "",
  });

  expect(await requestRepository.get(request.id)).toMatchObject({
    name: "Health",
    method: "GET",
  });
});
```

Run:

```bash
npm test -- tests/client/database.test.ts
```

Expected: FAIL because the database and repositories do not exist.

- [ ] **Step 2: Implement the Dexie schema**

Create `WebCurlDatabase` with tables for `collections`, `folders`, `requests`,
`environments`, and `history`. Include `preRequestScript` on collections,
folders, and requests. Use generated string IDs and ISO timestamps at the
repository boundary.

- [ ] **Step 3: Implement focused repositories**

Export repositories with explicit methods:

```ts
collectionRepository.create(input)
collectionRepository.update(id, patch)
collectionRepository.remove(id)
collectionRepository.list()

folderRepository.create(input)
folderRepository.update(id, patch)
folderRepository.remove(id)
folderRepository.listByCollection(collectionId)

requestRepository.create(input)
requestRepository.update(id, patch)
requestRepository.remove(id)
requestRepository.listByCollection(collectionId)

environmentRepository.list()
environmentRepository.setActive(id)
historyRepository.add(record)
historyRepository.list(limit)
historyRepository.clear()
```

Do not expose the Dexie instance to UI components.

- [ ] **Step 4: Add seed and import/export functions**

On an empty database, seed one collection, one folder, and one example
request:

```ts
{
  name: "Example",
  method: "GET",
  url: "https://httpbin.org/get",
  queryParams: [],
  headers: [],
  body: { type: "none", content: "" },
  preRequestScript: ""
}
```

Implement JSON serialization with a version field:

```ts
interface WorkspaceExport {
  version: 1;
  collections: CollectionRecord[];
  folders: FolderRecord[];
  requests: RequestRecord[];
  environments: EnvironmentRecord[];
}
```

Reject unknown versions and malformed records before writing any imported
record.

- [ ] **Step 5: Add Zustand editor and runtime stores**

The editor store holds selected collection/folder/request IDs and an in-memory
draft. The runtime store holds `isSending`, `activeResponse`, `activeError`,
`scriptLogs`, and `unresolvedVariables`. Store actions should contain plain
data transitions only and must not call `fetch` or Dexie directly.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test -- tests/client/database.test.ts tests/client/import-export.test.ts tests/client/editor-store.test.ts
npm run typecheck
```

Expected: all focused tests pass and type checking exits 0.

```bash
git add src/client/db src/client/state tests/fixtures/requests.ts tests/client/database.test.ts tests/client/import-export.test.ts tests/client/editor-store.test.ts
git commit -m "feat: add indexeddb workspace persistence"
```

## Task 5: Implement Variable Substitution and the Restricted Script Runner

**Files:**
- Create: `src/client/scripts/script-types.ts`
- Create: `src/client/scripts/variable-substitution.ts`
- Create: `src/client/scripts/quickjs.worker.ts`
- Create: `src/client/scripts/script-runner.ts`
- Create: `tests/client/variable-substitution.test.ts`
- Create: `tests/client/script-runner.test.ts`
- Modify: `src/shared/request-types.ts`

- [ ] **Step 1: Write variable substitution tests**

Test replacement in URL, query, headers, and body, including unresolved
variables:

```ts
it("keeps unresolved variables and reports them", () => {
  const result = substituteVariables(
    { url: "https://example.test/{{missing}}" },
    {},
  );

  expect(result.value.url).toBe("https://example.test/{{missing}}");
  expect(result.unresolved).toEqual(["missing"]);
});
```

Run:

```bash
npm test -- tests/client/variable-substitution.test.ts
```

Expected: FAIL because the substitution module does not exist.

- [ ] **Step 2: Implement pure variable substitution**

Create a recursive request transformation that replaces `{{name}}` with the
current execution environment, preserves unresolved tokens, deduplicates
warning names, and never mutates the saved request draft.

- [ ] **Step 3: Define the script worker protocol**

Create `script-types.ts`:

```ts
import type { RequestDefinition } from "../../shared/request-types";

export interface ScriptExecutionInput {
  source: string;
  request: RequestDefinition;
  environment: Record<string, string>;
  limits: {
    maxSourceLength: number;
    maxExecutionMs: number;
    maxLogs: number;
  };
}

export interface ScriptExecutionOutput {
  request: RequestDefinition;
  environment: Record<string, string>;
  logs: string[];
  durationMs: number;
}
```

The worker messages must be discriminated unions with `run`, `result`, and
`error` variants. The main thread must terminate the worker after every
execution or on timeout.

- [ ] **Step 4: Implement the QuickJS worker with an allowlisted API**

Load QuickJS WASM in `quickjs.worker.ts`. Expose only:

```text
pm.request.method
pm.request.url
pm.request.body
pm.request.query.set/delete
pm.request.headers.set/delete
pm.environment.get/set/unset
console.log
```

Do not expose `fetch`, `XMLHttpRequest`, DOM globals, IndexedDB, Node
globals, `process`, or module loading. Convert all values crossing the
worker boundary to validated JSON. Enforce source and log limits before
execution and terminate the worker when the timeout expires.

- [ ] **Step 5: Implement ordered script execution**

`script-runner.ts` must execute the collection script, folder scripts from
outermost to innermost, and request script serially. Each output becomes the
next input. If one script fails, return a typed error and do not call the
server API.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test -- tests/client/variable-substitution.test.ts tests/client/script-runner.test.ts
npm run typecheck
```

Expected: tests verify ordering, request mutations, environment mutations,
unresolved variables, exceptions, and timeout handling.

```bash
git add src/client/scripts src/shared/request-types.ts tests/client/variable-substitution.test.ts tests/client/script-runner.test.ts
git commit -m "feat: add isolated pre-request script execution"
```

## Task 6: Build the Developer Tool UI Shell

**Files:**
- Create: `src/client/components/AppShell.tsx`
- Create: `src/client/components/TopToolbar.tsx`
- Create: `src/client/components/CollectionSidebar.tsx`
- Create: `src/client/components/RequestWorkspace.tsx`
- Create: `src/client/components/RequestToolbar.tsx`
- Create: `src/client/components/RequestTabs.tsx`
- Create: `src/client/components/ResponsePanel.tsx`
- Create: `src/client/components/SettingsDrawer.tsx`
- Create: `src/client/styles/tokens.css`
- Modify: `src/client/App.tsx`
- Modify: `src/client/app.css`
- Create: `tests/client/app-shell.test.tsx`

- [ ] **Step 1: Write shell accessibility tests**

Test that the UI exposes named landmarks and controls:

```tsx
it("exposes the main request tool regions", () => {
  render(<App />);
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("complementary")).toBeInTheDocument();
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
});
```

Run:

```bash
npm test -- tests/client/app-shell.test.tsx
```

Expected: FAIL because the composed shell does not exist.

- [ ] **Step 2: Implement the three-region layout**

Compose `AppShell` with:

```tsx
<Layout className="app-shell">
  <TopToolbar />
  <Layout className="app-body">
    <CollectionSidebar />
    <Layout.Content>
      <RequestWorkspace />
    </Layout.Content>
  </Layout>
</Layout>
```

Use CSS Grid/CSS Variables for sidebar width, toolbar height, editor
separation, and response panel sizing. Keep page sections unframed; use
Ant Design cards only where an individual repeated item needs framing.

- [ ] **Step 3: Add theme tokens and theme switching**

Define light and dark token sets in `tokens.css`. The toolbar theme control
must update Ant Design `ConfigProvider` tokens and the application
`data-theme` attribute. Use readable semantic colors for request methods and
response statuses, with text labels in addition to color.

- [ ] **Step 4: Implement sidebar and toolbar states**

Render collection/folder/request tree data from the editor store. Add accessible
buttons for creating a folder, creating a request, importing, exporting,
opening settings, and switching environments. Include empty, loading, and
error states instead of blank regions.

- [ ] **Step 5: Verify the shell**

Run:

```bash
npm test -- tests/client/app-shell.test.tsx
npm run typecheck
npm run build
```

Expected: tests pass, type checking exits 0, and the production build
completes.

```bash
git add src/client/App.tsx src/client/app.css src/client/components src/client/styles tests/client/app-shell.test.tsx
git commit -m "feat: add developer tool workspace shell"
```

## Task 7: Implement Request Editing Components

**Files:**
- Create: `src/client/components/CodeMirrorEditor.tsx`
- Create: `src/client/components/ParamsEditor.tsx`
- Create: `src/client/components/HeadersEditor.tsx`
- Create: `src/client/components/BodyEditor.tsx`
- Create: `src/client/components/ScriptEditor.tsx`
- Modify: `src/client/components/RequestToolbar.tsx`
- Modify: `src/client/components/RequestTabs.tsx`
- Create: `tests/client/request-editors.test.tsx`

- [ ] **Step 1: Write editor behavior tests**

Cover adding a query row, disabling a header, selecting a body type, updating
the URL, and editing a script:

```tsx
it("adds an enabled query parameter to the draft", async () => {
  render(<ParamsEditor />);
  await userEvent.click(screen.getByRole("button", { name: /add parameter/i }));

  expect(screen.getByLabelText("Query parameter name 1")).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: /enable parameter 1/i })).toBeChecked();
});
```

Run:

```bash
npm test -- tests/client/request-editors.test.tsx
```

Expected: FAIL because the editor components do not exist.

- [ ] **Step 2: Implement the shared CodeMirror wrapper**

Create a controlled `CodeMirrorEditor` that accepts `value`, `onChange`,
`language`, `ariaLabel`, and `minHeight`. Dispose the editor view on unmount.
Use JSON mode for JSON bodies, JavaScript mode for scripts, and plain text mode
for text bodies.

- [ ] **Step 3: Implement query and header editors**

Use Ant Design `Table` with stable row dimensions and explicit controls for
enabled state, key, value, description, and delete. Generate IDs when adding
rows. Save draft updates through typed editor-store actions, not direct
database writes.

- [ ] **Step 4: Implement body and script editors**

`BodyEditor` provides `none`, `text`, `json`, and `form-urlencoded` modes. It
shows JSON validation feedback without preventing text editing. `ScriptEditor`
uses CodeMirror JavaScript mode and displays script errors and execution logs
in a separate status region.

- [ ] **Step 5: Implement request toolbar**

Render a method select, URL input, send button, cancel button while sending,
and a compact unresolved-variable warning area. The send control must be
keyboard accessible and expose `aria-busy` while active.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test -- tests/client/request-editors.test.tsx
npm run typecheck
npm run build
```

Expected: editor tests pass and the build remains clean.

```bash
git add src/client/components tests/client/request-editors.test.tsx
git commit -m "feat: add request parameter and body editors"
```

## Task 8: Connect Execution, Responses, History, Import, and Export

**Files:**
- Create: `src/client/api/execute-client.ts`
- Modify: `src/client/components/RequestWorkspace.tsx`
- Modify: `src/client/components/ResponsePanel.tsx`
- Modify: `src/client/components/TopToolbar.tsx`
- Modify: `src/client/components/SettingsDrawer.tsx`
- Modify: `src/client/state/editor-store.ts`
- Modify: `src/client/state/runtime-store.ts`
- Create: `tests/client/execution-flow.test.tsx`
- Create: `tests/client/import-export.test.ts`

- [ ] **Step 1: Write the API client and execution-flow tests**

Mock only the network boundary and assert the orchestration:

```tsx
it("runs scripts before sending and renders the response", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: [],
      body: '{"ok":true}',
      durationMs: 12,
      sizeBytes: 11
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: /send/i }));

  expect(await screen.findByText('{"ok":true}')).toBeInTheDocument();
});
```

Run:

```bash
npm test -- tests/client/execution-flow.test.tsx
```

Expected: FAIL because the API client and orchestration do not exist.

- [ ] **Step 2: Implement the typed API client**

Create `execute-client.ts`:

```ts
export async function executeRequest(
  request: ExecuteRequest,
  signal: AbortSignal,
): Promise<ExecuteResponse> {
  const response = await fetch("/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  return (await response.json()) as ExecuteResponse;
}
```

Convert non-JSON transport failures into the stable client runtime error
shape. Do not swallow `AbortError`; map it to `REQUEST_ABORTED`.

- [ ] **Step 3: Implement the send orchestration**

The `RequestWorkspace` send action must:

```text
load current draft
→ build script context
→ run collection script
→ run folders from outermost to innermost
→ run request script
→ substitute variables
→ show unresolved-variable warning
→ call /api/execute with AbortSignal
→ store response and history
```

Use one `AbortController` per send. Disable duplicate sends and release the
controller in `finally`.

- [ ] **Step 4: Implement the response panel**

Render status text, duration, size, response headers, raw body, and a JSON
pretty view when parsing succeeds. Keep non-JSON bodies in a plain text view.
Render controlled errors with code and message, and provide a copy-body
button with an accessible label.

- [ ] **Step 5: Add history persistence**

Write the request snapshot and response snapshot to IndexedDB only after a
completed response. Do not persist failed script runs as history entries.
Limit history reads to the configured maximum.

- [ ] **Step 6: Add import/export UI**

Use browser download APIs for JSON export and a file input for import. Validate
the version and all records before replacing or merging data. Show a
confirmation dialog before destructive replacement.

- [ ] **Step 7: Verify and commit**

Run:

```bash
npm test -- tests/client/execution-flow.test.tsx tests/client/import-export.test.ts
npm run typecheck
npm run build
```

Expected: the request flow, response rendering, cancellation state, and
import/export tests pass.

```bash
git add src/client/api src/client/components src/client/state tests/client/execution-flow.test.tsx tests/client/import-export.test.ts
git commit -m "feat: connect request execution and response history"
```

## Checkpoint: Core Request Flow

- [ ] `npm test` passes for all unit and integration tests created so far.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm run build` produces client and server output.
- [ ] The browser can create a request, edit its URL, and invoke a mocked
      `/api/execute` request.
- [ ] The browser restores collections and requests after a reload.

## Task 9: Add Static Hosting and Linux Deployment

**Files:**
- Modify: `src/server/app.ts`
- Modify: `src/server/index.ts`
- Create: `scripts/install.sh`
- Create: `scripts/uninstall.sh`
- Create: `deploy/web-curl.service.example`
- Modify: `package.json`
- Create: `README.md`
- Create: `tests/server/static-hosting.test.ts`

- [ ] **Step 1: Write the static hosting test**

Build a temporary fixture with `index.html`, create the app with the fixture
path, and assert that `/` serves the page while `/api/health` still serves
JSON:

```ts
it("serves the frontend and keeps api routes available", async () => {
  const app = await buildApp({ logger: false, staticRoot: fixtureRoot });
  const page = await app.inject({ method: "GET", url: "/" });
  const health = await app.inject({ method: "GET", url: "/api/health" });

  expect(page.statusCode).toBe(200);
  expect(page.body).toContain("<div id=\"root\"></div>");
  expect(health.json()).toEqual({ ok: true, service: "web-curl" });
  await app.close();
});
```

Run:

```bash
npm test -- tests/server/static-hosting.test.ts
```

Expected: FAIL because static hosting is not registered.

- [ ] **Step 2: Register static files and SPA fallback**

Register `@fastify/static` against `dist/client`. Serve `index.html` for
non-API browser routes, but never route `/api/*` through the SPA fallback.
Keep a configurable `staticRoot` for tests.

- [ ] **Step 3: Add service and install scripts**

Create a systemd unit:

```ini
[Unit]
Description=Web Curl
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/web-curl
ExecStart=/usr/bin/env node /opt/web-curl/dist/server/index.js
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=8080
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

`scripts/install.sh` must fail when `node --version` is not major 24, run
`npm ci`, run `npm run build`, install the unit, reload systemd, enable/start
the service, and poll `/api/health`. It must not install Docker, Nginx, or
SQLite. `scripts/uninstall.sh` stops, disables, and removes only this unit.

- [ ] **Step 4: Document supported deployment**

`README.md` must include:

```bash
./scripts/install.sh
sudo systemctl status web-curl
curl http://127.0.0.1:8080/api/health
```

Document `HOST`, `PORT`, resource-limit environment variables, the IndexedDB
data-loss caveat, and the SSRF risk of exposing an unrestricted proxy beyond
trusted users.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- tests/server/static-hosting.test.ts
npm run build
node --version
```

Expected: static hosting tests pass, the build exits 0, and the local runtime
reports Node.js 24 before proceeding with deployment verification.

```bash
git add src/server/app.ts src/server/index.ts scripts deploy package.json README.md tests/server/static-hosting.test.ts
git commit -m "feat: add direct fastify hosting and systemd deployment"
```

## Task 10: Browser End-to-End Verification and Final Hardening

**Files:**
- Create: `tests/e2e/request-flow.spec.ts`
- Create: `tests/e2e/persistence.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `src/client/app.css`
- Modify: `src/client/components/ResponsePanel.tsx`
- Modify: `README.md`

- [ ] **Step 1: Write the primary browser flow**

Create a Playwright test that:

```ts
test("creates a request, sends it, and renders the response", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /new request/i }).click();
  await page.getByLabel("Request URL").fill("https://httpbin.org/get");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByRole("region", { name: /response/i })).toContainText("200");
});
```

Use a deterministic local upstream fixture in the test environment; do not
make the test suite depend on a public internet service.

- [ ] **Step 2: Write persistence and responsive checks**

Verify creating a request, reloading the page, and seeing the same request.
Capture screenshots or inspect layout at 320px, 768px, 1024px, and 1440px.
Assert that the main editor regions remain visible without horizontal
overflow that hides controls.

- [ ] **Step 3: Run the complete verification suite**

Run in this order:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
git status --short
```

Expected: type checking, unit/integration tests, build, and browser tests
exit 0; audit has no unreviewed reachable high or critical runtime finding;
`git status --short` is empty after the final commit.

- [ ] **Step 4: Review the final requirements checklist**

Confirm the built application has:

```text
Node.js 24 runtime
Fastify directly serving frontend and API
No Docker, Nginx, SQLite, or external persistence
Ant Design 6.x UI
IndexedDB persistence and JSON import/export
Method, URL, query, header, and body editing
Collection/folder/request script ordering
QuickJS WebAssembly worker isolation
Unrestricted HTTP/HTTPS target behavior
Timeout, body-size, redirect, and script limits
Response status, headers, body, size, and duration
systemd installation without a reverse proxy
accessible empty/loading/error states
```

- [ ] **Step 5: Commit the verified release baseline**

```bash
git add tests/e2e src/client/app.css src/client/components/ResponsePanel.tsx playwright.config.ts README.md
git commit -m "test: verify web curl end to end"
```

## Checkpoint: Complete

- [ ] All task checklists are complete.
- [ ] All automated tests pass.
- [ ] Production build succeeds.
- [ ] Browser verification passes at all required viewport sizes.
- [ ] Deployment instructions work on a Linux host with Node.js 24.
- [ ] No uncommitted changes remain.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Unrestricted server-side proxy is abused for SSRF or proxying | High | Default bind to `127.0.0.1`, document exposure risk, keep request and response resource caps, avoid logging secrets |
| QuickJS worker integration is more complex than ordinary browser scripts | High | Isolate it behind a worker protocol, test request/environment mutations and terminate workers on timeout |
| IndexedDB data is lost by browser site-data cleanup | Medium | Provide versioned JSON export/import and document origin-local storage |
| Large responses freeze the UI or fill browser storage | Medium | Incremental server-side response limit, bounded history, and CodeMirror/plain-text rendering |
| Frontend and backend contracts drift | Medium | Keep types in `src/shared`, validate at the Fastify boundary, and cover the API with injection tests |
| Node.js 24 is absent on a target Linux host | Medium | Make `install.sh` fail clearly and document supported Node.js 24 installation paths |

## Spec Coverage Review

- Technology stack and same-process architecture: Tasks 1, 2, and 9.
- Ant Design, CodeMirror, responsive layout, and accessibility: Tasks 6, 7,
  and 10.
- IndexedDB-only persistence, repositories, seed data, history, and
  import/export: Tasks 4 and 8.
- Collection/folder/request scripts, variable substitution, QuickJS worker,
  limits, and ordering: Task 5 and Task 8.
- Fastify API contract, upstream status preservation, timeout, cancellation,
  response limits, and errors: Tasks 2 and 3.
- No Docker, Nginx, SQLite, or external service: Task 9 and README.
- systemd deployment and direct static serving: Task 9.
- Unit, integration, browser, build, type, and audit verification: every task
  checkpoint and Task 10.
