---
id: DRAFT-123
title: 'Restore scroll position when reloading a recipe'
status: Draft
assignee: []
created_date: '2026-06-27 22:06'
labels:
  - ungroomed
  - ux
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Observed

User noted during 2026-06-27 bake-log session: returning to a recipe after navigation reloads with scroll at top. Loses place when bouncing between tabs / recipe page / scratchpad / bake-log.

(Earlier ExperimentPanel reset concern was user confusion — the top reset button works fine.)

## Ask

Persist scroll position per-recipe in sessionStorage (or localStorage) keyed by recipe ID. On mount, if a stored offset exists, scroll there after layout settles. Clear on explicit navigation away to home/index, or after some TTL.

## Open questions for grooming

- Per-route or per-recipe? Should the bake detail page have its own restore, or share with recipe page?
- Anchor-aware: if user landed via TOC link or hash, prefer the hash over restored offset?
- Persist across browser sessions or only within tab session?

## Source

Bake log 2026-06-27 cook_log entry next_time item; user clarified scope in follow-up.
<!-- SECTION:DESCRIPTION:END -->
