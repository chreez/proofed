---
id: PF-79
title: 'Add recipe: Tomita/Fuunji-Style Gyokai-Tonkotsu Tsukemen'
status: Done
assignee: []
created_date: '2026-02-08 18:05'
updated_date: '2026-02-08 18:26'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Execution Plan

### Overview
Create `public/recipes/tomita-tsukemen.json` with 8+ sub-recipes modeled as stages, 70+ sources in the research block, full ingredient provenance, explicit soup-wari modeling, and noodle cold-shock (shimeru). Add entry to `public/recipes/index.json`.

### Step 1: Scaffold — Meta, Config, Vessels, Version
- **meta.name**: "Tomita/Fuunji-Style Gyokai-Tonkotsu Tsukemen"
- **meta.source**: `{ name: "Multi-Agent Research Synthesis", type: "original", author: "proofed. research (8 agents, 70+ sources)" }`
- **meta.yields**: "~8 servings"
- **meta.total_time**: "~2 days (Day 1: noodles + tare, Day 2: broth + assembly)"
- **meta.description**: Summary from synthesis — ultra-concentrated dipping broth, double soup method, three-mechanism thickness, cold noodles, soup-wari system
- **config.early_check_percent**: 0.8
- **version**: "v1.0.0"
- **change_log**: Initial entry dated 2026-02-08

**Vessels** (target ≤6 with reuse chains):
| ID | Name | Reuse |
|----|------|-------|
| V1 | Pressure Cooker (6L+) | Blanch bones → Phase 1-2 pressure cook → Phase 3 open boil |
| V2 | Large Pot | Fish dashi extraction → soup-wari broth |
| V3 | Medium Saucepan | Tare cold soak → tare assembly |
| V4 | Blender/Immersion Blender | Bone slurry blending |
| V5 | Pasta Machine + Large Bowl | Noodle making → noodle cold-shock |
| V6 | Small Pan | Chashu braising marinade |

### Step 2: Stages — Map Synthesis Components to Stage IDs

| Stage ID | Title | Gather? | States |
|----------|-------|---------|--------|
| PREP | Mise en Place | Yes (all vessels, equipment, ingredients) | PREP_WORKSPACE |
| TARE | Tare (Day 1 — Cold Soak) | null | COLD_SOAK_TARE, HEAT_TARE, FINISH_TARE |
| NOODLES | Noodles (Day 1 — Must Rest 24h) | null | DISSOLVE_KANSUI, MIX_DOUGH, REST_DOUGH_1, SHEET_NOODLES, REST_DOUGH_2, FINAL_ROLL, CUT_NOODLES, AGE_NOODLES |
| BROTH | Animal Broth (Day 2) | null | BLANCH_BONES, CLEAN_BONES, PRESSURE_PHASE_1, PRESSURE_PHASE_2, REMOVE_CHASHU, ADD_AROMATICS, STRAIN_BROTH, BLEND_SLURRY |
| FISH_DASHI | Fish Dashi | null | HEAT_WATER, STEEP_KOMBU_NIBOSHI, ADD_KATSUOBUSHI_SABABUSHI, STEEP_FISH, STRAIN_DASHI, ADD_GYOFUN_TO_BROTH |
| GYOFUN | Gyofun (Fish Powder) | null | TOAST_FISH, GRIND_GYOFUN |
| CHASHU | Chashu & Ajitama | null | MARINATE_CHASHU, BOIL_EGGS, MARINATE_EGGS |
| ASSEMBLY | Bowl Assembly | null | HEAT_DIPPING_BOWL, ASSEMBLE_DIPPING_BROTH, COOK_NOODLES, COLD_SHOCK_NOODLES, PLATE_NOODLES, ADD_TOPPINGS |
| SOUP_WARI | Soup-Wari (Post-Noodle Dilution) | null | HEAT_DILUTION_BROTH, SERVE_SOUP_WARI |

**Key AC-specific stages:**
- AC#9: Multi-component assembly modeled as separate stages with per-bowl ratios ✓
- AC#10: Soup-wari as explicit final stage ✓
- AC#11: Noodle cold-shock (shimeru) as explicit state (COLD_SHOCK_NOODLES) ✓

### Step 3: Ingredients — Full List with Provenance

Source from synthesis ingredient confidence tables (Tier 1-3) and master recipe components 1-6.

**PREP stage gather.ingredients** (all ingredients for entire recipe):

**Animal broth ingredients (~8):**
- pork_bones (1500g femur/neck — HIGH)
- chicken_feet (500g — HIGH, "70% pure collagen, non-negotiable")
- chicken_backs (1500g — HIGH)
- pork_belly (1000g — STRONG, dual-purpose: broth collagen + chashu)
- yellow_onion (1 quartered — STRONG)
- ginger (4 coins — STRONG)
- garlic (10 cloves — STRONG)

