---
id: PF-76
title: Click recipe title in header scrolls to top
status: Done
assignee: []
created_date: '2026-02-08 10:04'
updated_date: '2026-02-08 10:04'
labels:
  - feature
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Clicking the recipe name in the sticky header (minimized state, top right) should smooth-scroll the page back to top. Common UX pattern — title acts as a home anchor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Clicking recipe name in sticky header smooth-scrolls page to top
- [x] #2 Cursor shows pointer on hover to indicate clickability
- [x] #3 No visual change to title styling (no underline, no color shift)
- [x] #4 Works on both desktop and mobile
- [x] #5 Visual sign-off from user before commit (styling gate)
- [x] #6 npm run build passes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sticky header recipe title (visible when scrolled) now smooth-scrolls to top on click with pointer cursor. The element is the span in App.vue's header Transition block. Human visual sign-off confirmed.
<!-- SECTION:FINAL_SUMMARY:END -->
