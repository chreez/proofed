---
id: DRAFT-45
title: Backfill bake_stats on non-sourdough recipes
status: Draft
assignee: []
created_date: '2026-04-09 14:34'
labels:
  - backfill
  - data
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Backfill structured `bake_stats` onto cook log entries for all recipes beyond simple-sourdough. Follows the pattern established by PF-177.5 (best-effort extraction from prose notes, confidence ratings, key_notes curation). Each subtask is one recipe.\n\n6 recipes, 12 total bakes:\n- ny-style-pizza (4 bakes)\n- sourdough-cinnamon-buns (2 bakes)\n- birote-salado (2 bakes)\n- atk-cinnamon-buns-ultimate (2 bakes)\n- sourdough-pizza-dough (1 bake)\n- sourdough-cheddar-cheese (1 bake)\n\nEach recipe will need its own `bake_defaults` declaration and per-recipe `BakeStatsBlock` field set — sourdough's schema (S&F, aliquot, dough temps) won't apply to pizza or cinnamon buns.
<!-- SECTION:DESCRIPTION:END -->
