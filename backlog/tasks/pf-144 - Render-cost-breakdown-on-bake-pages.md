---
id: PF-144
title: Render cost breakdown on bake pages
status: To Do
assignee: []
created_date: '2026-02-17 04:02'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a cook_log entry has `cost` data, display it in both bake views. Full breakdown on the dedicated bake page, one-liner on the recipe page cards.

Two render points:
1. **BakeDetailView** (`/recipe/:id/bake/:date`) — full cost table with ingredient rows, source badges, total, per-serving. Slots after Notes, before Next Time.
2. **CookLogSection** (recipe page cards) — one-line summary like "$1.29 total · $0.16/serving" beneath existing notes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 BakeDetailView renders cost breakdown table when entry.cost exists
- [ ] #2 BakeDetailView hides cost section when entry.cost is undefined
- [ ] #3 Cost table shows ingredient name, source badge (HEB/RATE/PANTRY/MANUAL), amount, and cost per ingredient
- [ ] #4 Cost table shows total and per-serving footer
- [ ] #5 CookLogSection card shows one-line cost summary when entry.cost exists
- [ ] #6 CookLogSection hides cost line when no cost data
- [ ] #7 Negligible items (e.g. water $0.00) render but show negligible instead of $0.00
<!-- AC:END -->
