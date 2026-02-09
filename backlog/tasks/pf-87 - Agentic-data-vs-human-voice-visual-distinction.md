---
id: PF-87
title: Agentic data vs human voice visual distinction
status: Done
assignee: []
created_date: '2026-02-09 04:18'
updated_date: '2026-02-09 06:16'
labels:
  - feature
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Website needs a way to visually distinguish agent-generated content from personal notes. Human voice should stand out more.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Define two visual treatments: "human voice" (warm, prominent) and "agentic" (secondary)
- [ ] #2 Design system shortcuts added to uno.config.ts for both treatments
- [ ] #3 Treatment applies to: recipe summaries (PF-86), cook log notes, next_time suggestions
- [ ] #4 Existing first-person notes retroactively styled as human voice
- [ ] #5 Requires HITL gate — styling task needs human sign-off before commit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added voice-human (Fieldnote) and voice-agent (Data Block) UnoCSS shortcuts. Applied to StepNote (// My Note), NutritionSection ([calculated] tag), ResearchSection ([researched] tag). CookLogSection left unchanged — user preferred existing simple styling. Human sign-off received.
<!-- SECTION:FINAL_SUMMARY:END -->
