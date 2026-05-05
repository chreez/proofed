---
id: DRAFT-71
title: >-
  Photo review pipeline — v1 inherits attributes, v0 auto-excluded, editPresets
  reset
status: Draft
assignee: []
created_date: '2026-05-05 21:41'
labels:
  - ungroomed
  - ux
  - photo-pipeline
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

Captured during 2026-05-05 jalapeño-cheddar-sourdough bake-log session. After agent applied vision-guided `cropTighten` edits and produced v1 versions of 10 photos, user observed that the manifest now contains both v0 and v1 entries side-by-side in the review page, with no automatic supersession. User then articulated the desired pipeline behavior.

## Desired Behavior

When a new edited version (e.g. v1 from cropTighten) is created, the **bake review page** should re-open with all photos and apply these rules:

1. **Auto-reopen** — the review page (`/review/bake/{recipeId}/{date}`) re-loads after the edit pass so the user sees the updated state.
2. **v1 inherits non-edit attributes from v0** — when a new version is created, automatically copy these fields from the source version to the new version:
   - `summary`
   - `notes`
   - `usage` (`hero` / `step` / `process`)
3. **v0 auto-flagged `usage.exclude: true`** — the original is left visible in the review UI but marked excluded so it does NOT appear in the cook_log `photos[]` export. User can toggle exclude back off if they want to keep both versions.
4. **v1 `editPresets` reset to all-false** — so the same preset doesn't re-trigger on the next edit pass. (User can request a v2 by checking a new preset.)
5. **v1 `editInstruction` reset to empty** — the prior instruction belongs to the prior edit; a new instruction starts a new version chain.
6. **Loop closes when ready** — if the next "Copy review data" export contains no `editPresets: true`, the round-trip is finalized; agent wires photos into cook_log.

## Why

The user just hit this manually: had to re-tag `usage.process: true` on every v1 photo, re-set `usage.exclude: true` on every v0 (or accept v0 stayed visible by default). Tedious and error-prone. One photo in this session (`img-7482-frame-003`) ended up with v0 still tagged `step+process` and v1 untagged because user forgot to transfer flags — agent had to apply the inheritance rule manually when wiring cook_log.

## Open UI Decisions (for grooming)

- **"View original" toggle** — keep an affordance to A/B compare v0 vs v1 before the user commits to the edit? Or always show v1 once it exists?
- **Preset checkbox state on edited photo** — disabled? Greyed-checked with "applied" badge? Hidden behind a "request another edit" expander?
- **Multiple version chains** — what happens if user requests v2 (a different preset on top of v1)? Does v1 then inherit `exclude: true` automatically? (Recursive supersession rule, or only v0 → latest direct.)

## Acceptance Criteria (to be groomed)

This is a Draft. Grooming should:
1. Decide where the inheritance happens — in `BakeReviewPage.vue` on manifest load, or in `scripts/edit-photo.ts` when writing the new version, or both
2. Confirm "exclude" is the right semantic flag (vs adding a separate `superseded: true`)
3. Lock the UI affordance for the edited photo's preset checkboxes
4. Decide multi-generation chain behavior (v0 → v1 → v2)
5. Write agent-verifiable ACs against the BakeReviewPage component + manifest schema

## References

- This bake's review export: 33 photos, 10 cropTighten-flagged, produced 10 v1 versions
- `manifest.json` — already supports `versions[]` per photo
- `BakeReviewPage.vue` — currently lists v0 and v1 as separate top-level entries with no supersession logic
- `scripts/edit-photo.ts` — where v1 gets written; doesn't currently propagate any review-page state
<!-- SECTION:DESCRIPTION:END -->
