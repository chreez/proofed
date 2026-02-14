---
id: DRAFT-10.1
title: 'Demo: Recipe multiplier - UI control placement'
status: To Do
assignee: []
created_date: '2026-02-13 03:46'
labels:
  - demo
  - spike
dependencies: []
parent_task_id: DRAFT-10
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Throwaway demo showing multiplier control options integrated into the existing recipe header. Use real data from a recipe with clear yields (e.g., NY-Style Pizza — "2 pizzas" or ATK Cinnamon Buns — "8 buns").

**Options to demo:**
1. **Preset buttons** — inline 0.5x / 1x / 2x / 3x buttons near the yields display
2. **Stepper** — +/- stepper control next to yields
3. **Dropdown** — compact dropdown/select near yields

**Key considerations:**
- Must feel native alongside existing header elements (copy recipe button, permalink, etc.)
- Mobile: control must be reachable and not crowd the header on iPhone
- Show scaled ingredient values updating live as multiplier changes
- Show how yields text adapts (parseable "8 buns" → "16 buns" vs freeform "4-6 servings")

**This is disposable demo code — not production.**
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Demo page accessible at `/demo/multiplier` showing control options
- [ ] #2 Uses real recipe data (NY-Style Pizza or ATK Cinnamon Buns)
- [ ] #3 Shows at least 3 UI control patterns for the multiplier
- [ ] #4 Each pattern shows live-updating ingredient values when multiplier changes
- [ ] #5 Testable on iPhone at `192.168.1.213:5173/demo/multiplier`
- [ ] #6 Demo is self-contained — no changes to production components
- [ ] #7 npm run build passes
<!-- AC:END -->
