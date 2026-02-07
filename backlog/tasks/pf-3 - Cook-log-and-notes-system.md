---
id: PF-3
title: Cook log and notes system
status: To Do
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-07 00:20'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add cook_log array to recipe JSON schema. Dated freeform entries per bake session, with optional step_id reference for linking notes to specific states.\n\nEntry method: JSON-first (most entries added via Claude Code interactions). In-app UI is a future follow-up.\n\nNote: versioning (PF-6) matters here — cook log entries are tied to a specific recipe version. Need to consider how entries relate to version changes.\n\nDependency consideration: PF-6 (recipe versioning) should be at least designed before this ships, so entries can reference versions correctly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 cook_log array added to recipe TypeScript types
- [ ] #2 Each entry has: date, text, optional step_id, optional version ref
- [ ] #3 Entries render on recipe page in chronological order
- [ ] #4 Step-linked entries show which step they reference
- [ ] #5 Schema validated by /validate checklist
- [ ] #6 JSON is the input method (no UI required yet)
<!-- AC:END -->
