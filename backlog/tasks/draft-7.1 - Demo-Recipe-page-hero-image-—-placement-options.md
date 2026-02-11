---
id: DRAFT-7.1
title: 'Demo: Recipe page hero image — placement options'
status: Done
assignee: []
created_date: '2026-02-11 09:52'
updated_date: '2026-02-11 12:16'
labels:
  - spike
  - demo
dependencies: []
parent_task_id: DRAFT-7
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Throwaway demo page showing 3 placement options side-by-side for the latest bake's hero image on the recipe detail page:

1. **Header banner** — full-width hero above recipe title/meta
2. **Below title** — hero sits between header info and first stage, like a featured photo
3. **Sidebar/aside** — hero in a fixed position alongside content (desktop), above content (mobile)

Use ATK Cinnamon Buns as the test recipe (has multiple bakes with photos). Each option should show the real hero image at realistic dimensions so the user can evaluate visual weight and flow. Include the no-photo fallback state for comparison.

This is disposable code — not production. Just enough to evaluate visually.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Demo page renders all 3 placement options with real recipe data
- [x] #2 Each option uses the actual latest bake hero photo from ATK Cinnamon Buns
- [x] #3 No-photo fallback state shown for at least one option
- [x] #4 User picks a direction — chosen approach documented in DRAFT-7 notes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Demo spike complete. User reviewed 3 placement options (header banner, below title, sidebar) on a dedicated demo page, then compared A vs B in the real recipe page with a live toggle. **Chosen: Option A — Header Banner** (full-width hero above recipe title/meta with gradient overlay). Demo code cleaned up — all throwaway code removed. Decision documented in DRAFT-7 implementation notes.
<!-- SECTION:FINAL_SUMMARY:END -->
