---
id: PF-106
title: Index hero image pipeline — selection + backfill strategy
status: To Do
assignee: []
created_date: '2026-02-10 05:23'
labels:
  - ungroomed
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
How do we add consistent image selection for list view for new recipes? How to backfill existing ones?

Agent can do image transformations at user's request, but I'd rather not overwrite images that exist inside the recipe image gallery.

Key questions:
- Should index heroes be separate crops/transforms from cook_log gallery images?
- How to generate index-specific thumbnails without mutating the gallery originals?
- Pipeline for new recipes: auto-select best hero candidate from cook_log photos?
- Backfill: recipes with no cook_log photos need placeholder or generated art?
- Storage: separate output path (e.g. `public/images/{recipe-id}/index-hero/`) vs reusing existing thumbnails with different crop params?
<!-- SECTION:DESCRIPTION:END -->
