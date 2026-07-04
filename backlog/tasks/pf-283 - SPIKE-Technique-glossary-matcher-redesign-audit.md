---
id: PF-283
title: 'SPIKE: Technique-glossary matcher redesign + audit'
status: Done
assignee: []
created_date: '2026-07-04 20:01'
updated_date: '2026-07-04 20:35'
labels:
  - spike
  - ux
  - tech-debt
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problem

The technique glossary (`public/techniques.json` + `src/composables/useTechniques.ts`) uses **case-insensitive substring matching** to find tooltip triggers in ingredient names and state directions. This produces cross-contamination:

### Concrete failures observed (2026-07-04, jalapeño cheddar sourdough)

1. **Butter ingredient shows egg tooltip.** `Unsalted Butter (room temp)` matches the `"room temp"` key, whose tooltip is "Room Temperature Eggs..." Wrong ingredient context.
2. **Process-state directions misfire.** 28 recipes have direction text like "let dough rest at room temperature" — because "room temp" is a substring of "room temperature", the eggs tooltip triggers on every rest-state description. Structural false positive.
3. **Other ingredient-specific keys** (`softened`, `melted`, `diced`, `sifted`, `warm to 43°C`, `bloomed`) may misfire when the same descriptor is used across differently-typed ingredients.

### Immediate workaround shipped

Renamed jalapeño cheddar butter to `(softened)` (v3.0.1, PF-282). Point fix — does not address root cause or protect other recipes.

## Grooming decisions (2026-07-04)

- **Spike depth:** written recommendation + POC on jalapeño cheddar
- **Recommendation scope:** weigh all 4 disambiguation options fairly (annotation / word-boundary / scoped keys / hybrid)
- **Kill switch:** ship a `config.techniqueTooltips: false` per-recipe opt-out FIRST as a safety valve (separate task) before the redesign lands
- **Audit script:** built during the spike to ground the recommendation with data

## Acceptance Criteria

### Deliverable 1 — Kill switch (blocking prerequisite, separate follow-up task)

- Add optional `techniqueTooltips?: boolean` field to `RecipeConfig` (default true)
- `useTechniques.parseTextWithTechniques()` respects the flag — when false, returns a single `text` chunk with no technique decoration
- `TechniqueText.vue` (or callers) honor the flag
- Tests for on/off behavior
- Shipped in its own commit before the spike work starts

### Deliverable 2 — Audit script (part of spike)

- New `scripts/audit-techniques.ts` — walks every recipe in `public/recipes/*.json`, extracts every `gather.ingredients[].name`, `states[].direction`, `states[].exit_condition`, and runs the current matcher against them
- Output: table of `<recipe, field, ingredient_or_state, matched_key, tooltip_title>` with a `mismatch?` column flagged when the tooltip title/description mentions a different ingredient than the field context
- Add `npm run audit:techniques` script entry
- Emit both stdout summary + JSON dump (`scratchpad/audit-techniques-{date}.json`)
- Must correctly report: 3 categories of mismatch (ingredient-name mismatch, direction/exit false positive, subset-match like "room temp" ⊂ "room temperature")

### Deliverable 3 — Written recommendation (part of spike)

- Markdown document at `backlog/tasks/pf-283-spike-notes.md`
- Compare 4 approaches with concrete metrics from audit output:
  - **Annotation** — `technique_hint: "softened-butter"` on `IngredientRow`
  - **Word-boundary regex** — `\b<keyword>\b` matching
  - **Scoped keys** — keys renamed to disambiguated phrases ("room temp butter", "room temp eggs")
  - **Hybrid** — annotation-first with word-boundary fallback for state text
- For each: blast radius (files touched), migration cost (per-recipe patch bumps needed), matcher complexity, false-negative risk
- Explicit recommendation with justification
- Follow-up task ACs sketched for the chosen approach

### Deliverable 4 — POC on jalapeño cheddar (part of spike)

- Implement the recommended approach on jalapeño cheddar only
- Verify:
  - Butter row no longer shows egg tooltip
  - Butter row shows appropriate softened/butter-specific tooltip
  - No regressions on other recipes (build + manual spot check)
- Do NOT sweep other recipes in the spike — that's the follow-up task

### Deliverable 5 — Follow-up task drafts

- Draft task: implement chosen matcher approach across the codebase (not just POC)
- Draft task: apply migration to all 28 affected recipes (patch bumps + change_log entries per recipe)
- Draft task: ship regression tests + integrate audit script into `npm run build` gate
- Each with concrete ACs

## Out of Scope

- Implementing the chosen approach across all recipes (that's the follow-up)
- Rewriting `techniques.json` structure (unless annotation is chosen, in which case keys can stay flat)
- Historical `change_log[]` / `cook_log[]` snapshot migration (frozen by rule)

## Sequencing

1. Ship kill switch task first (separate PR/commit, blocking prerequisite noted above)
2. Execute spike: audit → recommendation → POC → follow-up drafts
3. Follow-up tasks land in later sessions

## Source

- Bake log 2026-06-27 (jalapeño cheddar) → next_time item on missing butter → grooming session revealed tooltip misfire
- Jalapeño cheddar v3.0.1 patch shipped a point fix — this task addresses root cause
- Grooming session 2026-07-04 (defaults auto-approved, spike executed same session)
<!-- SECTION:DESCRIPTION:END -->
