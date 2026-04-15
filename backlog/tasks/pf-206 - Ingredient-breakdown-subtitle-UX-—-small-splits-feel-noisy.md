---
id: PF-206
title: Ingredient breakdown subtitle UX — small splits feel noisy
status: To Do
assignee: []
created_date: '2026-04-15 22:30'
updated_date: '2026-04-15 22:39'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When an ingredient has a breakdown (e.g., caster sugar: 4g yeast bloom, 36g dough), the subtitle text shows underneath the ingredient name in the gather section. For ingredients where the split is small or obvious from directions, this reads as noise rather than helpful context. Noticed on gochujang-garlic-buns recipe — "4g yeast bloom, 36g dough" under Caster Sugar felt confusing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Demo spike (PF-206.1) shows 3-4 visual techniques side-by-side using real recipe breakdown data (caster sugar 4g/36g, butter 3-way split, flour 2-way split)
- [ ] #2 After demo review: chosen technique applied to GatherSection.vue breakdown rendering
- [ ] #3 Helpful breakdowns stay visible — splits across 3+ uses or where amounts aren't obvious from directions remain clear
- [ ] #4 Trivial breakdowns de-emphasized — small/obvious splits don't clutter the gather list
- [ ] #5 UI-only change — no modifications to recipe JSON breakdown arrays
- [ ] #6 All recipes with breakdowns render correctly — no regressions
<!-- AC:END -->
