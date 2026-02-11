---
id: PF-94
title: 'Smart copy: grocery-friendly mise en place'
status: To Do
assignee: []
created_date: '2026-02-10 03:10'
updated_date: '2026-02-10 08:20'
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
