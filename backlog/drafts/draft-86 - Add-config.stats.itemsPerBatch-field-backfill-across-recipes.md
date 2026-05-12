---
id: DRAFT-86
title: Add config.stats.itemsPerBatch field + backfill across recipes
status: Draft
assignee: []
created_date: '2026-05-12 13:11'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255.3 spike §5. The throughput scheduler needs to model oven-slot occupancy: batches_needed = ceil(defaultYield / itemsPerBatch). Examples: cinnamon buns 8/skillet → 1 batch; cookies 24 total, 8/sheet → 3 batches; sourdough loaves 2 total, 1/dutch oven → 2 batches. Add optional itemsPerBatch?: number to RecipeStats interface in src/types/recipe.ts:183. Backfill all recipes that already have a stats block. Recipes without itemsPerBatch should be treated by the scheduler as 'assume 1 batch'.
<!-- SECTION:DESCRIPTION:END -->
