---
id: PF-38
title: Verifiable source tracking for agent research
status: Done
assignee: []
created_date: '2026-02-07 01:08'
updated_date: '2026-02-08 08:46'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Unified source/citation tracking for recipe data. Three scopes decomposed into subtasks:\n\n1. **Recipe origin + suggestion citations** (PF-38.1 spike → PF-38.2 implement)\n2. **Agent research provenance** (PF-66 — schema with confidence ratings, per-ingredient sourcing)\n3. **Display: recipe appendix** (PF-69 — \"How was this recipe generated?\" UI)\n\nPF-38 parent tracks the overall initiative. No direct implementation on the parent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All subtasks complete (PF-38.1, PF-38.2)
- [x] #2 PF-66 (research provenance schema) complete
- [ ] #3 PF-69 (recipe appendix UI) complete
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Subtask Structure\n\n- **PF-38.1** — Spike: research citation schemas (JSON-LD, schema.org, custom)\n- **PF-38.2** — Implement recipe origin + suggestion citations (blocked by 38.1)\n- **PF-66** — Research provenance schema (agent research scope, depends on PF-38)\n- **PF-69** — Recipe appendix UI (depends on PF-66)\n\n## Context\n\nThe CoCo curry research session (2026-02-07) produced a concrete test case: 8 parallel search agents, 45+ sources, cross-source confidence ratings. Synthesis report was in scratchpad at `coco-curry-research-synthesis.md`."

## PF-38.1 Spike Output (2026-02-08)

### Proposed RecipeSource Schema
```typescript
interface RecipeSource {
  name: string           // "America's Test Kitchen"
  url?: string           // paywalled or public URL
  type?: 'original' | 'adapted' | 'inspired'
  author?: string        // "Lan Lam"
  accessed?: string      // "2026-01-15"
}
```

### Proposed NextTimeEntry Schema
```typescript
interface NextTimeEntry {
  text: string           // markdown-enabled
  source?: string        // "Reddit u/breadhead42"
}
```

### Key Decisions
- **meta.source**: Normalizer at useRecipe.ts load point (PF-38.3)
- **next_time**: Always-object, matches StateNote pattern (PF-38.6)
- **Validation**: New S-series checks (PF-38.5)
- **Copy features**: Not affected (PF-38.4 closed as duplicate)

### Risk Mitigation Tasks
- PF-38.3: Union type leakage → normalizer composable
- PF-38.4: CLOSED — copy features don't serialize source
- PF-38.5: Validation checklist S-series
- PF-38.6: next_time always-object migration
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All subtasks complete for verifiable source tracking:\n\n- **PF-38.1** (spike): Researched citation schemas, proposed RecipeSource + NextTimeEntry\n- **PF-38.2**: Structured sources with photo gallery, TOC integration, attribution display\n- **PF-38.3**: Source normalizer — zero type guards in components\n- **PF-38.4**: Closed as duplicate (copy features unaffected)\n- **PF-38.5**: S-series validation checks (S1-S5) + V4 update\n- **PF-38.6**: next_time migrated from string[] to NextTimeEntry[]\n- **PF-66**: Research provenance schema (Confidence, Research, ResearchTechnique types + ingredient-level provenance)\n\nRemaining downstream: PF-69 (recipe appendix UI) tracks separately.
<!-- SECTION:FINAL_SUMMARY:END -->
