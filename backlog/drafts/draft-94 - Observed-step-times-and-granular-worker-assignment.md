---
id: DRAFT-94
title: Observed step times + granular worker assignment
status: Draft
assignee: []
created_date: '2026-05-12'
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
