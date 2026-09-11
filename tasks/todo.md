# Web Curl Task Checklist

Implementation plan: [2026-09-11-web-curl-implementation.md](../docs/superpowers/plans/2026-09-11-web-curl-implementation.md)

## Phase 1: Foundation

- [ ] Task 1: Scaffold the TypeScript application
- [ ] Task 2: Define shared contracts and Fastify application boundaries
- [ ] Checkpoint: Foundation tests, typecheck, and build pass

## Phase 2: Core Execution

- [ ] Task 3: Implement the stateless HTTP execution service
- [ ] Task 4: Add IndexedDB persistence and workspace seed data
- [ ] Task 5: Implement variable substitution and the restricted script runner
- [ ] Checkpoint: API, persistence, and script tests pass

## Phase 3: User Workflow

- [ ] Task 6: Build the developer tool UI shell
- [ ] Task 7: Implement request editing components
- [ ] Task 8: Connect execution, responses, history, import, and export
- [ ] Checkpoint: Browser can edit, send, inspect, and restore a request

## Phase 4: Deployment and Release

- [ ] Task 9: Add static hosting and Linux deployment
- [ ] Task 10: Browser end-to-end verification and final hardening
- [ ] Checkpoint: Full verification passes and worktree is clean
