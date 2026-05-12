---
id: DRAFT-80
title: Backfill throughput time fields on all 26 recipes (PF-255.3)
status: Draft
assignee: []
created_date: '2026-05-12 13:10'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spawned from PF-255.6 spike audit.

Add and populate 4 new RecipeMeta fields on every recipe in public/recipes/:
- meta.prep_active_min (number) — hands-on time
- meta.proof_passive_min (number) — fermentation/rise time (timer: true states in proof stages)
- meta.oven_occupancy_min (number) — preheat + bake duration
- meta.bake_min (number) — bake only

BLOCKED ON: PF-255.3 must land the RecipeMeta schema extension first (src/types/recipe.ts).

Seed strategy:
- bake_min — sum duration_min of states whose direction mentions 'bake' or whose stage id contains 'bake'; cross-check against parenthetical in meta.total_time
- oven_occupancy_min — bake_min + preheat duration
- proof_passive_min — sum duration_min of states with timer: true and stage id matching bulk|proof|rise|retard|rest|ferment
- prep_active_min — sum duration_min of states with timer: false; sanity-check against active-time figure already in meta.total_time strings (most recipes record this parenthetically)

Affected: 26 / 26 recipes (universal gap).

Notes:
- Seed values are estimates. First bake's bake_stats.bake_phases[] gives actuals — backfill must NOT overwrite once real bake data exists.
- Audit detail: backlog/tasks/pf-255.6-spike-notes.md section 2A.

Priority: Blocker for PF-255.1 slice once schema lands.
<!-- SECTION:DESCRIPTION:END -->
