---
id: PF-23
title: Completing a step should ease the next substep into view
status: Done
assignee: []
created_date: '2026-02-06 19:43'
updated_date: '2026-02-07 02:52'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When checking off any item (gather items or action states), the next unchecked item should smoothly scroll into view — but ONLY if it's currently offscreen. No scroll if already visible.\n\nShould NOT trigger on final item in a section (that's the section collapse behavior).\n\nBoth gather items and states should trigger this. User wants to evaluate both in practice.\n\nThis is a UX task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Completing a gather item scrolls next unchecked gather item into view (if offscreen)
- [x] #2 Completing a state step scrolls next unchecked state into view (if offscreen)
- [x] #3 No scroll if next item is already visible in viewport
- [x] #4 Does NOT trigger on final item in section
- [x] #5 Smooth native scroll behavior
- [x] #6 Human visual sign-off on dev server before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added smooth scroll-to-next behavior when checking off gather items and state steps. Created `useScrollToNext` composable that checks viewport visibility before scrolling. Wired into GatherCategory (for gather items) and StageCard (for state steps via emit from StateStep). Skips scroll on final item in section. Uses `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` with `scroll-margin-top` to account for sticky header.
<!-- SECTION:FINAL_SUMMARY:END -->
