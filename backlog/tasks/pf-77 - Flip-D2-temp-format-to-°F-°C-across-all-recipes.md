---
id: PF-77
title: Flip D2 temp format to °F (°C) across all recipes
status: Done
assignee: []
created_date: '2026-02-08 11:07'
updated_date: '2026-02-10 09:25'
labels:
  - recipe
  - infra
dependencies: []
priority: low
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Change temperature convention from Celsius-primary to Fahrenheit-primary. D2 currently says "Temps formatted as 175°C (350°F)" — should be "350°F (175°C)". Update D2 rule, all recipe JSONs, validation tests, CLAUDE.md, and TempText component if it parses/renders temp format.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 D2 checklist rule updated: temps formatted as `350°F (175°C)` (Fahrenheit primary)
- [x] #2 All existing recipe JSONs updated to °F (°C) format
- [x] #3 TempText component updated if it parses temp format order
- [x] #4 Validation test for D2 updated to match new format
- [x] #5 CLAUDE.md recipe contract updated
- [x] #6 `npm run build` passes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Flipped temperature convention from Celsius-primary to Fahrenheit-primary across the entire project.\n\nFiles changed:\n- `CLAUDE.md` — recipe contract updated to °F (°C)\n- `.claude/rules/validation/checklist.md` — D2 rule flipped\n- `src/composables/useTemperature.ts` — rewrote parser to match paired temps first (consumed as text), then badge bare °F/°C. Added `fahrenheitToCelsius()`. Updated `hasTemperature()` to detect both units.\n- `src/components/TempText.vue` — updated data attribute from `celsius` to `alt`\n- `src/composables/useTemperature.spec.ts` — NEW: 17 tests covering conversion functions, paired temp passthrough, bare temp badging, ranges\n- 6 recipe JSONs updated (atk-cinnamon-buns, atk-cinnamon-buns-overnight, atk-cinnamon-buns-ultimate, carrot-cake, tartine-baguette, ny-style-pizza cook log note)\n- 4 recipes already °F-primary (ichiran-ramen, thai-tea-boba, tomita-tsukemen, ny-style-pizza directions) — no changes needed"
<!-- SECTION:FINAL_SUMMARY:END -->
