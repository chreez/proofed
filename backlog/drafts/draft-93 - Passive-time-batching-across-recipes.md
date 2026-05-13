---
id: DRAFT-93
title: Passive time batching across recipes
status: Draft
assignee: []
created_date: '2026-05-12'
labels:
  - bakery-ops
  - scheduler
  - optimization
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: PF-255 rework clarify loop (2026-05-12).

Scheduler optimization: passive phases (bulk ferment, cold retard, autolyse) don't consume the baker. Multiple recipes' passive phases can overlap perfectly with another recipe's active prep. The system should *recommend* this batching, not just *display* it.

Example: cinnamon buns cold retard 8h → start sourdough autolyse during hour 1, fold + shape during hour 4, bulk ferment finishes inside the retard window. Net: two products done in roughly the time of one.

Touches PF-255.4 scheduler design — currently shows passive blocks but doesn't auto-suggest interleaving. Solver looks for active prep windows that fit inside passive windows.

Scope flags:
- "Suggest a batch buddy" — given recipe A, surface recipes whose active phases fit inside A's passive windows
- Constraint: fridge capacity (multiple cold-retarding doughs compete for space)
- Constraint: dough hydration / temperature conflicts (don't ferment cold dough next to a warm autolyse)
- UI: dotted overlay or shadow showing where another recipe's active fits
<!-- SECTION:DESCRIPTION:END -->
