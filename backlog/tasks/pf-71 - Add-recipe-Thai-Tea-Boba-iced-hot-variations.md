---
id: PF-71
title: 'Add recipe: Thai Tea Boba (iced + hot variations)'
status: To Do
assignee: []
created_date: '2026-02-07 23:32'
updated_date: '2026-02-08 10:53'
labels:
  - recipe
dependencies:
  - PF-71.1
references:
  - backlog/documents/doc-1
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New recipe from comprehensive 16-source research synthesis. Two variations: iced (standard) and hot. Includes master recipe with synthesized best practices across all sources.\n\nKey decisions from research:\n- Tea base: pre-made Thai tea mix (Pantai or ChaTraMue), ½ cup to 3 cups water (iced) / 2 cups (hot)\n- Milk: condensed + evaporated (9/16 sources agree)\n- Boba: quick-cook (WuFuYuan brand), served warm in brown sugar syrup, within 2 hours\n- Sweetener: brown sugar preferred over white\n\nThis is the first multi-source agent-researched recipe — good test case for PF-66 (provenance schema). Full synthesis doc needs to be stored as source material.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe JSON created at `public/recipes/thai-tea-boba.json` using ChaTraMue tea mix
- [ ] #2 All measurements in grams (converted from volumetric sources, ±2g tolerance)
- [ ] #3 6 stages: PREP → BREW_TEA → MAKE_BOBA_SYRUP → COOK_BOBA → MIX_MILK → ASSEMBLE
- [ ] #4 `timer: true` on passive states only (SIMMER_COVERED, STEEP, CHILL_TEA, COOK_PEARLS)
- [ ] #5 Hot variation differences noted inline (notes on relevant states), not a separate variant
- [ ] #6 2-hour boba serving window modeled as `critical: true` note on DRAIN_TOSS_SYRUP state
- [ ] #7 Provenance block (PF-66 schema) with ~4-6 primary sources that directly shaped the recipe
- [ ] #8 Additional/secondary sources listed in research section as supporting references
- [ ] #9 Recipe added to `public/recipes/index.json` manifest
- [ ] #10 D4 checklist wording updated: "timer: true only on passive/waiting states" (drop RISE/BAKE/COOL enumeration)
- [ ] #11 D7 checklist wording updated: "gather sections on stages that introduce new ingredients"
- [ ] #12 `npm run build` passes (including recipe schema validation)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Source Material\n\nFull 16-source research synthesis stored as backlog document doc-1.\n\n## Key Notes\n- First multi-source agent-researched recipe — test case for PF-66 (provenance schema)\n- Two variations: iced (standard) + hot\n- Recipe uses volumetric measurements from sources — will need gram conversion for proofed. schema\n- No baking involved — this is a beverage recipe, may need schema consideration (no stages like RISE/BAKE/COOL)\n- Tapioca pearl timing is critical — states should emphasize the 2-hour window"
<!-- SECTION:NOTES:END -->
