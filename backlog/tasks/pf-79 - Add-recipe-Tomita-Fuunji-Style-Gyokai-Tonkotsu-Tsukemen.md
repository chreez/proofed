---
id: PF-79
title: 'Add recipe: Tomita/Fuunji-Style Gyokai-Tonkotsu Tsukemen'
status: To Do
assignee: []
created_date: '2026-02-08 18:05'
labels:
  - recipe
dependencies: []
references:
  - photos-source/tomita-tsukemen/research/tomita-tsukemen-research-synthesis.md
  - backlog/docs/doc-2 - Recipe-Creation-Task-Template.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the recipe JSON for a Tomita/Fuunji-style gyokai-tonkotsu tsukemen, built from the research synthesis (8 agents, 70+ sources).

Research source material: `photos-source/tomita-tsukemen/research/tomita-tsukemen-research-synthesis.md`

Key recipe characteristics from research:
- Double soup method: animal broth (pork bones + chicken) cooked separately from fish dashi (niboshi, katsuobushi, sababushi, kombu) — combined at assembly
- Three-mechanism thickness: collagen extraction + blending bone solids back into broth + mechanical emulsification — creates gravy-thick dipping broth
- Temperature-controlled fish extraction at 80-90°C (176-194°F) — boiling fish = bitter
- Fat wheat noodles: 42% hydration, 6% whole wheat, 3mm thick, 80:20 Na:K kansui (reversed from thin ramen), served cold (shimeru)
- Tare cold-soak: kombu + niboshi in soy sauce 6-24h before gentle heating
- Soup-wari system: remaining dipping sauce diluted with hot dashi to sippable consistency — broth must be dual-use (concentrated for dipping, balanced when diluted ~50%)
- Gyofun (fish powder) as finishing garnish — DIY blend: 40% mackerel, 30% bonito, 20% sardine, 10% flounder
- 200g noodle portions (vs 100-120g for ramen) — larger servings standard for tsukemen

Multi-component recipe (6+ sub-recipes): animal broth, fish dashi, tare, aroma oil, noodles, chashu + ajitama, gyofun blend, soup-wari dilution broth

Follows existing recipe pattern:
- `public/recipes/tomita-tsukemen.json` following schema in `src/types/recipe.ts`
- Entry in `public/recipes/index.json`
- Run `/validate` to verify

See doc-2 (Recipe Creation Task Template) for standard process.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe JSON — public/recipes/tomita-tsukemen.json created following recipe schema (meta, config, vessels, stages, states)
- [ ] #2 Index entry — added to public/recipes/index.json
- [ ] #3 Research field populated — research.sources[] contains 70+ sources from synthesis, research.strategy describes 8-agent approach, research.sourceCount and research.date set
- [ ] #4 Ingredient provenance — every ingredient has sourcedFrom, confidence (high/medium/low per synthesis tiers), and rationale fields
- [ ] #5 Technique provenance — research.techniques[] covers key findings (double soup, three-mechanism thickness, temperature-controlled fish extraction, shimeru, soup-wari) with source attribution and confidence
- [ ] #6 Units compliant — grams only, °F (°C), centimeters (D1-D3)
- [ ] #7 State rules — timer only on passive states, every state has exit_condition, one action per state (D4, D5, D9)
- [ ] #8 Ingredient sums — breakdown amounts sum to totals (D6)
- [ ] #9 Multi-component assembly — animal broth, fish dashi, tare, aroma oil, noodles, and gyofun modeled as separate stages with per-bowl assembly ratios documented
- [ ] #10 Soup-wari — dilution broth modeled as a final stage with instructions for post-noodle consumption
- [ ] #11 Noodle cold-shock (shimeru) — modeled as explicit state with cold water rinse technique
- [ ] #12 Passes /validate
- [ ] #13 npm run build passes
<!-- AC:END -->
