---
id: PF-4.9
title: Persist EXIF timestamp data from photo pipeline
status: To Do
assignee: []
created_date: '2026-02-07 09:01'
labels:
  - feature
  - ungroomed
dependencies: []
parent_task_id: PF-4
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The process-photos.ts script extracts DateTimeOriginal from EXIF and logs it to console, but the data is discarded. This is semi-dead code.\n\nOptions:\n- Add `timestamp?: string` to CookLogPhoto and persist in recipe JSON\n- Write to sidecar metadata.json (see sidecar metadata task)\n- Remove extraction if not needed (keep script lean)\n\nRelated: sidecar metadata pattern, CookLogPhoto future fields.
<!-- SECTION:DESCRIPTION:END -->
