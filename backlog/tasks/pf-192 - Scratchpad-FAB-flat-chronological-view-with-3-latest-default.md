---
id: PF-192
title: 'Scratchpad FAB: flat chronological view with 3-latest default'
status: Done
assignee: []
created_date: '2026-04-09 18:10'
updated_date: '2026-04-09 18:58'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the step-grouped collapsible section in GeneralNotesFab with a single flat chronological list. All entries (general + step-specific) mixed together, sorted newest-first. Show the 3 most recent by default; the rest collapse behind a "Show N more" expander. Each entry retains its step label (or "general") so context is preserved.

## Rationale
User darts around recipe adding notes to different steps. Step-grouped view hides recent activity behind expand toggles. Chronological ordering surfaces the latest notes immediately.

## Behavior
- All entries (general + step-specific) in one flat list, newest first
- Show latest 3 by default
- "Show N more" expander for the rest
- Each entry shows its step name (from stepNames map) or "general" label
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All entries (general + step-specific) rendered in a single flat list sorted by timestamp descending (newest first)
- [x] #2 Only the 3 most recent entries visible by default
- [x] #3 A 'Show N more' toggle expands the remaining entries below the initial 3
- [x] #4 Each entry displays its origin: step name (from stepNames prop) for step entries, 'general' for general notes
- [x] #5 Entry type badge (note/rating/reminder) and YYYY-MM-DD HH:MM timestamp still shown per entry
- [x] #6 Step-grouped collapsible section removed entirely
- [x] #7 No changes to scratchpad data storage format — display-only refactor
- [x] #8 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Subagent complete. 2 files changed: GeneralNotesFab.vue (refactored to flat chronological list, 3-latest default, origin labels), GeneralNotesFab.spec.ts (tests rewritten). Build passes (1403 tests). HITL gate: visual review required.
<!-- SECTION:NOTES:END -->
