---
id: PF-137
title: Clean up committed demo/spike pages
status: To Do
assignee: []
created_date: '2026-02-14 03:57'
updated_date: '2026-02-14 03:59'
labels:
  - cleanup
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
6 demo routes and 3 demo components were committed during spike subtasks but never removed after decisions landed. These are dev-time artifacts shipping in the production build.

Audit each demo tree via subagent delegation to determine removal safety and flag backlog sync issues (tasks marked Done but throwaway artifacts still in codebase).

**Demo Trees:**
1. **Favicon** — `DemoFavicon.vue` → PF-135.1 → PF-135 (Done)
2. **Bake Detail** — `DemoBakeDetail.vue` → DRAFT-6.1 → PF-130 (Done)
3. **QR/Share** — `DemoQrTest.vue` → PF-128.1 / PF-128.2 / PF-128 (In Progress)

**Inventory:**
| Demo Route | Component | Parent Task | Parent Status |
|------------|-----------|-------------|---------------|
| `/demo/favicon` | DemoFavicon.vue | PF-135 | Done |
| `/demo/bake-detail` | DemoBakeDetail.vue | PF-130 | Done |
| `/demo/bake-detail/route-view` | DemoBakeDetail.vue | PF-130 | Done |
| `/demo/shared-mode` | DemoQrTest.vue | PF-128.2 | Done (parent PF-128 In Progress) |
| `/demo/qr-test` | DemoQrTest.vue | PF-128.1 | Done (parent PF-128 In Progress) |
| `/demo/qr-print-test` | DemoQrTest.vue | PF-128 | In Progress |
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each demo tree audited by subagent — parent task status verified, component cross-references checked, removal verdict documented in task notes
- [ ] #2 Demos with all-Done ancestors removed — routes deleted from router/index.ts, components deleted, no dead imports
- [ ] #3 Demos with In Progress ancestors kept — documented reason in task notes for each retained demo
- [ ] #4 Backlog sync issues reported — any task marked Done that still has demo artifacts flagged as a finding (task ID + what's stale)
- [ ] #5 If sync issues found, parent tasks re-opened or annotated with cleanup note
- [ ] #6 npm run build passes after cleanup
- [ ] #7 No /demo/* routes remain in router for completed task trees
<!-- AC:END -->
