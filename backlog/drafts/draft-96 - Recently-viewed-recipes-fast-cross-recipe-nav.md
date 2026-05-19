---
id: DRAFT-96
title: Recently viewed recipes - fast cross-recipe nav
status: Draft
assignee: []
created_date: '2026-05-13 01:29'
labels:
  - ungroomed
  - feature
  - mobile-ux
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Persistent "recently viewed recipes" list (last 5) surfaced for fast recipe-to-recipe navigation. Use case: working on two recipes in parallel, or planning ingredients across recipes.

Must be mobile thumb-usable. One-tap reach from any recipe page is the #1 must-include.

Surface pattern (chip strip / FAB sheet / floating overlay / combo) left open for executor — decide via mobile demo spike. AC 5 leaves it intentionally pattern-agnostic.

**Pinned in-progress bakes**: Recipes with any `cook_log[].status === 'in_progress'` entry pin to the top of the recents list. Pinned state is derived (not stored) — so completing or archiving a bake removes the pin automatically. Pinned section is always visible even when click history is empty.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- SECTION:ACCEPTANCE_CRITERIA:BEGIN -->
- [ ] Last 5 visited recipe IDs persist in localStorage with timestamps; survives reload
- [ ] Visiting `/recipe/:id` pushes that id to head of list and dedupes prior entries
- [ ] Current recipe is excluded from displayed list (no self-link)
- [ ] Empty state (no history AND no pinned in-progress bakes) does not render the UI element
- [ ] Surfaces on `/recipe/:id` — reachable in one tap from any scroll position on mobile (executor picks pattern via demo)
- [ ] Surfaces on `/` index when >=2 history entries exist OR >=1 pinned in-progress recipe exists; positioned above main recipe list
- [ ] Recipes with any `cook_log[].status === 'in_progress'` entry pin to top of the recents list (above history entries)
- [ ] Pinned section sorted by most-recent in-progress entry `start_date` desc
- [ ] Pinned entries visually distinguished from history entries (dot / badge / label — executor picks via demo)
- [ ] Pinned entries excluded only when user is currently viewing that recipe (same self-link rule as history)
- [ ] Clear-recents wipes history only; pinned in-progress recipes remain (derived state, not stored)
- [ ] When an in-progress bake completes or is archived, recipe is no longer pinned (falls back to normal history order or drops out)
- [ ] Help tooltip on pinned indicator explains "Active bake in progress" per F43
- [ ] Each entry tap target is >=44x44px (WCAG mobile)
- [ ] Tapping an entry navigates to `/recipe/:id`
- [ ] Clear-recents control exists; one tap wipes the list
- [ ] Help tooltip on the recents control per F43
- [ ] Entry label uses recipe name from `public/recipes/index.json` (lookup by id); if id missing from index, entry is silently dropped
- [ ] No analytics or tracking dependencies — pure client-side feature
<!-- SECTION:ACCEPTANCE_CRITERIA:END -->
