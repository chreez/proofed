---
id: PF-190
title: 'Dev server: error on port collision instead of silent fallback'
status: Done
assignee: []
created_date: '2026-04-09 17:03'
updated_date: '2026-04-09 17:50'
labels:
  - dx
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When port 6811 is already in use, Vite silently falls back to the next available port. This causes confusion — agents and humans expect the dev server at a fixed port, and a second instance running on 6812 can lead to testing against stale builds or wrong instances.

## Fix
Set `server.strictPort: true` in `vite.config.ts`. Vite will error out with EADDRINUSE instead of silently picking another port.

## Context
- `vite.config.ts` has `server: { host: true }` but no `strictPort`
- `package.json` scripts use `--port 6811`
- Only one proofed instance should run per host. Multiple instances = sandbox or gate review steps.
- Quick one-line fix in vite config.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Set `server.strictPort: true` in vite.config.ts
- [x] #2 Dev server errors out with a clear message when port 6811 is already in use (no silent fallback to next port)
- [x] #3 Verify: start dev server, then start a second instance — second instance must fail with port-in-use error
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Subagent complete: added `strictPort: true` to vite.config.ts server config. Build passes (1397 tests, type-check clean). One-line change, no visual gate.
<!-- SECTION:NOTES:END -->
