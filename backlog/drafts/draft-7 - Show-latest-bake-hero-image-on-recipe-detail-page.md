---
id: DRAFT-7
title: Show latest bake hero image on recipe detail page
status: Draft
assignee: []
created_date: '2026-02-11 09:52'
updated_date: '2026-02-11 12:14'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Display the hero photo from the most recent cook log entry prominently on the recipe detail page. Placement TBD via demo spike — options include full-width header banner, below-title featured photo, or sidebar/aside. Recipes with no cook log photos need a clean fallback (no broken image, no empty space).
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Demo Result (DRAFT-7.1)\n\nUser reviewed 3 placement options in isolation (demo page) and in the real recipe page (A/B toggle).\n\n**Chosen: Option A — Header Banner**\n- Full-width hero image above recipe title/meta\n- Dark gradient overlay (bottom → transparent) with \"latest bake\" + date label\n- Hero from `cook_log[0].photos[last]` (existing convention)\n- Height: h-48 mobile, h-64 desktop\n- Wrapped in card with overflow-hidden (no padding)\n\n**Rejected:**\n- Option B (below title) — clean but less visual punch in real page context\n- Option C (sidebar) — conflicts with existing TocSidebar\n\n**Fallback:** Recipes with no cook log photos → no hero shown (no placeholder block)"
<!-- SECTION:NOTES:END -->
