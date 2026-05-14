---
id: PF-271
title: Observed step times + granular worker assignment
status: To Do
assignee: []
created_date: '2026-05-12'
updated_date: '2026-05-14 20:31'
labels:
  - bakery-ops
  - data
  - scheduler
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255 rework clarify loop (2026-05-12).

Two coupled ideas:

1. **Observed step times** — collect actual real-world durations per cognitive step (per `state` in the recipe state machine). Build a dataset of averages across bakes so estimates stop being agent-guessed and start being empirical. Each cook_log entry contributes timing observations; scheduler uses the empirical mean (with confidence interval) rather than the recipe author's a-priori estimate.

2. **Per-step worker capacity + granular assignment** — finer than DRAFT-92's per-bake baker assignment. Each state can declare a worker capacity (e.g., "turning out dough = 1 person", "cutting + scaling = up to 2 in parallel"). User assigns specific people to specific states at their leisure.

Together: the system learns the real time each step takes, and lets the user distribute the work in detail.

Touches:
- `RecipeState` schema: add `worker_capacity?: number` (default 1), maybe `parallelizable?: boolean`
- New `step_observations` field on cook_log entries (or new top-level dataset): `{ stateId, actualMin, observedAt, baker? }`
- Scheduler: per-state assignment UI, not just per-bake
- Stats: per-state running mean + stddev across recipes

Relationship to other drafts:
- Extends DRAFT-92 (multi-baker) with finer granularity
- Feeds DRAFT-83 (timing backfill) with empirical data over time, displacing the heuristic
- Adjacent to DRAFT-93 (passive batching) — granular per-state windows make batch-fit math more accurate
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Design doc exists at backlog/tasks/pf-271-design-notes.md, referenced from this task, splits scope into Part A (observation collection + aggregation) and Part B (per-state worker capacity + granular assignment) so they can ship as separate slices.
- [ ] #2 Doc specifies StateObservation shape — { stateId, actualMin, observedAt (ISO 8601), baker?, source: 'manual'|'auto'|'estimated' } — and where it lives (per cook_log entry as step_observations[] vs top-level dataset). Storage decision is documented with rationale.
- [ ] #3 Doc specifies StateAggregate shape per (recipeId, stateId): { n, meanMin, stddevMin, confidence: 'high'|'medium'|'low', lastObservedAt } and the aggregation thresholds (proposed: n<3 → low, 3-9 → medium, ≥10 → high; reuses the existing Confidence ladder from src/types/recipe.ts:138).
- [ ] #4 Doc specifies the capture flow: while cooking, user marks a state 'done' on the recipe page → timestamp captured → derives actualMin from previous state's done-time (or stage start). UX covers retro-fill, edit, and skip cases.
- [ ] #5 Doc specifies RecipeState schema additions — worker_capacity?: number (default 1) and parallelizable?: boolean — with field semantics, defaults, and where validation is enforced.
- [ ] #6 Doc covers scheduler consumption: empirical mean replaces RecipeMeta.prep_active_min / proof_passive_min / oven_occupancy_min / bake_min (PF-267) on a per-state basis when StateAggregate.confidence >= medium; otherwise scheduler falls back to the heuristic estimate. Replacement is gradual and per-state, not per-recipe.
- [ ] #7 Doc specifies how DRAFT-92 / PF-269 (multi-baker shift management) consumes worker_capacity + parallelizable to widen per-state baker assignment beyond the single-baker default.
- [ ] #8 Doc specifies provenance + confidence display rules on the recipe page: every timing estimate renders with its confidence badge and an 'estimated' vs 'observed (n=X)' label. Hard requirement of PF-256 — no naked agent estimates surface to the user once observations exist.
- [ ] #9 Doc enumerates open decisions and follow-up Drafts (≥1 per actionable finding). At minimum: one Draft for Part A (observation capture UI + aggregation), one for Part B (worker_capacity schema + scheduler), and one for the provenance display work.
- [ ] #10 User has signed off on the design doc.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design doc: backlog/tasks/pf-271-design-notes.md

Scope split into Part A (observation collection + aggregation) and Part B (per-state worker capacity + granular assignment). The two parts share schema but ship as separate slices — see §1 and §8 of the design doc.

Cross-refs:
- PF-269 — multi-baker shift management (per-bake assignment; PF-271 adds per-state granularity)
- PF-267 — agent-estimated meta.*_min fields (PF-271 replaces these per-state as observations accumulate, with PF-267 as the cold-start fallback)
- PF-270 — passive-time batching (consumes finer per-state windows)
- PF-256 — Bakery Ops Assistant (provenance/confidence display is a hard requirement here)
- DRAFT-94 — promoted source

Follow-up Drafts to spawn after user signoff (see §8 of design doc): six slices covering capture UI, aggregation, auto-backfill, worker_capacity schema, scheduler integration, and provenance display.
<!-- SECTION:NOTES:END -->
