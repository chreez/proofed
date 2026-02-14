---
id: PF-133
title: Bake scratchpad - structured note capture during bake
status: Done
assignee: []
created_date: '2026-02-13 18:44'
updated_date: '2026-02-14 22:12'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Structured note-taking and reminder system during active bakes. Two related features in one cohesive UI:

**Reminders:** Per-step prompts set during recipe generation (e.g. "measure yield", "check steel temp"). Reminder icon appears when a step is completed — nudges the baker to capture data.

**Notes:** Freeform + prompted note capture at any point during the bake. Popover with contextual questions. Can be triggered per-step or from a floating notepad button.

**Output:** Structured JSON blob for agentic ingestion during `/feedback` session. Data shape supports input/output/result tracking — excel-style exportable for recipe improvement over time.

**Broader direction:** Redesign of how bake log data is captured. Moving from post-hoc recall to in-the-moment structured capture. Feeds back into recipe refinement loop.

**Design open questions (see demo spike):**
- Where does the note UI live? (FAB toolbar vs inline per-step vs hybrid)
- Reminder UX (icon on completed step vs floating banner vs both)
- Structured data shape (what fields, how prompted)
- How it connects to existing feedback/cook log flow
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Per-step reminder icons appear on completed steps when reminders are configured
- [x] #2 Reminders are defined per-step during recipe generation
- [x] #3 Note capture popover with prompted questions is accessible from each step
- [x] #4 Floating notepad button available for general bake notes
- [x] #5 Output is structured JSON blob consumable by /feedback skill
- [x] #6 Data shape supports input/output/result tracking per step
- [x] #7 UI does not clutter the bake view — minimal unless interacted with
- [x] #8 JSON export available for external use (excel-style)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Design Direction (from PF-133.1 demo review)\n\n- **Placement: Inline per-step** — small icon button next to each step title\n- **Reminder UX: Banner** — but must fire BEFORE/DURING the step, not after completion. Key insight: if reminder only fires on step completion, user has already mentally moved past it.\n- **Data capture: Structured form** with prompted questions + freeform\n- **JSON shape: TBD** — step-keyed objects likely best fit

## Implementation Complete (2026-02-14)

### New Files
- `src/composables/useScratchpad.ts` — state management, localStorage persistence
- `src/components/ReminderBanner.vue` — banner above active steps with reminders
- `src/components/ScratchpadNote.vue` — inline icon + popover for per-step notes
- `src/components/GeneralNotesFab.vue` — FAB bottom-left for session-wide notes

### Modified Files
- `src/types/recipe.ts` — StepReminder, ScratchpadEntry, BakeScratchpad types
- `src/components/StateStep.vue` — integrated scratchpad + reminder props
- `src/components/StageCard.vue` — passes scratchpad + activeStepId
- `src/App.vue` — initializes scratchpad, wires events
- `public/recipes/atk-cinnamon-buns-ultimate.json` — sample reminders on 3 steps
- Tests: 30 new tests (684 total), snapshot updated

### Key Decisions
- shallowRef for scratchpad in App.vue (avoids deep reactive unwrapping)
- Explicit save() calls instead of watchers (prevents recursive updates)
- Record<string, boolean> for dismissedReminders (better reactivity than Set)

Build passes. Awaiting HITL visual review.
<!-- SECTION:NOTES:END -->
