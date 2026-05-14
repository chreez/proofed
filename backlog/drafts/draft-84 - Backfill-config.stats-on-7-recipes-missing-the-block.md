---
id: DRAFT-84
title: Backfill config.stats on 7 recipes missing the block
status: Draft
assignee: []
created_date: '2026-05-12 13:11'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Merged with former DRAFT-81 (2026-05-14).** Both drafts described the same scope from different spikes.

Source: PF-255.3 + PF-255.6 spikes. Recipes lacking config.stats can't be modeled by the throughput scheduler and can't compute per-unit / per-serving prices for PF-256 lenses.

Each needs `{ group, subgroup?, defaultYield, unit, servingsPerItem, servingUnit }` per the `RecipeStats` interface (`src/types/recipe.ts:183`). Derive defaultYield from `meta.yields` string. Coordinate group/subgroup values with existing recipes for consistent stats rollups.

**Recipes (consolidated from both audits):**
- `ba-bolognese` → defaultYield 4, servingsPerItem 1, unit 'servings', servingUnit 'serving'
- `jalapeno-cheddar-sourdough` → **FLAG for review**: meta.yields says "2 loaves" but nutrition.servings is 16 (mismatch — 8/loaf or 10/loaf?). Resolve before backfilling.
- `sourdough-chocolate-chip-cookies` → defaultYield 23 (matches nutrition.servings), servingsPerItem 1, unit 'cookies'
- `sourdough-discard-cheese-crackers` → defaultYield ~90 (estimate from '80-100'), servingsPerItem 1
- `tartine-lemon-cream-tart` → defaultYield 12, servingsPerItem 1, unit 'tartlets'
- `tartine-rugelach` → defaultYield 16, servingsPerItem 1, unit 'rugelach'
- Plus any recipes missed by the surveys — re-audit on execution.

All derivable from existing `meta.yields` strings except the jalapeno-cheddar mismatch (needs human reconciliation).

**Audit details:** `backlog/tasks/pf-255.6-spike-notes.md` §2B and `pf-255.3-spike-notes.md`.

**Priority:** Medium — blocks Pricing lens (S1) accuracy + throughput modeling.
<!-- SECTION:DESCRIPTION:END -->
