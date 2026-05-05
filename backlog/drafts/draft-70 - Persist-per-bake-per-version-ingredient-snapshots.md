---
id: DRAFT-70
title: Persist per-bake + per-version ingredient snapshots
status: Draft
assignee: []
created_date: '2026-05-05 21:23'
labels:
  - ungroomed
  - schema
  - print
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problem

Print page (`/recipe/:id/print`) lets the user pick a bake or estimated cost from a dropdown. Cost values swap correctly, but ingredient amounts only loosely follow because they are derived from `cook_log[].cost.items[]` — a cost snapshot, not an ingredient snapshot.

Concrete failures observed on `jalapeno-cheddar-sourdough`:

- Bake 1 (2026-05-03) `cost.items[]` is missing `starter` entirely — print falls back to recipe default (110g) which may misrepresent the bake.
- `water` is never in cost items (zero-cost) — always falls back to recipe default in every bake.
- If a bake scaled water differently, there is no record.
- A version bump that changes ingredient amounts retroactively rewrites what historical bakes look like in the print view.

Root cause: there is no first-class ingredient record per bake or per version. Cost items leak ingredient data as a side effect of cost calculation, and zero-cost items are silently dropped.

## Proposed direction

Persist ingredient snapshots in two places:

### Per-version (canonical baseline)

Each `change_log[]` entry (or top-level recipe version block) carries a frozen full ingredient list — same shape as `stages[].gather.ingredients`, but flat and immutable for that version. This is the canonical "what the recipe says at vX.Y.Z."

### Per-bake (experimental deltas)

Each `cook_log[]` entry carries a full ingredient snapshot for that bake. Mirrors the version baseline by default, but can carry experimental values where the user changed amounts during the bake (e.g., -40g flour/water adjustment captured in bake_notes).

The bake snapshot is the source of truth for what was actually baked. The version snapshot is the source of truth for the recipe at that version.

### Print page consumption

- Selecting a bake → render bake snapshot.
- Selecting estimated → render version baseline (or top-level gather).
- Cost remains a cost concern; ingredient list reads from snapshots, not from cost.items.

## Open design questions

1. Schema shape — flat ingredient list per snapshot, or preserve stage grouping (`{ stageId, ingredients[] }[]`)?
2. Backfill strategy — synthesize snapshots for existing recipes/bakes from current `gather` + `cost.items`? Or leave historical bakes uncovered until user retroactively fills them in?
3. Authoring UX — when does the bake snapshot get written? At bake start (capture version baseline)? At bake log time (capture user's recall + scratchpad notes)?
4. Migration — version bumps to ingredient amounts are common; need clear rules for whether existing cook_log entries auto-update their snapshot or stay frozen.
5. Relationship to `scaling` block — if a bake records `multiplier`, does the snapshot store post-scaling absolutes or pre-scaling base + multiplier?

## Source

Captured during 2026-05-05 jalapeno-cheddar-sourdough print page bug investigation. User confirmed flour=550g across both bakes, but flagged that the print view's per-bake fallback to recipe defaults masks an underlying design gap. User intent: per-bake snapshots are primary; per-version snapshots replicate exact information so bake logs can carry experimental deltas from the version baseline.

## Related

- Draft fix in `RecipePrintView.vue:74` overrides ingredient amounts from `selectedCostSource.items[]` when present — interim improvement, does not solve the core gap.
- DRAFT-69 (v2.0.0 workflow rework) may interact with this — version bump + ingredient changes should land together.
- F26+F27 (print validation) — once snapshots exist, add a check that every bake on the print page has a matching ingredient snapshot.
<!-- SECTION:DESCRIPTION:END -->
