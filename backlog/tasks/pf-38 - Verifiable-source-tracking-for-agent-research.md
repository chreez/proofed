---
id: PF-38
title: Verifiable source tracking for agent research
status: To Do
assignee: []
created_date: '2026-02-07 01:08'
labels:
  - feature
  - ungroomed
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When an agent (chatbot or Claude Code) researches anything — flour substitutes, technique explanations, equipment recommendations — the sources must be captured and stored as structured data.\n\n## Problem\nCurrently agent suggestions land in next_time or cook notes with no provenance. "Try bread flour" — says who? Based on what?\n\n## Proposal\nNew JSON structure for citations/sources attached to suggestions, notes, and recipe decisions:\n```json\n{\n  "claim": "Bread flour works as AP substitute in enriched dough",\n  "sources": [\n    { "title": "King Arthur: Flour Guide", "url": "https://...", "fetched": "2026-02-07" },\n    { "title": "Serious Eats: Flour Types", "url": "https://...", "fetched": "2026-02-07" }\n  ],\n  "confidence": "high",\n  "verified_by": "agent"\n}\n```\n\nStorage options:\n- Per-recipe: sources[] array in recipe JSON\n- Global: public/data/sources.json knowledge base\n- Both: recipe-specific citations + shared reference library\n\nEventually surface on website: \"Why does this recipe use bread flour?\" → expandable citation block with links.\n\nRelates to PF-5 (source tracking), PF-11 (suggestion source tracking), PF-37 (AI chatbot).
<!-- SECTION:DESCRIPTION:END -->
