---
id: PF-46
title: Reset/resume state when returning to recipe page
status: To Do
assignee: []
created_date: '2026-02-07 02:53'
updated_date: '2026-02-07 03:42'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When returning to a recipe page, progress state (checked items, collapsed stages) persists from last session. Need a way to reset for a fresh bake, or clearly show that saved state exists.\n\nNeeds spike on UX options:\n- Reset button (where? header? banner?)\n- "Welcome back" banner showing last session date + reset option\n- Auto-reset after N days?\n- Per-bake sessions vs persistent state?\n- How does this interact with cook_log (new bake = new log entry)?
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A "reset all" action is available on the recipe page that clears all progress (checked items, completed states, collapsed stages) for the current recipe
- [ ] #2 Reset clears localStorage for the recipe immediately (no confirmation dialog)
- [ ] #3 After reset, all gather checkboxes, state checkboxes, and "Complete All" toggles are unchecked
- [ ] #4 Reset architecture is granular internally (per-stage capable) but only "reset all" is exposed in UI
- [ ] #5 Post-reset collapse/scroll behavior is decided at the human-in-the-loop styling gate
- [ ] #6 Button/toolbar placement and design is out of scope — separate backlog task
<!-- AC:END -->
