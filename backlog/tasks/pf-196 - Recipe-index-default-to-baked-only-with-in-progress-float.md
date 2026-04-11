---
id: PF-196
title: 'Recipe index: default to baked-only with in-progress float'
status: Done
assignee: []
created_date: '2026-04-09 21:42'
updated_date: '2026-04-11 17:58'
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
- [x] #1 AC1 — Default filtered view: Recipe index shows only recipes where cook_log.length > 0 on initial load. No unbaked recipes visible without user action.
- [x] #2 AC2 — Category grouping preserved: Baked recipes remain grouped by category (baking, pizza & dough, mains, etc.). Empty categories are hidden entirely.
- [x] #3 AC3 — In-progress bake detection: On index load, scan localStorage for scratchpad-{recipeId} keys with non-empty entries. Recipes with active scratchpad data appear in a distinct 'In Progress' section above category groups.
- [x] #4 AC4 — In-progress visual distinction: In-progress bakes are visually differentiated from the regular baked list (e.g., different section header, indicator that notes exist).
- [x] #5 AC5 — Reveal mechanism for unbaked recipes: Method TBD via demo spike — some user-initiated action surfaces the full recipe list including unbaked items.
- [x] #6 AC6 — Unbaked visual distinction: When revealed, unbaked recipes are visually distinct from baked ones (e.g., dimmed, no hero image, no bake count).
- [x] #7 AC7 — No data contract changes: All filtering is client-side using existing cook_log array length and localStorage scratchpad keys. No changes to recipe JSON schema or index.json.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in RecipeIndex.vue with the following approach:\n\n**In-progress detection**: `hasActiveScratchpad(recipeId)` checks localStorage for `scratchpad-{recipeId}` keys with non-empty entries or generalNotes.\n\n**Three-section layout**:\n1. **In Progress** section at top — recipes with active scratchpad data, sorted alphabetically. Pulsing accent dot, \"in progress\" badge.\n2. **Baked categories** — existing category groups (baking, pizza & dough, etc.) filtered to only baked recipes. In-progress items excluded to avoid duplication.\n3. **Reveal toggle** — \"+ N more recipes\" monospace link at bottom (Option A from demo). Click reveals unbaked recipes grouped by category, dimmed at 0.45 opacity with stone-colored dots.\n\n**Visual styling**: In-progress dot pulses via CSS animation. Unbaked items have reduced opacity, stone-colored timeline dots (not accent), no hero image, no bake count. Hover increases opacity to 0.7.\n\n**Tests**: 29 tests covering all ACs — baked-only default, in-progress detection (entries, generalNotes, empty, invalid JSON), reveal toggle show/hide, dimmed styling, no duplicate items, category hiding, provenance in unbaked section."
<!-- SECTION:NOTES:END -->
