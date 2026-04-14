---
id: DRAFT-54
title: Non-linear scaling badges — confidence warnings on gather items
status: Draft
assignee: []
created_date: '2026-04-10 17:01'
labels:
  - scaling
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a recipe is scaled (multiplier != 1x), ingredients classified as `non_linear` in the scaling research should show a warning indicator in the gather section. On hover/tap, explain that this ingredient's scaled amount hasn't been tested and has low confidence due to non-linear behavior (e.g., yeast doesn't scale proportionally with dough mass).

Additionally, support scaling "step overrides" — after a user confirms a particular scaled amount works via a bake, lock that amount in as a verified data point. This allows building confidence over time through actual bakes.

## Context
- PF-183.1–183.6 scaling spikes identified non-linear ingredients per recipe (yeast, starter, baking soda/powder)
- Current scaling (PF-183) applies linear multiplier to all ingredients
- User wants visual feedback that some scaled amounts are estimates, not verified

## Toppings/Fillings Note
Toppings and fillings (pizza sauce, cheese, pepperoni, cinnamon filling) scale linearly with serving count — no special handling needed. The non-linear concern is primarily chemical leaveners and biological fermentation agents.
<!-- SECTION:DESCRIPTION:END -->
