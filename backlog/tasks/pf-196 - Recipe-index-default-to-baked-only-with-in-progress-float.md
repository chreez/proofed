---
id: PF-196
title: 'Recipe index: default to baked-only with in-progress float'
status: To Do
assignee: []
created_date: '2026-04-09 21:42'
labels:
  - ux
dependencies: []
references:
  - src/components/RecipeIndex.vue
  - src/composables/useScratchpad.ts
  - public/recipes/index.json
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Recipe index page should default to showing only recipes the user has actually baked (cook_log.length > 0). Recipes with active scratchpad notes in localStorage float to the top as "in-progress bakes." Unbaked recipes hidden by default, revealed via a user-initiated action (mechanism TBD via demo spike).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AC1 — Default filtered view: Recipe index shows only recipes where cook_log.length > 0 on initial load. No unbaked recipes visible without user action.
- [ ] #2 AC2 — Category grouping preserved: Baked recipes remain grouped by category (baking, pizza & dough, mains, etc.). Empty categories are hidden entirely.
- [ ] #3 AC3 — In-progress bake detection: On index load, scan localStorage for scratchpad-{recipeId} keys with non-empty entries. Recipes with active scratchpad data appear in a distinct 'In Progress' section above category groups.
- [ ] #4 AC4 — In-progress visual distinction: In-progress bakes are visually differentiated from the regular baked list (e.g., different section header, indicator that notes exist).
- [ ] #5 AC5 — Reveal mechanism for unbaked recipes: Method TBD via demo spike — some user-initiated action surfaces the full recipe list including unbaked items.
- [ ] #6 AC6 — Unbaked visual distinction: When revealed, unbaked recipes are visually distinct from baked ones (e.g., dimmed, no hero image, no bake count).
- [ ] #7 AC7 — No data contract changes: All filtering is client-side using existing cook_log array length and localStorage scratchpad keys. No changes to recipe JSON schema or index.json.
<!-- AC:END -->
