---
id: PF-124
title: Timer system cleanup + time widget refinement
status: To Do
assignee: []
created_date: '2026-02-12 01:26'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-PF-116 cleanup: remove dead useTimer code and redesign the static time badge (TimerDisplay.vue) to be more visually prominent. Demo spike first to evaluate styling options before committing to a direction.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 useTimer.ts and useTimer.spec.ts are deleted from the codebase
- [ ] #2 No remaining imports or references to useTimer anywhere in src/
- [ ] #3 TimerDisplay.vue is restyled per the chosen demo direction
- [ ] #4 Passive waits (timer: true) and active work (timer: false) have intentional visual treatment (same or different, per demo outcome)
- [ ] #5 All 8 recipes render the updated time widget correctly
- [ ] #6 npm run build passes
<!-- AC:END -->
