---
id: PF-90
title: Photo review workflow for cook log images
status: To Do
assignee: []
created_date: '2026-02-09 06:42'
labels:
  - ux
  - workflow
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After processing photos through the pipeline, the agent should present a numbered grid/list to the user for review before wiring into JSON. User should be able to easily: reorder photos, pick the hero image, exclude blurry/bad shots, edit alt text — with minimal friction (e.g. "hero=8, drop 3,6, swap 4 and 5").
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After photo processing, agent presents numbered photo list with thumbnails/descriptions before writing to JSON
- [ ] #2 User can specify hero, exclusions, and reordering with simple shorthand (e.g. 'hero=8, drop 3')
- [ ] #3 Agent applies user feedback and re-presents for final approval before commit
- [ ] #4 Works within the existing CLI/conversation flow — no new UI required
<!-- AC:END -->
