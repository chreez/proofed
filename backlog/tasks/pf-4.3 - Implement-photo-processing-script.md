---
id: PF-4.3
title: Implement photo processing script
status: To Do
assignee: []
created_date: '2026-02-07 04:36'
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
- [ ] #1 Script converts HEIC/JPEG/PNG input to WebP output
- [ ] #2 Output at two sizes: 400w (thumb) and 800w (full)
- [ ] #3 All EXIF metadata stripped from output images
- [ ] #4 DateTimeOriginal extracted and logged for cook_log use
- [ ] #5 Dry-run mode prints what would be done without writing files
- [ ] #6 --all flag processes all source directories
- [ ] #7 Output stored in public/images/{recipe-id}/{date}/
- [ ] #8 npm script entry added (photos)
- [ ] #9 sharp and heic-convert added to package.json devDependencies
<!-- AC:END -->
