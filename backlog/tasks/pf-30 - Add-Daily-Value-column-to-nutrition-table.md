---
id: PF-30
title: Add % Daily Value column to nutrition table
status: To Do
assignee: []
created_date: '2026-02-07 00:24'
updated_date: '2026-02-07 00:37'
labels:
  - feature
dependencies:
  - PF-14
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a % Daily Value column to the nutrition table, visible only in per-serving view. Uses FDA 2,000 kcal/day reference intakes.\n\nData approach: Store FDA reference values in public/config/fda-dv.json (e.g. { "fat": 78, "carbs": 275, "protein": 50, "sodium": 2300, ... } in grams/mg). Compute % DV = (perServing / fdaReference) * 100 at render time in NutritionSection. Only show % DV for nutrients that exist in both the recipe JSON and the FDA reference file.\n\nDepends on PF-14 (nutrition data) being complete.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 % DV column only visible when per-serving toggle is active
- [ ] #2 % DV computed as (perServing / fdaReference) * 100, rounded to nearest integer
- [ ] #3 FDA reference values stored in public/config/fda-dv.json
- [ ] #4 Only nutrients present in both recipe JSON and FDA reference show % DV
- [ ] #5 Nutrients without an FDA reference show — (em dash) in the DV column
- [ ] #6 Column header shows “% DV” with a footnote: “*Based on 2,000 kcal/day”
- [ ] #7 Values over 100% display normally (no cap)
- [ ] #8 This is a styling task — human visual sign-off required before commit
<!-- AC:END -->
