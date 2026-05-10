---
id: PF-244
title: >-
  Strengthen /bake-log ingredient snapshot capture (experiment panel + note
  parse)
status: To Do
assignee: []
created_date: '2026-05-10 02:53'
updated_date: '2026-05-10 04:09'
labels:
  - ux
  - snapshot
  - backfill
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

DRAFT-74 originally proposed a /review/snapshot/{recipeId}/{date} page mirroring the photo review UX. Reframed during grooming (2026-05-09): the user pointed out that bake-log + experiment panel + bake_notes ALREADY supply the inputs needed to produce an accurate cook_log[].ingredients snapshot — no separate review page needed.

PF-237 AC #8 covered this in spirit ("/bake-log skill writes cook_log[].ingredients...if scratchpad or bake_notes contain ingredient deltas, surface a confirmation prompt") but the mechanics were vague.

## Scope

Strengthen the /bake-log skill so that, at bake-end, it produces a cook_log[].ingredients snapshot that reflects what was ACTUALLY used — not just a clone of the version baseline. Two input streams feed deltas on top of the baseline:

1. **ExperimentPanel localStorage adjustments** — per-ingredient gram overrides set by the user during the bake via sliders. Already persisted via useExperimentStorage. Apply silently (user explicitly set them).

2. **bake_notes prose mentions** — quantity references the user wrote during the bake ("400g cheddar", "ran out, used half", "-40g flour"). Skill scans for patterns, echoes each detected delta, prompts user to confirm/skip/edit/reassign before applying.

## Out of scope

- New review page or component (rejected per draft reframe)
- Auto-inference without user confirmation for prose deltas (Mozzarella Rule)
- Schema migration (snapshots already exist from PF-237)
- ExperimentPanel UX changes — only its persisted output is consumed

## References

- PF-237 — established cook_log[].ingredients schema and the /bake-log AC #8 expectation
- src/composables/useExperimentStorage.ts — persistence layer for ExperimentPanel adjustments
- src/composables/useScratchpad.ts:140-154 — clearAll pattern to mirror for post-write cleanup
- .claude/skills/bake-log/skill.md — existing skill flow
- CLAUDE.md "Cook Log Protocol" — Mozzarella Rule (never infer details)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /bake-log skill SKILL.md (.claude/skills/bake-log/skill.md) gains a 'Snapshot resolution' phase that runs before writing cook_log[].ingredients; phase is documented step-by-step in SKILL.md
- [ ] #2 Phase reads ExperimentPanel localStorage for the current recipeId via the same key shape as useExperimentStorage; extracts per-ingredient adjusted gram values from the stored adjustments map
- [ ] #3 Phase applies ExperimentPanel adjustments on top of the version baseline clone: for each adjusted ingredient, replaces baseline 'total' with the adjusted value (preserving the ingredient's id, name, unit, breakdown shape)
- [ ] #4 ExperimentPanel adjustments are applied without per-item prompts (already user-set during bake), but the skill echoes a single summary listing every applied adjustment at echo-back time
- [ ] #5 Phase parses every bake_notes[].curated string for quantity-mention patterns: number-then-unit ('400g', '10ml', '1.5 Tbsp'), signed delta ('-40g flour', '+10g salt'), prose volume ('half a bag', 'full can', 'ran out'); the catalog of patterns is documented in SKILL.md with examples
- [ ] #6 For each detected pattern, phase associates it with an ingredient via exact name match (case-insensitive substring), partial match, or by prompting the user to choose — never silently picks an ingredient
- [ ] #7 For each detected note-derived delta, phase echoes to the user: ingredient name, baseline gram value, proposed gram value, the source bake_note (timestamp + curated text), with action options [Apply / Skip / Edit value / Choose different ingredient]
- [ ] #8 User can choose 'Apply all' or 'Skip all' batch operations to resolve all detected note-derived deltas at once
- [ ] #9 No note-derived delta is ever applied without explicit user confirmation; SKILL.md cites the Mozzarella Rule from CLAUDE.md and prohibits silent inference
- [ ] #10 Final cook_log[].ingredients reflects: version baseline + ExperimentPanel adjustments + user-confirmed note-derived deltas; D6 breakdown-sum check validated post-write; failed D6 aborts the write with an error explaining which ingredient broke
- [ ] #11 ExperimentPanel localStorage for the recipe is cleared on successful cook_log write (mirrors useScratchpad.clearAll pattern; prevents stale adjustments leaking into the next bake)
- [ ] #12 If no ExperimentPanel adjustments AND no detected note deltas exist, phase writes baseline clone unchanged (preserves PF-237 existing behavior; silent no-op)
- [ ] #13 No new Vue component or route is added; all interaction happens inside the /bake-log skill terminal flow (out-of-scope guardrail enforced by the absence of any src/components/*.vue diff)
- [ ] #14 Skill-level fixture test or live test validates: a fixture recipe + bake with one ExperimentPanel adjustment AND one note delta, with confirm-all responses, produces the expected cook_log[].ingredients (baseline + both deltas)
- [ ] #15 Skill-level fixture test: same fixture with skip-all responses yields baseline clone unchanged (no deltas applied)
- [ ] #16 PF-237 task notes get a follow-up reference linking PF-244 as the realization of AC #8's vague delta-prompt requirement
<!-- AC:END -->
