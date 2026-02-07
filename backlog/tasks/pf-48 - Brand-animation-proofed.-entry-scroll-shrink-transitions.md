---
id: PF-48
title: 'Brand animation: proofed. entry + scroll shrink transitions'
status: In Progress
assignee: []
created_date: '2026-02-07 02:56'
updated_date: '2026-02-07 03:17'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CSS transitions for the proofed. brand in the header:\n1. Entry animation on page load — dot animates separately with a scale/color pop\n2. Smooth shrink transition on scroll (text-2xl → text-lg)\n\nRequires mockup spike: build 2-3 entry animation variants, present side by side for user to choose. Variants should include fade+rise, fade+scale, letter-spacing shift, etc. All variants must have the dot popping independently.\n\nRelates to PF-32 (recipe title poof animation) — both are header scroll animations.\n\nThis is a styling task — requires human visual sign-off (PF-22 rule).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spike: build 2-3 entry animation mockup variants
- [ ] #2 All variants: accent dot (.) animates independently from 'proofed' text (scale/color pop)
- [ ] #3 User chooses variant from mockups before implementation
- [ ] #4 Entry animation plays on page load (~300-500ms total)
- [ ] #5 Scroll shrink transition smooth between text-2xl and text-lg
- [ ] #6 Animation does not delay page interactivity (CSS-only, no JS blocking)
- [ ] #7 Animation respects prefers-reduced-motion (disabled when set)
- [ ] #8 Works on mobile (iPhone via 192.168.1.213:5173)
- [ ] #9 Human visual sign-off on chosen animation before commit
<!-- AC:END -->
