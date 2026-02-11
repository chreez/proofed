---
id: PF-115
title: Differentiate synthesized vs sourced recipes on index page
status: In Progress
assignee: []
created_date: '2026-02-11 05:01'
updated_date: '2026-02-11 22:12'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a visual indicator next to recipe names on the index page showing whether a recipe is agent-synthesized or adapted from a human source. Demo spike determines the treatment (icon, badge, or text label).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Synthesized recipes (source.type === 'original') display a visual provenance indicator on the index page recipe row
- [ ] #2 Indicator treatment determined by PF-115.1 demo outcome (icon, badge, or text label)
- [ ] #3 Hovering or reading the indicator conveys the source name and number of sources
- [ ] #4 Indicator styling uses subdued stone palette colors, consistent with existing index page visual weight
- [ ] #5 Adapted recipes (source.type === 'adapted') treatment determined by PF-115.1 demo outcome
- [ ] #6 Indicator is read-only (no click action)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Demo Outcome — 2026-02-11

**Chosen direction:** Variant A — icon on synthesized recipes only, adapted recipes unmarked
**Icon:** #4 Terminal prompt (`>_`) — developer/agent feel, fits "coder meets baker" brand
**Tooltip:** Custom CSS `::after` pseudo-element with `data-tooltip` attr — instant show (no native title delay)
**Tooltip style:** Dark bg (ink), monospace text, 100ms fade-in
**Icon color:** stone-400 default, accent on hover
**Tooltip content:** "AI-synthesized: proofed. research (N agents, M sources)"

## Implementation — 2026-02-11

Files modified:
- `src/components/RecipeIndex.vue` — extended RecipeMeta/TimelineItem interfaces, fetchRecipeMeta extracts source data, template adds terminal icon with CSS tooltip
- `src/components/RecipeIndex.spec.ts` — 4 new tests (provenance icon render, adapted no-icon, missing source, click-stop)

All 580 tests pass, type-check clean, build succeeds.
<!-- SECTION:NOTES:END -->
