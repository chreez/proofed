---
id: PF-277
title: 'Cost breakdown: ''servings'' label wrong for breads (use ''loaves'')'
status: Draft
assignee: []
created_date: '2026-05-26 17:19'
updated_date: '2026-05-26 19:44'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On bake detail pages (and possibly print/IG share), cost breakdown shows '2 servings' (or '1 servings') as a count label above total cost. For breads this should read 'loaves' (or the recipe-defined unit), not 'servings'.

Context: 2026-05-26 simple-sourdough bake. Single-loaf cost wired as servings=1 — UI rendered '1 servings'. The recipe's nutrition.servings is 10 (per-slice), but cost.servings is the unit count (loaves). Mixing the two terms is confusing.

Possible direction:
- Add unit label to cost block (`cost.unitLabel: 'loaves'` / 'cookies' / 'tarts' etc.), default to 'servings' for backward compat.
- OR derive from recipe.meta.yields (parse '2 loaves (~800g each baked)' → 'loaves').
- Pluralize properly (1 loaf, 2 loaves).

Touch points: bake detail cost breakdown component, print page cost block, IG share caption (L2 spend lines).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New pluralizeUnit(count, singular) util added: handles -f -> -ves (loaf->loaves), -fe -> -ves (knife->knives), -y -> -ies (berry->berries), default +s (cookie->cookies); count===1 returns singular unchanged
- [ ] #2 CostBreakdown.vue count line and per-unit line derive label via inferDefaultUnit(recipe.meta.yields) + pluralizeUnit(cost.servings, singular); empty meta.yields falls back to serving/servings/Per serving
- [ ] #3 BakeDetailView.vue per-serving label line applies same unit-aware logic as CostBreakdown.vue
- [ ] #4 RecipePrintView.vue all three 'per unit'/'per serving' ternary occurrences replaced with extracted unit name (e.g. per loaf, per cookie); empty meta.yields still falls back to per serving
- [ ] #5 useBakeAggregates.ts buildCaption() is NOT modified (already uses /item)
- [ ] #6 LabelCard.vue:265 nutrition 'per serving' label is NOT modified (nutrition.servings != cost.servings semantically)
- [ ] #7 CookLogCost type in src/types/recipe.ts is unchanged - no new unitLabel field; label derived at render time, not stored
- [ ] #8 Visual verification: simple-sourdough/2026-05-26 bake detail page renders '1 loaf' + 'Per loaf: $1.33'; a recipe with yields like '16 cookies' renders '16 cookies' + 'Per cookie: $X'
- [ ] #9 Vitest covers pluralizeUnit: loaf->loaves, knife->knives, berry->berries, cookie->cookies, tart->tarts, bun->buns; n=1 returns singular for each
- [ ] #10 Vitest covers integration of inferDefaultUnit + pluralizeUnit: yields present -> derived unit name; yields empty -> 'servings'
- [ ] #11 CostBreakdown and RecipePrintView snapshot tests updated to reflect new labels; snapshot diff is bounded to label strings only (no structural changes)
- [ ] #12 Styling/UX HITL gate: dev server running, bake detail page opened for visual review on desktop + iPhone URL, explicit user approval before commit
<!-- AC:END -->
