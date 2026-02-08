---
id: PF-73
title: Fix missing scroll on stage auto-advance (mobile)
status: To Do
assignee: []
created_date: '2026-02-08 01:18'
updated_date: '2026-02-08 01:37'
labels:
  - bug
dependencies: []
references:
  - 'https://github.com/chreez/proofed/issues/2'
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issue #2. When the last item in a stage is checked, checkAutoAdvance() collapses current stage and expands next — but no scroll logic fires. Viewport stays put while content shifts underneath. Worse on mobile because smaller viewport means next stage is always off-screen. Secondary concern: HEADER_HEIGHT hardcoded at 64px in useScrollToNext.ts — unreliable with iOS Safari dynamic viewport. Needs spike before implementation.
<!-- SECTION:DESCRIPTION:END -->
