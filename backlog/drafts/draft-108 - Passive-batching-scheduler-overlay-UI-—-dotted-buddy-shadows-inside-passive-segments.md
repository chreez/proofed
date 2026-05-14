---
id: DRAFT-108
title: >-
  Passive-batching scheduler overlay UI — dotted buddy shadows inside passive
  segments
status: Draft
assignee: []
created_date: '2026-05-14 20:32'
labels:
  - ux
  - scheduler
  - bakery-ops
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-270 design §8. Renders up to 3 buddy shadow blocks inside each oven-free passive segment of a queued bake. Dotted 2px border, 40% opacity, recipe name + uplift readout + warning badges. Click 'Add buddy →' promotes shadow to solid block (joins queue). Hover reveals rationale panel. Wired to the solver from sibling draft. Lives in the PF-255.4 scheduler view.
<!-- SECTION:DESCRIPTION:END -->
