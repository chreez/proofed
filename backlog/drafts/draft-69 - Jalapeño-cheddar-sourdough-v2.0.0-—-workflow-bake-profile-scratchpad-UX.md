---
id: DRAFT-69
title: Jalapeño cheddar sourdough v2.0.0 — workflow + bake profile + scratchpad UX
status: Draft
assignee: []
created_date: '2026-05-05 21:11'
labels:
  - ungroomed
  - recipe
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Source

Captured from scratchpad meta-notes during 2026-05-05 jalapeño cheddar sourdough bake (cook_log entry on `public/recipes/jalapeno-cheddar-sourdough.json` for date 2026-05-05). User flagged these in scratchpad as candidates for a major version bump, then asked to encapsulate everything into one backlog draft for later grooming.

## What the user said (verbatim, from bake_notes)

- "overall recipe note: i am doing things in a order that seems to work for me."
- "i start with autolyse. so i measure out the water flour and starter. its good to get this started because its a mostly passive step. we can do other preps in the meantime. in order: start dry mix (i also feed my starter this step but nonconsequential for recipe)"
- "if i get that done quickly. i'm able to then shift focus on the cheese and jalapeños. however, an improvement is to measure out the butter right after auto lyse. just so we can let it come to room temp naturally without needing microwave."
- "i then do the cheddar cubes. and then jalapeños. i throw them in a cambro and shake it up to mix."
- "these notes should result in a major version bump. when processing just create and draft the backlog item for version bump. include all details and make sure it references raw notes so the agent picking up the task knows what to do with it."
- "disregard last entry. note: would be nice to be able to edit or remove entries."

## Candidate changes for major version bump (v2.0.0)

### Workflow / order of operations
- Reorder steps so autolyse (water + flour + starter) starts first as the passive anchor
- Insert "measure butter, leave on counter to come to room temp" step immediately after autolyse start — eliminates need to microwave butter later
- Document inclusion prep sequence: cheddar cubes → jalapeños → combine in cambro → shake to mix (vs folding separately into dough)
- Note that starter feed can happen during autolyse window (parallel passive step, no recipe impact)

### Bake profile
- Current recipe vs observed: loaf 1 used 375°F covered → 450°F uncovered (overbrowned). Loaf 2 used 450°F covered (30 min) → 425°F uncovered (~18 min) and produced much more desirable color, internal 210°F.
- Consider updating recipe bake states to 450°F covered 30min + 425°F uncovered ~18min as the canonical profile
- Compare against prior next_time from 2026-05-03 bake which suggested 475/440 — synthesize across both bakes before deciding

### Ingredient sourcing note
- 100g block of sharp cheddar is not enough for one loaf at current scale — recipe meta should call out target block size or recommend ≥250g block when planning to make twice in a row

### Source material
- Re-verify against Proof Bread YouTube transcript at `jalapeno-cheddar-sourdough_7hU_nEJYgxw/transcript.txt` for canonical inclusion technique (cambro shake is consistent with Proof Bread's "fold inclusions" method but worth confirming)

## Out-of-scope nit (separate concern, capture here for triage)

**Scratchpad UX:** user's "disregard last entry" workaround surfaces a missing feature — the scratchpad capture UI needs edit and/or delete on individual entries before export. Not part of recipe v2.0.0 work; split into its own task during grooming.

## Acceptance Criteria (to be groomed)

This is a Draft. Grooming should:
1. Confirm scope — single v2.0.0 PR vs split into multiple smaller version bumps
2. Decide which workflow changes promote to recipe states vs notes
3. Lock the bake profile based on cumulative cook_log evidence (2 bakes so far)
4. Split out the scratchpad-UX item as a separate Draft
5. Write agent-verifiable ACs against the recipe JSON schema

## References

- Cook log entry: `public/recipes/jalapeno-cheddar-sourdough.json` → `cook_log[1]` (date 2026-05-05) — see `bake_notes[]` with `processing: "meta"` for raw user instructions
- Prior cook log entry: `cook_log[0]` (date 2026-05-03) for the v1.0.0 → v1.1.0 reasoning
- Proof Bread reference video: `jalapeno-cheddar-sourdough_7hU_nEJYgxw/transcript.txt`
<!-- SECTION:DESCRIPTION:END -->
