---
id: PF-189
title: Fix scratchpad timestamp and step ID display
status: Done
assignee: []
created_date: '2026-04-09 16:54'
updated_date: '2026-04-09 18:05'
labels:
  - bug (ux)
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two scratchpad UX issues:

1. **Timestamps show time-only** — `ScratchpadNote.vue` and `GeneralNotesFab.vue` format entry timestamps with `toLocaleTimeString` (time only, no date). For multi-day bakes this loses date context entirely. Should display `YYYY-MM-DD HH:MM` in local time, consistent with the project's timestamp convention.

2. **Raw step IDs in headers** — Scratchpad header shows `scratchpad: FOLD_3` instead of human-readable names like "Fold #3". The name lives on the recipe state object and should be passed as a prop from StateStep.

## Technical context
- `ScratchpadNote.vue:72` — `formattedEntries` uses `toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })`
- `ScratchpadNote.vue:105,201` — header/title shows raw `stepId`
- `GeneralNotesFab.vue` — same time-only format for general notes
- Prop threading: StageCard (has state.name) → StateStep (has step.id) → ScratchpadNote (new stepName prop)
- Display-only change — no modifications to scratchpad localStorage data format
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All scratchpad entry timestamps display as YYYY-MM-DD HH:MM in local time (ScratchpadNote + GeneralNotesFab)
- [x] #2 ScratchpadNote receives a new `stepName` prop from parent (StateStep passes it down from the recipe state)
- [x] #3 Desktop popover header shows `scratchpad: {stepName}` with raw stepId as secondary muted text
- [x] #4 Mobile bottom sheet title shows `scratchpad: {stepName}` with raw stepId as secondary muted text below
- [x] #5 All existing callsites of ScratchpadNote updated to pass the new prop
- [x] #6 No changes to scratchpad data storage format — display-only fix
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Subagent complete. 7 files changed: ScratchpadNote.vue (timestamp format + stepName prop + header/sheet display), GeneralNotesFab.vue (timestamp format), StateStep.vue (passes stepName prop), BottomSheet.vue (subtitle prop), 3 test files updated. Build passes (1397 tests, type-check clean). HITL gate: visual review required — popover header, bottom sheet title, timestamp formats all changed.
<!-- SECTION:NOTES:END -->
