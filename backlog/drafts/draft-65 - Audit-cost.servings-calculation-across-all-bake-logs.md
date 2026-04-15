---
id: DRAFT-65
title: Audit cost.servings calculation across all bake logs
status: Draft
assignee: []
created_date: '2026-04-15 18:46'
labels:
  - bug
  - data-integrity
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `cost` block in cook_log entries uses `servings` to mean "number of loaves/items" (1 or 2), and `perServing` means per-loaf cost. But the recipe config defines `servingsPerItem: 10` and `servingUnit: "slices"` — so a serving is actually a slice, not a loaf.

This means `cost.perServing` is likely displayed incorrectly on BakeDetailView and StatsPage. A $2.65 two-loaf bake should show $0.13/serving (per slice), not $1.32/serving (per loaf).

**Investigation scope:**
- How does BakeDetailView render `cost.perServing` and `cost.servings`? Does it use the cost block values directly or cross-reference `config.stats.servingsPerItem`?
- How does StatsPage compute per-serving cost in the ledger?
- Are all 16 simple-sourdough bake entries consistent in how they define `servings`?
- Check other recipes with cost data (birote-salado, ny-style-pizza, etc.) for the same issue
- Decide: should `cost.servings` mean items (loaves) or actual servings (slices)? Update schema and all entries accordingly.
<!-- SECTION:DESCRIPTION:END -->
