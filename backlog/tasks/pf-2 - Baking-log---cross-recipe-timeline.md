---
id: PF-2
title: Baking log - cross-recipe timeline
status: To Do
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-10 08:20'
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
