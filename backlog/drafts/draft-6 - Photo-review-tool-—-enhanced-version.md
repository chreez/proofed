---
id: DRAFT-6
title: Photo review tool — enhanced version
status: Draft
assignee: []
created_date: '2026-02-11 03:04'
labels:
  - feature
  - workflow
dependencies:
  - PF-109
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evolve the photo review POC (PF-109) into a full workflow tool. The POC proved very useful for structured photo feedback during the v1.2 bake log — worth investing in.

**Enhancement ideas from first use:**
- **Magnify**: Zoom/lightbox on photos within the review page for closer inspection
- **Manipulate notes**: Let the agent reformat, clean up, or enrich notes inline
- **Agent image manipulation**: Agent can crop, rotate, or adjust images on the user's behalf
- **Generify for reuse**: Remove seed data, make fully dynamic for any recipe + date combo (partially done via photos.json manifest)
- **localStorage persistence**: Already working in POC — preserve across refreshes

**POC branch:** `poc/photo-review-tool` — contains the working prototype with seed data, instructions panel, usage tags (hero/step/process/exclude), and JSON export.

**Origin:** Built during v1.2 ATK Cinnamon Buns Ultimate bake log session. PF-109 ACs cover the basic version.
<!-- SECTION:DESCRIPTION:END -->
