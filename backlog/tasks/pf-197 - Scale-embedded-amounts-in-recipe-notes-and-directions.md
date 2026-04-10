---
id: PF-197
title: Scale embedded amounts in recipe notes and directions
status: To Do
assignee: []
created_date: '2026-04-09 21:46'
updated_date: '2026-04-09 22:04'
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
Free-text fields (`state.direction` and `notes[].text`) contain hardcoded ingredient amounts (e.g., "100g" starter) that don't update when the scaling multiplier is active. Add `{{Ng}}` template placeholder syntax to these fields so the renderer can interpolate scaled values at display time — no regex guessing.\n\n## Approach\n- Add optional `scalable_direction` to `RecipeState` and `scalable_text` to `StateNote` — template strings with `{{413g}}`-style placeholders\n- Renderer parses `{{<number><unit>}}`, scales the number by multiplier, strips braces\n- Non-scaling numbers (temps, times, fixed ingredients) stay as plain text — the annotation IS the scaling decision\n- Each recipe needs manual audit to classify every numeric amount; spike subtasks per recipe\n\n## Scope\n- Only recipes with a `scaling` block need annotation\n- Subtask per recipe for exhaustive numeric audit (sourdough pizza, simple sourdough, birote salado)\n- Yields mentioned in notes should also scale where applicable\n\n## References\n- User example: "weighing out your 100g" of starter → should show 200g at 2×, 400g at 4×\n- Aligns with JSON-first philosophy — structured data, not regex parsing
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 RecipeState gains an optional `scalable_direction?: string` field. When present, the renderer uses it instead of `direction` for display. The string may contain `{{Ng}}` placeholders (e.g., `{{413g}}`).
- [ ] #2 StateNote gains an optional `scalable_text?: string` field. When present, the renderer uses it instead of `text` for display. The string may contain `{{Ng}}` placeholders.
- [ ] #3 A shared utility function `interpolateScalableText(text: string, multiplier: number): string` is added to `useScaling.ts` (or a new composable). It parses all `{{<number><unit>}}` patterns, multiplies the number by the multiplier, and returns the interpolated string. When multiplier is 1, it strips the braces and returns the original values unchanged.
- [ ] #4 `StateStep.vue` uses the interpolation utility to render `scalable_direction` (falling back to `direction`) and `scalable_text` on each note (falling back to `text`). Unbraced numbers (temps, times, percentages) pass through unchanged.
- [ ] #5 Numbers that should NOT scale (temperatures, times, percentages, fixed-behavior ingredients) are never wrapped in `{{braces}}` in recipe JSON. The annotation is the scaling decision.
- [ ] #6 Three spike subtasks are created for exhaustive numeric audits: (1) sourdough-pizza-dough.json, (2) simple-sourdough.json, (3) birote-salado.json. Each spike classifies every numeric amount as scalable or non-scalable, annotates with `{{Ng}}` placeholders, and documents rationale.
- [ ] #7 Each recipe annotated by a spike gets a minor version bump and `change_log` entry summarizing the addition of scalable amount annotations.
- [ ] #8 When `multiplier > 1`, scaled values in interpolated text render with the computed amount (e.g., `{{413g}}` → `826g` at 2×). No `{{` or `}}` characters are ever visible to the user.
- [ ] #9 Recipes without a `scaling` block are unaffected — their `direction` and `notes[].text` render exactly as before (no `scalable_direction` / `scalable_text` fields present).
- [ ] #10 `npm run build` passes (vitest + vue-tsc + vite build).
<!-- AC:END -->
