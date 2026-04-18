---
id: PF-208
title: Gochujang buns v2.0 — step restructure from first bake feedback
status: Done
assignee: []
created_date: '2026-04-17 17:50'
labels:
  - recipe-feedback
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Recipe feedback from first bake (2026-04-17). Warrants a minor version bump and reassessment of step practicality.

## Feedback Items
1. Split mix-dough step — currently overloaded, should be two separate steps
2. Streamline ingredient flow — instructions bounce around, mise en place not helpful
3. Tangzhong ratio — use round numbers (100g water / 20g flour), specify how much to add (batch makes extra)
4. Add garlic chopping prep step before fold-in-garlic stage
5. Clarify prepared pan — second-rise says prepared pan but no instructions how
6. Consider rest before shaping after dividing
7. Split glaze into two clearer tasks — honey-soy vs butter could be confused
8. Garlic quantity — confit full bulb for practical prep, specify count at fold-in step

## YouTube References
- Tangzhong: https://www.youtube.com/watch?v=x8Ixpeel-Us
- Garlic confit: https://www.youtube.com/watch?v=-HcKWq7WY5E

## Grooming Notes (2026-04-17)

**Dropped from scope** (revisit after next bake):
- Items 1 & 2: mix-dough split / ingredient flow streamline
- Item 9: oven temp adjustment (not enough data from one bake)
- Item 4: garlic chopping prep (already exists as `chop-confit-garlic` state)

## Source
First bake cook_log 2026-04-17
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

- [x] **AC1 — Tangzhong ratio**: `water` ingredient total = 100g, tangzhong bread flour breakdown = 20g (total bread flour = 420g). `make-tangzhong` components show 100g water / 20g flour. Direction says "add all tangzhong to dough."
- [x] **AC2 — Pan prep**: `second-rise` direction explicitly says "Line a sheet pan with parchment paper" instead of "prepared pan." Vessel V4 updated from "25cm Round Baking Pan" to "Sheet Pan" with appropriate reuse note.
- [x] **AC3 — Garlic quantity**: CONFIT stage `garlic` ingredient total updated to ~1 full bulb (~50g). `confit-garlic-setup` components updated. `fold-in-garlic` direction specifies "~6 cloves worth" with note to save extras.
- [x] **AC4 — Bench rest step**: New state `bench-rest` added between divide and shape steps. 5 min rest. Note about shaping gloveless for better feel of surface tension.
- [x] **AC5 — Glaze step clarity**: `mix-glaze` direction and components clearly separate honey-soy mixture from melted butter. No ambiguity that butter is melted alone, not mixed into the honey-soy bowl.
- [x] **AC6 — Version bump**: Version bumped to v1.2.0. `change_log` entry added with summary describing the restructure.
- [x] **AC7 — Nutrition update**: Nutrition breakdown recalculated for changed garlic and tangzhong quantities.
- [x] **AC8 — Build passes**: `npm run build` exits 0 after all changes.
