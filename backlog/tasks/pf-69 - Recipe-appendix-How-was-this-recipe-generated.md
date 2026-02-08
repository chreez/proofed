---
id: PF-69
title: 'Recipe appendix: "How was this recipe generated?"'
status: Done
assignee: []
created_date: '2026-02-07 20:08'
updated_date: '2026-02-08 09:19'
labels:
  - feature
  - ux
dependencies:
  - PF-66
  - PF-70
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add an expandable appendix section to recipe pages that tells the research story behind the recipe. Surfaces the provenance data from the research schema (PF-66) in a human-readable narrative format.

Concept: The research trail becomes part of the recipe's identity — not just "here's a recipe" but "here's why every ingredient is in this recipe, traced to 30+ sources."

Potential content:
- Research strategy overview (how many agents, what search angles)
- Source count and types (blogs, Reddit, manufacturer labels, industry reporting)
- Confidence badges on ingredients (high/medium/low based on cross-source agreement)
- Key primary source findings (e.g., factory production secrets, retail label analysis)
- Open questions / things to A/B test
- Full source list with links

Depends on PF-66 (research provenance schema) for the underlying data structure.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Research section renders only when recipe.research exists — recipes without it show nothing
- [x] #2 Section structure matches existing pattern — h3 header ("Research"), permalink button, TOC registered (desktop sidebar + mobile bottom sheet)
- [x] #3 Strategy overview — displays research.strategy text and research.sourceCount badge
- [x] #4 Source list — renders research.sources[] as linked list (name + URL), reusing RecipeSource display pattern from SourceSection
- [ ] #5 Ingredient confidence — ingredients with confidence field show a badge (high/medium/low) in the gather section, not just the appendix
- [x] #6 Technique provenance — research.techniques[] rendered with name, rationale, source attribution, and optional confidence badge
- [x] #7 Collapsible by default — section starts collapsed with a summary line (e.g. "Researched from 45 sources"), expands on click
- [x] #8 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #5 (ingredient confidence badges) reverted — static badges without hover/click context aren't intuitive. Backlogged as separate task for interactive exploration with demo variants.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Research appendix section wired into recipe pages. Collapsible by default showing source count, expands to reveal strategy, technique findings with confidence badges, and grouped source list. Registered in TOC (desktop sidebar + mobile bottom sheet) with IntersectionObserver tracking. Only renders on recipes with research data (coco-curry). Confidence badges in gather section deferred to separate backlog task for interactive design exploration.
<!-- SECTION:FINAL_SUMMARY:END -->
