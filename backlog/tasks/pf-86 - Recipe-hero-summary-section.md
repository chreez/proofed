---
id: PF-86
title: Recipe hero summary section
status: In Progress
assignee: []
created_date: '2026-02-09 04:18'
updated_date: '2026-02-11 01:13'
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
## Status: Summary dictation in progress\n\n**Branch:** `mainline`\n\n**What's done:**\n- RecipeSummary.vue component already exists with auto-generate + dictated modes\n- voice-human / voice-agent styling from PF-87 already applied\n- App.vue currently gates to `v-if=\"currentRecipe.summary?.mode === 'dictated'\"` — only shows dictated\n- User chose to dictate all 10 summaries rather than use auto-generated\n\n**What's left:**\n- Dictation interview for all 10 recipes (started with ATK Cinnamon Buns Ultimate)\n- User wants link rendering in summaries — RecipeSummary needs markdown support\n- ATK Quick and Overnight variants planned for deprecation (PF-108) — may skip summaries for those\n- Draft summary for Ultimate: mentions friend Joseph, Reddit link, first agentic experiment, origin of proofed.\n- After dictation: add `summary` field to each recipe JSON, change v-if to always show, HITL review\n\n**User direction on ATK Cinnamon Buns Ultimate:**\n> Friend Joseph sent the Reddit link. Took that recipe, ran first agentic experiment. Started the whole concept of the website. Include Reddit comment link: https://www.reddit.com/r/Baking/comments/985zxm/made_skillet_cinnamon_rolls_the_first_time_from/e4ecnaw/\n> User wants markdown link rendering in summary component.
<!-- SECTION:NOTES:END -->
