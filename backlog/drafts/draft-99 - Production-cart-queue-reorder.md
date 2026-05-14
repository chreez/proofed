---
id: DRAFT-99
title: Production cart — drag-to-reorder queue entries
status: Draft
assignee: []
created_date: '2026-05-13'
labels:
  - bakery-ops
  - ux
  - followup
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-256.2 demo review (2026-05-13). User locked Demo B (Cart pattern) for PF-256.1 with the explicit trade-off that queue reorder is deferred.

Add drag-to-reorder to the production cart sidebar so the user can express bake sequence ("do these first, then those"). Demo A pattern (vertical sort with before/after drop indicators) is the reference. Should not break the click-to-add interaction model — drag is in-cart only, not library→cart.

Open questions:
- Whether reorder needs to persist as part of `ProductionPlan` entries (current shape relies on array order — yes, this would naturally persist).
- Touch support for mobile — review mode probably doesn't need reorder, but worth confirming.
- Keyboard reorder for a11y (ArrowUp/Down with focused entry).
<!-- SECTION:DESCRIPTION:END -->
