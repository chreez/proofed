---
id: PF-16
title: Overall styling and consistency issues.
status: To Do
assignee: []
created_date: '2026-02-06 18:51'
updated_date: '2026-02-10 08:20'
labels:
  - ux
dependencies: []
priority: medium
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit overall styling consistency across all components. Evaluate headless component libraries (Radix Vue, Headless UI, Floating UI) for a11y and bundle size.\n\nThis is a parent task — decompose into subtasks when ready:\n- Spike: evaluate libraries, audit current inconsistencies\n- Design: define component patterns and fixes\n- Implement: apply fixes and integrate chosen library (if any)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spike (timeboxed ~2hrs): audit doc lists all inconsistencies — buttons, section headers, spacing, TOC, padding drift
- [ ] #2 Spike evaluates: reusable component patterns vs component library (Radix Vue, Headless UI) vs manual cleanup
- [ ] #3 Decision documented: approach chosen based on spike findings
- [ ] #4 Shared button component or pattern: all buttons (copy, toggle, FAB, nav) follow one style
- [ ] #5 Section headers unified: cook log, version history, nutrition, stages all use same pattern
- [ ] #6 Spacing system consistent: card padding, section gaps, margins follow defined scale
- [ ] #7 TOC styling polished and consistent with rest of design system
- [ ] #8 UnoCSS shortcuts used everywhere — no one-off utility combos (D13)
- [ ] #9 Human visual sign-off on each component change before commit
<!-- AC:END -->
