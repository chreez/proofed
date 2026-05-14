---
id: DRAFT-102
title: Build ingredient canonical catalog seed (public/ingredients/catalog.json)
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - bakery-ops
  - inventory
  - data-seed
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-268 design notes §4. Build the canonical ingredient catalog file at public/ingredients/catalog.json from the existing cost-rates.json keys plus every ingredient id used in public/recipes/*.json. Each entry needs: canonical id, name, category, aliases array (every recipe id + cost-rates key that maps to it), shelfLifeDays (USDA FoodKeeper defaults), perishable flag, and bulkTiers when applicable (start with AP flour 5/25/50 lb, butter 1 lb / 4 lb, eggs 12 ct / 18 ct / 60 ct). Surface every unmapped recipe id as an inline TODO. Includes a one-shot dev script (scripts/seed-ingredient-catalog.ts) so the seed is regenerable. Conflict pairs (bread vs AP flour, flaky vs fine salt, butter aliases, egg/yolks) documented in design §4 — do not merge. Acceptance: zero UnmappedIngredient warnings against the current recipe library.
<!-- SECTION:DESCRIPTION:END -->
