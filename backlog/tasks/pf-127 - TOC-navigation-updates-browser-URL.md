---
id: PF-127
title: TOC navigation updates browser URL
status: To Do
assignee: []
created_date: '2026-02-13 02:43'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Clicking a TOC sidebar item should update the browser URL hash to reflect the current section. Enables deep-linking and shareable URLs to specific recipe sections. Browser back/forward should work with TOC-driven navigation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Clicking a TOC item updates the URL hash (e.g., #stage-prep, #cook-log-section) without full page reload
- [ ] #2 Opening a URL with a section hash scrolls to and highlights the correct section
- [ ] #3 Browser back/forward navigates between previously visited sections
- [ ] #4 Active TOC item reflects the current URL hash on page load
- [ ] #5 Hash updates do not interfere with existing scroll behavior or stage expand/collapse
<!-- AC:END -->
