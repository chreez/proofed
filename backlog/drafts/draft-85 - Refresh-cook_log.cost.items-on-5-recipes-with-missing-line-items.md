---
id: DRAFT-85
title: 'Refresh cook_log[].cost.items[] on 5 recipes with missing line-items'
status: Draft
assignee: []
created_date: '2026-05-12 13:11'
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
