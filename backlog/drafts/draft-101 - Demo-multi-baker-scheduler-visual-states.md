---
id: DRAFT-101
title: 'Demo: multi-baker scheduler visual states'
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - bakery-ops
  - scheduler
  - demo
  - spike
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-269 design (§8 deferred visual decisions).

Build a static demo at `public/demo/multi-baker-scheduler.html` showing the multi-baker timeline visualization. Covers visual decisions deferred from the PF-269 design doc:

- Fragment block rendering when one bake has 3 active states assigned to 3 different bakers (single block with 3 sub-bars vs 3 separate linked blocks)
- Baker color palette (extend stone/crust tokens vs new tertiary palette)
- Density / lane scrolling when roster > 4 people
- Off-window assignment warning chip appearance
- Parallel-work indicator placement
- Per-baker lane stacking with the OVEN + PASSIVE bands

Pure static HTML, no real drag. Used for HITL review before any PF-269 implementation work begins.

Depends on: PF-269 user sign-off.
<!-- SECTION:DESCRIPTION:END -->
