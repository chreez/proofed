---
id: PF-282
title: Move butter from MIX to PREP gather in jalapeño cheddar sourdough
status: Done
assignee: []
created_date: '2026-06-27 22:06'
updated_date: '2026-07-04 20:02'
labels:
  - ux
  - recipe
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Intent

User expects the mise en place block on stage 1 (PREP) to be the shopping list for the bake. Butter (50g, needed at room temp for temper) currently sits in stage 2 (MIX) gather, hidden from view when the user reads the PREP mise upfront.

Audit shows this is the only recipe with a single-ingredient stage-N gather that could reasonably be front-loaded. Other multi-stage-gather recipes (tres leches, lemon tart, bolognese, focaccia) have legit progressive prep for subrecipes and are out of scope.

## Changes

1. Move `butter` ingredient from `stages[1].gather.ingredients` → `stages[0].gather.ingredients` in `public/recipes/jalapeno-cheddar-sourdough.json`
2. Delete `stages[1].gather` (becomes null/absent) since butter was its only ingredient
3. Keep the `temper-butter` state in MIX — that's the "set butter out to soften" step, still relevant
4. Butter direction text in `temper-butter` state: no change (already reads "50g unsalted butter"), just reflects that it's already staged from PREP
5. Bump recipe `version` to `v3.0.1` (patch)
6. New `change_log` entry for v3.0.1 with frozen ingredient snapshot

## Acceptance Criteria

1. `stages[0].gather.ingredients` includes butter (50g, no breakdown)
2. `stages[1].gather` is null OR `stages[1].gather.ingredients` is empty
3. `states[temper-butter]` still exists, direction unchanged
4. `version` = `v3.0.1`
5. New `change_log[]` entry with `version: v3.0.1`, non-empty summary, frozen `ingredients[]` snapshot matching updated gather state
6. Snapshot in change_log entry reflects new structure (butter under PREP, no MIX gather group)
7. D6 breakdown sums still pass (butter has no breakdown, total unchanged 50g)
8. `npm run build` exits 0
9. Recipe page: PREP gather section shows butter alongside other 8 ingredients (visual HITL)
10. MIX stage still shows the `temper-butter` state, no orphan gather rendering

## Out of Scope

- Aggregating stage-N gathers across all recipes (many have legit multi-stage prep — separate design work)
- UI-side "All ingredients" summary view (deferred pending observed need)
- Cinnamon buns / other recipes with similar patterns (audit shows they're already front-loaded or intentionally staged)

## Source

- Bake log 2026-06-27 cook_log entry next_time item
- User confirmation 2026-07-04: "just missing in the ingredient list"
- Grooming session 2026-07-04
<!-- SECTION:DESCRIPTION:END -->
