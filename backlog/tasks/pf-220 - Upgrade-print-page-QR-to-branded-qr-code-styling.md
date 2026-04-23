---
id: PF-220
title: Upgrade print page QR to branded qr-code-styling
status: To Do
assignee: []
created_date: '2026-04-23 19:05'
labels:
  - feature
  - print
dependencies:
  - PF-219
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Print page currently uses plain qrcode library. Upgrade to use shared QR composable (from PF-219) with branded accent corners and ink dots. No reheat label text on print — just the styled QR code. Ensures visual consistency across share modal, bake detail, and print page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Print page QR replaced from `qrcode` library to shared `useQrLabel` composable (from PF-219)
- [ ] #2 Branded QR styling matches share modal: accent corners, ink dots, rounded type
- [ ] #3 QR URL is configurable — default: recipe page (`/recipe/{id}`), accepts bake-specific URL if provided
- [ ] #4 No label text on print page QR — just the styled QR code
- [ ] #5 QR renders as static `<img>` via data URL (same as current approach), compatible with print CSS
- [ ] #6 Spike subtask: investigate `qr-code-styling` canvas→dataURL timing reliability in print rendering context
- [ ] #7 `qrcode` library dependency removed after migration (if no other usages remain)
<!-- AC:END -->
