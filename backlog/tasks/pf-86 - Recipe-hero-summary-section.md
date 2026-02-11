---
id: PF-86
title: Recipe hero summary section
status: To Do
assignee: []
created_date: '2026-02-09 04:18'
updated_date: '2026-02-10 08:20'
labels:
  - feature
dependencies:
  - PF-87
priority: medium
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A hero-style personal summary block at the top of each recipe page. Two content modes: human-dictated (user speaks it, agent formats) and auto-generated (default fallback). Human voice should be visually distinct.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe JSON schema supports summary field with text and mode (dictated | auto)
- [ ] #2 Recipe page renders summary as hero block above stages
- [ ] #3 dictated summaries styled with human-voice treatment (ties into PF-87)
- [ ] #4 auto summaries generated from recipe metadata as sensible default
- [ ] #5 Recipes without a summary show auto-generated version (no blank state)
- [ ] #6 Workflow: user dictates → agent formats/trims → user approves → saved as dictated
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Related: PF-62 (hero photo) occupies same visual zone — coordinate layout when both are implemented.\nBackfill needed for all existing recipes (auto-generated initially, replaced with dictated over time).
<!-- SECTION:NOTES:END -->
