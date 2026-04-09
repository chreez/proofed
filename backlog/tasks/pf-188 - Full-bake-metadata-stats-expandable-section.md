---
id: PF-188
title: Full bake metadata stats expandable section
status: To Do
assignee: []
created_date: '2026-04-09 15:47'
labels:
  - ux
  - data
dependencies:
  - PF-185
  - PF-186
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An expandable section on the bake detail page that surfaces all captured metadata for a bake session (weather conditions, indoor ambient temp, dough temps, timing breakdowns, etc.) in one consolidated view. Collapsed by default so the bake page stays clean, and progressively renders only the data that actually exists for that bake.

## Context
- BakeStatsBlock already renders 6 sections (pills, temps, S&F, aliquot, bake phases) — always visible when bake_stats exists
- Weather data (PF-185) and indoor ambient capture (PF-186) will add new data sources
- This task is the display layer — the data sources land via dependencies first
- Came up during PF-185/186 grooming: user wants rich data visible but not cluttering the default view
- Provenance indicators (recorded live vs backfilled from API) may be needed — TBD after spikes land
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Expandable "Bake Metadata" section on BakeDetailView, collapsed by default
- [ ] #2 Progressive render — only shows subsections for data that exists on the entry (weather, ambient, dough temps, timing, bake phases, etc.)
- [ ] #3 Toggle state persists visually within the session (doesn't reset on scroll or re-render)
- [ ] #4 Accommodates future data sources (weather from PF-185, ambient from PF-186) without requiring restructure — schema-driven rendering
- [ ] #5 Does not duplicate data already shown elsewhere on the page (e.g., if pills stay above the fold, don't repeat pill data inside)
- [ ] #6 Dependencies: PF-185 and PF-186 should land first to define what data is available
- [ ] #7 Demo subtask: mock up 2-3 layout options (e.g., wrap existing BakeStatsBlock in toggle vs. separate new section vs. unified rebuild) at mobile width for user review before implementation
- [ ] #8 HITL gate: styling requires user sign-off before commit
<!-- AC:END -->
