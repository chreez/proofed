---
id: PF-207
title: 'QR label: replace brand with Reheat arrow'
status: To Do
assignee: []
created_date: '2026-04-16 14:11'
labels: [ux]
priority: Low
dependencies: []
---

## Context

QR label in ShareModal currently renders "proofed." brand text next to QR code. Recipients with no context don't know what the code is for. Replace brand with functional "Reheat ↑" label — serves the eater, not the maker.

## Acceptance Criteria

- [ ] QR label canvas renders "Reheat" with upward arrow (↑) instead of "proofed." brand text
- [ ] No brand name, brand dot, or accent-colored brand elements on the QR label
- [ ] Label text is legible when printed at small sticker sizes (~2-3cm wide)
- [ ] Arrow visually points toward the QR code in the label layout
- [ ] Change is isolated to the canvas-rendered label image — modal UI, share URL, and QR code generation unchanged
- [ ] QR label alt text updated to reflect new content (no "proofed" reference)

## Files

- `src/components/ShareModal.vue` — `renderQrLabel()` function (lines 71-127)
