---
id: DRAFT-88
title: Seed estimatedCost block on 14 un-baked recipes
status: Draft
assignee: []
created_date: '2026-05-12 13:11'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spawned from PF-255.6 spike audit.

Populate Recipe.estimatedCost (EstimatedCost interface, src/types/recipe.ts) for 14 recipes that have no cook_log entries and therefore no per-bake cost data:
- candida-focaccia
- carrot-cake
- coco-curry
- grain-free-bread
- ichiran-ramen
- ny-pizza-sauce
- potato-buns
- sourdough-cheddar-bay-biscuits
- sourdough-chocolate-chip-cookies
- sourdough-discard-cheese-crackers
- tartine-baguette
- tartine-rugelach
- thai-tea-boba
- tomita-tsukemen

estimatedCost is recipe-level (not per-bake) → uses /cost skill against current ingredients with default servings.

Why needed: PF-255 pricing UI should be able to show 'estimated cost to bake' for recipes that have never been made.

Open question for grooming: confirm with orchestrator whether PF-255 pricing should consume estimatedCost for un-baked recipes, or require at least one bake (i.e., is estimatedCost the right surface?).

Audit detail: backlog/tasks/pf-255.6-spike-notes.md section 2E + open question 3.

Priority: Low — defer until pricing UI is being built.
<!-- SECTION:DESCRIPTION:END -->
