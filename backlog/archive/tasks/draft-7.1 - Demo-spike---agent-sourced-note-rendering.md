---
id: DRAFT-7.1
title: Demo spike - agent-sourced note rendering
status: To Do
assignee: []
created_date: '2026-02-11 19:26'
updated_date: '2026-02-11 19:41'
labels:
  - spike
  - demo
  - ux
dependencies: []
parent_task_id: DRAFT-7
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Throwaway demo page showing how agent-contributed `StateNote` entries (with `source: 'agent'`) render differently from user-authored ones on the recipe page. Goal: give the user side-by-side visual options to pick a design direction before building the real thing.

**Scope (disposable demo — just enough to evaluate):**
- Create a demo page or temporary route that renders a recipe stage with a mix of `source: 'user'` and `source: 'agent'` notes
- Show 2-3 visual differentiation options side by side (e.g., subtle label/badge, different background tint, italic + attribution line, border accent)
- Each option should be clearly labeled and self-contained
- Use the existing `StateStep.vue` / `StageCard.vue` rendering as the baseline
- Demo data can be hardcoded — no need to wire up real recipe loading
- Code is intentionally disposable — will be deleted after the user picks a direction

**Dependencies:** PF-118.1 (source field must exist in type system). Output feeds into PF-118's visual design and DRAFT-10 (skill needs to know how agent notes will look).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Demo page/route accessible on localhost showing a recipe stage with a mix of `source: 'user'` and `source: 'agent'` notes
- [ ] #2 At least 3 distinct visual differentiation options displayed side by side, each clearly labeled (e.g. "Option A: Badge", "Option B: Tint", "Option C: Border accent")
- [ ] #3 Demo renders through the real `StateStep.vue` rendering path (or a minimal fork of it) — not a static mockup
- [ ] #4 Demo data is hardcoded — no recipe loading required
- [ ] #5 Each option shows both a non-critical and a critical agent note so the user can evaluate how `source` and `critical` interact visually
- [ ] #6 Demo code is self-contained and disposable — deletable without affecting production code
- [ ] #7 No production component changes — demo only
<!-- AC:END -->
