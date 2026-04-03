---
id: PF-172
title: Simple Sourdough v3.0.0 — codify evolved technique + audit input UX
status: Done
assignee: []
created_date: '2026-04-03 01:10'
updated_date: '2026-04-03 01:41'
labels:
  - recipe-update
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Comprehensive recipe update to capture 11 bakes worth of evolved technique that has diverged from the written recipe. The recipe is now used as guidance/checklist by an experienced baker — the UX should reflect that.

## Pillar 1: Recipe Procedure Update

The written recipe (v2.1.0) is missing several steps that have become standard practice:

- **Fermentolyse**: Delayed salt addition (~30 min after initial mix). Standard since bake #6 (2026-03-01). Recipe currently says "combine all ingredients" in one step.
- **Aliquot jar**: Not mentioned anywhere in recipe. Used since bake #4 (2026-02-20) to track bulk ferment rise %. Targeting 30-60% depending on dough temp.
- **Room temp rest after shaping**: ~1 hour settle at room temp, then stitch for tension, then into fridge. Recipe currently goes straight from shape → basket → fridge.
- **No-linen banneton**: Confirmed better results across bakes #7-11. Recipe still mentions "towel-lined proofing baskets."
- **Fix DIVIDE weight**: Says ~480g each — wrong for 2-loaf recipe (total dough ~1920g, each half ~960g). Bug from v1 single-loaf days.
- **Sequential bake procedure**: Re-preheat 500°F for 30 min between loaves. Flip second loaf at ~15 min for even browning. Not documented.
- **Fermentolyse water hold-back**: Some bakes held back 25g water for salt incorporation. Consider standardizing.

## Pillar 2: Input Mechanism Audit

User has recipe mostly memorized after 11 bakes. The app is guidance + checklist + structured note capture now. Audit:

- Are `reminders` (dough temp, weigh, fermentation check) being used? Cook log data suggests they're often skipped.
- Should reminders evolve into optional checklists rather than mandatory prompts?
- The structured timestamped input (step notes from the app) is working great — preserve and improve that flow.
- Consider whether the step-by-step progression still fits or if a "dashboard" mode would serve experienced bakers better.

## Pillar 3: Mobile Viewport Zoom Bug

Separate from PF-164 (notes popover overflow, Done). When tapping a note input on iPhone, the page zooms in and doesn't restore the viewport. User must manually pinch to zoom back out. Likely iOS Safari auto-zoom on input focus when font-size < 16px. Investigate all input elements in ScratchpadNote, GeneralNotesFab, and any other mobile-facing text inputs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Recipe JSON version bumped to v3.0.0 with change_log entry summarizing all procedure changes
- [x] #2 All procedure changes grounded in bake log evidence (cite bake # where technique was adopted)
- [x] #3 Human review gate completed before any StateNote or reminder is added, modified, or removed
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## PF-172.1 Spike Findings: Reminder & StateNote Audit

### Critical Finding: COMBINE_INGREDIENTS "No autolyse needed" note
Directly contradicted by 6 consecutive bakes using fermentolyse (#6-11). Highest-priority removal.

### DIVIDE weight bug
Direction says ~480g each — wrong for 2-loaf recipe (should be ~960g). v1 leftover caught by bake #11.

### Reminder Usage Rates (of 11 bakes)
- Dough temp (FOLD_1): 9/11 — KEEP + expand to all folds
- Ambient temp (BULK): 5/11 — MODIFY (merge with dough temp)
- Volume rise % (BULK): 8/11 — KEEP + enhance with aliquot targets
- Internal temp (BAKE): 4/11 — DEMOTE to optional
- Crust rating (COOL): 6/11 — MODIFY to be more specific

### Missing Items (12 additions needed)
1. PREP: Aliquot jar in equipment, Challenger in vessels, no-linen banneton default
2. MIX: New fermentolyse states (mix without salt → rest ~30min → add salt + held-back water)
3. MIX: Aliquot sample reminder at salt addition
4. STRETCH_FOLD: Temp reminder on FOLD_2 and FOLD_3 (not just FOLD_1)
5. STRETCH_FOLD: Sourdough Journey V2.0 fermentation chart reference
6. BULK_FERMENT: Aliquot target by temp (~30% at 80°F+, ~40-50% at 75-79°F, ~50-60% at 70-74°F)
7. SHAPE: New ROOM_TEMP_REST state (~1 hr at room temp, stitch, then fridge)
8. COLD_PROOF: Reminder to note fridge entry time
9. BAKE: Sequential 2-loaf procedure (re-preheat 500°F 30 min between loaves)
10. BAKE: Cross score recommended over decorative patterns

### Notes to Modify (6 items)
- Remove: "No autolyse needed" (COMBINE_INGREDIENTS)
- Soften: "3 sets is sufficient" → "3 is standard, 4th optional"
- Update: "Watch the dough not the clock" → reference aliquot jar
- Merge: ambient temp reminder into dough temp tracking
- Demote: internal temp reminder to optional
- Specify: crust rating → "color, ear development, blistering"

Full spike report with per-bake evidence available in conversation history.

## Human Review Gate — APPROVED (2026-04-03)

All 22 changes approved by user: 1 remove, 6 modify, 12 add, ~18 keep.
User will do visual review on the web page after implementation.

Approved changes:
- R1: Remove "No autolyse needed" note
- M1-M6: Modify 6 existing notes/reminders
- A1-A12: Add 12 new items (equipment, states, reminders, notes)
- All other existing notes kept as-is
<!-- SECTION:NOTES:END -->
