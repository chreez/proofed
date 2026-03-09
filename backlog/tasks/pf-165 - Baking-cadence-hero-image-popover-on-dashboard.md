---
id: PF-165
title: Baking cadence hero image popover on dashboard
status: Done
assignee: []
created_date: '2026-03-09 01:29'
updated_date: '2026-03-09 02:34'
labels:
  - ux
dependencies: []
references:
  - src/components/StatsPage.vue
  - 'src/types/recipe.ts (CookLogEntry, CookLogPhoto)'
  - src/router/index.ts (bake-detail route)
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On the stats dashboard baking cadence timeline, hovering (desktop) or tapping (mobile) a timeline dot shows a popover with the hero image and recipe name for each bake on that date. Clicking/tapping a bake entry drills down to the bake detail page. Multiple bakes on the same date are listed vertically within the popover.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1 — Enriched timeline dot data: Each timeline dot carries recipe ID(s) and hero image path(s) for all bakes on that date. Hero image = last entry in cook_log[].photos[]. Bakes with no photos show recipe name only (no image).
- [x] #2 AC2 — Hover popover (desktop): Hovering a timeline dot shows a popover with one entry per bake on that date: hero thumbnail + recipe name. If multiple bakes share a date, all are listed vertically. Popover disappears on mouse leave.
- [x] #3 AC3 — Tap popover (mobile): Tapping a timeline dot shows the same popover content. Tapping outside dismisses it.
- [x] #4 AC4 — Drill-down navigation: Clicking/tapping a bake entry within the popover navigates to /recipe/:recipeId/bake/:date.
- [x] #5 AC5 — No-photo fallback: If a bake has no photos, the popover entry shows recipe name + date only — no broken image, no placeholder image.
- [x] #6 AC6 — Viewport-aware positioning: Popover does not overflow viewport edges (left/right/top). Adjusts position for dots near timeline edges.
- [x] #7 AC7 — Design system compliance: Popover uses existing stone palette, 0-radius borders, JetBrains Mono for labels, Inter for body. 2px solid border. Consistent with ds3-* class naming in StatsPage.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added interactive popovers to baking cadence timeline dots on the stats dashboard. Hovering (desktop) or tapping (mobile) a dot reveals hero thumbnails + recipe names for all bakes on that date, with drill-down navigation to bake detail pages. Includes viewport-aware positioning, no-photo fallback, delayed hide for mouse gap, click-outside dismissal, and full ds3-* design system compliance. 81 tests passing with diff-coverage gate satisfied.
<!-- SECTION:FINAL_SUMMARY:END -->