**Fish dashi ingredients (~5):**
- kombu (20g — HIGH)
- niboshi (80g — HIGH, "primary fish backbone")
- katsuobushi (50g thick-cut — HIGH)
- sababushi (50g thick-cut — HIGH)
- gyofun_broth (30g for adding to broth — HIGH)

**Tare ingredients (~7):**
- soy_sauce (450g koikuchi — HIGH)
- hon_mirin (50g — HIGH)
- kombu_tare (15g — for cold soak, separate from dashi kombu)
- niboshi_tare (20g — for cold soak)
- sake (20g — STRONG)
- brown_sugar (20g — STRONG)
- katsuobushi_tare (15g — for finishing steep)
- msg (5g — STRONG, optional)

**Gyofun ingredients (~4):**
- sababushi_powder (40% of blend)
- katsuobushi_powder (30%)
- niboshi_powder (20%)
- flounder_powder (10%, optional)

**Noodle ingredients (~5):**
- bread_flour (940g — HIGH)
- whole_wheat_flour (60g — STRONG, 6% for Tomita-style color/flavor)
- water_noodles (420g — 42% hydration)
- kansui (10g — 80:20 Na:K ratio, reversed from thin ramen)
- salt_noodles (10g)

**Chashu/ajitama ingredients (~5):**
- soy_sauce_chashu (200g)
- mirin_chashu (100g)
- brown_sugar_chashu (50g)
- eggs (6)
- water_chashu (200g)

**Assembly condiments (~4):**
- rice_vinegar (per bowl — HIGH, "prevents palate fatigue")
- nori, menma, green_onion

**Ingredient provenance notes:**
- Every ingredient gets `sourcedFrom` referencing synthesis agent count and key sources
- Confidence tiers mapped directly from synthesis tables
- Rationale explains why this amount/choice was selected

**Delegatable sub-agent work**: Transcribe all ~40+ ingredients from synthesis with full provenance fields.

### Step 4: States — Write All ~30 States

Key timer rules (D4 compliance):
- `timer: true` ONLY on: AGE_NOODLES (24h+), COLD_SOAK_TARE (6-24h), PRESSURE_PHASE_1 (1h), PRESSURE_PHASE_2 (1h), STEEP_KOMBU_NIBOSHI (20min), STEEP_FISH (15min), MARINATE_CHASHU (passive), MARINATE_EGGS (8-24h), BOIL_EGGS (6.5min)
- All active hands-on states: `timer: false`

**Critical states requiring detailed direction + technique notes:**

1. **BLEND_SLURRY** — THE signature technique. "Transfer 2/3 of cooked bones/meat to blender with enough broth to blend. Blend into smooth slurry. Return to strained broth." Add `notes: [{ text: "This is what creates Tomita-level thickness — without this step you get tonkotsu, not tsukemen-thick", critical: true }]`

2. **STEEP_KOMBU_NIBOSHI** — Temperature-controlled fish extraction. "Heat water to 176°F (80°C). Add kombu and niboshi. Hold at 176°F (80°C) for 20 minutes. Do NOT boil — boiling extracts bitter compounds." `notes: [{ text: "Boiling fish is the #1 mistake — steep at 176-194°F (80-90°C) only", critical: true }]`

3. **COLD_SHOCK_NOODLES** — Shimeru technique. "Drain cooked noodles. Shock in ice-cold water until completely chilled. Drain well and arrange on plate." Exit condition: "Noodles are cold, firm, and springy with no residual starch."

4. **SERVE_SOUP_WARI** — Soup-wari. "Provide a small pot of hot fish dashi or light chicken broth on the side. After finishing noodles, diner pours hot broth into remaining dipping sauce to dilute to sippable consistency. Add yuzu peel or extra green onion."

### Step 5: Research Block

**research.strategy**: "8 parallel search agents using distinct strategies: copycat recipe aggregation, Japanese-language ramen blogs (Men to Choujin, Ramen Cook), food science and collagen extraction research, Reddit/r/ramen community (especially Ramen_Lord's Tomita clone), YouTube creator analysis, noodle science and manufacturing (Yamato Noodle, Myojo), specialty ingredient sourcing, and restaurant/documentary deep dives (Tomita official site, Fuunji interview, Ramen Heads documentary). Key insight: the 'secret' is three-mechanism thickness (collagen + blended solids + emulsification) combined with umami synergy between glutamic acid and inosinic acid."

**research.sourceCount**: 74 (count from synthesis registry)
**research.date**: "2026-02-08"

**research.sources[]**: Transcribe all 74 sources from synthesis "Full Source Registry" (lines 414-492).

