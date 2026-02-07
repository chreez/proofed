---
id: PF-4.6
title: Add validation check for photo paths
status: To Do
assignee: []
created_date: '2026-02-07 04:36'
labels:
  - implement
dependencies:
  - PF-4.5
parent_task_id: PF-4
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Vitest check that verifies all photos[].src paths referenced in recipe JSON actually exist in public/images/. Add corresponding entry to validation checklist.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Vitest test validates all photo src paths in recipe JSON exist on disk
- [ ] #2 Test fails if a referenced photo is missing
- [ ] #3 Test passes when no photos are referenced (empty/absent photos array)
- [ ] #4 Validation checklist updated with new photo path check
- [ ] #5 npm run build passes
<!-- AC:END -->
