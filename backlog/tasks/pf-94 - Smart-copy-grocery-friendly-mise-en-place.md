---
id: PF-94
title: 'Smart copy: grocery-friendly mise en place'
status: To Do
assignee: []
created_date: '2026-02-10 03:10'
updated_date: '2026-02-11 21:18'
labels:
  - spike
dependencies: []
priority: low
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evaluate two approaches for a grocery-shopping-friendly copy-to-clipboard feature. Current F11 copies everything (all items, ignores checked state, includes vessels/equipment). Users want to copy just unchecked ingredients for shopping.

**Approach A**: Enhance existing per-section Copy button in GatherSection.vue — skip checked items, ingredients-only mode (or at least deprioritize vessels/equipment).

**Approach B**: New recipe-level "Shopping List" action that aggregates unchecked ingredients across ALL stages into one combined list. Single copy for the whole recipe.

Spike output: recommendation on which to implement, with rationale. Consider UX (grocery shopping workflow), implementation complexity, and whether both could coexist.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spike documents the current copy behavior in GatherSection.vue (what gets copied, what's ignored, no checked-state filtering)
- [ ] #2 Spike evaluates Approach A: enhance existing per-stage Gather copy — section-level button copies all unchecked items (vessels + equipment + ingredients), each sub-category gets its own copy button for just that category's unchecked items
- [ ] #3 Spike evaluates Approach B: new cross-stage "Shopping List" action that aggregates unchecked items from ALL stages into one combined list, preserving the same two-level copy pattern (full list + per-category)
- [ ] #4 Each approach is evaluated against two user workflows: grocery shopping (clean buy-list on phone) and home prep (what's left to gather before starting)
- [ ] #5 Spike considers whether A and B can coexist (per-stage for prep, cross-stage for shopping) or if one supersedes the other
- [ ] #6 Spike output is a written recommendation in the parent task's implementation notes with rationale, covering UX fit, implementation complexity, and coexistence viability
- [ ] #7 Recommendation is specific enough to groom an implementation task from without re-evaluating the approaches
<!-- AC:END -->
