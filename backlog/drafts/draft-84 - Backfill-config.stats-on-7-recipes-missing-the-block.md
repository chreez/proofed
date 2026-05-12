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
Source: PF-255.3 spike. Seven recipes lack config.stats and therefore can't be modeled by the throughput scheduler: ba-bolognese, jalapeno-cheddar-sourdough, sourdough-chocolate-chip-cookies, sourdough-discard-cheese-crackers, tartine-lemon-cream-tart, tartine-rugelach (plus any missed in survey). Each needs { group, subgroup?, defaultYield, unit, servingsPerItem, servingUnit } per the RecipeStats interface (src/types/recipe.ts:183). Derive defaultYield from meta.yields string. Coordinate group/subgroup values with existing recipes for consistent stats rollups.
<!-- SECTION:DESCRIPTION:END -->
