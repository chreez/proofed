---
id: PF-83
title: 'Spike: Pizza dough scaling research'
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
Research whether 1:1 linear scaling works for pizza dough or if there are gotchas (hydration, yeast, fermentation timing).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Document whether 1:1 linear scaling holds for 62% hydration pizza dough at 25-100% increases
- [ ] #2 Research yeast scaling behavior (linear vs sublinear)
- [ ] #3 Research fermentation timing adjustments for larger dough mass
- [ ] #4 Summary with scaling recommendation written to PF-82 implementation notes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Spike Findings: Pizza Dough Scaling Research

**Verdict: Linear ×1.25 works. No adjustments needed.**

- Under the 1500g threshold where "mass effects" start mattering (Busby's Bakery)
- Yeast scales linearly at home batch sizes — pizzamaking.com moderator consensus
- No fermentation timing changes for 25% increase (thermal mass difference negligible)
- Salt, hydration, mixing time — all scale linearly

### Recommended scaled values (×1.25)

| Ingredient | Current | ×1.25 | Rounded |
|---|---|---|---|
| Bread Flour | 370g | 462.5g | 463g |
| Water | 230g | 287.5g | 288g |
| Instant Yeast | 5g | 6.25g | 6g |
| Olive Oil | 14g | 17.5g | 18g |
| Sugar | 15g | 18.75g | 19g |
| Salt | 6g | 7.5g | 8g |

Yields ~775g total dough (2 large or 3 standard balls).

### Sources
- [Busby's Bakery — Batch Size Guide](https://www.busbysbakery.com/increase-the-batch-size-of-a-recipe/)
- [PizzaMaking.com — Yeast Scaling Thread](https://www.pizzamaking.com/forum/index.php?topic=63086.0)
- [The Fresh Loaf — Scaling Discussion](https://www.thefreshloaf.com/node/69238/how-scale-dough-recipe)
- [PizzaBlab — Bulk vs Ball Fermentation](https://www.pizzablab.com/learning-and-resources/fermentation/bulk-vs-ball-fermentation/)
- [King Arthur — Friction Factor](https://www.kingarthurbaking.com/blog/2018/08/27/determining-the-friction-factor-in-baking)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Linear ×1.25 scaling confirmed safe for all ingredients. No yeast, fermentation, or mixing adjustments needed at this batch size (under 1500g threshold). Scaled values documented for PF-82 implementation.
<!-- SECTION:FINAL_SUMMARY:END -->
