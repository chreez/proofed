---
id: PF-131
title: Cook log cards link to bake detail page
status: To Do
assignee: []
created_date: '2026-02-13 06:15'
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
- [ ] #1 Each collapsed cook log card in CookLogSection displays a navigation affordance (link/button) to `/recipe/:recipeId/bake/:date`
- [ ] #2 Clicking navigates via `router.push`, not a full page reload
- [ ] #3 Existing expand/collapse behavior on the cook log card is unchanged (coexistence)
- [ ] #4 Navigation affordance is visually consistent with existing card styling (not a new pattern)
- [ ] #5 Works on mobile at `192.168.1.213:5173`
- [ ] #6 No changes to BakeDetailView.vue
- [ ] #7 npm run build passes
<!-- AC:END -->
