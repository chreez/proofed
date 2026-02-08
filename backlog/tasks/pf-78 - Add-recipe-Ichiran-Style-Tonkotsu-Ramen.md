---
id: PF-78
title: 'Add recipe: Ichiran-Style Tonkotsu Ramen'
status: To Do
assignee: []
created_date: '2026-02-08 17:44'
labels:
  - recipe
dependencies: []
references:
  - photos-source/ichiran-ramen/research/ichiran-ramen-research-synthesis.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the recipe JSON for an Ichiran-style tonkotsu ramen, built from the research synthesis (8 agents, 92 sources).

Research source material: `photos-source/ichiran-ramen/research/ichiran-ramen-research-synthesis.md`

Key recipe characteristics from research:
- Clean, odor-free tonkotsu broth (100% pork bones, no chicken) via aggressive blanching + 12h rolling boil
- Double-soup technique: tonkotsu base + dashi (bonito, kelp, shiitake, scallop) — confirmed by product labels despite "pure tonkotsu" marketing
- Hiden no tare (red sauce): sweet-first, umami-second, spicy-third — Umakara Kokumashi label is the Rosetta Stone (soy sauce > sugar > yeast extract > garlic > chili)
- Tare (seasoning sauce): light soy base with Ribotide (IMP+GMP nucleotide umami), dashi-enriched
- Aroma oil: rendered lard + garlic (labels show cottonseed oil as primary fat in commercial product)
- Hakata-style thin straight noodles: 29% hydration, 1.25% kansui, 1.1-1.3mm, aged 24-48h
- 7-dimension customization system (flavor strength, richness, garlic, scallion, chashu, red sauce level, noodle firmness)
- Assembly ratio per bowl: 25-30ml tare / 15-20ml oil / 350ml broth / 100-120g noodles

5 sub-recipes in one: broth, tare, aroma oil, red sauce, noodles + chashu and ajitama

Follows existing recipe pattern:
- `public/recipes/ichiran-ramen.json` following schema in `src/types/recipe.ts`
- Entry in `public/recipes/index.json`
- Run `/validate` to verify
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe JSON — public/recipes/ichiran-ramen.json created following recipe schema (meta, config, vessels, stages, states)
- [ ] #2 Index entry — added to public/recipes/index.json
- [ ] #3 Research field populated — research.sources[] contains 90+ sources from synthesis, research.strategy describes 8-agent approach, research.sourceCount and research.date set
- [ ] #4 Ingredient provenance — every ingredient has sourcedFrom, confidence (high/medium/low per synthesis tiers), and rationale fields
- [ ] #5 Technique provenance — research.techniques[] covers key findings (clean tonkotsu, double-soup, red sauce aging, noodle hydration) with source attribution and confidence
- [ ] #6 Units compliant — grams only, Celsius with Fahrenheit, centimeters (D1-D3)
- [ ] #7 State rules — timer only on passive states, every state has exit_condition, one action per state (D4, D5, D9)
- [ ] #8 Ingredient sums — breakdown amounts sum to totals (D6)
- [ ] #9 Multi-component assembly — broth, tare, aroma oil, red sauce, and noodles modeled as separate stages with per-bowl assembly ratios documented
- [ ] #10 Passes /validate
- [ ] #11 npm run build passes
<!-- AC:END -->
