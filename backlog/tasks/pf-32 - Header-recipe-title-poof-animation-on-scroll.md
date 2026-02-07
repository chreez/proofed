---
id: PF-32
title: Header recipe title "poof" animation on scroll
status: To Do
assignee: []
created_date: '2026-02-07 00:33'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When scrolling down and the header shrinks, the recipe title that appears should have a light fade + slight scale-up animation (~150-200ms). Currently it just pops in with no transition.\n\nApproach: Wrap the v-if span in a Vue Transition component with opacity 0→1 and scale 0.92→1.0.\n\nThis is a styling task — requires human visual sign-off before commit (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe title in scrolled header fades in + scales up (~200ms)
- [ ] #2 Animation feels light and snappy, not distracting
- [ ] #3 No animation on scroll-up (title just disappears)
- [ ] #4 Mobile header animation matches desktop
- [ ] #5 Human visual sign-off on dev server before commit
<!-- AC:END -->
