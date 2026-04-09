---
id: DRAFT-43
title: Bake entry tags — filter/search by user-authored labels
status: Draft
assignee: []
created_date: '2026-04-09 00:06'
labels:
  - schema
  - ux
  - bake-log
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User-authored string tags per bake log entry for filtering and finding notable bakes. Surfaced primarily on `/bake-log` (global list) and possibly on the recipe page cook log section for visual marking.

## Origin

Surfaced during PF-177.8 demo review. When reacting to the Panel 3 (global bake log) mini stats glance, user said: "the use of tags will be good for me to sift through and find that specific bake from that notable experiment or tag."

## Concept

Every `CookLogEntry` gets an optional `tags?: string[]` field. Tags are user-authored free-form strings like:

- `over-proofed`
- `trevor-collab`
- `temp-experiment`
- `emergency-retard`
- `perfect-crumb`
- `first-try-success`

Unlike recipe-level labels, bake-level tags describe THIS specific bake session — notable experiments, conditions, collaborators, outcomes.

## Surfaces

1. **Global bake log (`/bake-log`)** — filter bar / tag cloud at top. Clicking a tag filters to just bakes with that tag. Search box for typing tag names.
2. **Per-bake detail page** — tags visible in the header area
3. **Recipe page cook log section** — tags as small chips near the bake summary for visual marking
4. **Possibly `/bake-log` search bar** that matches on both tag AND summary text

## Schema

```ts
interface CookLogEntry {
  // ... existing fields
  tags?: string[]
}
```

No controlled vocabulary — free-form. Maybe lowercase + kebab-case convention but not enforced.

## Open questions (for grooming session)

- Tag input UX — type-ahead suggestions from existing tags across all bakes?
- Display cap on Panel 3 rows (e.g., "show 3, +2 more")?
- Any reserved / auto-tags (e.g., `in-progress`, `complete` already covered by `status`)?
- Tag color / styling — single color vs semantic coloring?
- `/bake-log` filter behavior — AND vs OR when multiple tags selected?
- Does tag selection persist in URL query for shareable links?

## Scope boundary

Pure additive feature. Does not affect `bake_stats` schema, the PF-177 structured stats work, or existing cook log rendering. Can land independently once PF-177 ships.
<!-- SECTION:DESCRIPTION:END -->
