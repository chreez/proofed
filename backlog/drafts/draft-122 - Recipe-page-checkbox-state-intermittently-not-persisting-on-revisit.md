---
id: DRAFT-122
title: Recipe page checkbox state intermittently not persisting on revisit
status: Draft
assignee: []
created_date: '2026-05-28 15:37'
labels:
  - ungroomed
  - bug
  - ux
  - scratchpad
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Symptom

User reports: "checkboxes i ticked don't seem to be saving sometimes" when returning to the recipe page after navigating away. Intermittent — not every time. Surfaced during tartine-walnut-currant-sourdough first bake (2026-05-28).

## Affected surface

Recipe page progress checkboxes — the gather-list checkboxes (`vessels`, `equipment`, `ingredients`) and possibly state-completion checkboxes.

## Persistence model (current understanding)

Progress is tracked via `useProgress` composable. Storage is likely `localStorage`-backed. The "Complete All" gather pattern (F4-F8) and per-item checkboxes share the same persistence layer.

## Reproduction notes (incomplete — needs more data)

- Not consistent across all returns
- User did not capture exact reproduction steps in real-time during this bake
- Possible triggers (hypotheses, untested):
  - Browser tab/window switch + return
  - Mobile (Safari iOS) — bfcache or aggressive storage reclaim?
  - Race condition between save and navigation
  - localStorage quota issues on long-running bakes with many notes

## What to investigate

- Confirm storage mechanism (`localStorage` vs `sessionStorage` vs in-memory only)
- Check `useProgress` write/read flow for race conditions
- Test on iOS Safari specifically (most likely client during active bake)
- Add a debug log entry when progress is read/written so the next user session can capture more diagnostic info
- Look at recent changes to the progress composable or scratchpad system

## Status: ungroomed

Needs reproduction + diagnostic data before AC writing. Could be Draft → spike subtask first.

## Source

User observation during /bake-log session 2026-05-28.
<!-- SECTION:DESCRIPTION:END -->
