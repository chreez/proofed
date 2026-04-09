---
id: PF-73
title: Fix missing scroll on stage auto-advance (mobile)
status: Done
assignee: []
created_date: '2026-02-08 01:18'
updated_date: '2026-04-09 19:32'
labels:
  - bug
dependencies: []
references:
  - 'https://github.com/chreez/proofed/issues/2'
priority: high
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue #2. When the last item in a stage is checked, checkAutoAdvance() collapses current stage and expands next — but no scroll logic fires. Viewport stays put while content shifts underneath. Worse on mobile because smaller viewport means next stage is always off-screen. Secondary concern: HEADER_HEIGHT hardcoded at 64px in useScrollToNext.ts — unreliable with iOS Safari dynamic viewport.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After completing the last item in a stage, checkAutoAdvance() collapses the current stage, expands the next, and scrolls the next stage header into view.
- [ ] #2 Scroll fires only after the collapse/expand DOM transition completes — no race condition with reflow.
- [ ] #3 Audit and replace HEADER_HEIGHT hardcoded at 64px in useScrollToNext.ts with a dynamic value if feasible.
- [ ] #4 Mobile verified — next stage header is visible on 375px viewport after auto-advance.
- [ ] #5 Desktop behavior not broken — scroll only fires when next stage is off-screen.
- [ ] #6 npm run build passes.
<!-- AC:END -->
