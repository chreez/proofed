---
id: PF-135
title: Branded favicon for proofed.
status: To Do
assignee: []
created_date: '2026-02-14 03:29'
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
- [ ] #1 Demo page at `/demo/favicon` shows 3-4 design candidates rendered at 16px, 32px, and 180px side-by-side for comparison
- [ ] #2 User selects winning design from demo
- [ ] #3 Final favicon delivered as: `favicon.ico` (16+32), `favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png` (180x180)
- [ ] #4 index.html `<link>` tags updated to reference new favicon assets
- [ ] #5 Default Vite favicon removed
- [ ] #6 npm run build passes
<!-- AC:END -->
