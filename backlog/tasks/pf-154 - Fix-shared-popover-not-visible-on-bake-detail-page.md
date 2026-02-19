---
id: PF-154
title: Fix shared popover not visible on bake detail page
status: Done
assignee: []
created_date: '2026-02-19 03:43'
updated_date: '2026-02-19 04:03'
labels:
  - bug
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The shared mode popover (`?shared=true`) on bake detail pages is invisible because the `page-settle` animation wrapper in App.vue applies a CSS transform that creates a new containing block for `position: fixed`. The popover's `fixed inset-0` becomes relative to the 2828px content div instead of the viewport, centering the card off-screen at ~1414px down.

**Root cause:** `animation: page-settle 200ms ease-out both` — the `both` fill mode retains `transform: translateY(0)` (identity matrix) after animation, which breaks fixed positioning for all descendants.

**Fix:** Wrap the shared popover `<Transition>` in `<Teleport to="body">` in BakeDetailView.vue.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Shared popover renders centered in viewport on bake detail page with `?shared=true`
- [x] #2 Popover dismiss button works and removes `?shared=true` from URL
- [x] #3 Page-settle animation still works for bake detail content
- [x] #4 Build passes (npm run build)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed shared popover visibility by wrapping in `<Teleport to=\"body\">` to escape `page-settle` transform context. Redesigned popover with hero photo + gradient overlay title, \"I made this.\" greeting, truncate/expand reheat methods with reference links and agent attribution, scrollable content area with sticky footer. Added `reference?: string` to `ReheatMethod` type. All 981 tests pass, diff-coverage 88% branch.
<!-- SECTION:FINAL_SUMMARY:END -->
