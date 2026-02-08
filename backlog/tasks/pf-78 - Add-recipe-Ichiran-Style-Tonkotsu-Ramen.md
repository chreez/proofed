---
id: PF-78
title: 'Add recipe: Ichiran-Style Tonkotsu Ramen'
status: To Do
assignee: []
created_date: '2026-02-08 17:44'
updated_date: '2026-02-08 18:10'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Execution Plan

### Overview
Create `public/recipes/ichiran-ramen.json` with 8 sub-recipes modeled as stages, 92 sources in the research block, and full ingredient provenance. Add entry to `public/recipes/index.json`.

### Step 1: Scaffold — Meta, Config, Vessels, Version
- **meta.name**: "Ichiran-Style Tonkotsu Ramen"
- **meta.source**: `{ name: "Multi-Agent Research Synthesis", type: "original", author: "proofed. research (8 agents, 92 sources)" }`
- **meta.yields**: "6-8 servings"
- **meta.total_time**: "~14 hrs (mostly passive broth simmering)"
- **meta.description**: Summary from synthesis executive summary — clean tonkotsu + red sauce identity
- **config.early_check_percent**: 0.8
- **version**: "v1.0.0"
- **change_log**: Initial entry dated 2026-02-08

**Vessels** (map from synthesis — target ≤6 with reuse chains):
| ID | Name | Reuse |
|----|------|-------|
| V1 | Large Stock Pot (8L+) | Blanch bones → main broth cook |
| V2 | Medium Saucepan | Tare dashi → tare assembly → freed |
| V3 | Small Saucepan | Aroma oil → freed → red sauce |
| V4 | Large Bowl | Ice bath (eggs) → assembly bowls |
| V5 | Zip-Lock Bags | Noodle kneading → egg marinade |
| V6 | Pasta Machine | Noodle sheeting/cutting |

### Step 2: Stages — Map Synthesis Sub-Recipes to Stage IDs

| Stage ID | Title | Gather? | States |
|----------|-------|---------|--------|
| PREP | Mise en Place | Yes (all vessels, equipment, ingredients) | PREP_WORKSPACE |
| BROTH | Tonkotsu Broth | null | SOAK_BONES, BLANCH_BONES, SCRUB_BONES, MAIN_COOK, ADD_AROMATICS, BREAK_BONES, STRAIN_BROTH, GELATION_TEST |
| TARE | Tare (Seasoning Sauce) | null | MAKE_DASHI, ASSEMBLE_TARE |
| AROMA_OIL | Aroma Oil | null | RENDER_FAT, STRAIN_OIL |
| RED_SAUCE | Hiden no Tare (Red Sauce) | null | BLOOM_SPICES, COMBINE_WET, AGE_SAUCE |
| NOODLES | Noodles | null | MIX_DOUGH, KNEAD_NOODLES, REST_DOUGH, SHEET_NOODLES, CUT_NOODLES, AGE_NOODLES |
| CHASHU | Chashu | null | SEASON_PORK, COOK_CHASHU, CHILL_CHASHU |
| AJITAMA | Ajitama (Marinated Eggs) | null | BOIL_EGGS, MAKE_MARINADE, MARINATE_EGGS |
| ASSEMBLY | Bowl Assembly | null | HEAT_BOWLS, ASSEMBLE_BOWL, ADD_TOPPINGS |

### Step 3: Ingredients — Full List with Provenance

Source all from synthesis sections 3A-3E and section 5 master recipe. Each ingredient needs:
- `id`, `name`, `total` (grams), `unit: "g"`, `breakdown` (if split across sub-recipes)
- `sourcedFrom`: reference synthesis source codes (S1, S2... → map to source names)
- `confidence`: high/medium/low per synthesis tiers
- `rationale`: why this amount/choice

**Delegatable sub-agent work**: Transcribe all ~30 ingredients from synthesis sections 5A-5H with provenance fields. Agent should cross-reference confidence tiers from section 3.

Key ingredients requiring careful modeling:
- **Pork bones** (1500g femur + 750g trotters + 500g neck): breakdown across BROTH stage, confidence HIGH
- **Red sauce blend** (8+ ingredients): model as individual ingredients with the spice blend amounts
- **Noodle ingredients**: flour + gluten + kansui + salt + water
- **Tare dashi ingredients**: kombu, shiitake, bonito — separate from tare assembly ingredients

