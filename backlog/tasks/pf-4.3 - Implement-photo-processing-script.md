---
id: PF-4.3
title: Implement photo processing script
status: Done
assignee: []
created_date: '2026-02-07 04:36'
updated_date: '2026-02-07 05:27'
labels:
  - implement
dependencies:
  - PF-4.2
parent_task_id: PF-4
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build scripts/process-photos.ts — the core photo pipeline script. HEIC detection, heic-convert decode, sharp resize/strip/WebP output, dry-run mode, --all batch mode. Add sharp + heic-convert as dependencies. Follows CLI interface from PF-4.2 design.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Script converts HEIC/JPEG/PNG input to WebP output
- [x] #2 Output at two sizes: 400w (thumb) and 800w (full)
- [x] #3 All EXIF metadata stripped from output images
- [x] #4 DateTimeOriginal extracted and logged for cook_log use
- [x] #5 Dry-run mode prints what would be done without writing files
- [x] #6 --all flag processes all source directories
- [x] #7 Output stored in public/images/{recipe-id}/{date}/
- [x] #8 npm script entry added (photos)
- [x] #9 sharp and heic-convert added to package.json devDependencies
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Photo processing script implemented. HEIC→WebP via heic-convert+sharp. 5 sample photos processed (690KB total from 7.5MB source). Sharp reads HEIC metadata but can't decode pixels on this platform — heic-convert used for all HEIC files. Build passes.
<!-- SECTION:FINAL_SUMMARY:END -->
