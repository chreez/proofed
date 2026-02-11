---
id: PF-117
title: Show latest bake hero image on recipe detail page
status: To Do
assignee: []
created_date: '2026-02-11 09:52'
updated_date: '2026-02-11 12:27'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Display the hero photo from the most recent cook log entry prominently on the recipe detail page. Placement TBD via demo spike — options include full-width header banner, below-title featured photo, or sidebar/aside. Recipes with no cook log photos need a clean fallback (no broken image, no empty space).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe detail page renders a full-width hero banner image above RecipeMeta when the recipe has cook log photos
- [ ] #2 Hero image is sourced from cook_log[0].photos[photos.length - 1] (latest bake, last photo = hero convention)
- [ ] #3 Banner uses object-cover with height h-48 (mobile) / h-64 (desktop)
- [ ] #4 Dark gradient overlay (bottom-to-transparent) displays "latest bake" label and bake date in white monospace text
- [ ] #5 Banner is wrapped in a card container (border-2 border-stone-200 rounded-none) with no padding and overflow-hidden
- [ ] #6 Recipes with no cook log or no photos in the latest entry render no banner — no placeholder, no empty space
- [ ] #7 RecipeMeta, stages, TOC sidebar, and all content below the banner are visually unaffected
- [ ] #8 Clicking the hero banner opens the photo in the existing PhotoLightbox
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Demo Result (DRAFT-7.1)\n\nUser reviewed 3 placement options in isolation (demo page) and in the real recipe page (A/B toggle).\n\n**Chosen: Option A — Header Banner**\n- Full-width hero image above recipe title/meta\n- Dark gradient overlay (bottom → transparent) with \"latest bake\" + date label\n- Hero from `cook_log[0].photos[last]` (existing convention)\n- Height: h-48 mobile, h-64 desktop\n- Wrapped in card with overflow-hidden (no padding)\n\n**Rejected:**\n- Option B (below title) — clean but less visual punch in real page context\n- Option C (sidebar) — conflicts with existing TocSidebar\n\n**Fallback:** Recipes with no cook log photos → no hero shown (no placeholder block)"
<!-- SECTION:NOTES:END -->
