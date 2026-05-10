---
id: DRAFT-78
title: Move QR + printer icons to sticky header on bake detail page
status: Draft
created_date: '2026-04-23 20:30'
labels:
  - ux
  - feature
dependencies:
  - PF-219
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bake detail page (`/recipe/:id/bake/:date`) currently hides header action icons (`showHeaderActions` excludes `showBakeDetail`). QR and printer buttons are in a content-level nav row instead of the sticky app header, which feels disjoint from the recipe detail page where those icons live in the header.

Move QR + printer icons into the sticky header for bake detail pages. QR should open BakeQrModal directly (no bake picker — context is known from route). Printer should link to print page. Remove duplicate nav row icons after migration.
<!-- SECTION:DESCRIPTION:END -->
