---
id: PF-155
title: 'Fix: hero photo missing when latest bake is in-progress with no photos'
status: Done
assignee: []
created_date: '2026-02-20 19:16'
updated_date: '2026-02-21 00:47'
labels:
  - bug
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When the most recent cook_log entry is an in-progress bake with no photos, the hero photo logic returns null/fallback instead of falling back to the most recent entry that HAS photos.\n\nAffected call sites:\n1. **RecipeIndex.vue:79** — `latestCookLogEntry(cookLog)` grabs the newest entry (in-progress, empty photos), so the index card shows no hero thumb\n2. **App.vue:193** — same function, hero banner on recipe detail page disappears\n3. **useRecipeMeta.ts:83** — uses `r.cook_log[0]` (oldest entry, not newest) — separate ordering issue but same class of bug\n\nReproduction: simple-sourdough has in-progress entry (2026-02-19) with `photos: []`, while 02-17/02-16/02-14 all have photos.\n\nFix: add a `latestCookLogEntryWithPhotos()` helper to useCookLog.ts that skips entries without photos, then use it at all three call sites.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Index page shows hero thumbnail from most recent bake WITH photos, even when a newer in-progress entry has no photos
- [x] #2 Recipe detail page hero banner shows photo from most recent bake WITH photos, even when a newer in-progress entry has no photos
- [x] #3 OG meta image (useRecipeMeta.ts) uses the most recent bake entry with photos, not cook_log[0] (oldest)
- [x] #4 New `latestCookLogEntryWithPhotos()` helper in useCookLog.ts — returns latest entry where photos array is non-empty
- [x] #5 All three call sites (RecipeIndex, App.vue hero, useRecipeMeta) use the new helper
- [x] #6 Existing behavior unchanged when latest entry already has photos
- [x] #7 Existing behavior unchanged when no entries have photos (graceful fallback)
- [x] #8 npm run build passes
<!-- AC:END -->
