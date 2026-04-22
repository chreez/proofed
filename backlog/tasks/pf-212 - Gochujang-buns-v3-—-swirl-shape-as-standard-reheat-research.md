---
id: PF-212
title: Gochujang buns v3 — swirl shape as standard + reheat research
status: To Do
assignee: []
created_date: '2026-04-22'
labels:
  - recipe-update
dependencies:
  - PF-212.1
priority: medium
---

# Gochujang buns v3 — swirl shape as standard + reheat research

## Context

Bake #3 (2026-04-22) A/B tested 6 cinnamon-roll swirl buns vs 6 standard scored rounds. Swirl was the clear winner — better bread flavor, more surface for glaze absorption. User wants swirl to become the standard shape in v3.

## Key findings from bake #3

- Swirl style: roll out dough, add melted butter pat + minced confit garlic, roll up like cinnamon roll, slice
- Better overall bread flavor than round buns
- More exposed surface area = better honey-soy glaze penetration
- Butter/confit in roll-up could replace the post-rise fold-in step — more even distribution
- Concern: potential dryness on reheat with the layered structure
- Uniformity challenge: need consistent roll sizing for even baking (12 buns)

## Source bakes

- Bake #3 (2026-04-22): A/B test, swirl declared winner
- Bake #2 (2026-04-19): bloomed/blistered top absorbed glaze better — related to surface area insight
- Bake #1 (2026-04-17): baseline standard shape

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 **Blocked by** PF-212.1 research spike — do not begin SHAPE rewrite until spike findings reviewed
- [ ] #2 SHAPE stage rewritten: `fold-in-garlic` + `divide` + `final-shape` replaced with roll-out → fill → roll-up → slice approach per research findings
- [ ] #3 Filling step uses melted butter + minced confit garlic (existing ingredients only)
- [ ] #4 Roll sizing guidance included — exit condition or note addresses uniform portioning for 12 buns
- [ ] #5 Yield updated: `meta.yields` = 12 buns, `nutrition.servings`, `cost.servings`, `config.stats.defaultYield` all updated
- [ ] #6 Reheat block updated with method validated for layered/swirled structure (moisture retention addressed)
- [ ] #7 All stage `exit_condition` values still make sense for new swirl process
- [ ] #8 Version bumped to v3.0.0 with `change_log` entry summarizing shape change
- [ ] #9 `npm run build` passes
<!-- AC:END -->
