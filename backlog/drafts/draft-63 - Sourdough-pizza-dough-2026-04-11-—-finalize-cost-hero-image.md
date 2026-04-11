---
id: DRAFT-63
title: Sourdough pizza dough 2026-04-11 — finalize cost + hero image
status: Draft
assignee: []
created_date: '2026-04-11 18:38'
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
Two deferred items from the 2026-04-11 sourdough pizza dough bake log:

1. **Bake cost calculation** — HEB results are in `public/review-data/sourdough-pizza-dough/2026-04-11/heb-results.json`. Need to finalize product selections for toppings (Sclafani sauce, mozzarella, Parmigiano-Reggiano, pepperoni) and calculate full cost. Dough ingredient costs partially done (King Arthur flour, Bob's Red Mill cornmeal). Recipe was doubled (4 pizzas, servings=4). Wire final cost into `cook_log[1].cost`.

2. **Hero image curation** — 11 process photos are wired into `cook_log[1].photos[]` but none tagged as hero. User will select and tag one.
<!-- SECTION:DESCRIPTION:END -->
