---
id: DRAFT-6.1
title: 'Demo: Bake detail view - popover vs route vs panel'
status: Done
assignee: []
created_date: '2026-02-13 03:19'
updated_date: '2026-02-13 03:38'
labels:
  - demo
  - spike
dependencies: []
parent_task_id: DRAFT-6
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Throwaway demo page showing three bake detail view patterns side-by-side, using real bake data from ATK Cinnamon Buns (2026-02-10).

**Options to demo:**
1. **Full-screen popover/modal** — overlay that takes over the screen, dismiss to return. On mobile, could feel app-like.
2. **Separate route** — `/recipe/:id/bake/:date` as a dedicated page. On mobile this is the most natural pattern (forward/back nav). PF-128 QR could link here directly.
3. **Slide-in panel** — slides from right (desktop) or bottom sheet (mobile) over the recipe page.

**Key considerations to evaluate:**
- How each feels on iPhone (192.168.1.213:5173)
- How the PF-128 share/QR flow maps onto each (does the recipient land here directly?)
- Transition animations and back-navigation feel
- Whether the collapsed cook log cards still make sense as entry points

**Note from user:** "page" is figurative — on mobile a separate route might make more sense even if desktop uses a popover.

**This is disposable demo code — not production.**
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Demo page accessible at `/demo/bake-detail` showing three patterns side-by-side
- [ ] #2 All three patterns use real data from ATK Cinnamon Buns cook log (2026-02-10 entry) — photos, notes, next-time items
- [ ] #3 Pattern A: Full-screen modal — overlay that takes over the screen with dismiss button/gesture
- [ ] #4 Pattern B: Separate route — navigates to a dedicated page, back button returns to demo
- [ ] #5 Pattern C: Slide-in panel — slides from right on desktop, bottom sheet on mobile
- [ ] #6 Each pattern includes a "shared mode" preview showing how it would look for a PF-128 QR recipient (intro text + reheat placeholder + photos)
- [ ] #7 Testable on iPhone at `192.168.1.213:5173/demo/bake-detail`
- [ ] #8 Demo is self-contained — no changes to production components
- [ ] #9 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User leaning toward Pattern B (separate route) but undecided. Reheat styling deferred to PF-128.
<!-- SECTION:NOTES:END -->
