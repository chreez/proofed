---
id: PF-76
title: Click recipe title in header scrolls to top
status: Done
assignee: []
created_date: '2026-02-08 09:58'
updated_date: '2026-02-08 10:01'
labels:
  - feature
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Clicking the recipe name (h2) in the RecipeMeta header should smooth-scroll the page back to top. Common UX pattern — title acts as a home anchor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Clicking recipe name h2 in RecipeMeta header smooth-scrolls page to top
- [x] #2 Cursor shows pointer on hover to indicate clickability
- [x] #3 No visual change to title styling (no underline, no color shift)
- [x] #4 Works on both desktop and mobile
- [x] #5 Visual sign-off from user before commit (styling gate — cursor change)
- [x] #6 npm run build passes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added click-to-scroll-to-top on recipe name h2 in RecipeMeta. Pointer cursor on hover, smooth scroll to top on click. No visual styling changes beyond cursor. Human visual sign-off confirmed.
<!-- SECTION:FINAL_SUMMARY:END -->
