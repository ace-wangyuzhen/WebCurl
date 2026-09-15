# Web Curl Docs Page Design Specification

## 1. Overview

Add an in-app documentation page that introduces the platform's main
features. The page lives inside the existing single-page application (no
router, no new dependency) and is toggled from the top toolbar. It describes
what Web Curl can do, using the same bilingual (Chinese / English) and
light / dark theme systems already in place.

The docs page is read-only content. It does not modify workspace data, does
not require the server, and is fully renderable offline.

## 2. Entry point and state

The page follows the existing `SettingsDrawer` pattern exactly: the App owns a
boolean `docsOpen` state and passes it down through `AppShell`.

- `App.tsx` gains `docsOpen` state plus `openDocs` / `closeDocs` callbacks,
  mirroring the existing `settingsOpen` handling.
- `TopToolbar` gains one icon-only button (`ReadOutlined`) with an accessible
  label and a tooltip (`docs.open`, localized). It is placed next to the
  existing settings button.
- Opening docs sets `docsOpen = true`; closing it restores the request view.
  No selection, draft, or runtime state is cleared while docs are open.

## 3. Layout and view swap

When `docsOpen` is `true`, `AppShell` renders `<DocsPage onBack={closeDocs} />`
in place of the normal `.app-body` children (`CollectionSidebar`, the resizer,
and `RequestWorkspace`). The top toolbar and settings drawer remain mounted.

`DocsPage` is a single scrollable column:

- A header row with a back button (returns to the request view) and the page
  title (`docs.title`).
- A two-column content area below: a sticky table of contents on the left and
  the section bodies on the right.
- On narrow viewports (≤ 767px, matching the existing breakpoint) the TOC
  collapses above the content and is no longer sticky.

The page reuses existing design tokens (`--surface`, `--border-color`,
`--ink`, `--text-secondary`, `--accent`, `--radius-*`, `--space-*`) and
follows the `.request-workspace` conventions (centered, `max-width`-capped,
`overflow-y: auto`). No new color or type tokens are introduced.

## 4. Content

The page is organized into eleven sections, each with a stable `id` used as
the TOC anchor. Every section is sourced from the i18n dictionary so the page
follows the app language toggle. Section headings and body text are localized;
inline code and command names are not translated.

1. **Platform overview** — what Web Curl is (single-user HTTP debugging tool),
   where data lives (browser IndexedDB), and that the server is a stateless
   same-origin executor.
2. **Collections, folders, and requests** — organizing requests in a tree;
   create, rename, move, copy, and delete.
3. **Building a request** — HTTP method, URL, query parameters, headers, and
   the body types (none / text / JSON / form-urlencoded).
4. **Pre-request scripts** — JavaScript run in the QuickJS sandbox, the
   `pm.globals` / `pm.environment` / `pm.request` surface, and the
   collection → folder (outermost → innermost) → request execution order.
5. **Environments and variables** — globals vs. environments, the active
   environment, and `{{variable}}` substitution with unresolved-variable
   warnings.
6. **Sending and inspecting a response** — send / cancel, status / duration /
   size, headers, pretty vs. raw body, and copying the equivalent curl command.
7. **Importing from curl** — pasting a curl command to create a request.
8. **Workspace import / export** — JSON backup and restore.
9. **History** — per-request runs, replay, and clearing.
10. **Settings** — timeout, redirects, pretty-print default, line wrapping,
    render cap, and resetting the workspace.
11. **Keyboard shortcuts** — send, save, and cancel.

The content is descriptive and grounded in actual current behavior; it must
not advertise features that do not exist.

## 5. Component and file changes

New file:

- `src/client/components/DocsPage.tsx` — the docs view component. It renders
  the header/back button, the TOC, and the section list. It derives all text
  from `useTranslation()`.

Modified files:

- `src/client/App.tsx` — add `docsOpen` state and open/close callbacks; pass
  them to `AppShell`.
- `src/client/components/AppShell.tsx` — accept and render `DocsPage` when
  docs are open.
- `src/client/components/TopToolbar.tsx` — add the `ReadOutlined` entry button.
- `src/client/i18n.ts` — add `docs.*` message keys to both `zh` and `en`
  dictionaries.
- `src/client/app.css` — add docs page layout and TOC styles using existing
  tokens.

New test:

- `tests/client/docs-page.test.tsx` — renders the app, opens docs, asserts the
  title and a representative section are visible, and asserts the back button
  restores the request view.

The i18n message keys are grouped under `docs.` and mirror the existing
flat-key convention. Any change to the section list must update both language
dictionaries and the TOC order in the same commit.

## 6. Acceptance criteria

- `npm run typecheck`, `npm run lint`, and `npm run test` pass.
- The docs button is visible in the top toolbar with an accessible label.
- Clicking the button replaces the workspace with the docs page; the back
  button returns to the request view without losing editor state.
- The TOC anchors navigate to their sections.
- Content switches between Chinese and English with the language toggle, and
  respects light and dark themes.
- The docs page introduces the platform's main features accurately and does
  not mention unimplemented functionality.

## 7. Non-goals

- No router or new runtime dependency.
- No server-side or dynamic documentation source; content is static text in
  the i18n dictionary.
- No markdown rendering engine; the page is React + Ant Design components.
- No search, versioning, or analytics.
