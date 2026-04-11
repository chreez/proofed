---
id: DRAFT-62
title: Video frame extraction in photo pipeline — MOV/MP4 support
status: Draft
assignee: []
created_date: '2026-04-11 18:31'
labels:
  - photo-pipeline
  - feature
dependencies: []
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
