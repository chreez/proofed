---
id: PF-90
title: Photo review workflow for cook log images
status: To Do
assignee: []
created_date: '2026-02-09 06:42'
updated_date: '2026-02-13 18:33'
labels:
  - ux
  - workflow
dependencies: []
priority: medium
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Full photo review workflow combining CLI shorthand and web UI. Evolves the POC (PF-109) into a production tool for reviewing cook log photos after pipeline processing.

**Web UI enhancements (from DRAFT-6):**
- Lightbox/magnify for closer photo inspection
- Note editing buttons that modify output JSON payload (reformat, clean up) — no live agent connection from browser
- Image manipulation controls (crop, rotate) that modify output JSON payload
- Fully generic — works for any recipe + date combo, no seed data
- localStorage persistence across refreshes (already working in POC)

**CLI flow (original scope):**
- Agent presents numbered photo list after processing
- User specifies hero, exclusions, reordering with shorthand (e.g. "hero=8, drop 3")
- Agent applies feedback, re-presents for approval

Output: JSON payload copied to clipboard, ready for cook log wiring.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Review page has lightbox/magnify — tap photo for zoomed view
- [ ] #2 Review page has note editing buttons that modify output JSON payload (reformat, clean up) — no agent connection from browser
- [ ] #3 Review page has image manipulation controls (crop, rotate) that modify output JSON payload
- [ ] #4 Review page is fully generic — works for any recipe + date combo, no seed data
- [ ] #5 localStorage persists review state across page refreshes
- [ ] #6 CLI shorthand input still works ("hero=8, drop 3") alongside web UI
- [ ] #7 "Copy feedback to clipboard" exports final JSON payload with all modifications
<!-- AC:END -->
