---
id: DRAFT-120
title: 'Cost picker: remember preferred HEB products per ingredient'
status: Draft
assignee: []
created_date: '2026-05-26 17:12'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Speed up bake log cost capture by remembering user's go-to HEB products per ingredient.

Context (from 2026-05-26 simple-sourdough session): user has known preferences for staple ingredients. Today the HEB results list shows 7+ flour options every bake and user picks the same one each time.

Known user defaults (seed data):
- Bread flour → King Arthur Unbleached Bread Flour, 10 lb
- All-purpose flour → King Arthur (confirm size during grooming)
- Fine sea salt → Morton Fine Sea Salt, 17.6 oz

Possible shapes (groom):
- Per-ingredient "default product" memory keyed by ingredient ID, stored alongside the recipe or in a user-level config (e.g. `public/cost-preferences.json`).
- Bake-log skill / cost picker auto-pre-selects the default if present; user can override.
- Surface the most recent pick across cook_log entries as the suggested default (mining historical data, no manual config).
- Combination: explicit pinned defaults take precedence, fall back to most-recent.

Open questions for grooming:
- Where does the memory live (recipe JSON, separate config file, localStorage)?
- Global per-ingredient or recipe-scoped (e.g. King Arthur for sourdough, HEB store brand for cookies)?
- How does the review page render the pre-selection (badge, sticky highlight)?
- Should the bake-log skill skip HEB lookups for ingredients with pinned defaults and just inject the cost line directly?
<!-- SECTION:DESCRIPTION:END -->
