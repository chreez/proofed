---
id: DRAFT-52
title: Scale embedded amounts in recipe notes and directions
status: Draft
assignee: []
created_date: '2026-04-09 21:46'
labels:
  - scaling
  - schema
dependencies:
  - PF-183
references:
  - src/types/recipe.ts
  - src/components/StateStep.vue
  - src/composables/useScaling.ts
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Free-text fields (notes[].text, state.direction) contain hardcoded ingredient amounts (e.g., "100g" starter) that don't update when the scaling multiplier is active. Add structured `scalable_amounts` annotations to notes so the renderer can replace values at display time.

## Approach
- Add optional `scalable_amounts` array to StateNote type: `{ original: string, value: number, unit: string }[]`
- Renderer does string replacement at display time when multiplier > 1 — no regex guessing
- Each recipe needs manual review to identify which numbers are ingredient amounts vs. times/temps/percentages
- One sub-agent per recipe for thorough review, minor version bump per recipe

## Scope
- Only recipes with a `scaling` block need annotation (currently sourdough-pizza-dough; more pending from PF-183 spikes)
- Subtask per recipe, delegated to sub-agents to avoid context overload
- Yields mentioned in notes should also scale where applicable

## References
- User example: "weighing out your 100g" of starter → should show 200g at 2×, 400g at 4×
- Aligns with JSON-first philosophy — structured data, not regex parsing
<!-- SECTION:DESCRIPTION:END -->
