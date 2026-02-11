---
id: PF-84
title: 'Spike: Dough stretching & short-proof mitigation'
status: Done
assignee: []
created_date: '2026-02-09 04:18'
updated_date: '2026-02-09 05:45'
labels:
  - spike
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Research protips for stretching dough with only a 1-day cold proof. Techniques to improve extensibility without longer ferment. Feeds future recipe version bump.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Document minimum cold proof time for good extensibility at 62% hydration
- [ ] #2 List techniques that improve stretchability without longer ferment (autolyse, hydration, oil, warm-up time, etc.)
- [ ] #3 Document common causes of dough tearing during hand stretch
- [ ] #4 Summary documented in task notes for future version bump
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Spike Findings: Dough Stretching & Short-Proof Mitigation

### Root Cause
5g yeast (1.35%) + 24hr cold proof = underproofed. At fridge temps, fermentation runs ~4× slower than room temp. 24hr cold ≈ 6hr room temp equivalent — not enough for enzymatic gluten relaxation.

### Minimum Proof Times (62% hydration)
- **24hr**: Absolute minimum, gluten not fully relaxed
- **48hr**: Sweet spot — significant jump in extensibility
- **72hr**: Peak flavor + extensibility, can stretch direct from cooler

### Mitigation Techniques (ranked)

**Tier 1 — High impact:**
1. Extended room-temp warm-up (2-3hrs, not 30-60min)
2. Reduce yeast to 1.5-2g (0.3-0.5%) for cold ferment workflow
3. Bulk ferment 1-2hrs at room temp BEFORE refrigerating

**Tier 2 — Moderate impact:**
4. True autolyse (flour+water ONLY, no salt/oil, then add rest after 30min)
5. Bump hydration to 63-65% (+8-11g water)

**Tier 3 — Helpful extras:**
6. Mid-stretch rest (10-15min under inverted bowl if dough snaps back)

### Common Stretch Mistakes
- Stretching cold dough (#1 cause)
- Over-kneading / over-tightening balls
- Pulling instead of pressing from center
- Not resting after balling (need 30-60min minimum)
- Insufficient fermentation (our issue)

### Ball Size Note
Current 310g balls are on the heavy side for 12". Standard is ~250g. Consider 3 balls from scaled recipe.

### Sources
- [PizzaBlab — Cold Ferment Guide](https://www.pizzablab.com/learning-and-resources/fermentation/how-to-cold-ferment-pizza-dough/)
- [PizzaBlab — Under vs Over-Fermented](https://www.pizzablab.com/learning-and-resources/fermentation/under-and-over-fermentation/)
- [Crust Kingdom — Stop Dough Shrinking](https://www.crustkingdom.com/how-to-keep-pizza-dough-from-shrinking/)
- [King Arthur — How to Stretch Pizza Dough](https://www.kingarthurbaking.com/blog/2024/02/14/how-to-stretch-pizza-dough)
- [Pizza Today — Stop the Snapback](https://pizzatoday.com/topics/dough-production-development/knead-to-know-stop-the-snapback/)
- [Home Cooking Collective — 72hr Cold Fermented Dough](https://homecookingcollective.com/cold-fermented-pizza-dough-recipe/)
- [Baking Steel — 72hr Dough Recipe](https://bakingsteel.com/blogs/recipes/72-hour-pizza-dough-recipe)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
24hr proof + 5g yeast confirmed as root cause of underproofing. Key recommendation: extend to 48hr+ OR reduce yeast to 1.5-2g. Secondary: 2-3hr warm-up before stretching, true autolyse (flour+water only). Findings documented for future recipe version bump.
<!-- SECTION:FINAL_SUMMARY:END -->
