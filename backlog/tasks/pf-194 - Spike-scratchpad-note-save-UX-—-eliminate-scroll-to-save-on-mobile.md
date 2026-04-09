---
id: PF-194
title: 'Spike: scratchpad note save UX — eliminate scroll-to-save on mobile'
status: To Do
assignee: []
created_date: '2026-04-09 19:28'
labels:
  - spike
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On mobile, after tapping the textarea in ScratchpadNote with existing entries visible, the Save button is below the fold. User must dismiss keyboard, scroll down, then tap Save. High friction for a tool meant for quick notes with messy hands during baking. Research and demo better patterns: (A) auto-save on blur — no button needed, (B) sticky save pinned above keyboard, (C) save action in sheet header/toolbar, (D) submit on Enter for short notes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Research ≥3 UX patterns for eliminating scroll-to-save friction (auto-save on blur, sticky save above keyboard, save in header, submit on Enter).
- [ ] #2 Document pros/cons of each pattern against the scratchpad use case (quick notes, messy hands, mobile-primary).
- [ ] #3 Demo subtask: create side-by-side mockup at mobile width (375px) showing top 2-3 options in ScratchpadNote context.
- [ ] #4 Evaluate interaction with PF-192 (flat chronological FAB) — does the chosen pattern affect how notes render in the FAB view?
- [ ] #5 Document findings on the task.
<!-- AC:END -->
