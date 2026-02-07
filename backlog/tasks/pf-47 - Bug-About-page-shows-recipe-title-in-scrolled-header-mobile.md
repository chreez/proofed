---
id: PF-47
title: 'Bug: About page shows recipe title in scrolled header (mobile)'
status: Done
assignee: []
created_date: '2026-02-07 02:54'
updated_date: '2026-02-07 02:56'
labels:
  - bug
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On mobile, scrolling down on the About page causes the collapsed header to show "Cinnamon Rolls" (or whatever recipe was last viewed). The scrolled header recipe title should only appear on recipe pages, not on About or Index.\n\nLikely cause: the `isScrolled && currentRecipe` condition in App.vue doesn't account for the current route — it shows the recipe title whenever a recipe is loaded in memory, regardless of which page you're on.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scrolled header does NOT show recipe title on About page
- [ ] #2 Scrolled header does NOT show recipe title on Index page
- [ ] #3 Scrolled header shows recipe title ONLY on recipe pages
- [ ] #4 Verified on mobile (iPhone via 192.168.1.213:5173)
- [ ] #5 Human visual sign-off before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
One-line fix in App.vue:268 — added `&& !showIndex && !showAbout` to the v-if condition for the scrolled header recipe title. Prevents recipe name from leaking onto About and Index pages.">
<!-- SECTION:FINAL_SUMMARY:END -->
