---
id: PF-161
title: Fix page title not updating on navigation
status: Done
assignee: []
created_date: '2026-02-27 05:31'
updated_date: '2026-02-27 05:33'
labels:
  - bug
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bug: document title stays as the last loaded recipe name when navigating to index, about, stats, or bake-log pages. Root cause: `useRecipeMeta` only checks if a recipe exists but has no route awareness, and `currentRecipe`/`currentRecipeId` are never cleared when leaving a recipe page.

Fix: Pass route name into `useRecipeMeta` so the title computed can return route-appropriate titles (e.g., "proofed." for index, "About — proofed." for about, "Dashboard — proofed." for stats). This also fixes recipe→recipe navigation if the recipe ref updates slowly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Navigating to index page sets title to "proofed."
- [x] #2 Navigating to a recipe page sets title to "{Recipe Name} — proofed."
- [x] #3 Navigating to about page sets title to "About — proofed."
- [x] #4 Navigating to stats page sets title to "Dashboard — proofed."
- [x] #5 Navigating to bake-log page sets title to "Cook Log — proofed."
- [x] #6 Navigating to bake detail sets title to "{Recipe Name} — {date} Bake"
- [x] #7 Recipe-to-recipe navigation updates title to new recipe name
- [x] #8 OG meta tags update alongside title for each route
- [x] #9 Existing useRecipeMeta tests updated to cover route-based title logic
- [x] #10 npm run build passes
<!-- AC:END -->
