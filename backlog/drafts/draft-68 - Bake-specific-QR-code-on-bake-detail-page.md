---
id: DRAFT-68
title: Bake-specific QR code on bake detail page
status: Draft
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

## AC
- [ ] Bake detail page has a QR button that generates a code for the current bake URL
- [ ] QR code uses qr-code-styling with brand colors (accent corners, ink dots)
- [ ] No bake picker needed — URL derived from route params
<!-- SECTION:DESCRIPTION:END -->
