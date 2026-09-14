# Web Curl Task Checklist

Implementation plan: [2026-09-11-web-curl-implementation.md](../docs/superpowers/plans/2026-09-11-web-curl-implementation.md)

## Phase 1: Foundation

- [x] Task 1: Scaffold the TypeScript application
- [x] Task 2: Define shared contracts and Fastify application boundaries
- [x] Checkpoint: Foundation tests, typecheck, and build pass

## Phase 2: Core Execution

- [x] Task 3: Implement the stateless HTTP execution service
- [x] Task 4: Add IndexedDB persistence and workspace seed data
- [x] Task 5: Implement variable substitution and the restricted script runner
- [x] Checkpoint: API, persistence, and script tests pass

## Phase 3: User Workflow

- [x] Task 6: Build the developer tool UI shell
- [x] Task 7: Implement request editing components
- [x] Task 8: Connect execution, responses, history, import, and export
- [x] Checkpoint: Browser can edit, send, inspect, and restore a request

## Phase 4: Deployment and Release

- [x] Task 9: Add static hosting and Linux deployment
- [x] Task 10: Browser end-to-end verification and final hardening
- [x] Checkpoint: Full verification passes and worktree is clean
