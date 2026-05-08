---
id: PF-239
title: 'Scratchpad: edit/remove individual entries before export'
status: To Do
assignee: []
created_date: '2026-05-07 18:00'
updated_date: '2026-05-07 19:39'
labels:
  - ux
  - scratchpad
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

Captured from DRAFT-69 grooming during 2026-05-05 jalapeño-cheddar bake. User wrote "disregard last entry" inside scratchpad as a workaround because there is no edit or delete affordance on individual scratchpad entries before export.

## Problem

Scratchpad capture (entry list during a bake) currently only supports append. Once an entry is committed, the user cannot:
- Edit a typo or correction
- Delete an entry that was wrong / accidental / duplicate
- Reorder entries

Workaround today is a follow-up entry like "disregard last entry" — pollutes the bake_notes export and forces the agent processing the cook log to manually filter.

## Desired behavior

Per-entry edit and delete from the scratchpad UI, before the export step. Out of scope for any specific recipe version bump.

## Open Qs (for grooming)

1. Edit-in-place vs open-edit-dialog?
2. Soft delete (strikethrough kept in scratchpad, omitted from export) vs hard delete (entry gone)?
3. Edit window — until export, or until cook_log finalized? Or always?
4. Audit trail — keep history of edits, or last write wins?

## References

- Scratchpad component(s) in src/components/ — find via grep at grooming time
- DRAFT-69 source: cook_log entry on jalapeno-cheddar-sourdough.json date 2026-05-05
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 useScratchpad exposes editEntry(stepId | '_general', index, newValue: string) that updates entry.value (trimmed and non-empty), preserves timestamp/type/prompt, persists via save()
- [ ] #2 useScratchpad exposes deleteEntry(stepId | '_general', index) that splices the entry from state.entries[stepId] or generalNotes, removes empty step-arrays, persists via save()
- [ ] #3 Both editEntry and deleteEntry handle all three entry types ('note', 'reminder_response', 'rating') — type-agnostic
- [ ] #4 exportJson output reflects post-edit and post-delete state: deleted entries do NOT appear in entries[stepId] or generalNotes; edited entries show the new value
- [ ] #5 ScratchpadNote.vue desktop popover renders pencil + trash icon controls per entry block, inline with the entry, sized to match existing iconography
- [ ] #6 ScratchpadNote.vue mobile BottomSheet renders the same pencil + trash controls per entry block
- [ ] #7 Pencil click swaps the entry block to inline edit mode: textarea pre-filled with current value, save and cancel buttons; Enter saves, Esc cancels; cancel restores original; only one entry editable at a time per scratchpad surface
- [ ] #8 Trash click opens a small confirm dialog ('Delete this entry?') with confirm/cancel buttons before deletion; no double-delete
- [ ] #9 Reminder-response entries can be edited via the pencil flow OR re-prompted via the existing reminder UI (useScratchpad.ts:80-84 overwrite path); both paths converge to the same persisted state
- [ ] #10 Edit and delete update totalEntryCount and generalNoteCount reactive computeds; UI badge counts decrement after delete
- [ ] #11 After /bake-log clears the scratchpad (clearAll), edit and delete controls are no longer shown (entries don't exist)
- [ ] #12 Component test: given a scratchpad with 3 entries on stepId 'mix', deleting index 1 results in 2 entries with original index 0 and (former) index 2 preserved in order
- [ ] #13 Component test: editing index 0's value to 'updated' persists to localStorage and survives a reload via useScratchpad.load()
- [ ] #14 Component test: deleting the only generalNote leaves generalNotes as [] and totalEntryCount drops by 1
- [ ] #15 Snapshot tests for ScratchpadNote.vue desktop + mobile updated to include the new edit/trash icons; snapshot diffs limited to those additions
- [ ] #16 No reorder controls added (out of scope); no soft-delete schema fields added (hard delete only)
<!-- AC:END -->
