---
id: PF-58
title: Explore sidecar metadata pattern for photo pipeline (vyra adaptation)
status: To Do
assignee: []
created_date: '2026-02-07 09:01'
updated_date: '2026-02-10 08:20'
labels:
  - feature
  - ungroomed
  - refactor
dependencies: []
references:
  - '/Users/chris/workspace/vyra/public/data/blog/{slug}/meta.json'
priority: low
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Vyra uses per-article `meta.json` sidecar files to separate pipeline-generated metadata from authored content. Explore adopting this for the photo pipeline:\n\n- `public/images/{recipe-id}/{date}/metadata.json` could store EXIF dates, dimensions, AI descriptions, processing info\n- Recipe JSON references photos by path; sidecar stores generated data\n- Keeps authored content (alt text, manual notes) separate from machine-generated data\n- Enables re-processing without touching recipe JSON\n\nNeeds scoping: what belongs in sidecar vs recipe JSON? How does the Vue component consume it?
<!-- SECTION:DESCRIPTION:END -->