### Step 4: States — Write All ~25 States

Each state needs: `id`, `title`, `direction`, `duration_min`, `timer` (true ONLY for passive), `parallel`, `components`, `exit_condition`, `notes[]`.

**Key rules to enforce:**
- D4: `timer: true` only on passive states (SOAK_BONES, MAIN_COOK, AGE_SAUCE, AGE_NOODLES, MARINATE_EGGS, COOL_AND_REST type states)
- D5: every state has non-empty exit_condition
- D9: one physical action per state
- D12: technique references for complex steps (bone scrubbing, emulsification, foot-kneading noodles)

**States that need technique_url or detailed notes:**
- SCRUB_BONES — bone cleaning technique
- MAIN_COOK — rolling boil importance (not simmer)
- BLOOM_SPICES — residual heat spice blooming
- KNEAD_NOODLES — foot method at 29% hydration

### Step 5: Research Block

**research.strategy**: "8 parallel search agents using distinct strategies: copycat recipe aggregation, Japanese-language sources, product label reverse-engineering (7 Ichiran products), red sauce deep dive, community intelligence (Reddit/forums), tonkotsu broth food science, noodle science and manufacturing, and deep-dive article analysis. Key breakthrough: cross-referencing Umakara Kokumashi bridge product label revealed red sauce flavor profile."

**research.sourceCount**: 92
**research.date**: "2026-02-08"

**research.sources[]**: Transcribe all 92 sources from synthesis section 7 "Full Source Registry." Each source: `{ name, url, type, author? }`.

**Delegatable sub-agent work**: Transcribe the 92-entry source registry. Map synthesis source types to schema types (`official` → use source name, `recipe-blog` → `adapted`, etc.). This is mechanical transcription work ideal for a sub-agent.

**research.techniques[]**: Extract 8-10 key techniques from synthesis section 4:
1. Aggressive blanching + bone scrubbing (universal, HIGH)
2. Rolling boil emulsification (universal, HIGH)
3. Long cook time 12h+ (strong, HIGH)
4. Meticulous scum skimming first 50 min (strong, MEDIUM)
5. 100% pork bones — no chicken (strong, HIGH — Ichiran confirmed)
6. Multi-chili blend for red sauce (universal, HIGH)
7. Red sauce aging minimum 2-3 days (strong, MEDIUM)
8. Sweet-umami-first heat-second in red sauce (strong, HIGH — Umakara label evidence)
9. Tare-first assembly order (universal, HIGH)
10. Red sauce placed as central disc (strong, HIGH — Ichiran visual signature)

### Step 6: Index Entry
Add to `public/recipes/index.json`:
```json
{ "id": "ichiran-ramen", "name": "Ichiran-Style Tonkotsu Ramen", "file": "ichiran-ramen.json" }
```

### Step 7: Validation
1. Run `/validate` — check D1-D16
2. Verify D6 (breakdown sums = totals) for all multi-breakdown ingredients
3. Verify D2 (temps: °F (°C) format — note: synthesis has °F and °C, ensure JSON uses °F (°C))
4. Run `npm run build`

### Delegation Strategy

| Work | Delegatable? | Notes |
|------|-------------|-------|
| Source registry (92 entries) | YES — sub-agent | Mechanical transcription from synthesis §7 |
| Ingredient provenance fields | YES — sub-agent | Cross-reference synthesis §3 confidence tiers with §5 amounts |
| State writing (25 states) | PARTIAL — sub-agent can draft, main agent reviews | States need careful exit_condition and timer rules |
| Research techniques | NO — main agent | Requires judgment on which techniques to include |
| Validation | NO — main agent | Must run /validate and npm run build |

### Estimated Complexity
- **Ingredients**: ~30 unique (comparable to CoCo curry's ~20, more due to sub-recipe count)
- **States**: ~25 (comparable to CoCo curry's ~15, more due to 8 sub-recipes vs 7 stages)
- **Sources**: 92 (highest yet — CoCo was 64)
- **Hardest parts**: Red sauce reconstruction (8+ ingredients, aging), per-bowl assembly ratios, noodle specs (low hydration, kansui ratio)
<!-- SECTION:PLAN:END -->
