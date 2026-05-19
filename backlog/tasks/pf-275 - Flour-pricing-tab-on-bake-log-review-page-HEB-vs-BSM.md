---
id: PF-275
title: Flour pricing tab on bake-log review page (HEB vs BSM)
status: In Progress
assignee: []
created_date: '2026-05-19 17:14'
updated_date: '2026-05-19 18:18'
labels:
  - ux
  - cost
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On bake-log review page (`/review/bake/...` or cost surfaces), add a Flour pricing tab/section.

Lets the user pick the pricing source for flour ingredients per bake:
- HEB (via `mcp__heb__heb_product_search`) — commodity flours, KABF etc.
- BSM (via `mcp__bsm__bsm_product_search`) — Barton Springs Mill specialty / whole-grain / heritage grains.

UI surface: side-by-side options OR per-ingredient dropdown. User picks which price flows into recipe cost calc. Persist the choice on the cook_log entry, e.g. `cost.items[].sourceVendor: "heb" | "bsm"`, so future renders honor it.

BSM v1 search hits classes/tours too — use `product_type` filter or query the `all-flours` collection (39 products) for flour-only results.

Depends on BSM MCP being live (now true; registered in proofed/.mcp.json May 2026).

Groom before implementing — open Qs: HEB vs BSM toggle UX, schema migration for `sourceVendor`, how to handle mixed sources within one bake.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `CostSourceType` in src/types/recipe.ts includes `'bsm'`; existing values unchanged
- [ ] #2 `CostSelection` interface extends with optional `bsmHandle?: string` and `bsmVariantIndex?: number`
- [ ] #3 BSM MCP server gains `bsm_collection_products(handle)` tool fetching /collections/{handle}/products.json
- [ ] #4 BakeReviewPage Cost tab per-ingredient picker exposes BSM as a selectable source for any ingredient (no hard flour-only gate)
- [ ] #5 Selecting BSM source loads products from `all-flours` collection; picker shows title, variants (2.5lb/5lb), per-unit price, availability
- [ ] #6 Bundle products (multiple flours in body_html, or product_type not single-flour) excluded from v1 picker via filter before render
- [ ] #7 BSM selections persist to existing localStorage key `cost-selections:{recipeId}:{date}`; no separate storage path
- [ ] #8 Payload assembly produces CostLineItem with sourceType: 'bsm', sourceName: '{product title} ({variant})', packageSize from variant, packagePrice from variant price, cost = (recipe_amount_g / package_size_g) * packagePrice
- [ ] #9 Existing HEB / pantry / manual / rate selections render and persist unchanged (no regression)
- [ ] #10 Tests in BakeReviewPage.spec.ts or CostBreakdown.spec.ts cover BSM source: selection, persistence round-trip, CostLineItem payload shape
- [ ] #11 `npm run build` exits 0 (vitest + vue-tsc + vite build)
- [ ] #12 Validation checklist gains new Fxx entries for BSM source rendering + payload schema
- [ ] #13 HITL visual review on BakeReviewPage Cost tab before commit: picker renders, products load from all-flours, selection updates UI on iPhone + MacBook
<!-- AC:END -->
