---
id: DRAFT-113
title: /labels stamps bakeDate + best-by date
status: Draft
assignee: []
created_date: '2026-05-19'
labels:
  - bakery-ops
  - pf-256
  - labels
dependencies:
  - DRAFT-112
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: 2026-05-19 market-workflow gap. `/labels` stamps today's date on every card. For real food labels this is wrong — labels need the actual bake date + an implied shelf-life / best-by.

Blocked by DRAFT-112 (need `bakeDate` on ProductionEntry first).

## Scope
- LabelCard reads `entry.bakeDate ?? today` and displays as "Baked: {date}".
- New "Best by: {date}" line below; default = bakeDate + recipe-specific shelf life (per-recipe metadata, fallback 3 days for bread, 7 days for cookies/crackers).
- New `recipe.meta.shelfLifeDays?: number` field — optional; falls back to category default.
- Print preview shows the date pair clearly.

## Proposed ACs
1. LabelCard renders "Baked: {bakeDate}" using entry.bakeDate; falls back to today's date with a small "(printed today)" tag when bakeDate is null.
2. "Best by: {bakeDate + shelfLifeDays}" line renders below the bake date.
3. `recipe.meta.shelfLifeDays?: number` added to RecipeMeta type; optional.
4. Category defaults: bread/sourdough = 3 days, cookies/crackers = 7 days, tarts/cakes = 4 days. Hardcoded for v1; backfill drafts can populate per-recipe later.
5. Snapshot test updated for dated card.
6. F43 tooltip on each date line explaining the source.
<!-- SECTION:DESCRIPTION:END -->
