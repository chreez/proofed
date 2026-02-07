---
id: PF-4.6
title: Add validation check for photo paths
status: Done
assignee: []
created_date: '2026-02-07 04:36'
updated_date: '2026-02-07 05:33'
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
- [x] #1 Vitest test validates all photo src paths in recipe JSON exist on disk
- [x] #2 Test fails if a referenced photo is missing
- [x] #3 Test passes when no photos are referenced (empty/absent photos array)
- [x] #4 Validation checklist updated with new photo path check
- [x] #5 npm run build passes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added vitest validation for cook_log photo paths (src + thumb exist on disk) and non-empty alt text. Checklist updated with F23/F24. 333 tests pass.
<!-- SECTION:FINAL_SUMMARY:END -->
