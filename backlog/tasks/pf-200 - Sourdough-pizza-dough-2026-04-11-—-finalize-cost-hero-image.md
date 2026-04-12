---
id: PF-200
title: Sourdough pizza dough 2026-04-11 — finalize cost + hero image
status: Done
assignee: []
created_date: '2026-04-11 18:38'
updated_date: '2026-04-12 17:24'
labels:
  - data
dependencies: []
references:
  - public/recipes/sourdough-pizza-dough.json
  - public/review-data/sourdough-pizza-dough/2026-04-11/heb-results.json
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finalize the 2026-04-11 sourdough pizza dough bake log with a hero image and dough-only cost block.

**Cost scope**: Base dough ingredients only (flour, water, starter, salt, malt, cornmeal). Topping costs excluded — each of the 4 pizzas had different toppings, making per-pizza allocation impractical.

**Hero image**: 11 process photos already wired into cook_log[1].photos[]. User selects one as hero.

**Existing data**: HEB results in public/review-data/sourdough-pizza-dough/2026-04-11/heb-results.json. Partial cost selections from review page (King Arthur flour $10.99/10lb, Bob's Red Mill cornmeal $4.19/1.5lb). Recipe was doubled (4 pizzas, servings=4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1 — Hero image tagged: Exactly one photo in cook_log[1].photos[] has "usage": "hero". User selects which one — never auto-pick.
- [x] #2 AC2 — Hero renders full-width: The selected hero photo renders as the full-width lead image on the bake detail page (existing behavior for last photo in array — reorder if needed).
- [x] #3 AC3 — Dough-only cost block: cook_log[1].cost contains line items for base dough ingredients only: bread_flour, water, sourdough_starter, salt, diastatic_malt, cornmeal. Topping ingredients excluded.
- [x] #4 AC4 — Cost totals correct: cost.total equals sum of all items[].cost. cost.perServing equals total / servings. cost.servings is 4.
- [x] #5 AC5 — Topping exclusion noted: A cost.note field (string) explains why toppings are excluded, e.g. "Dough cost only — topping costs excluded due to per-pizza variation."
- [x] #6 AC6 — No recipe schema changes: Cost uses existing CookLogCost interface. The note field is additive (optional string, no breaking change).
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Hero image: cheese-basil-slice-side-crumb tagged as hero and reordered to last position. Cost block: dough-only with 6 ingredients, $2.73 total / $0.09 per serving (32 servings = 4 pizzas × 8 slices). Sources: King Arthur 10lb flour (HEB), Morton Sea Salt (manual), Amazon diastatic malt, Bob's Red Mill cornmeal (HEB), starter estimated from flour cost. Added optional note field to CookLogCost interface.
<!-- SECTION:FINAL_SUMMARY:END -->
