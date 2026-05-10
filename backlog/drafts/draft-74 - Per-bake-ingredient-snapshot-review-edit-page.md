---
id: DRAFT-74
title: Per-bake ingredient snapshot review/edit page
status: Draft
assignee: []
created_date: '2026-05-10 02:53'
labels:
  - ux
  - snapshot
  - backfill
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

PF-237 HITL revealed gap: sync script clones version baseline into every cook_log[].ingredients snapshot but cannot infer deltas from prose notes. The 2026-05-07 jalapeno-cheddar bake had \"~400g cheddar\" in notes (Gemma overshot by ~180g) but the print page showed the cloned 220g baseline. User had to manually patch the JSON.

PF-237 AC #8 covers FUTURE bakes via /bake-log skill prompt for ingredient deltas. This draft covers HISTORICAL bakes that were logged before PF-237 shipped.

## Problem

No UI to review or edit cook_log[].ingredients snapshots after the bake is logged. Manual JSON editing is error-prone (D6 breakdown sum, schema shape, file size).

## Desired behavior

A review/edit page at /review/snapshot/{recipeId}/{date} mirroring the photo review UX:
1. Render the cook_log[].ingredients snapshot in editable form
2. Show diff against change_log[].ingredients (the version baseline) — visually highlight deltas
3. Allow per-ingredient amount override + breakdown clear
4. Persist edits via export-to-clipboard JSON (same pattern as photo review) OR write directly back to recipe JSON via dev-only file write
5. Optionally surface bake_notes side-by-side so the user can transcribe deltas while reviewing notes

## Out of scope

- Auto-inference from prose (rejected per AC #6 of PF-237)
- Schema migration (snapshots are already in place from PF-237)

## Open Qs (for grooming)

1. Same export-to-clipboard pattern as /review/bake/, or direct file write in dev?
2. Should the review surface deltas only, or full ingredient list?
3. Where does the entry point live — bake detail page \"Edit snapshot\" link?
4. Validation feedback inline (D6 breakdown sum)?

## References

- PF-237 (just shipped) — AC #6 sync script clones baseline; AC #8 /bake-log catches future deltas
- BakeReviewPage.vue (photo review) — pattern to mirror
<!-- SECTION:DESCRIPTION:END -->
