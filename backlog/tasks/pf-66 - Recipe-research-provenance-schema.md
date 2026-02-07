---
id: PF-66
title: Recipe research provenance schema
status: To Do
assignee: []
created_date: '2026-02-07 19:51'
labels:
  - ungroomed
  - schema
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the recipe JSON schema to carry research provenance alongside recipe data. Every ingredient and technique decision should be traceable to its source.

Adds three new schema concepts:
1. **Top-level `research` object** — metadata about the research process (sources[], strategies[], source_count, date)
2. **Ingredient-level provenance** — `sourced_from`, `confidence` (high/medium/low), `rationale`, `brand` fields on each ingredient
3. **Technique-level provenance** — `techniques[]` array with source attribution and rationale

Confidence rating system: high (5+ sources), medium (2-4 sources), low (1 source).

Spike output documented in PF-67 conversation context (2026-02-07 CoCo curry research session — 8 parallel search agents, 30+ sources).
<!-- SECTION:DESCRIPTION:END -->
