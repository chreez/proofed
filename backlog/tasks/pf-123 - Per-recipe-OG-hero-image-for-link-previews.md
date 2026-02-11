---
id: PF-123
title: Per-recipe OG hero image for link previews
status: In Progress
assignee: []
created_date: '2026-02-11 22:04'
updated_date: '2026-02-11 22:16'
labels:
  - feature
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use the hero photo from a recipe's latest bake session as the `og:image` when sharing recipe links. Crawlers (iMessage, Slack, Discord) should see the actual bake photo instead of the generic brand card.

Current state: `useRecipeMeta.ts` hardcodes `og:image` to static `og-image.png`. Hero convention (last photo in cook_log entry's photos array) is already established in CookLogSection.vue and RecipeIndex.vue.

Key files: `src/composables/useRecipeMeta.ts`, `src/components/CookLogSection.vue`, `src/components/RecipeIndex.vue`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 #1 `useRecipeMeta` sets `og:image` to the hero photo (last in photos array) from the latest cook_log entry with photos. Uses the 800w WebP version for OG quality.
- [ ] #2 #2 Recipes with no cook_log photos fall back to the existing generic `og-image.png`.
- [ ] #3 #3 OG meta tags are visible to non-JS crawlers (iMessage, Slack, Discord) — SPA pre-rendering or edge function solution from spike.
- [ ] #4 #4 og:image:width and og:image:height are set correctly for the hero image dimensions.
- [ ] #5 #5 Link preview renders correctly in iMessage unfurl (primary test target).
- [ ] #6 #6 Index page OG tags unchanged (still uses generic brand card).
- [ ] #7 #7 `npm run build` passes.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Spike Summary (PF-123.1)

Existing `scripts/prerender-og.ts` already generates per-recipe HTML at build time. Only change needed: resolve hero image from cook_log instead of hardcoding og-image.png. No new infrastructure.

## Implementation — 2026-02-11

Files modified:
- `scripts/prerender-og.ts` — added resolveHeroImage(), cook_log types, og:image:width 800 for heroes
- `src/composables/useRecipeMeta.ts` — SPA-side og:image now computed from cook_log hero (matches pre-rendered)
- `src/composables/useRecipeMeta.spec.ts` — updated + new test for hero resolution

Build output verified:
- ATK cinnamon buns: hero photo (img-6794-vsco-800w.webp)
- NY-style pizza: hero photo (09-slice-fold-800w.webp)
- CoCo curry: fallback (og-image.png)
- Index page: unchanged (generic brand card)

581 tests pass, type-check clean, build succeeds.
<!-- SECTION:NOTES:END -->