**Delegatable sub-agent work**: Transcribe the 74-entry source registry. Map source types to schema types.

**research.techniques[]**: Extract 10+ key techniques from synthesis:
1. Double soup method — animal + fish cooked separately (universal, HIGH)
2. Blending bone solids back into broth — slurry technique (universal, HIGH)
3. Temperature-controlled fish extraction 176-194°F (80-90°C) (universal, HIGH)
4. Tare cold soak — kombu + niboshi in soy sauce 6-24h (strong, HIGH)
5. Noodles served cold — shimeru technique (universal, HIGH)
6. Soup-wari finishing dilution system (universal, HIGH)
7. Pressure cooking acceleration — 5-6h vs 13-18h stovetop (strong, MEDIUM)
8. Gyofun as finishing garnish — progressive intensification (strong, HIGH)
9. 24h+ noodle rest — eliminates air bubbles, develops flavor (strong, MEDIUM)
10. Aromatics added late — only final 45-60 min (strong, MEDIUM)
11. Forced emulsification — immersion blender shortcut (notable, MEDIUM)
12. Kansui ratio 80:20 Na:K — reversed from thin ramen (confirmed, HIGH)

### Step 6: Temperature Format Compliance (D2)

The synthesis uses mixed formats. Standardize all to **°F (°C)** per D2:
- Fish extraction: 176°F (80°C) — not 80-90°C
- Tare heating: 175°F (79°C)
- Pressure cooking: standard pressure (no temp needed)
- Baked baking soda: 250°F (121°C) (in notes only)

### Step 7: Index Entry
Add to `public/recipes/index.json`:
```json
{ "id": "tomita-tsukemen", "name": "Tomita/Fuunji-Style Gyokai-Tonkotsu Tsukemen", "file": "tomita-tsukemen.json" }
```

### Step 8: Validation
1. Run `/validate` — check D1-D16
2. Verify D6 (breakdown sums = totals) for split ingredients
3. Verify D2 (all temps in °F (°C) format)
4. Verify D4 (timer only on passive states)
5. Verify AC#9 (multi-component assembly), AC#10 (soup-wari), AC#11 (shimeru)
6. Run `npm run build`

### Delegation Strategy

| Work | Delegatable? | Notes |
|------|-------------|-------|
| Source registry (74 entries) | YES — sub-agent | Mechanical transcription from synthesis registry |
| Ingredient provenance fields | YES — sub-agent | Cross-reference synthesis confidence tiers with master recipe amounts |
| State writing (~30 states) | PARTIAL — sub-agent can draft, main agent reviews | Timer rules, exit conditions, and critical notes need review |
| Noodle spec states | NO — main agent | Kansui ratio, hydration %, whole wheat % are technical details |
| Soup-wari modeling | NO — main agent | Novel stage pattern, needs careful exit_condition design |
| Research techniques | NO — main agent | Requires judgment on selection and confidence |
| Validation | NO — main agent | Must run /validate and npm run build |

### Estimated Complexity
- **Ingredients**: ~40+ unique (most complex recipe yet)
- **States**: ~30 (most complex recipe yet)
- **Sources**: 74
- **Multi-day recipe**: Day 1 (tare cold soak, noodles), Day 2 (broth, assembly)
- **Hardest parts**: Bone slurry technique, temperature-controlled fish extraction, soup-wari as dual-use broth (concentrated for dipping / balanced when diluted ~50%), correct kansui ratio modeling
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Created `public/recipes/tomita-tsukemen.json` (2,120 lines) — Tomita/Fuunji-Style Gyokai-Tonkotsu Tsukemen.

**Stats:** 74 research sources, 31 ingredients with full provenance, 39 states across 9 stages (Prep, Tare, Noodles, Animal Broth, Fish Dashi, Gyofun, Chashu, Assembly, Soup-Wari), 6 vessels with reuse chains, 12 research techniques.

**Key modeling decisions:**
- Soup-wari modeled as explicit final stage (AC#10) with HEAT_DILUTION_BROTH and SERVE_SOUP_WARI states
- Noodle cold-shock (shimeru) modeled as explicit COLD_SHOCK_NOODLES state (AC#11)
- Bone slurry blending (BLEND_SLURRY) documented as the signature technique with critical note
- Temperature-controlled fish extraction at 176°F (80°C) with critical "never boil" note
- Multi-day recipe: Day 1 (tare cold soak, noodles), Day 2 (broth, dashi, assembly)
- 7 shared ingredients consolidated with breakdowns (soy sauce 700g across 3 sub-recipes, etc.)
- Placeholder nutrition block added (pending PF-79.1 USDA pipeline)
<!-- SECTION:FINAL_SUMMARY:END -->
