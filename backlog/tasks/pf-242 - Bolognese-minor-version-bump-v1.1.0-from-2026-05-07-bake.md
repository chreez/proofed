---
id: PF-242
title: Bolognese minor version bump (v1.1.0) from 2026-05-07 bake
status: To Do
assignee: []
created_date: '2026-05-07 18:27'
updated_date: '2026-05-07 19:39'
labels:
  - recipes
dependencies:
  - PF-241
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Recipe improvements derived from first bake (cook_log entry 2026-05-07). Bump v1.0.0 → v1.1.0. Changes: (1) next_time/recommended: full 6oz can tomato paste (~170g) instead of 85g — richer outcome. (2) next_time: 2 carrots (~100g) instead of 1 (50g). (3) next_time: 2 celery stalks instead of 1. (4) Pasta water salt note: for ~75% pot fill use ~1.5 Tbsp salt (not 30g) — final dish was salty with 30g. (5) Variant note: homemade egg pasta (00 flour) confirmed works, ~3 min cook. (6) Simmer timing: 2.5hr confirmed; start pasta water at ~2hr mark. Apply via /feedback against ba-bolognese after this bake-log commit lands.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe meta.version bumps to v1.1.0; change_log[] gets new entry { version: 'v1.1.0', date: '2026-05-07', summary: 'Tomato paste 85g→170g (full 6oz can), carrot 50g→100g, celery 40g→80g (2 stalks), pasta water salt 30g→14g with display_amount 1.5 Tbsp; added simmer state note for pasta water timing.' }
- [ ] #2 tomato-paste ingredient: total 85 → 170; breakdown[] (if present) rescaled or removed so D6 sum check passes
- [ ] #3 carrot ingredient: total 50 → 100; name updated from 'Carrot (small, peeled)' to reflect 2-carrot quantity (drop 'small'); breakdown rescaled if present
- [ ] #4 celery ingredient: total 40 → 80; name updated to reflect 2 stalks; breakdown rescaled if present
- [ ] #5 kosher-salt-pasta-water ingredient: total 30 → 14; display_amount 1.5 Tbsp populated (requires PF-241 schema field); name unchanged
- [ ] #6 Hard dependency on PF-241: this task is blocked until PF-241 (Ingredient.display_amount) lands
- [ ] #7 Simmer state notes[] gets a new StateNote with source: 'user', text: 'Start pasta water at ~2hr mark of the 2.5hr simmer.' — appended (not replacing existing notes)
- [ ] #8 cook_log[2026-05-07].next_time[] has these four items removed (now applied to the recipe): tomato paste 170g, 2 carrots, 2 celery stalks, pasta water salt 1.5 Tbsp
- [ ] #9 cook_log[2026-05-07].next_time[] retains the homemade egg pasta variant note (deferred to future pasta-noodles recipe link)
- [ ] #10 cook_log[2026-05-07].version field stays at v1.0.0 (entry was baked against v1.0.0; historical truth preserved)
- [ ] #11 Subsequent cook_log entries default to version v1.1.0 (handled by /bake-log on next bake)
- [ ] #12 Validation passes D1-D14, D16, R1-R8: grams/F/cm units; exit_condition non-empty on every state; gather breakdown sums match totals; F29 reheat block intact
- [ ] #13 Validation passes V1-V6 on cook_log[2026-05-07] post-edit (next_time entries that remain are still first-person and well-sourced)
- [ ] #14 Recipe accuracy gate: ingredient changes are user-derived (cook_log evidence); task notes document the basis (cook_log[2026-05-07].notes lines confirming each change)
- [ ] #15 Snapshot tests: GatherSection and RecipeMeta snapshots that include these ingredients update with new gram values; HITL styling-gate sign-off required before commit
- [ ] #16 Print page renders updated amounts and display_amount on pasta water salt correctly (verified via HITL styling gate)
- [ ] #17 Egg pasta variant + future 'pasta noodles' recipe link captured as a follow-up draft in task notes (not created in this task)
<!-- AC:END -->
