---
id: PF-41
title: 'Bake log: bake count + variant/version breakdown'
status: To Do
assignee: []
created_date: '2026-02-07 01:42'
updated_date: '2026-02-10 08:20'
labels:
  - feature
dependencies: []
priority: medium
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Show count of bakes per recipe with variant breakdown. Click into a recipe to see version breakdown of bakes.\n\nNeeds grooming to clarify: where this lives (index page, recipe page, both), data source (cook_log entries), display format.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe page shows bake summary at top of Cook Log section (total count + version breakdown)
- [ ] #2 Index page shows aggregate bake count across family variants
- [ ] #3 Index display format determined by spike (badge, subtitle, or icon+number)
- [ ] #4 Version breakdown format: version label + count, e.g. "v1.0 (2x), v2.0 (1x)"
- [ ] #5 Recipes with zero bakes show no count (not "0 bakes")
- [ ] #6 Count is derived from cook_log.length — no manual tracking
- [ ] #7 Family aggregate sums cook_log entries from all variant recipe files
- [ ] #8 npm run build passes
<!-- AC:END -->
