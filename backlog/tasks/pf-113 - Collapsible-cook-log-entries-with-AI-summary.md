---
id: PF-113
title: Collapsible cook log entries with AI summary
status: Done
assignee: []
created_date: '2026-02-11 04:01'
updated_date: '2026-02-11 04:28'
labels:
  - feature
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cook log bake entries collapsed by default. Collapsed card shows: formatted cook date, version badge, AI-generated 2-sentence summary, small hero thumbnail, and peek strip of up to 4 photo thumbnails (+N counter). Expands on click to show full notes, next-time items, and scrollable photo strip. Summary field stored in JSON, authored via agent-proposes/user-approves HITL flow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CookLogEntry type gains optional `summary: string` field (2-sentence AI-generated summary of the bake session)
- [ ] #2 All cook log bake entries render collapsed by default
- [ ] #3 Collapsed card displays: formatted cook date, version badge, summary text, hero thumbnail (small), peek strip of up to 4 photo thumbnails with +N counter when more exist
- [ ] #4 Clicking a collapsed entry expands it to show full notes, next-time items, and scrollable photo strip (current full layout)
- [ ] #5 Clicking an expanded entry collapses it back
- [ ] #6 When summary field is missing/empty, collapsed card renders gracefully (date + version + photos, no summary text)
- [ ] #7 Summary authoring follows HITL flow: agent generates candidate summary, presents to user for approval before writing to JSON
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Design Decision
User chose **Variant C — Hero Banner** from PF-113.1 spike demo.
- Hero photo as ~144px tall banner with gradient overlay
- Date + version badge overlaid in white at bottom of banner
- Summary text + note/photo/next-time counts below banner
- Expands on click to full notes, next-time, photo gallery
- Collapses back on click
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented collapsible cook log entries with Variant C hero banner design. Entries collapse by default showing hero photo with gradient overlay (date + version in white), AI summary, and note/photo/next-time counts with ChevronDown indicator. Click to expand shows full markdown notes, photo gallery with lightbox, and per-entry permalink (IconButton with copy feedback). Date format: ISO-first (2026-02-05 — Thursday). All styling aligned to site conventions: ChevronDown matching ResearchSection, IconButton for permalinks matching all sections, copyPermalink naming convention.
<!-- SECTION:FINAL_SUMMARY:END -->
