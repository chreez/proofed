---
id: PF-55
title: Header alignment shifts between index and recipe views
status: To Do
assignee: []
created_date: '2026-02-07 05:38'
labels:
  - bug (styling)
dependencies: []
references:
  - 'src/App.vue:266'
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Header inner div uses different max-w and px-4 combinations on index vs recipe page. Index gets `max-w-3xl` with no horizontal padding, recipe gets `max-w-4xl px-4`. This causes the "proofed." wordmark to visibly shift left/right when navigating between views, especially noticeable on mobile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Header wordmark stays in the same horizontal position when navigating between index and recipe views
- [ ] #2 Consistent padding between header and main content in both views
- [ ] #3 No visual shift on mobile
<!-- AC:END -->
