---
id: PF-167
title: Agent-friendly dev server lifecycle
status: To Do
assignee: []
created_date: '2026-03-12 03:22'
labels:
  - dx
  - agent-workflow
dependencies: []
references:
  - vite.config.ts
  - package.json
  - src/composables/useClipboard.ts
  - CLAUDE.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When an agent needs to show the user something in the browser (HITL review, bake log page, styling approval), the current process is fragile: npm run dev binds to localhost only (unreachable from iPhone), the LAN IP changes with DHCP so hardcoded references go stale, and there's no startup/shutdown discipline — agents manually check ports, start the server, and forget to kill it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 npm run dev binds to 0.0.0.0 (all interfaces) by default — no manual --host needed
- [ ] #2 On startup, the dev server detects the current LAN IP (ipconfig getifaddr en0 or equivalent) and prints it to stdout in a parseable format
- [ ] #3 Stale hardcoded IP reference in useClipboard.ts:3 is updated to be generic (no specific IP)
- [ ] #4 Agent-facing CLAUDE.md instructions updated: use runtime IP detection, not a hardcoded address
- [ ] #5 If port 5173 is occupied, Vite's default port-increment behavior is preserved and the actual port is included in the printed URL
<!-- AC:END -->
