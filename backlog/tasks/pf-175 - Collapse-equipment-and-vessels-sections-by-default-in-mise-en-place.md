---
id: PF-175
title: Collapse equipment and vessels sections by default in mise en place
status: Done
assignee: []
created_date: '2026-04-03 01:30'
updated_date: '2026-04-03 04:39'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Minor UX improvement: The first two gather sections (equipment and vessels) should start collapsed by default, assuming the user already has the right tools. Ingredients section remains expanded as the primary actionable checklist.

Context: After 11+ bakes of the same recipe, clicking through equipment and vessels every time is friction. Experienced bakers know what they need — the value is in the ingredient checklist.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 GatherCategory receives a prop controlling whether it starts collapsed; default is expanded (no breaking change)
- [x] #2 GatherSection passes start-collapsed to Vessels and Equipment categories; Ingredients remains expanded
- [x] #3 A collapsed-by-default category shows the same collapsed badge UI as a manually collapsed category (title + badge count)
- [x] #4 Clicking a collapsed-by-default category expands it normally — all existing expand/collapse behavior unchanged
- [x] #5 "Complete All", copy, and reset still function correctly on categories that started collapsed
- [x] #6 GatherCategory snapshot test updated to reflect the new prop
- [x] #7 npm run build passes
<!-- AC:END -->
