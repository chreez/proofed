---
id: PF-207
title: 'QR label: replace brand with reheat label'
status: Done
assignee: []
created_date: '2026-04-16 14:11'
labels: [ux]
priority: Low
dependencies: []
---

## Context

QR label in ShareModal currently renders "proofed." brand text next to QR code. Recipients with no context don't know what the code is for. Replace brand with functional "reheat." label — serves the eater, not the maker.

## Acceptance Criteria

- [x] QR label canvas renders "reheat." instead of "proofed." brand text
- [x] Brand dot retained as accent element after "reheat"
- [x] Label text is legible when printed at small sticker sizes (~2-3cm wide)
- [x] Change is isolated to the canvas-rendered label image — modal UI, share URL, and QR code generation unchanged
- [x] QR label alt text updated to reflect new content

## Implementation Notes

- Explored 10 label variants via demo page (wording, casing, layout, with/without arrows)
- User chose variant D: single word "reheat." with accent dot, horizontal layout
- Font bumped to 48px for single-word legibility at sticker size
- Demo page at `/demo/qr-label-variants` for reference

## Files

- `src/components/ShareModal.vue` — `renderQrLabel()` function
