---
id: PF-133
title: Bake scratchpad - structured note capture during bake
status: To Do
assignee: []
created_date: '2026-02-13 18:44'
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
- [ ] #1 Per-step reminder icons appear on completed steps when reminders are configured
- [ ] #2 Reminders are defined per-step during recipe generation
- [ ] #3 Note capture popover with prompted questions is accessible from each step
- [ ] #4 Floating notepad button available for general bake notes
- [ ] #5 Output is structured JSON blob consumable by /feedback skill
- [ ] #6 Data shape supports input/output/result tracking per step
- [ ] #7 UI does not clutter the bake view — minimal unless interacted with
- [ ] #8 JSON export available for external use (excel-style)
<!-- AC:END -->
