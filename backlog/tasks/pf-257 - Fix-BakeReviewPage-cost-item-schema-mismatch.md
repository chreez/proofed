---
id: PF-257
title: Fix BakeReviewPage cost item schema mismatch
status: Done
assignee: []
created_date: '2026-05-13 21:34'
updated_date: '2026-05-13 22:14'
labels:
  - bug
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`BakeReviewPage.vue` "Copy review data" emits cost items that don't match the `CookLogCostItem` contract, causing `undefined` renders + doubled brand prefixes on print pages. Discovered while wiring tartine-rugelach bake log.

## Bugs
1. **Wrong field names** (BakeReviewPage.vue:561-572): emits `ingredientName`/`recipeAmount`/`recipeUnit` but `CookLogCostItem` (src/types/recipe.ts) expects `name`/`amount`/`unit`. `RecipePrintView.vue` reads `item.amount` and `item.unit` directly — gets `undefined`.
2. **Doubled brand in sourceName** (BakeReviewPage.vue:547): `sourceName = ${product.brand} ${product.name}` produces "Central Market Central Market European Style Unsalted Butter Sticks" because HEB product names already start with the brand.

## Files Affected
- `src/components/BakeReviewPage.vue` (lines 547, 561-572)
- `src/components/BakeReviewPage.spec.ts` (update assertions)
- One-off backfill for tartine-rugelach already done (in 3591b74); no other recipes affected because no other recipes used the broken page output yet.

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AC1: `BakeReviewPage.vue` `costPayload` computed emits objects with keys `{ingredientId, name, sourceType, sourceName, amount, unit, packageSize, packagePrice, cost}` — matching `CookLogCostItem` for the first six fields.
- [ ] #2 AC2: `sourceName` for `heb` source type is just `product.name` (NOT `${product.brand} ${product.name}`), since HEB product names already include brand. Verified: "H-E-B Regular Cream Cheese" not "H-E-B H-E-B Regular Cream Cheese".
- [ ] #3 AC3: `sourceName` for `pantry`/`manual`/`rate` types unchanged — no regression in those paths.
- [ ] #4 AC4: `BakeReviewPage.spec.ts` updated — assertions verify the new field names and de-duped sourceName.
- [ ] #5 AC5: `npm run build` passes (type-check + tests + bundle).
- [ ] #6 AC6: Visual HITL on `/review/bake/tartine-rugelach/2026-05-12` — "Copy review data" payload (paste into a scratchpad / inspect JSON) shows correct field names and clean sourceName.

## Why
Without this fix, every future `/bake-log` session that goes through the cost picker produces broken cook_log entries that render as "undefinedundefined" + doubled brand on print pages. The Mozzarella Rule applies: wrong data ships silently if not caught.
<!-- SECTION:DESCRIPTION:END -->
<!-- AC:END -->
