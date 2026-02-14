---
id: PF-132
title: OG meta tags for bake detail page + route-level validation rule
status: In Progress
assignee: []
created_date: '2026-02-13 18:39'
updated_date: '2026-02-14 02:47'
labels:
  - feature
  - validation
dependencies: []
priority: medium
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `BakeDetailView.vue` sets OG meta tags via `useSeoMeta` (or extended `useRecipeMeta`) with bake-specific values
- [x] #2 `og:title` includes recipe name and formatted bake date (e.g., "ATK Ultimate Cinnamon Buns — Feb 10, 2026 Bake")
- [x] #3 `og:description` uses the cook log entry's `summary` (truncated to ~150 chars), falling back to recipe-level description
- [x] #4 `og:image` resolves to the hero photo (last in that bake's `photos[]` array), falling back to `og-image.png`
- [x] #5 `og:url` is the canonical bake URL (`https://proofeddot.netlify.app/recipe/:recipeId/bake/:date`)
- [x] #6 Twitter card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) mirror the OG values
- [x] #7 Validation checklist gets a new check: "Every route in the router must call `useSeoMeta` or `useRecipeMeta` with route-appropriate values"
- [x] #8 Existing routes verified against the new validation rule: `/` (index), `/recipe/:id`, `/recipe/:id/bake/:date`, `/about`
- [x] #9 `npm run build` passes
- [ ] #10 #10 `prerender-og.ts` generates static HTML for bake detail pages (`recipe/:id/bake/:date/index.html`) with bake-specific OG tags embedded in the HTML — crawlers see correct title, description, and hero image without executing JavaScript
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Extended `useRecipeMeta` composable with optional `bakeDate` parameter. When provided, sets bake-specific OG meta: title with formatted date ("Recipe Name — Feb 10, 2026 Bake"), description from cook log summary (truncated to 150 chars with fallback), hero photo from that bake's photos array, and canonical bake URL. Twitter card tags mirror OG values. Added F27 validation check to checklist. Added 10 new tests (8 for bake meta, 2 for bakeDate getter in App.vue). All 672 tests pass, diff-coverage passes.
<!-- SECTION:FINAL_SUMMARY:END -->
