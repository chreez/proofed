---
id: PF-237
title: Persist per-bake + per-version ingredient snapshots
status: Done
assignee: []
created_date: '2026-05-05 21:23'
updated_date: '2026-05-10 02:55'
labels:
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New schema field: change_log[].ingredients?: { stageId: string, stageName: string, ingredients: Ingredient[] }[] mirroring stages[].gather.ingredients shape (Ingredient type unchanged)
- [ ] #2 New schema field: cook_log[].ingredients?: { stageId: string, stageName: string, ingredients: Ingredient[] }[] (same shape as version snapshot); amounts are absolute grams post-multiplier
- [ ] #3 Both fields documented in src/types/recipe.ts with comments stating 'frozen at write time; never auto-mutated by later version bumps'
- [ ] #4 RecipePrintView.vue ingredientsByStage reads from cook_log[].ingredients when a bake is selected, change_log[].ingredients when 'Estimated' is selected; falls back to stages[].gather.ingredients only when neither snapshot is present
- [ ] #5 RecipePrintView.vue no longer maps cost.items[] amounts over gather amounts; cost.items remains as cost data only (still drives cost summary, no longer drives ingredient amounts)
- [ ] #6 One-shot synthesis script (scripts/sync-ingredient-snapshots.ts) backfills every recipe in public/recipes/: writes change_log[].ingredients for each version (frozen copy of current gather grouped by stage) and cook_log[].ingredients for each bake (clone of that bake's version baseline; no deltas inferred)
- [ ] #7 Synthesis script is idempotent: re-running on a recipe whose snapshots already exist must not modify them; only fills missing snapshots
- [ ] #8 /bake-log skill writes cook_log[].ingredients on cook_log entry creation: defaults to clone of the selected version's change_log[].ingredients; if scratchpad or bake_notes contain ingredient deltas (e.g. '-40g flour'), skill surfaces a confirmation prompt and records the delta in the snapshot
- [ ] #9 Validation rule (new F-series check): every cook_log entry must have a matching ingredients[] snapshot; print validation flags missing snapshot per bake
- [ ] #10 Validation rule: every change_log entry must have a matching ingredients[] snapshot
- [ ] #11 Sum check (extension of D6): for each snapshot ingredient, breakdown amounts (when present) sum to total ±2g
- [ ] #12 Component test on RecipePrintView verifies: with a bake selected and cook_log[].ingredients present, rendered ingredient amounts equal the snapshot (NOT cost.items[], NOT gather defaults)
- [ ] #13 Component test verifies: with 'Estimated' selected, rendered ingredient amounts equal change_log[].ingredients for the matching version
- [ ] #14 Backward compat: recipes without ingredients[] snapshots continue to render via gather fallback (no print regression for unmigrated recipes); both new fields are optional in the type
- [ ] #15 Schema docs in CLAUDE.md updated to describe the new snapshot fields and the authoring rules (when written, by whom, never auto-mutated)
<!-- AC:END -->
