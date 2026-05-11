---
id: PF-254
title: Tag search bar (hybrid) — bake log + recipe index
status: Done
assignee: []
created_date: '2026-05-11 20:28'
updated_date: '2026-05-11 21:48'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a hybrid tag-style search bar to both /bake-log and / (recipe index). Pattern chosen from public/demo/bake-log-search.html (variant C). Tokens derived from existing JSON fields — no real Tag model yet. Follow-up work: introduce real Tag model (separate task).

**UX (shared component):**
- Inline chips left of search input
- Dropdown shows 2 sections when input non-empty: 'Add filter tag' (top, with live counts) + 'Jump to result' (bottom, with preview rows)
- Click tag → adds chip, clears input. Click preview → navigates to detail page.
- Multi-chip = AND filter on list below
- Keyboard: ↑↓ Enter Esc; Backspace pops last chip when input empty

**Per-page config:**

| Page | Tokens | Preview row | Nav target |
|------|--------|-------------|------------|
| /bake-log | name (word), weather, month, status, version | thumb + recipe name + date + version | /recipe/:id/bake/:date |
| / | name (word), category, source (author), type (original/adapted), status (baked/unbaked/in-progress/outdated) | thumb + recipe name + category + bake count | /recipe/:id |

**Recipe index filter behavior:** chips filter the underlying recipe set; existing category grouping, in-progress section, outdated section, and unbaked toggle continue to work on the filtered set.

**Out of scope (v1):**
- URL hash state — follow-up task
- Real Tag model — follow-up task
- Mobile chips-below-input layout — follow-up

Demo: public/demo/bake-log-search.html — 3 variants × 2 pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 TagSearch.vue component exists in src/components/, generic over items via props (tokensFn, matchTextFn, renderItem slot, navigate handler)
- [x] #2 BakeLogPage.vue renders a TagSearch at the top of the page that filters the bake timeline below; chips AND-filter; clicking a preview navigates to /recipe/:id/bake/:date
- [x] #3 RecipeIndex.vue renders a TagSearch at the top that filters recipes; existing category groups, in-progress section, outdated section, and unbaked-toggle still work on the filtered subset
- [x] #4 Dropdown opens on input non-empty; shows 'Add filter tag' (max 4) + 'Jump to result' (max 4) sections; live counts reflect chip-scoped subset
- [x] #5 Keyboard nav: ArrowDown/ArrowUp moves active index across all dropdown items; Enter activates; Esc closes; Backspace on empty input pops the last chip
- [x] #6 Multi-chip filter is AND (every chip's token must match)
- [x] #7 Empty state: when filter returns 0 items, list shows 'No matches — clear filter' affordance
- [x] #8 Component tests in src/components/TagSearch.spec.ts: chip add/remove, AND filter logic, keyboard nav, dropdown sections, empty state
- [x] #9 Integration: BakeLogPage.spec.ts asserts search bar renders + filters timeline; RecipeIndex.spec.ts asserts search bar renders + filters category groups
- [x] #10 npm run build passes (vitest + vue-tsc + vite build), including snapshot updates for BakeLogPage and RecipeIndex
- [x] #11 Human sign-off: visual review on /bake-log and / on iPhone + macOS — search opens, chips render, previews jump, mobile readable
<!-- AC:END -->
