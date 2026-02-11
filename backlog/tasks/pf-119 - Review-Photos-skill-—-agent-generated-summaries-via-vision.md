---
id: PF-119
title: Review Photos skill — agent-generated summaries via vision
status: To Do
assignee: []
created_date: '2026-02-11 19:54'
updated_date: '2026-02-11 19:59'
labels:
  - feature
  - skill
  - photos
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`/review-photos` Claude Code skill that reads processed photos via multimodal vision, generates descriptive summaries with recipe context, writes them to manifest.json, and opens the review page. Agent needs recipe context (stages, ingredients, techniques) to accurately describe what's in each photo. Voicing matters — summaries should match the proofed. tone (technical warmth, first-person bake context).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /review-photos skill exists at .claude/skills/review-photos/SKILL.md and is registered as user-invocable
- [ ] #2 Skill accepts explicit {recipeId} {date} arguments — no auto-detection
- [ ] #3 Skill validates manifest.json exists at public/images/{recipeId}/{date}/manifest.json before proceeding
- [ ] #4 Skill loads recipe JSON (public/recipes/{recipeId}.json) and extracts targeted context: stage names, state descriptions, and matching cook_log entry (notes, step_notes, existing photos)
- [ ] #5 Skill spawns a sub-agent (Task tool) that reads each photo in the manifest via the Read tool (multimodal vision) alongside recipe context
- [ ] #6 Sub-agent generates a short descriptive summary per photo and writes all summaries back to manifest.json summary fields
- [ ] #7 After summaries are written, skill opens the review page URL (/review/photos/{recipeId}/{date}) for user review
- [ ] #8 npm run build passes
<!-- AC:END -->
