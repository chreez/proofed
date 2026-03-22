---
id: PF-168
title: Update NY-style pizza dough recipe to match current process
status: Done
assignee: []
created_date: '2026-03-22 03:42'
updated_date: '2026-03-22 04:05'
labels:
  - recipe-accuracy
dependencies: []
references:
  - public/recipes/ny-style-pizza.json
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The NY-style pizza recipe (`public/recipes/ny-style-pizza.json`) instructions no longer reflect how Chris actually makes the dough. Full update: rewrite dough stages to match current 3-day cold ferment process, remove sugar (keep as optional note), add hard Italian cheese, update vessels to baking steel, fix topping order, version bump.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dough stages rewritten to 3-day cold ferment default: Mix → 1h room temp rest → overnight cold bulk ferment (fridge) → divide next day → cold proof 1-2 days → pull out 1h before bake. Same-day 2h RT bulk + 1h RT proof removed as default.
- [x] #2 Sugar removed from ingredients list. Note added on enrichments state: 'For ovens below 500°F, consider adding 10-19g sugar for browning.'
- [x] #3 Hard Italian cheese (Parmigiano-Reggiano or Pecorino Romano) added as ingredient in PREP gather list and TOP_PIZZA components (~30-50g for 2 pizzas).
- [x] #4 Vessels updated: 'Pizza Stone' → 'Baking Steel' throughout (vessel list, states, notes).
- [x] #5 Topping order updated in TOP_PIZZA: sauce → grated hard cheese → mozz → pepperoni as standard layer order.
- [x] #6 Existing notes and technique references preserved — window pane test URL, critical notes, cook log tip sources all survive the rewrite.
- [x] #7 Version bumped v1.3.0 → v1.4.0 with change_log entry summarizing the update.
- [x] #8 Nutrition recalculated: sugar removed from breakdown, hard cheese added, totals and perServing recomputed.
- [x] #9 Cook log entries untouched — historical records of prior versions not modified.
- [x] #10 npm run build exits 0 after all changes.
<!-- AC:END -->
