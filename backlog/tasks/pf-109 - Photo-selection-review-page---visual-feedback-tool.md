---
id: PF-109
title: Photo selection review page - visual feedback tool
status: Done
assignee: []
created_date: '2026-02-11 02:35'
updated_date: '2026-02-11 19:47'
labels:
  - feature
  - workflow
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dedicated web page for reviewing photos after pipeline processing. Shows each photo with: agent-generated image summary, notes field, checkboxes for usage patterns (hero, step photo, process shot, exclude). Bottom has a submit button that outputs all feedback as a JSON payload. Minimal dev work — just a mechanism to give structured photo feedback. Reusable across recipes when adding new bakes or new recipes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Page accessible at `/review/photos/:recipeId/:date` route
- [ ] #2 Displays all pipeline-processed photos for a given recipe/date as a vertical list
- [ ] #3 Each photo shows: thumbnail, agent-generated image summary, notes field
- [ ] #4 Each photo has checkboxes for usage: hero, step, process shot, exclude
- [ ] #5 Only one photo can be marked hero at a time (radio behavior)
- [ ] #6 Submit button at bottom outputs full selection as JSON to console/clipboard (structured payload)
- [ ] #7 Page loads photo list from public/images/{recipeId}/{date}/ — no hardcoded data
- [ ] #8 Reusable across recipes — same page works for any recipe + date combo
- [ ] #9 No external dependencies — vanilla Vue component
- [ ] #10 npm run build passes
<!-- AC:END -->
