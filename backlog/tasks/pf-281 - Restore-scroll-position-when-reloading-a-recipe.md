---
id: PF-281
title: Restore scroll position when reloading a recipe
status: To Do
assignee: []
created_date: '2026-06-27 22:06'
labels:
  - ux
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Intent

Coming back to the same recipe on phone/laptop shouldn't drop the user at the top when nothing has changed. Hash links + version bumps still win over restored offset.

## Behavior

1. **Save** — on `/recipe/:id`, listen to `window` scroll (throttled via `requestAnimationFrame`, not `setTimeout`). On each fire, write `{ offset, savedAt, version }` to `localStorage['proofed:scroll:{recipeId}']` where `version` is the recipe's current `version` string.
2. **Restore** — on `/recipe/:id` mount:
   - If `window.location.hash` truthy → skip restore entirely (hash wins)
   - Else read stored entry. If missing, or `savedAt` older than 24h, or `version` ≠ current recipe version → wipe entry, no restore
   - Else wait for `document.documentElement.scrollHeight` to reach `offset + viewport` via `ResizeObserver` on the recipe root. When condition met, `scrollTo({ top: offset, behavior: 'auto' })` and disconnect observer.
   - Watchdog: if ResizeObserver fires with height stable (delta < 8px) across 3 consecutive callbacks AND target still unreachable, scroll to `document.documentElement.scrollHeight - viewport` (max) and give up. No time-based fallback.
3. **Clear conditions** (all wipe the stored entry):
   - Recipe `version` changed (checked on read, not save)
   - 24h TTL elapsed
   - User clicks the existing "clear scratchpad" button on the recipe page → extend that handler
   - User clicks the existing "clear checked items" button on the recipe page → extend that handler
   - No new button — piggyback on existing UX

## Acceptance Criteria

1. New composable `src/composables/useScrollRestore.ts` handles save + restore, keyed by `recipeId` prop
2. Storage key format: `proofed:scroll:{recipeId}`, shape `{ offset: number, savedAt: string, version: string }`
3. Save throttled via `requestAnimationFrame` (verify no `setTimeout` in the module)
4. Restore skipped if `window.location.hash` is non-empty (unit test)
5. Restore skipped + entry cleared if stored `version` ≠ current (unit test)
6. Restore skipped + entry cleared if `Date.now() - savedAt > 24 * 60 * 60 * 1000` (unit test)
7. Restore uses `ResizeObserver`, not `setTimeout` (verify no ms literals in module)
8. Watchdog: after 3 stable observations with target unreachable, scrolls to max and disconnects (unit test)
9. Existing "clear scratchpad" handler additionally removes the scroll key (integration test)
10. Existing "clear checked items" handler additionally removes the scroll key (integration test)
11. Wired into `RecipePage.vue` (or equivalent recipe view component) via `onMounted` / `onBeforeUnmount`
12. `npm run build` exits 0; no snapshot regressions
13. Manual HITL: verify on iPhone + desktop that scroll survives page reload, hash links still work, version bump wipes

## Out of Scope

- Bake detail page (`/recipe/:id/bake/:date`) — only recipe root gets scroll memory
- Bake-log index, stats, or home page
- Explicit standalone clear button (piggybacks on existing clears)
- Cross-device sync (localStorage is per-browser)

## Source

- Bake log 2026-06-27 cook_log entry next_time item
- Grooming session 2026-07-04
<!-- SECTION:DESCRIPTION:END -->
