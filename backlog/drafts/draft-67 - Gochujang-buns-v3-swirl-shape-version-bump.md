---
id: DRAFT-67
title: "Gochujang buns v3 — swirl shape as standard + reheat research"
status: Draft
priority: Medium
labels: [recipe-update]
recipe: gochujang-garlic-buns
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

## What needs to happen

1. **Rewrite SHAPE stage** — replace fold-in-garlic + divide + final-shape states with roll-out → fill → roll-up → slice approach
2. **Research reheat methods** for layered/swirled enriched bread — ensure moisture retention
3. **Update reheat block** based on research findings
4. **Confit amount** — consider increasing to use all garlic from confit (currently ~25g of ~50g). More garlic = more flavor.
5. **Roll sizing guidance** — add notes on getting uniform swirl rolls from a single dough sheet
6. **Yield change** — likely moving from 10 to 12 buns (update meta.yields, nutrition.servings, cost.servings, config.stats.defaultYield)
7. **Version bump** to v3.0.0 (major shape change affects multiple stages)
8. **Validate** all steps and exit conditions still make sense for new process

## Source bakes

- Bake #3 (2026-04-22): A/B test, swirl declared winner
- Bake #2 (2026-04-19): bloomed/blistered top absorbed glaze better — related to surface area insight
- Bake #1 (2026-04-17): baseline standard shape
