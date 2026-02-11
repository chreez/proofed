---
id: DRAFT-9
title: Demo spike — agent-sourced note rendering
status: Draft
assignee: []
created_date: '2026-02-11 19:26'
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

**Context for grooming:** Depends on DRAFT-7.1 (the `source` field must exist in the type system). Output feeds into the parent task's visual design and into DRAFT-7.3 (the skill needs to know how agent notes will look). Follow the "demo" pattern from grooming rules — batch with other demos if any are pending.
<!-- SECTION:DESCRIPTION:END -->
