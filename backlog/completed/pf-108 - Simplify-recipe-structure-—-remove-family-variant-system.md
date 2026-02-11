---
id: PF-108
title: Simplify recipe structure — remove family/variant system
status: Done
assignee: []
created_date: '2026-02-10 08:10'
updated_date: '2026-02-11 04:55'
labels:
  - refactor
dependencies: []
priority: medium
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove the families/variants grouping so every recipe is a standalone entry on the timeline. ATK Quick and Overnight get archived to `public/recipes/archive/` (excluded from any future programmatic index generation). The Ultimate stays as the sole ATK cinnamon buns recipe. Family/variant code is lightly used (1 family, 1 component, ~6 references in useRecipe) — clean removal.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `public/recipes/archive/` directory exists with `atk-cinnamon-buns.json` and `atk-cinnamon-buns-overnight.json` moved there
- [x] #2 `public/recipes/index.json` has no `families` array; only `recipes` array remains
- [x] #3 ATK Ultimate recipe stays in `recipes` array (renamed entry to just "ATK Cinnamon Buns" if appropriate)
- [x] #4 `RecipeIndex.vue` iterates all recipes individually — no family flattening logic, no variant count badge
- [x] #5 `VariantTabs.vue` and `VariantTabs.spec.ts` deleted
- [x] #6 `useRecipe.ts` — `families`, `currentFamily`, `getFamilyForRecipe` refs/exports removed; `RecipeFamily`/`RecipeFamilyVariant` types removed from `recipe.ts`
- [x] #7 `App.vue` — VariantTabs import and conditional render block removed
- [x] #8 `RecipeIndex.spec.ts` — tests updated: no family mock data, all items are standalone recipes
- [x] #9 `App.spec.ts` — VariantTabs mock and test cases removed
- [x] #10 `useRecipe.spec.ts` — family-related test cases removed
- [x] #11 D15 validation check removed from `recipe-schema.spec.ts` and `checklist.md`
- [x] #12 `npm run build` passes
- [x] #13 HITL sign-off before commit (visual change to index page)
<!-- AC:END -->
