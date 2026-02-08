---
id: doc-2
title: Recipe Creation Task Template
type: other
created_date: '2026-02-08 17:46'
---
# Recipe Creation Task Template

Reusable task outline for turning a `/research` synthesis into a shipped recipe JSON. Based on the CoCo curry (PF-70), Thai Tea Boba (PF-71), and Ichiran ramen (PF-78) pipelines.

---

## Pipeline Overview

```
/research {subject}
    → photos-source/{id}/research/{id}-research-synthesis.md
    → PF-XX: Create recipe JSON (parent task)
    → PF-XX.1: Add nutrition data (subtask, blocked by parent)
    → Optional spikes for schema changes, open questions, etc.
```

---

## Phase 0: Research

Run `/research {subject}`. Produces:
- Synthesis report at `photos-source/{id}/research/{id}-research-synthesis.md`
- Cross-source ingredient confidence tiers
- Technique consensus
- Full source registry (aim for 40+ unique sources)
- Open questions for future A/B testing

**No backlog task needed for research itself** — it's a pre-task activity.

---

## Phase 1: Parent Task — Create Recipe JSON

### Metadata

| Field | Value |
|-------|-------|
| Title | `Add recipe: {Recipe Name}` |
| Labels | `recipe` |
| Priority | Medium |
| References | `photos-source/{id}/research/{id}-research-synthesis.md` |

### Description Template

```
Create the recipe JSON for {recipe name}, built from the research synthesis
({N} agents, {N}+ sources).

Research source material: `photos-source/{id}/research/{id}-research-synthesis.md`

Key recipe characteristics from research:
- {characteristic 1 — the defining technique or identity}
- {characteristic 2 — key ingredient insight}
- {characteristic 3 — structural note (sub-recipes, stages, etc.)}

Follows existing recipe pattern:
- `public/recipes/{id}.json` following schema in `src/types/recipe.ts`
- Entry in `public/recipes/index.json`
- Run `/validate` to verify
```

### Acceptance Criteria (standard set)

```
1. Recipe JSON — public/recipes/{id}.json created following recipe schema
   (meta, config, vessels, stages, states)
2. Index entry — added to public/recipes/index.json
3. Research field populated — research.sources[] contains {N}+ sources,
   research.strategy describes multi-agent approach,
   research.sourceCount and research.date set
4. Ingredient provenance — every ingredient has sourcedFrom, confidence
   (high/medium/low per synthesis tiers), and rationale fields
5. Technique provenance — research.techniques[] covers key findings
   with source attribution and confidence
6. Units compliant — grams only, °F (°C), centimeters (D1-D3)
7. State rules — timer only on passive states, every state has
   exit_condition, one action per state (D4, D5, D9)
8. Ingredient sums — breakdown amounts sum to totals (D6)
9. Passes /validate
10. npm run build passes
```

**Add recipe-specific ACs as needed** (e.g., "multi-component assembly modeled as separate stages" for ramen, "hot variation inline via notes" for beverages).

---

## Phase 2: Subtask — Nutrition Data

### Metadata

| Field | Value |
|-------|-------|
| Title | `Add nutrition data for {recipe name}` |
| ID | `PF-XX.1` |
| Labels | `recipe` |
| Priority | Medium |
| Parent | PF-XX |
| Dependencies | PF-XX |

### Acceptance Criteria (standard set)

```
1. USDA mappings added to scripts/usda-mappings.ts for all new ingredients
2. Branded/proxy ingredients use best-fit proxies with documented rationale
3. Run scripts/calculate-nutrition.ts — generates nutrition block with
   totals, perServing, and breakdown
4. meta.yields parses correctly for servings count
5. Passes F17-F22 nutrition validation checks
6. npm run build passes
```

**Add recipe-specific ACs as needed** (e.g., "broth nutrition accounts for extraction vs discarded solids" for bone-based recipes).

---

## Phase 3 (optional): Spike Subtasks

Create as `PF-XX.N` when needed:

| Spike Type | When | Example |
|------------|------|---------|
| Schema flexibility | Recipe doesn't fit current schema | PF-71.1 (beverage recipes) |
| Open questions | Research synthesis has unresolved A/B tests | "Test cottonseed oil vs lard in aroma oil" |
| Sourcing investigation | Specialty ingredients need brand research | "Best kansui source for home ramen" |
| Checklist updates | New recipe type needs new validation rules | PF-71.2 added D16 (nutrition required) |

---

## Shipped Examples

| Recipe | Parent | Nutrition | Agents | Sources | Notes |
|--------|--------|-----------|--------|---------|-------|
| CoCo Ichibanya Curry | PF-70 | PF-70.1 | 9 | 64 | First multi-agent recipe |
| Thai Tea Boba | PF-71 | PF-71.2 | — | 16 | First beverage; schema spike (PF-71.1) |
| Ichiran Ramen | PF-78 | PF-78.1 | 8 | 92 | 5 sub-recipes; highest source count |
