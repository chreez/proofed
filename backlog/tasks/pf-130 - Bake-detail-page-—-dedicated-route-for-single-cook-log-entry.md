---
id: PF-130
title: Bake detail page — dedicated route for single cook log entry
status: To Do
assignee: []
created_date: '2026-02-13 04:38'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dedicated route (`/recipe/:recipeId/bake/:date`) showing a single cook log entry as a full page. Pattern B from the DRAFT-6.1 spike. Whether it replaces or supplements the inline cook log expand is TBD — this task builds the page, navigation model decided later.

PF-128 (QR sharing) depends on this for the shared/QR recipient landing page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Route at `/recipe/:recipeId/bake/:date` renders a dedicated page for a single cook log entry
- [ ] #2 Page loads the recipe JSON and extracts the cook log entry matching `:date` param
- [ ] #3 Page displays: recipe name, bake date, version, summary, notes (with markdown bold), next-time items, and photo gallery
- [ ] #4 Hero photo (last in array) rendered full-width; supporting photos as scrollable thumbnails
- [ ] #5 Photo thumbnails open in PhotoLightbox on click
- [ ] #6 Back navigation returns to the recipe page (browser back or explicit back button)
- [ ] #7 If `:date` param doesn't match any cook log entry, shows a 'Bake not found' state
- [ ] #8 Page works on mobile at `192.168.1.213:5173` — no horizontal overflow, photos scale
- [ ] #9 No changes to the existing inline cook log expand in CookLogSection (coexistence — navigation model decided later)
- [ ] #10 npm run build passes
<!-- AC:END -->
