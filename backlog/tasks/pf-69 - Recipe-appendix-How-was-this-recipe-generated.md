---
id: PF-69
title: 'Recipe appendix: "How was this recipe generated?"'
status: To Do
assignee: []
created_date: '2026-02-07 20:08'
updated_date: '2026-02-08 08:52'
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
- [ ] #1 Research section renders only when recipe.research exists — recipes without it show nothing
- [ ] #2 Section structure matches existing pattern — h3 header ("Research"), permalink button, TOC registered (desktop sidebar + mobile bottom sheet)
- [ ] #3 Strategy overview — displays research.strategy text and research.sourceCount badge
- [ ] #4 Source list — renders research.sources[] as linked list (name + URL), reusing RecipeSource display pattern from SourceSection
- [ ] #5 Ingredient confidence — ingredients with confidence field show a badge (high/medium/low) in the gather section, not just the appendix
- [ ] #6 Technique provenance — research.techniques[] rendered with name, rationale, source attribution, and optional confidence badge
- [ ] #7 Collapsible by default — section starts collapsed with a summary line (e.g. "Researched from 45 sources"), expands on click
- [ ] #8 npm run build passes
<!-- AC:END -->
