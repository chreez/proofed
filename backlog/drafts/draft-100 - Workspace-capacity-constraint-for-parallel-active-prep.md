---
id: DRAFT-100
title: Workspace capacity constraint for parallel active prep
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - bakery-ops
  - scheduler
  - constraint
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-269 design (§4.4 soft constraint #3, §10 future direction, §11 out-of-scope v1).

Multi-baker scheduler (PF-269) treats two bakers doing simultaneous active prep as soft-allowed — a 'parallel work' indicator shows but the drop succeeds. Real kitchens have hard workspace caps (one bench, one mixer, one shaper). This draft captures the follow-up to gate parallel-prep with a workspace_capacity constraint.

Scope flags:
- Per-profile workspace_capacity field (default 1 = single counter)
- Hard refusal when N concurrent active states > workspace_capacity
- Per-state workspace footprint declaration (mixing = 1 counter, shaping = 1 counter, glazing = 0 — done at the bake itself)
- Interaction with DRAFT-94 worker_capacity (a state needing 2 workers also needs 2 counter slots? Probably yes — same slot, two hands.)

Depends on: PF-269 ships.
<!-- SECTION:DESCRIPTION:END -->
