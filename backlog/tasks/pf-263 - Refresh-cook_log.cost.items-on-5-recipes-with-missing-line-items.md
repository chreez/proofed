---
id: PF-263
title: 'Refresh cook_log[].cost.items[] on 5 recipes with missing line-items'
status: To Do
assignee: []
created_date: '2026-05-12 13:11'
updated_date: '2026-05-14 19:55'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spawned from PF-255.6 spike audit.

Run /cost skill against the most-recent cook_log entry on these 5 recipes — their last bake either has no cost.items[] array or it is empty:
- birote-salado (has cost.total only)
- gochujang-garlic-buns (has cost.total only)
- ny-style-pizza (missing BOTH cost.items AND cost.total — entry has no cost data)
- simple-sourdough-wheat (has cost.total only)
- sourdough-cinnamon-buns (has cost.total only)

Special case: ny-style-pizza needs full cost reconstruction (no aggregate total either).

Sources: current HEB pricing + pantry rates (cost-rates.json).

Why needed: PF-255 pricing UI will fall back to estimatedCost block when cook_log cost data is sparse — but cost-history charting and per-bake spend comparison need line-items on recent bakes.

Audit detail: backlog/tasks/pf-255.6-spike-notes.md section 2D.

Priority: Medium.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Identify the 5 (or actual count) recipes whose most-recent cook_log[].cost.items[] is missing/empty, verified against current JSON state
- [ ] #2 Each addressed recipe's most-recent cook_log[] cost block uses canonical CookLogCost shape: {total, perServing, servings, items[]} with each item shaped as CookLogCostItem ({ingredientId, name, sourceType, sourceName, amount, unit, cost})
- [ ] #3 Every cost.items[] entry has non-empty sourceName (PV7)
- [ ] #4 cost.total equals sum of cost.items[].cost (rounded 2dp); cost.perServing equals total / servings; cost.servings populated
- [ ] #5 HEB-sourced pricing preferred when available; pantry/manual fallbacks documented in change_log summary
- [ ] #6 Each addressed recipe gets a minor version bump with new change_log[] entry including PF-237 ingredients snapshot
- [ ] #7 scripts/sync-ingredient-snapshots.ts run, cook_log[].ingredients snapshots present on the touched entries
- [ ] #8 npm run build passes (BV1-BV3)
- [ ] #9 Files staged but NOT committed; PF-262 recipes not double-touched
<!-- AC:END -->
