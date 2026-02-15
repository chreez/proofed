---
id: DRAFT-15
title: Bake review page - unified post-bake review flow
status: Draft
assignee: []
created_date: '2026-02-14 22:50'
labels:
  - feature
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evolve the existing photo review page (`/review/photos/{recipe-id}/{date}`) into a full bake review page (`/review/bake/{recipe-id}/{date}`). Single post-bake session that consolidates all review activities.

**Sections:**
1. **Photos** — existing review-photos flow (tag hero/step/process/exclude, AI summaries)
2. **Cost** — ingredient cost capture via HEB MCP product picker + pantry rates (PF-134)
3. **Notes** — review scratchpad entries from the bake, finalize into cook_log JSON
4. **Summary** — total bake cost, per-serving cost, session overview

**Cost pricing modes:**
- **Fresh purchase** — search HEB via MCP, user picks which product they bought from results array ("which one did you purchase or which is closest?"), price calculated from package size vs recipe amount
- **Pantry/historical** — stored cost-per-gram rate for bulk staples (flour, sugar, salt, yeast), persists across bakes until updated

**What it's NOT:**
- Not a recipe editor — review only
- No price optimization or shopping recommendations
- No inflation tracking
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Review page route exists at /review/bake/{recipe-id}/{date}
- [ ] #2 Photos section preserves existing review-photos functionality (tag, alt text, hero selection)
- [ ] #3 Cost section searches HEB MCP for each recipe ingredient
- [ ] #4 Cost section presents product matches as selectable array — user picks which they bought
- [ ] #5 Pantry rate mode available for bulk/historical ingredients (stored cost-per-gram)
- [ ] #6 Notes section displays scratchpad entries from bake for review and finalization
- [ ] #7 Summary section shows total bake cost and per-serving cost
- [ ] #8 Review page accessible via /review-bake skill or direct URL
<!-- AC:END -->
