---
id: PF-187
title: Add confirm dialog to reset bake button
status: To Do
assignee: []
created_date: '2026-04-09 15:44'
labels:
  - bug (ux)
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The reset bake button (RotateCcw icon) is positioned close to the Copy Recipe button with only `gap-1` spacing. Accidental taps reset all bake progress (localStorage + scratchpad) with no warning and no undo.

Add a confirmation dialog that shows what will be lost before executing the reset.

## Technical context
- Reset fires from `handleReset()` in RecipeMeta.vue → emits `reset` to App.vue
- App.vue calls `progress.resetProgress()` (clears localStorage) + `scratchpad.clearAll()`
- Dialog needs to query progress state for stats (checked items, completed stages, scratchpad entries)
- Existing patterns: BottomSheet.vue, Teleport modals in BakeDetailView, popover in ShareModal
- Mobile is the primary concern — most baking happens with phone in hand
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Reset bake button opens a confirm dialog instead of resetting immediately
- [ ] #2 Dialog shows what will be lost: count of checked items, completed stages, scratchpad notes
- [ ] #3 Two actions: Cancel (dismiss, no change) and Confirm (executes reset)
- [ ] #4 Mobile-first design — touch-friendly targets, not clipped on small viewports
- [ ] #5 Demo subtask: mock up 2-3 dialog styles (bottom sheet, center modal, popover) at mobile width for user review before implementation
- [ ] #6 HITL gate: styling requires user sign-off before commit
<!-- AC:END -->
