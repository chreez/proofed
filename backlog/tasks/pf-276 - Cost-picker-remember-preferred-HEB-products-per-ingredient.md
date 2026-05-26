---
id: PF-276
title: 'Cost picker: remember preferred HEB products per ingredient'
status: Done
assignee: []
created_date: '2026-05-26 17:12'
updated_date: '2026-05-26 20:00'
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Preferences file public/cost-preferences.json tracked in git; shape { version: 1, ingredients: { [ingredientId]: { pinned?: PrefEntry, lastUsed?: PrefEntry } } } where PrefEntry = { name, brand, sizeGrams, packagePrice, packageSize, updatedAt }
- [ ] #2 Seed data: pinned entries for bread_flour (KA Unbleached Bread Flour, 10 lbs, $10.99), ap_flour (KA Unbleached AP, 5 lbs, $5.48), salt (Morton Fine Sea Salt, 17.6 oz, $2.98)
- [ ] #3 CostPreferences and CostPreferenceEntry types added (src/types/recipe.ts or new file) and used in BakeReviewPage.vue
- [ ] #4 BakeReviewPage.vue fetches /cost-preferences.json after loadHebResults() and applies preferences to costSelections only for ingredients with no existing per-bake localStorage entry (cost-selections:{recipeId}:{date})
- [ ] #5 Selection priority: pinned > lastUsed > current smart default (cheapest HEB > rate > manual)
- [ ] #6 Match strategy: preference matches an HEB product when brand matches case-insensitively AND |product.sizeGrams - pref.sizeGrams| <= 5g; no size match falls back to brand-only (lowest-priced of that brand); brand absent from results falls back to smart default
- [ ] #7 Products auto-selected from pinned preference render with a distinct visual marker (filled pin icon or badge) on the bake review page
- [ ] #8 Selected HEB product shows a pin button; clicking pins/unpins it as the pinned entry for that ingredientId
- [ ] #9 Page tracks dirty preferences in local state and includes a preferencesUpdates: { [ingredientId]: { pinned?, lastUsed? } } field in the copy-review-data JSON payload
- [ ] #10 Bake-log skill Phase 5+6 applies preferencesUpdates from the pasted review payload to public/cost-preferences.json and stages the file in the same commit as the cook_log entry
- [ ] #11 Once user makes any selection on the review page, cost-selections:{recipeId}:{date} localStorage takes precedence over preferences on subsequent loads of the same review page
- [ ] #12 Missing or unfetchable cost-preferences.json: review page falls back to smart-default behavior with no user-visible errors
- [ ] #13 Vitest covers: (a) match by brand+sizeGrams within tolerance, (b) brand-only fallback when size mismatches, (c) selection priority pinned > lastUsed > smart default, (d) per-bake localStorage override
- [ ] #14 .claude/skills/bake-log/SKILL.md Phase 5+6 documents the preferencesUpdates payload field and the file-write step
- [ ] #15 1,2,3,4,5,6,7,8,9,10,11,12,13,14
<!-- AC:END -->
