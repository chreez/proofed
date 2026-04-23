---
id: PF-221
title: Cost source dropdown — swap between estimated and per-bake cost
status: Done
assignee: []
created_date: '2026-04-23 19:05'
labels:
  - feature
  - cost
dependencies:
  - PF-214
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Screen-only dropdown on print page to swap cost source between estimatedCost (PF-214) and per-bake cost snapshots. Changing source updates all cost-derived values on the printout: breakdown table, totals, and per-serving cost. Default selection = freshest by timestamp. Dropdown hidden in `@media print`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dropdown on print page lists available cost sources: estimatedCost + each bake with `cost.items[]`
- [x] #2 Each option labeled with source type and date (e.g., "Estimated — Apr 23, 2026", "Bake — Apr 17, 2026")
- [x] #3 Default selection = freshest timestamp (compare `estimatedCost.estimatedAt` vs bake `cost` dates)
- [x] #4 Swapping source reactively updates cost breakdown table, total cost, and per-serving cost everywhere on print page
- [x] #5 Dropdown is screen-only — hidden in `@media print` output
- [x] #6 If only one cost source exists (e.g., only estimatedCost, no bakes), dropdown still renders but with single option (no empty state)
- [x] #7 If no cost data exists at all (no estimatedCost, no bake cost), cost section shows placeholder — no dropdown
<!-- AC:END -->
