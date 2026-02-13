---
id: PF-132
title: OG meta tags for bake detail page + route-level validation rule
status: To Do
assignee: []
created_date: '2026-02-13 18:39'
labels:
  - feature
  - validation
dependencies: []
priority: medium
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `BakeDetailView.vue` sets OG meta tags via `useSeoMeta` (or extended `useRecipeMeta`) with bake-specific values
- [ ] #2 `og:title` includes recipe name and formatted bake date (e.g., "ATK Ultimate Cinnamon Buns — Feb 10, 2026 Bake")
- [ ] #3 `og:description` uses the cook log entry's `summary` (truncated to ~150 chars), falling back to recipe-level description
- [ ] #4 `og:image` resolves to the hero photo (last in that bake's `photos[]` array), falling back to `og-image.png`
- [ ] #5 `og:url` is the canonical bake URL (`https://proofeddot.netlify.app/recipe/:recipeId/bake/:date`)
- [ ] #6 Twitter card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) mirror the OG values
- [ ] #7 Validation checklist gets a new check: "Every route in the router must call `useSeoMeta` or `useRecipeMeta` with route-appropriate values"
- [ ] #8 Existing routes verified against the new validation rule: `/` (index), `/recipe/:id`, `/recipe/:id/bake/:date`, `/about`
- [ ] #9 `npm run build` passes
<!-- AC:END -->
