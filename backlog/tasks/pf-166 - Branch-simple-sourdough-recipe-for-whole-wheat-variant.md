---
id: PF-166
title: Branch simple sourdough recipe for whole wheat variant
status: To Do
assignee: []
created_date: '2026-03-09 00:21'
updated_date: '2026-04-10 14:18'
labels:
  - recipe
  - variant
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a flavor-focused variant of simple sourdough as a separate recipe file, swapping some bread flour for whole wheat and/or rye — whatever research says gives the best flavor payoff without adding complexity. Same simple workflow (mix, fold, overnight bulk, shape, cold proof, bake), just better flavor.

Motivated by desire for "more complexity" noted across bake logs #5, #6, #7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Research spike (subtask) completed using /research skill with documented findings on: optimal bread flour / whole wheat / rye blend ratios for flavor, hydration adjustment per % of whole grain, fermentation timing impact, and any shaping considerations
- [x] #2 New recipe JSON file created (e.g., simple-sourdough-wheat.json) as a separate file in public/recipes/
- [x] #3 Recipe added to public/recipes/index.json
- [x] #4 Recipe uses the same stage structure as simple-sourdough (mix, fold, overnight bulk, shape, cold proof, bake) — no new stages or complexity
- [x] #5 Flour blend and hydration adjusted per spike findings, with rationale fields citing the research
- [x] #6 All other ingredients (salt, starter) recalculated if ratios change
- [x] #7 meta.source references simple-sourdough as the base recipe with type: adapted
- [x] #8 Nutrition block recalculated for the new flour blend
- [x] #9 Recipe passes /validate (D1-D16, S1-S5)
- [ ] #10 First bake logged against this recipe to verify the numbers work in practice
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Research Findings (PF-166.1 Spike Output)\n\n### Recommended Blend (1000g total flour)\n- Bread flour: 800g (80%)\n- Whole wheat flour: 150g (15%)\n- Dark rye flour: 50g (5%)\n\n### Full Formula\n- Bread flour: 800g\n- Whole wheat flour: 150g\n- Dark rye flour: 50g\n- Water: 740g (74% hydration)\n- Starter: 150g (15% inoculation)\n- Salt: 20g (2%)\n\n### Key Adjustments\n1. Hydration: 70% → 74% (+40g water) — bran absorbs 2-3x its weight in water\n2. Inoculation: 20% → 15% (-50g starter) — whole grain ferments faster, prevents over-fermentation\n3. Salt: unchanged at 2%\n\n### Rationale\n- 15% WW + 5% rye = \"pain de campagne\" sweet spot per Tartine, The Perfect Loaf, King Arthur\n- Tartine Basic Country is 10% WW; 15-20% is where flavor becomes noticeable per multiple sources\n- 5% rye adds fruity/spicy complexity that WW alone cannot, plus slows staling\n- Conservative 74% hydration — can go up to 75% if dough feels tight\n- 15% inoculation offsets faster whole-grain fermentation for same overnight window\n\n### HEB Flour Availability\n- Whole wheat: King Arthur 5lb/$5.58, H-E-B Baker's Scoop 5lb/$3.58, Central Market 5lb/$4.48\n- Rye: Bob's Red Mill Dark Rye 1.25lb/$3.48, Arrowhead Mills 1.25lb/$5.48\n\n### Sources (18 cited)\nThe Perfect Loaf, King Arthur Baking, Tartine/Chad Robertson, Breadtopia, The Clever Carrot, The Sourdough Framework, The Fresh Loaf, yoursourdoughstart.com, Grant Bakes, chillspice.com, Pain de Campagne tradition\n\n### Shaping & Scoring Notes\n- Boule shape preferred for whole grain (less spreading)\n- Deeper primary score (1/2 inch vs 1/4 inch)\n- More bench flour — whole grain dough is stickier\n- Expect slightly less ear — normal at 20% whole grain\n- Cold score from fridge remains ideal (already in workflow)

2026-04-10: Demoted from In Progress → To Do during stale task triage. Research subtask PF-166.1 is Done with detailed findings. Implementation ready when wanted — all ACs except #10 (first bake) are checked.
<!-- SECTION:NOTES:END -->
