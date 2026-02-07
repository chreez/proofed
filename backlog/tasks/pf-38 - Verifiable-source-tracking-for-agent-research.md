---
id: PF-38
title: Verifiable source tracking for agent research
status: To Do
assignee: []
created_date: '2026-02-07 01:08'
updated_date: '2026-02-07 02:17'
labels:
  - feature
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Unified source/citation tracking. Merges PF-5 (recipe origin) and PF-11 (suggestion sources).\n\nThree scopes:\n1. Recipe origin — meta.source becomes structured: { name, url, attribution, accessed }\n2. Suggestion citations — next_time[] items get optional source field, backwards compatible with plain strings\n3. Agent research — when an agent researches anything, sources captured as structured data: { claim, sources: [{ title, url, fetched }], confidence, verified_by }\n\nStorage: per-recipe sources in recipe JSON + potential global knowledge base.\nSurface on website eventually: expandable citation blocks with links.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spike: research citation schemas (JSON-LD, schema.org, custom) for recipe origins, suggestion citations, and agent research
- [ ] #2 Spike: propose unified schema covering all three scopes
- [ ] #3 Schema decision documented before implementation
- [ ] #4 Recipe origins: meta.source becomes structured object with URL, attribution, date
- [ ] #5 Suggestion citations: next_time[] items support optional source, backwards compatible
- [ ] #6 Agent research: sources captured as structured data with URL, title, fetch date, confidence
- [ ] #7 Display: recipe origin shown in footer 'Sources' section
- [ ] #8 Display: suggestion/note sources shown inline as expandable citations
- [ ] #9 All recipes updated with structured source data after schema finalized
- [ ] #10 Recipe passes /validate after schema change
<!-- AC:END -->
