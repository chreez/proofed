---
id: PF-120
title: Integrate /review-photos into photo processing workflow
status: To Do
assignee: []
created_date: '2026-02-11 20:00'
updated_date: '2026-02-11 20:01'
labels:
  - feature
  - photos
  - workflow
dependencies:
  - PF-119
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When an agent runs `npm run photos` to process new bake photos, it should automatically invoke `/review-photos {recipeId} {date}` afterward. This is a documentation/skill wiring task — the photo processing skill or workflow instructions tell the agent to chain the two steps.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Photo processing workflow docs/skill instruct the agent to invoke /review-photos {recipeId} {date} after npm run photos completes
- [ ] #2 No manual user step between photo processing and review-photos invocation
- [ ] #3 Agent passes the same recipeId and date used in npm run photos to the review-photos skill
<!-- AC:END -->
