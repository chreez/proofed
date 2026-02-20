---
id: PF-96
title: Ensure all recipes have a version field (default v1.0.0)
status: In Progress
assignee: []
created_date: '2026-02-10 03:13'
updated_date: '2026-02-19 21:10'
labels: []
dependencies: []
priority: low
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Data hygiene: all recipe JSON files should have a `version` field. If missing, default to v1.0.0. Prevents null edge cases in header display (PF-95) and anywhere else version is rendered.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 version field in Recipe interface is required (not optional)
- [ ] #2 All recipe JSON files have a non-empty version string
- [ ] #3 Build passes (npm run build)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation\n- Changed `version?: string` to `version: string` in `src/types/recipe.ts:23`\n- All 11 recipe JSON files already had version fields — no data changes needed\n- Harmless `v-if` guards on `recipe.version` left in place (RecipeMeta.vue:86, App.vue:398)\n- Harmless nullish coalesce `?? 'v1.0.0'` in App.vue:544 left in place\n- Build passes: 981 tests, clean type-check, bundle built
<!-- SECTION:NOTES:END -->
