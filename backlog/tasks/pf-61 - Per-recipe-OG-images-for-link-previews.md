---
id: PF-61
title: Per-recipe OG images for link previews
status: To Do
assignee: []
created_date: '2026-02-07 09:14'
updated_date: '2026-02-10 08:20'
labels:
  - feature
dependencies:
  - PF-4
priority: medium
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Currently all pages share the same generic og-image.png brand card. Add support for per-recipe OG images so link previews show a recipe-specific image when available, falling back to the generic brand card.\n\nDepends on photo pipeline (PF-4) for actual images, but the wiring/fallback logic can land independently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe image convention defined (e.g. public/recipes/images/{recipe-id}-og.png or og_image field in recipe JSON)
- [ ] #2 useRecipeMeta.ts checks for recipe-specific image, falls back to generic og-image.png
- [ ] #3 prerender-og.ts checks for recipe-specific image, falls back to generic og-image.png
- [ ] #4 Static fallback OG tags in index.html unchanged (always use generic brand card)
- [ ] #5 OG images must be 1200x630 recommended, < 8MB, PNG or JPG
- [ ] #6 Facebook Sharing Debugger shows recipe-specific image when available
- [ ] #7 Facebook Sharing Debugger shows generic brand card when no recipe image exists
<!-- AC:END -->
