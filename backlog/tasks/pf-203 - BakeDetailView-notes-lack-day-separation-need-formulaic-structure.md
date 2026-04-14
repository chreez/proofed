---
id: PF-203
title: 'BakeDetailView: notes lack day separation, need formulaic structure'
status: Done
assignee: []
created_date: '2026-04-10 18:02'
updated_date: '2026-04-12 17:47'
labels:
  - ux
dependencies: []
references:
  - src/components/BakeDetailView.vue
  - src/types/recipe.ts
  - public/recipes/simple-sourdough.json
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From bake 15 (2026-04-10) review:

Notes section renders as a flat bullet list with no logical separation between days. For multi-day bakes (mix day 1, bake day 2), the notes run together and are confusing to read.

Should have a more formulaic, consistent structure — e.g., day headers, chronological grouping, or visual separators between bake phases/days. The current approach relies on the user embedding timestamps in note text, but the rendering doesn't leverage those for structure.

Reference bake: simple-sourdough 2026-04-10 (15 notes spanning Apr 9 mix → Apr 10 bake)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A `KeyNote` interface is added to `src/types/recipe.ts` with fields `text: string` and `timestamp?: string` (ISO 8601 datetime). `CookLogEntry.key_notes` type changes from `string[]` to `KeyNote[]`.
- [ ] #2 All existing `key_notes` entries in `public/recipes/simple-sourdough.json` (13 bakes) are migrated from plain strings to `{ text, timestamp }` objects. Timestamps sourced from corresponding `raw_notes` scratchpad entries — provenance from original capture data.
- [ ] #3 `BakeDetailView` renders key_notes grouped under day headers when `start_date` differs from `date`. Day header format matches project date display convention (e.g., "Apr 9" / "Apr 10"). Single-day bakes render notes without day headers.
- [ ] #4 Day assignment uses each key_note's `timestamp` field — notes grouped by calendar date (local time). Notes without timestamps render in the final group.
- [ ] #5 `keyNotesList()` and `renderNotes()` functions in `BakeDetailView.vue` updated to handle the new `KeyNote` object shape.
- [ ] #6 Fallback path (`notes[]` when `key_notes` is absent) continues to render as flat list with no day grouping — no changes to raw notes display.
- [ ] #7 The `/bake-log` skill's capture pipeline writes `key_notes` as `KeyNote[]` objects (with timestamps from scratchpad data) going forward.
- [ ] #8 `npm run build` passes (vitest + vue-tsc + vite build).
<!-- AC:END -->
