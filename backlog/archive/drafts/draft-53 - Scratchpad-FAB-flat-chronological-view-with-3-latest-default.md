---
id: DRAFT-53
title: 'Scratchpad FAB: flat chronological view with 3-latest default'
status: Draft
assignee: []
created_date: '2026-04-09 18:05'
labels:
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the step-grouped collapsible in GeneralNotesFab with a flat chronological list of all notes (general + step-specific mixed together). Show the 3 most recent notes by default, collapse the rest behind an expand toggle.

## Rationale
User darts around recipe adding notes to different steps. Step-grouped view hides recent activity behind expand toggles. Chronological ordering surfaces the latest notes immediately.

## Grooming decisions (2026-04-09)
- No tap-to-navigate — notes are view-only in the FAB, not a jump index. Adds complexity for little value.
- "Show N more" reveals all remaining notes at once — no pagination.
- Fully replaces step-grouped view — no toggle between modes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GeneralNotesFab renders all scratchpad entries (general + step-specific) in a single flat list, newest first
- [ ] #2 Only the 3 most recent entries are visible by default
- [ ] #3 "Show N more" button expands to reveal all remaining entries at once
- [ ] #4 Each entry displays a step label tag (step name or "general") for context — no navigation behavior on tap
- [ ] #5 Step-grouped collapsible view is fully removed — no toggle, no remnants
- [ ] #6 Mobile-first: bottom sheet layout unchanged, list scrollable within sheet
- [ ] #7 `npm run build` passes
<!-- AC:END -->
