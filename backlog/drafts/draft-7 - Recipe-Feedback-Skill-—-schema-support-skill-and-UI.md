---
id: DRAFT-7
title: 'Recipe Feedback Skill — schema support, skill, and UI'
status: Draft
assignee: []
created_date: '2026-02-11 19:26'
labels:
  - feature
  - skill
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A `/feedback` skill for interactive recipe review sessions. User picks a recipe, reads through it, asks questions, flags changes, and makes notes. Agent always checks the recipe JSON first before offering external knowledge. Agentic inferences (tips, definitions, technique explanations) are labeled with their source and persisted as StateNote entries. Changes happen live on localhost during the session. Session concludes with a version bump and changelog entry. All agent-contributed content remains distinguishable from user-authored content in the schema and on the site.
<!-- SECTION:DESCRIPTION:END -->
