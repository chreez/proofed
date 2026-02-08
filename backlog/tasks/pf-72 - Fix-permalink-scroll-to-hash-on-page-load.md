---
id: PF-72
title: Fix permalink scroll-to-hash on page load
status: To Do
assignee: []
created_date: '2026-02-08 01:18'
updated_date: '2026-02-08 01:37'
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
- [ ] #1 Navigating to hash URL on cold load scrolls to target section after recipe DOM mounts
- [ ] #2 Works for all section types: stages (#stage-prep), cook log (#cook-log-section), version history (#version-history-section), nutrition (#nutrition-section)
- [ ] #3 Collapsed stages auto-expand before scroll when targeted by hash
- [ ] #4 Router scrollBehavior does not race against recipe load — scroll waits for DOM
- [ ] #5 Existing TOC navigation (click-based) continues to work unchanged
- [ ] #6 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Investigation Findings\n\n### Current Implementation (App.vue:143-164)\n- Watcher on `currentRecipe` with `{ once: true }` — fires after recipe loads\n- Extracts hash from `window.location.hash`\n- Auto-expands collapsed stages via `progress.value.toggleStageCollapse()`\n- Uses nested `nextTick()` + `scrollIntoView({ behavior: 'smooth', block: 'start' })`\n\n### Root Cause\n- Router `scrollBehavior()` returns `{ top: 0 }` (src/router/index.ts:11-13)\n- This fires BEFORE recipe JSON loads → hash target doesn't exist yet\n- Watcher fires after load but browser already scrolled to top\n\n### ID Map\n- `#stage-{stageId}` → App.vue:339\n- `#nutrition-section` → App.vue:351\n- `#cook-log-section` → App.vue:359\n- `#version-history-section` → App.vue:367\n\n### Fix Direction\n- Option: Make router `scrollBehavior` hash-aware — return `false` when hash present, let watcher handle it\n- Option: Remove `{ top: 0 }` default, use explicit scroll in route watcher"
</invoke>
<!-- SECTION:NOTES:END -->
