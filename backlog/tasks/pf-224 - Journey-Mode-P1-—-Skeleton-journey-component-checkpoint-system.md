---
id: PF-224
title: Journey Mode P1 — Skeleton journey component + checkpoint system
status: To Do
assignee: []
created_date: '2026-04-23 21:45'
updated_date: '2026-04-23 22:23'
labels:
  - feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Phase 1: Skeleton Journey

Minimal viable journey — checkpoints, timestamps, navigation. No smart inputs yet.

### Scope

1. **Journey component** — minimizable overlay on recipe page
   - Always shows current stage + current step
   - Navigates to correct recipe section on step advance
   - Minimized state: compact bar with stage name + step name
   - Expanded: full step detail + complete button
2. **Checkpoint system** — complete step → optional data prompt → scratchpad write → advance
3. **Timestamp derivation** — calculate elapsed segment time from scratchpad entries on every page load/unlock
4. **Recipe page boundary** — recipe checkboxes = declutter UX, journey checkpoints = canonical progress. Define clearly.
5. **Multi-bake** — leverage existing scratchpad concurrency

### Demo Gate
- iPhone demo variants before committing to patterns
- Test: minimized state, expanded state, navigation, messy-hands usability

### Depends on: P0 spike
### Parent: DRAFT-66
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 JourneyOverlay component renders on recipe page when an active journey exists — minimizable to a compact bar showing current stage name + step name
- [ ] #2 Expanded state shows full step detail with a Complete action that writes a scratchpad entry and advances to next checkpoint
- [ ] #3 Completing a checkpoint auto-navigates the recipe page to the relevant section/stage
- [ ] #4 Journey checkpoint state (current, completed, not-started) is persisted in localStorage and survives page reload/unlock
- [ ] #5 Elapsed segment time calculated on every component mount by diffing current time against last checkpoint scratchpad timestamp — no setInterval or foreground timer
- [ ] #6 Recipe checkbox progress (useProgress) does not trigger journey advancement — the two systems are independent
- [ ] #7 Journey can be started and stopped without affecting existing recipe page functionality — user can dart around freely
- [ ] #8 Multiple concurrent journeys (different recipes) coexist via separate localStorage keys without conflict
- [ ] #9 Journey state references checkpoint IDs from the schema defined in P0 spike — does not hardcode recipe-specific logic
- [ ] #10 iPhone demo gate: at least 2 layout variants (compact bar position, expanded overlay style) tested on device before committing to final pattern
<!-- AC:END -->
