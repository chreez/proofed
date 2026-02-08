---
id: PF-70
title: 'Add recipe: CoCo Ichibanya-style Japanese Curry'
status: Done
assignee: []
created_date: '2026-02-07 20:43'
updated_date: '2026-02-08 09:02'
labels:
  - recipe
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the recipe JSON for a CoCo Ichibanya-style Japanese curry, built from the research synthesis (9 search agents, 45+ sources, 19 retail product labels analyzed).

Research source material stored in `photos-source/coco-curry/research/coco-curry-research-synthesis.md`.

Follows the same pattern as existing recipes:
- `public/recipes/coco-curry.json` following schema in `src/types/recipe.ts`
- Entry in `public/recipes/index.json`
- Run `/validate` to verify

Key recipe characteristics from research:
- Smooth, blended sauce (no visible chunks)
- Java Curry Medium Hot roux base
- Triple onion treatment (caramelized + fried + raw)
- Kakushi aji: grated apple, mango chutney, Worcestershire, instant coffee, dark chocolate, miso, peanut butter
- Overnight rest mandatory
- Pork shoulder or chicken thigh protein options

This is the first recipe generated entirely from multi-agent web research rather than a single cookbook source.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Recipe JSON — public/recipes/coco-curry.json created following recipe schema (meta, config, vessels, stages, states)
- [x] #2 Index entry — added to public/recipes/index.json
- [x] #3 Research field populated — research.sources[] contains 60+ sources from synthesis, research.strategy describes multi-agent approach, research.sourceCount and research.date set
- [x] #4 Ingredient provenance — every ingredient has sourcedFrom, confidence (high/medium/low per synthesis tiers), and rationale fields
- [x] #5 Technique provenance — research.techniques[] covers the 9 technique findings with source attribution and confidence
- [x] #6 Units compliant — grams only, Celsius with Fahrenheit, centimeters (D1-D3)
- [x] #7 State rules — timer only on passive states, every state has exit_condition, one action per state (D4, D5, D9)
- [x] #8 Ingredient sums — breakdown amounts sum to totals (D6)
- [x] #9 Passes /validate
- [x] #10 npm run build passes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Created `public/recipes/coco-curry.json` — the first fully agent-researched recipe with complete provenance data.

**Recipe**: CoCo Ichibanya-Style Japanese Curry (4-6 servings, ~24 hrs with overnight rest)

**Structure**:
- 7 stages, 17 states following the 6-stage synthesis structure (Onion Base, Build Curry, Add Roux, Blend & Season, Overnight Rest, Serve)
- 23 ingredients with full provenance (sourcedFrom, confidence tier, rationale)
- 4 vessels with documented reuse chains
- All units in grams (liquids converted from ml to g)
- timer: true only on passive states (COOL_AND_REST, COOK_RICE)

**Research field** (first recipe to use this):
- 64 sources cataloged in research.sources[]
- 9 techniques documented with confidence levels
- Strategy describes the multi-agent research methodology

**Key decisions**:
- Used "g" for all liquid units (not ml) to pass validation tests
- Removed timer:true from active states (caramelize, simmer, season) to comply with passive-only timer rule
- Renamed COOK_RICE to "Cook Rice and Rest" to match passive state pattern

All 387 tests pass, type-check clean, build succeeds.
<!-- SECTION:FINAL_SUMMARY:END -->
