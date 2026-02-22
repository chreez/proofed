---
id: PF-157
title: Add start/end date to cook_log entries
status: To Do
assignee: []
created_date: '2026-02-22 04:07'
labels:
  - schema
  - cook-log
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `date` field in cook_log entries should represent when the bake finished (consumable), not when it started. Multi-day bakes need a `start_date` field to capture the full timeline.

Backwards compat: entries without `start_date` are single-day bakes where start = end.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CookLogEntry type has optional start_date?: string field
- [ ] #2 date field = end date (day bake finished)
- [ ] #3 Components rendering bake dates show 'Feb 19–20' range format when start_date exists and differs from date
- [ ] #4 Components show single date when start_date is absent or equals date
- [ ] #5 Simple sourdough 2026-02-19 entry updated: date becomes 2026-02-20, start_date: 2026-02-19
- [ ] #6 Validation schema test updated to accept start_date
- [ ] #7 Build passes
<!-- AC:END -->
