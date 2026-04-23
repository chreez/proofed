---
id: DRAFT-68
title: Journey Mode P1 — Skeleton journey component + checkpoint system
status: Draft
assignee: []
created_date: '2026-04-23 21:45'
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
