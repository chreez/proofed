---
id: PF-11
title: Suggestion source tracking
status: To Do
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-07 01:23'
labels:
  - recipe
  - ungroomed
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agent suggestions in next_time[] should include source/citation. Currently plain strings. Add optional source field or use inline markdown links.\n\nOverlaps with PF-5 (recipe source tracking) and PF-38 (verifiable citations). May merge during implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 next_time[] items support optional source field or inline markdown links
- [ ] #2 Agent-generated suggestions prefixed with 'Try:' per V3 voice rule
- [ ] #3 Sources render as clickable links in the UI
- [ ] #4 Plain string entries still work (backwards compatible)
<!-- AC:END -->
