---
id: PF-135
title: Branded favicon for proofed.
status: Done
assignee: []
created_date: '2026-02-14 03:29'
updated_date: '2026-02-14 03:38'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the default Vite favicon with a branded proofed. favicon. Standard sizes: 16x16, 32x32, 180x180 (apple-touch-icon). Deliver as static assets in public/.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Demo page at `/demo/favicon` shows 3-4 design candidates rendered at 16px, 32px, and 180px side-by-side for comparison
- [x] #2 User selects winning design from demo
- [x] #3 Final favicon delivered as: `favicon.ico` (16+32), `favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png` (180x180)
- [x] #4 index.html `<link>` tags updated to reference new favicon assets
- [x] #5 Default Vite favicon removed
- [x] #6 npm run build passes
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Generated branded favicon files using the user-selected Candidate A design (accent dot, #a65d45 filled circle on transparent background).

**Files created:**
- `public/favicon.svg` — Primary SVG favicon (modern browsers)
- `public/favicon-16x16.png` — 16x16 PNG fallback
- `public/favicon-32x32.png` — 32x32 PNG fallback
- `public/apple-touch-icon.png` — 180x180 for iOS
- `public/favicon.ico` — Multi-size ICO (16+32) for legacy browsers
- `scripts/generate-favicons.ts` — Repeatable generation script using `sharp`

**Files modified:**
- `index.html` — Added `<link>` tags for SVG, PNG, and apple-touch-icon favicons

**Notes:**
- No default Vite favicon existed to remove (already cleaned up previously)
- SVG is the primary favicon for modern browsers; PNGs serve as fallbacks
- Generation script uses `sharp` (already a devDependency) and can be re-run if the design changes
<!-- SECTION:FINAL_SUMMARY:END -->
