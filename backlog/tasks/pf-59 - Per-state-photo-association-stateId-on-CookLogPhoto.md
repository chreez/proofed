---
id: PF-59
title: Per-state photo association (stateId on CookLogPhoto)
status: To Do
assignee: []
created_date: '2026-02-07 09:01'
updated_date: '2026-02-10 08:20'
labels:
  - feature
dependencies:
  - PF-4.8
references:
  - /Users/chris/workspace/vyra/src/data/article-review-2-data.ts
priority: low
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Currently photos attach to the cook_log entry as a flat array. No way to associate a photo with a specific recipe state (e.g., ROLL_DOUGH, BAKE).\n\nVyra validates this pattern: each article section has a `selectedImage` association. Same approach could enable per-step photo galleries in the recipe view.\n\nAdd optional `stateId?: string` to CookLogPhoto. Component could then group/display photos near their relevant step.\n\nNeeds scoping: interaction with gallery layout (PF-4.8), how step-level grouping affects UI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CookLogPhoto type gets optional stateId?: string field
- [ ] #2 Photos with stateId can render grouped near their associated state (UI approach TBD)
- [ ] #3 Photos without stateId continue rendering in the cook log gallery as today
- [ ] #4 Existing recipe JSON unaffected (field is optional, no backfill required)
- [ ] #5 npm run build passes
<!-- AC:END -->
