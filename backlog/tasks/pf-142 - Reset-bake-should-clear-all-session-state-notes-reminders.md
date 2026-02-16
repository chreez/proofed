---
id: PF-142
title: Reset bake should clear all session state (notes + reminders)
status: To Do
assignee: []
created_date: '2026-02-16 22:26'
labels:
  - bug
dependencies: []
references:
  - 'src/App.vue:473 — @reset handler'
  - 'src/composables/useProgress.ts:134-139 — resetProgress()'
  - 'src/composables/useScratchpad.ts:168-175 — clearAll()'
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When user taps "Reset Bake", clear ALL session state: progress checkboxes, scratchpad notes, general notes, AND dismissed reminders. Full clean slate so the recipe page returns to a fresh-bake state.

Currently resetProgress() only clears progress (items, states, stages). scratchpad.clearAll() exists but isn't wired to the reset action.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Reset bake clears progress state (items, states, stages) — existing behavior preserved
- [ ] #2 Reset bake clears all scratchpad entries (step notes + general notes)
- [ ] #3 Reset bake clears dismissed reminders (dismissedReminders state)
- [ ] #4 After reset, recipe page shows zero notes, zero progress, all reminders re-enabled
<!-- AC:END -->
