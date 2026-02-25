---
id: PF-131
title: Cook log cards link to bake detail page
status: Done
assignee: []
created_date: '2026-02-13 06:15'
updated_date: '2026-02-25 20:25'
labels:
  - feature
dependencies:
  - PF-130
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add forward navigation from collapsed cook log cards in CookLogSection to the bake detail page. Each entry becomes a gateway to the full bake detail view at `/recipe/:recipeId/bake/:date`. Additive — no changes to existing expand/collapse behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each collapsed cook log card in CookLogSection displays a navigation affordance (link/button) to `/recipe/:recipeId/bake/:date`
- [x] #2 Clicking navigates via `router.push`, not a full page reload
- [x] #3 Existing expand/collapse behavior on the cook log card is unchanged (coexistence)
- [x] #4 Navigation affordance is visually consistent with existing card styling (not a new pattern)
- [x] #5 Works on mobile at `192.168.1.213:5173`
- [x] #6 No changes to BakeDetailView.vue
- [x] #7 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation

Added "View bake →" link on collapsed cook log cards in CookLogSection.vue. Uses router.push with stopPropagation to coexist with expand/collapse. Styled with text-stone-400, hover:text-accent, ArrowRight icon (12px). Hidden when recipeId not available.

**Files changed:**
- `src/components/CookLogSection.vue` — added view bake link on collapsed cards

**GATE: Visual review required before commit.**
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced full expand/collapse with flat summary cards. Truncated summary (2-line clamp) toggles on click. \"View bake →\" link navigates to bake detail page via router.push. Removed inline photos, notes, lightbox, chevron. Net -445 lines.
<!-- SECTION:FINAL_SUMMARY:END -->
