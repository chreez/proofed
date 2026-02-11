---
id: PF-72
title: Fix permalink scroll-to-hash on page load
status: Done
assignee: []
created_date: '2026-02-08 01:18'
updated_date: '2026-02-08 09:21'
labels:
  - bug
dependencies: []
references:
  - 'https://github.com/chreez/proofed/issues/1'
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue #1. Navigating directly to a hash URL (e.g., /recipe/atk-cinnamon-buns-ultimate#stage-prep) doesn't scroll to the section. Root cause: router scrollBehavior returns { top: 0 } before recipe JSON loads, so hash target doesn't exist yet. The watcher in App.vue:143-164 fires after recipe loads but the router already scrolled to top. TOC navigation works because recipe is already loaded when user clicks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Navigating to hash URL on cold load scrolls to target section after recipe DOM mounts
- [x] #2 Works for all section types: stages (#stage-prep), cook log (#cook-log-section), version history (#version-history-section), nutrition (#nutrition-section)
- [x] #3 Collapsed stages auto-expand before scroll when targeted by hash
- [x] #4 Router scrollBehavior does not race against recipe load — scroll waits for DOM
- [x] #5 Existing TOC navigation (click-based) continues to work unchanged
- [x] #6 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Investigation Findings\n\n### Current Implementation (App.vue:143-164)\n- Watcher on `currentRecipe` with `{ once: true }` — fires after recipe loads\n- Extracts hash from `window.location.hash`\n- Auto-expands collapsed stages via `progress.value.toggleStageCollapse()`\n- Uses nested `nextTick()` + `scrollIntoView({ behavior: 'smooth', block: 'start' })`\n\n### Root Cause\n- Router `scrollBehavior()` returns `{ top: 0 }` (src/router/index.ts:11-13)\n- This fires BEFORE recipe JSON loads → hash target doesn't exist yet\n- Watcher fires after load but browser already scrolled to top\n\n### ID Map\n- `#stage-{stageId}` → App.vue:339\n- `#nutrition-section` → App.vue:351\n- `#cook-log-section` → App.vue:359\n- `#version-history-section` → App.vue:367\n\n### Fix Direction\n- Option: Make router `scrollBehavior` hash-aware — return `false` when hash present, let watcher handle it\n- Option: Remove `{ top: 0 }` default, use explicit scroll in route watcher"
</invoke>
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Fix: Permalink scroll-to-hash on page load (PF-72)

### Problem
Navigating directly to a hash URL (e.g., `/recipe/atk-cinnamon-buns-ultimate#stage-prep`) didn't scroll to the target section. The router's `scrollBehavior()` returned `{ top: 0 }` before the recipe JSON loaded, so the hash target element didn't exist in the DOM yet. By the time the App.vue watcher fired after recipe load, the browser had already scrolled to top.

### Fix
Modified `scrollBehavior()` in `src/router/index.ts` to return `false` when a hash is present in the route. This prevents the router from racing against recipe load — the scroll-to-top no longer fires before the DOM is ready. The existing watcher in `src/App.vue` (lines 144-166) already correctly handles hash scrolling after recipe data loads, including auto-expanding collapsed stages.

### Files Changed
- `src/router/index.ts` — Made `scrollBehavior` hash-aware: returns `false` for hash routes, `{ top: 0 }` otherwise

### Verification
- All 387 tests pass
- Type-check clean
- Build succeeds
<!-- SECTION:FINAL_SUMMARY:END -->
