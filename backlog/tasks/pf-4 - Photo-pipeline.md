---
id: PF-4
title: Photo pipeline
status: Done
assignee: []
created_date: '2026-02-06 18:46'
updated_date: '2026-02-08 10:25'
labels:
  - feature
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
V1: Simple photo pipeline. User provides photo → resize for web → strip sensitive EXIF → store in public/images/{recipe-id}/. No AI analysis in v1.\n\nFuture: AI image analysis, auto-descriptions, purpose tags, weather from EXIF.\n\nPhotos referenced in cook_log entries and optionally in recipe steps.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Photos stored in public/images/{recipe-id}/ directory
- [ ] #2 Images resized/optimized for web
- [ ] #3 Sensitive EXIF metadata stripped
- [ ] #4 Recipe JSON can reference photos (path field in cook_log entries)
- [ ] #5 Photos render on recipe page when referenced
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Core photo pipeline shipped via subtasks 4.1–4.6: HEIC→WebP processing script (sharp + heic-convert), photo schema in recipe types, cook log photo rendering with lazy loading, and validation checks for paths/alt text. Remaining work (video support, gallery styling, EXIF persistence) tracked in open subtasks PF-4.7, PF-4.8, PF-4.9.
<!-- SECTION:FINAL_SUMMARY:END -->
