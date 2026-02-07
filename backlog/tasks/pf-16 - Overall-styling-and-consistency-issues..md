---
id: PF-16
title: Overall styling and consistency issues.
status: To Do
assignee: []
created_date: '2026-02-06 18:51'
updated_date: '2026-02-07 01:23'
labels:
  - ux
  - ungroomed
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit overall styling consistency across all components. Evaluate headless component libraries (Radix Vue, Headless UI, Floating UI) for a11y and bundle size.\n\nThis is a parent task — decompose into subtasks when ready:\n- Spike: evaluate libraries, audit current inconsistencies\n- Design: define component patterns and fixes\n- Implement: apply fixes and integrate chosen library (if any)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Styling audit doc lists all inconsistencies across components
- [ ] #2 Component library evaluated: Radix Vue, Headless UI, or none
- [ ] #3 All interactive elements follow consistent pattern (borders, radius, colors)
- [ ] #4 UnoCSS shortcuts used everywhere — no one-off utility combos (D13)
- [ ] #5 Human visual sign-off on each component change before commit
<!-- AC:END -->
