---
id: PF-279
title: Recipe page checkbox state intermittently not persisting on revisit
status: Draft
assignee: []
created_date: '2026-05-28 15:37'
updated_date: '2026-06-03 04:11'
labels:
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 useProgress removes watch(state, save, {deep:true}) async watcher; save() called synchronously at end of toggleItem, toggleState, toggleStageCollapse, resetSection, resetProgress, and any Complete-All bulk mutation path. Grep useProgress.ts shows zero occurrences of watch(state after change.
- [ ] #2 Repeat useProgress(id) calls (recipe change, HMR, computed re-eval) do not register additional Vue watchers. Unit test asserts that calling useProgress('a') then useProgress('b') then back to useProgress('a') does not increase localStorage.setItem call count beyond 1-per-mutation.
- [ ] #3 New tests in useProgress.spec.ts: toggleItem -> immediately read localStorage.getItem(key) -> assert toggled value present (no await nextTick before read). Same shape test for toggleState and toggleStageCollapse.
- [ ] #4 useProgress(id) return object has identical keys and types (load, toggleItem, isItemChecked, hasProgress computed, etc.). StageCard, GatherSection, GatherCategory, StateStep, App.vue compile and pass existing tests with zero edits to any .vue consumer file.
- [ ] #5 npm run build passes (vitest + vue-tsc + vite build). No snapshot churn in StageCard, GatherSection, or GatherCategory snapshots.
- [ ] #6 Manual HITL on /recipe/tartine-walnut-currant-sourdough: check 3 boxes, navigate to /, return - all 3 stay checked. Repeat with rapid check + back-button within 100ms - all stay checked. Repeat on iPhone Safari via LAN URL - stays checked across tab switch + return. User signs off before commit.
- [ ] #7 useScratchpad.ts unchanged (already saves sync - out of scope). Task notes record: scratchpad verified safe, sync-save pattern already in place.
<!-- AC:END -->
