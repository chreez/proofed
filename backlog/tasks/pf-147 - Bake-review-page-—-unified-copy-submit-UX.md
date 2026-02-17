---
id: PF-147
title: Bake review page — unified copy/submit UX
status: To Do
assignee: []
created_date: '2026-02-17 04:37'
updated_date: '2026-02-17 04:45'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current UX requires navigating to each tab and copying separately (photos tab has its own copy, cost tab has its own copy via summary). Copy should be visible/accessible when all sections are complete, not buried per-tab. Rethink the review page submit flow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Single Copy all button visible at the bottom of the page regardless of active tab
- [ ] #2 Combined payload includes both photo feedback and cost data in one JSON object
- [ ] #3 Button is disabled/muted until at least one section has data (photos loaded or cost selections made)
- [ ] #4 Individual per-tab copy buttons removed (photos tab, summary tab)
- [ ] #5 /bake-log skill parses the combined payload format (update skill doc if needed)
- [ ] #6 Summary tab still shows the cost breakdown table for review, just without its own copy button
<!-- AC:END -->
