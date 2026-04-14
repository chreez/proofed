---
id: PF-4.9
title: Persist EXIF timestamp data from photo pipeline
status: To Do
assignee: []
created_date: '2026-02-07 09:01'
updated_date: '2026-04-13 20:33'
labels:
  - feature
dependencies: []
parent_task_id: PF-4
priority: low
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The process-photos.ts script extracts DateTimeOriginal from EXIF and logs it to console, but the data is discarded. This is semi-dead code.\n\nOptions:\n- Add `timestamp?: string` to CookLogPhoto and persist in recipe JSON\n- Write to sidecar metadata.json (see sidecar metadata task)\n- Remove extraction if not needed (keep script lean)\n\nRelated: sidecar metadata pattern, CookLogPhoto future fields.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `ManifestPhoto` interface in `process-photos.ts` gains an optional `takenAt?: string` field (ISO 8601 datetime).
- [ ] #2 The existing `extractExifDate()` return value is passed through to the `ManifestPhoto` object returned by `processImage()`, populating `takenAt` when EXIF DateTimeOriginal is present.
- [ ] #3 Photos without EXIF data (e.g., video-extracted frames, screenshots) omit `takenAt` from their manifest entry — no error, no placeholder.
- [ ] #4 HEIC files (the primary source format) have their EXIF date extracted correctly — existing `extractExifDate()` already handles this via sharp metadata parsing.
- [ ] #5 `npm run build` passes (vitest + vue-tsc + vite build).
<!-- AC:END -->
