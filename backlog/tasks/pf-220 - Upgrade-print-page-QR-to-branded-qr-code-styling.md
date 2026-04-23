---
id: PF-220
title: Upgrade print page QR to branded qr-code-styling
status: Done
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
- [x] #1 Print page QR replaced from `qrcode` library to shared `useQrLabel` composable (from PF-219)
- [x] #2 Branded QR styling matches share modal: accent corners, ink dots, rounded type
- [x] #3 QR URL is configurable — default: recipe page (`/recipe/{id}`), accepts bake-specific URL if provided
- [x] #4 No label text on print page QR — just the styled QR code (omitting `labelText` param)
- [x] #5 QR renders as static `<img>` via data URL (same as current approach), compatible with print CSS
- [x] #6 Spike subtask: investigate `qr-code-styling` canvas→dataURL timing reliability in print rendering context — findings documented as JSDoc comment in RecipePrintView.vue onMounted
- [x] #7 `qrcode` library dependency retained — DemoQrTest.vue (spike comparison page) still uses it. Will be removed when demo pages are cleaned up.
<!-- AC:END -->
