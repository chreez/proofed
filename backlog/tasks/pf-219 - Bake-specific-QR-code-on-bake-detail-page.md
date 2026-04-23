---
id: PF-219
title: Bake-specific QR code on bake detail page
status: Done
assignee: []
created_date: '2026-04-23 17:08'
labels:
  - feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context
Currently the share popover on bake detail page generates a QR code for choosing which bake to share. User wants a direct QR button (not popover) on the bake detail page that generates a QR code linking directly to that specific bake URL.

## Desired behavior
- QR button on bake detail page (alongside or replacing share button)
- Click generates QR code for the specific bake URL: /recipe/{id}/bake/{date}
- Use qr-code-styling library (same as ShareModal) for branded look
- No popover/bake-picker — the bake context is already known from the route
- Consider: inline display vs modal vs expandable section

## Also consider
- Colorized QR on print page (swap qrcode → qr-code-styling for accent-colored dots/corners)
- Consistent QR styling across share modal, bake detail, and print page

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 QR icon button in bake detail nav row, next to existing printer icon
- [x] #2 Tapping QR button opens full modal (same pattern as ShareModal) showing branded QR label for current bake URL
- [x] #3 Modal includes: branded QR label image, link preview, copy link button, native share button (when available)
- [x] #4 No bake picker step — URL derived from route params (`/recipe/:id/bake/:date`)
- [x] #5 QR code styling config (accent corners, ink dots, rounded type, brand colors) extracted into shared composable (e.g., `useQrLabel`)
- [x] #6 ShareModal refactored to use shared composable — no behavioral changes to existing share flow
- [x] #7 `reheat.` label text is per-context (bake detail modal includes it), composable handles QR rendering only
- [x] #8 Shared composable exposes enough flexibility for future print page QR upgrade (no label text, different sizing)
<!-- AC:END -->
