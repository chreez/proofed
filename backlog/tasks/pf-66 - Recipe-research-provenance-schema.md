---
id: PF-66
title: Recipe research provenance schema
status: To Do
assignee: []
created_date: '2026-02-07 19:51'
updated_date: '2026-02-07 20:35'
labels:
  - ungroomed
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
