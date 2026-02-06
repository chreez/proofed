---
id: PF-23
title: Completing a step should ease the next substep into view
status: To Do
assignee: []
created_date: '2026-02-06 19:43'
updated_date: '2026-02-06 20:24'
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
- [ ] #1 Completing a gather item scrolls next unchecked gather item into view (if offscreen)
- [ ] #2 Completing a state step scrolls next unchecked state into view (if offscreen)
- [ ] #3 No scroll if next item is already visible in viewport
- [ ] #4 Does NOT trigger on final item in section
- [ ] #5 Smooth native scroll behavior
- [ ] #6 Human visual sign-off on dev server before commit
<!-- AC:END -->
