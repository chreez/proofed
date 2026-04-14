---
id: PF-204
title: Video frame extraction in photo pipeline — MOV/MP4 support
status: Done
assignee: []
created_date: '2026-04-11 18:31'
updated_date: '2026-04-12 18:12'
labels:
  - photo-pipeline
  - feature
dependencies: []
references:
  - scripts/
  - src/pages/ReviewPhotosPage.vue
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From the 2026-04-11 pizza bake: user provided MOV files alongside HEICs. Currently handled as a one-off hack (ffmpeg frame extraction at 1 frame per 2 seconds, manual review of frames).

Formalize this into the photo pipeline so video files are automatically split into candidate frames during `npm run photos`. User reviews all frames on the bake review page and picks keepers — same as regular photos.

One-off approach that worked:
- `ffmpeg -i input.MOV -vf "fps=1/2,scale=3024:-1" -q:v 2 output-frame-%02d.jpg`
- Extract at full resolution, every 2 seconds
- Show all frames in review page, user excludes duds

Questions to resolve during grooming:
- Should frame interval be configurable (e.g., 1/sec for short clips, 1/3sec for long ones)?
- Auto-detect video duration and adjust interval?
- Keep video files in photos-source or discard after extraction?
- How to handle video-sourced frames in manifest.json metadata (mark source as video?)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `npm run photos <source-dir>` detects `.MOV` and `.MP4` files (case-insensitive) in the source directory alongside HEIC/JPG files.
- [ ] #2 For each video file, ffmpeg extracts frames at 1 frame per second at full resolution. Output frames named `{video-basename}-frame-{NNN}.jpg` in the source directory for pipeline processing.
- [ ] #3 Extracted frames flow through the existing photo pipeline (resize to 800w + 400w WebP) identically to regular photos.
- [ ] #4 `manifest.json` entries for video-extracted frames include provenance metadata: `source: "video"`, `sourceFile: "{original filename}"`, and `frameIndex: number`.
- [ ] #5 If ffmpeg is not installed, the pipeline logs a clear error message naming the missing dependency and skips video files without crashing. Photo processing continues for non-video files.
- [ ] #6 Original video files are retained in `photos-source/` after extraction (not deleted).
- [ ] #7 The review page (`/review/photos/{recipe-id}/{date}`) renders video-extracted frames identically to regular photos — user can tag/exclude them the same way.
- [ ] #8 `npm run build` passes (vitest + vue-tsc + vite build).
<!-- AC:END -->
