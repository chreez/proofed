---
id: PF-97
title: Rework recipe index page
status: Done
assignee: []
created_date: '2026-02-10 03:15'
updated_date: '2026-02-10 08:08'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the current card/chip recipe index with a clean vertical timeline layout. Port the approved direction from PF-97.1 spike (clean timeline + motion-v) into the production RecipeIndex component.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 RecipeIndex component renders a vertical timeline layout with category grouping (baking, pizza & dough, mains, drinks) — replaces current card/chip layout
- [x] #2 Sort order: baked recipes first, then alphabetical within each category
- [x] #3 Category labels styled as monospace uppercase with bottom border separator
- [x] #4 Timeline spine (vertical line + dot per item) renders on left edge
- [x] #5 Scroll-triggered animations via motion-v — items slide up + fade with per-item stagger delay
- [x] #6 Hero thumbnails (6rem cropped) display for recipes that have cook_log photos
- [x] #7 Recipe summaries display below each recipe name — source TBD (spike subtask may be needed for schema)
- [x] #8 Hover fills timeline dot + accents recipe name (desktop)
- [x] #9 Mobile-friendly — renders cleanly on iPhone at 375px+
- [x] #10 Index route removes top py-6 padding (per-route layout control in App.vue)
- [x] #11 Demo page (/demo/index-variants) and Demo*.vue components removed after production index ships
- [x] #12 npm run build passes
- [x] #13 HITL sign-off before commit (ux label)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rewrote RecipeIndex.vue from card/chip layout to vertical timeline with category grouping, motion-v scroll animations, hero thumbnails from cook_log, and description display. Removed demo components (DemoVariantHybrid.vue, DemoIndexVariants.vue), demo route, and dummy cook_log entries from coco-curry.json and ny-style-pizza.json. Fixed App.vue per-route padding for index page. Updated tests to match new timeline structure. Created PF-107 for meta.summary field.
<!-- SECTION:FINAL_SUMMARY:END -->
