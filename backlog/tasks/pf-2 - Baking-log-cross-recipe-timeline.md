---
id: PF-2
title: Baking log - cross-recipe timeline
status: In Progress
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-17 23:16'
labels:
  - feature
dependencies: []
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A cross-recipe baking timeline section on the index page. Shows all bakes across all recipes chronologically — like a baker's journal. Each entry links to the specific recipe + cook log.\n\nData source TBD — needs a spike to determine whether to aggregate from existing cook_log arrays in recipe JSONs or create a separate baking-log.json.\n\nThis is a parent task — decompose into spike (data model) + design (timeline UI) + implement when ready.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Timeline section visible on index page
- [ ] #2 Entries sorted chronologically (newest first)
- [ ] #3 Each entry links to its recipe page
- [ ] #4 Shows recipe name, date, and summary per entry
- [ ] #5 Data model decided via spike subtask
- [ ] #6 Works on both desktop and mobile
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Spike Resolution (Data Model)

Decision: Aggregate from existing `cook_log` arrays in recipe JSONs at runtime.

**Rationale:**
- Only ~10 recipes, ~7 bake entries — no performance concern
- RecipeIndex already fetches each recipe JSON for meta enrichment
- No data duplication or sync issues
- cook_log entries already have: date, version, summary, notes, photos

## Implementation Plan

1. During existing meta-fetch in RecipeIndex, collect cook_log entries with recipe context
2. Build flat timeline array sorted newest-first
3. Render below recipe list with recipe name, date, summary, hero thumb
4. Link entries to `/recipe/:id/bake/:date`
5. Match existing timeline dot/spine aesthetic
6. Mobile responsive
<!-- SECTION:NOTES:END -->
