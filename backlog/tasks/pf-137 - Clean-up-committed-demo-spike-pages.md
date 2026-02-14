---
id: PF-137
title: Clean up committed demo/spike pages
status: Done
assignee: []
created_date: '2026-02-14 03:57'
updated_date: '2026-02-14 21:16'
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
- [x] #1 Each demo tree audited by subagent — parent task status verified, component cross-references checked, removal verdict documented in task notes
- [x] #2 Demos with all-Done ancestors removed — routes deleted from router/index.ts, components deleted, no dead imports
- [x] #3 Demos with In Progress ancestors kept — documented reason in task notes for each retained demo
- [x] #4 Backlog sync issues reported — any task marked Done that still has demo artifacts flagged as a finding (task ID + what's stale)
- [x] #5 If sync issues found, parent tasks re-opened or annotated with cleanup note
- [x] #6 npm run build passes after cleanup
- [x] #7 No /demo/* routes remain in router for completed task trees
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Cleanup Results (2026-02-14)

### Removed (parent Done)
- `DemoFavicon.vue` + `/demo/favicon` route (PF-135 Done)
- `DemoBakeDetail.vue` + `/demo/bake-detail`, `/demo/bake-detail/route-view` routes (PF-130 Done)
- Related imports in App.vue and test mocks in App.spec.ts

### Kept (parent In Progress)
- `DemoQrTest.vue`, `DemoSharedMode.vue`, `DemoQrPrintTest.vue` + 3 routes (PF-128 In Progress)

### Backlog Sync Issues
None found. All Done-status tasks had artifacts cleaned; In Progress tasks retain theirs.

### Files Modified
- `src/router/index.ts` — removed 3 routes
- `src/App.vue` — removed 2 imports, 2 template branches
- `src/App.spec.ts` — removed mock, test route, test case

### Files Deleted
- `src/components/DemoFavicon.vue`
- `src/components/DemoBakeDetail.vue`

Build passes (671 tests, 0 type errors).
<!-- SECTION:NOTES:END -->
