---
id: PF-66
title: Recipe research provenance schema
status: Done
assignee: []
created_date: '2026-02-07 19:51'
updated_date: '2026-02-08 08:45'
labels:
  - schema
  - feature
dependencies:
  - PF-38
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Subtask of PF-38 (Verifiable source tracking). Covers the "agent research" scope.\n\nExtend the recipe JSON schema to carry research provenance alongside recipe data. Every ingredient and technique decision should be traceable to its source.\n\nAdds three new schema concepts:\n1. **Top-level `research` object** — metadata about the research process (sources[], strategies[], source_count, date)\n2. **Ingredient-level provenance** — `sourced_from`, `confidence` (high/medium/low), `rationale`, `brand` fields on each ingredient\n3. **Technique-level provenance** — `techniques[]` array with source attribution and rationale\n\nConfidence rating system: high (5+ sources), medium (2-4 sources), low (1 source).\n\nSpike output documented in PF-38 implementation notes and scratchpad `coco-curry-research-synthesis.md` (2026-02-07 CoCo curry research session — 8 parallel search agents, 45+ sources).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Research interface added to recipe.ts with fields: sources: RecipeSource[], strategy: string, sourceCount: number, date: string
- [x] #2 Recipe.research optional field added to top-level Recipe interface
- [x] #3 Ingredient interface extended with optional sourcedFrom?: string, confidence?: 'high' | 'medium' | 'low', rationale?: string
- [x] #4 ResearchTechnique interface added: { name: string; sourcedFrom: string; rationale: string; confidence?: 'high' | 'medium' | 'low' }
- [x] #5 Research.techniques field uses ResearchTechnique[]
- [x] #6 Reuses RecipeSource — research.sources[] is the same type as meta.source, no parallel citation model
- [x] #7 Confidence semantics documented — high (5+ sources agree), medium (2-4), low (1 source) — in a code comment on the type
- [x] #8 No existing recipe JSON breaks — research is optional, existing recipes without it load fine
- [x] #9 npm run build passes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added research provenance schema types to `src/types/recipe.ts`. Purely additive — no existing types modified, no recipe JSON changed, no components affected.\n\nNew types added:\n- `Confidence` type alias (`'high' | 'medium' | 'low'`) with JSDoc documenting semantics (5+ sources = high, 2-4 = medium, 1 = low)\n- `ResearchTechnique` interface: name, sourcedFrom, rationale, optional confidence\n- `Research` interface: sources (reuses `RecipeSource[]`), techniques (`ResearchTechnique[]`), strategy, sourceCount, date\n\nExtended existing types:\n- `Recipe.research?: Research` — optional top-level field\n- `Ingredient.sourcedFrom?: string`, `Ingredient.confidence?: Confidence`, `Ingredient.rationale?: string` — optional provenance fields\n\nAll 375 tests pass, type-check clean, build succeeds.
<!-- SECTION:FINAL_SUMMARY:END -->
