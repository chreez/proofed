---
id: DRAFT-15
title: Clean up committed demo/spike pages
status: Draft
assignee: []
created_date: '2026-02-14 03:57'
labels:
  - cleanup
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
6 demo routes and 3 demo components were committed during spike subtasks but never removed after decisions landed. These are dev-time artifacts shipping in the production build.

**Inventory:**
| Demo Route | Component | Parent Task | Parent Status |
|------------|-----------|-------------|---------------|
| `/demo/favicon` | DemoFavicon.vue | PF-135 | Done |
| `/demo/bake-detail` | DemoBakeDetail.vue | PF-130 | Done |
| `/demo/bake-detail/route-view` | DemoBakeDetail.vue | PF-130 | Done |
| `/demo/shared-mode` | DemoQrTest.vue | PF-128.2 | Done (parent PF-128 In Progress) |
| `/demo/qr-test` | DemoQrTest.vue | PF-128.1 | Done (parent PF-128 In Progress) |
| `/demo/qr-print-test` | DemoQrTest.vue | PF-128 | In Progress |

**Rule:** Remove if parent task is Done. Keep if parent (PF-128) is still In Progress and demo serves as active reference. Re-audit PF-128 demos when PF-128 completes.
<!-- SECTION:DESCRIPTION:END -->
