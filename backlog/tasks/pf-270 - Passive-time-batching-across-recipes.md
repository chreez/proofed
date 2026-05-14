---
id: PF-270
title: Passive time batching across recipes
status: To Do
assignee: []
created_date: '2026-05-12'
updated_date: '2026-05-14 20:33'
labels:
  - bakery-ops
  - scheduler
  - optimization
  - design
dependencies: []
priority: high
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

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Design doc exists at backlog/tasks/pf-270-design-notes.md with all sections below
- [ ] #2 Batch-buddy solver pseudocode is documented: input=queue of bakes with throughput fields (prep_active_min, proof_passive_min, oven_occupancy_min, bake_min) + per-state windows; output=ranked list of (recipeA, recipeB, anchorTime) suggestion tuples
- [ ] #3 Time-window matching rule documented: for each passive window W in recipe A, candidate recipe B must satisfy B.prep_active_min + slack <= W.duration_min, AND B's active phases fit inside W with the configured slack buffer (default 10 min)
- [ ] #4 Constraint catalog documented for: oven exclusivity (only one bake_min phase active at a time), fridge slot capacity (cold_retard tagged via stage id contains 'cold' or 'retard' — default N=2 slots), baker attention (only one prep_active phase at a time across all queued bakes), temperature/hydration adjacency (warm autolyse vs cold retard tagged as soft-warn, not blocker)
- [ ] #5 Suggestion ranking heuristic documented: primary by combined active-$/hr uplift over running A alone, secondary by sequence simplicity (fewer alarms / context switches), tertiary by least cleanup (fewer distinct vessels added)
- [ ] #6 Scheduler overlay UX spec: candidate B renders as dotted+translucent shadow track inside A's passive segment with 'Add buddy' affordance; hover reveals delta-$/hr and constraint warnings
- [ ] #7 Mute/dismiss UX documented: per-pair dismiss persists to profile (e.g. 'never suggest cinnamon-buns + ny-pizza-sauce together'); session-only mute is one-click; mute decays after N=30 days to allow reconsideration
- [ ] #8 Storage decision documented: suggestions recompute on each render from queue state; only the mute list and accepted pairs persist; trade-off (recompute cost vs staleness) explained
- [ ] #9 Edge cases documented: empty queue, single bake (no buddy possible), zero passive recipes, partial fit (B fits in part of W but not all), conflicting buddy suggestions (B fits in A and C — pick one), recursive batching (A+B suggests adding C inside leftover passive)
- [ ] #10 User signs off on design doc before status moves to Done
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Design doc

Full design at `backlog/tasks/pf-270-design-notes.md`. Covers:

- §2 inputs/outputs (queue, library, constraints, mute list → Suggestion[])
- §3 phase decomposition: typed PassiveWindow + ActiveBurst extraction from state walks
- §4 solver pseudocode with cheap-filter then tryPlace micro-scheduler
- §5 constraint rules: oven exclusive (hard), fridge slots (soft/hard at N+1/N+2), baker attention (hard, 1 baker), temp/hydration adjacency (soft), sleep band inherited from PF-255.4 §6
- §6 ranking: uplift_active (primary) + simplicity (secondary) + cleanup (tertiary), composite score with profile-tunable weights
- §7 storage: recompute-on-render; only muteList + acceptedBuddies + rankingWeights persist (in profile JSON, PF-255.5)
- §8 overlay UX: dotted translucent shadows inside passive segments, Add buddy / Dismiss / Hover affordances
- §9 mute semantics: 3 flavors (session, 30-day decay, permanent), unordered pair keys
- §10 edge cases: empty queue, no-passive recipes, partial fit, conflicting buddies, recursive batching, same-recipe-twice, cross-day windows, pricing missing
- §11 open decisions: authored vs inferred windows, slack learning, multi-baker (DRAFT-92), ingredient sharing, batching-makes-A-worse warning
- §12 demo plan at public/demo/passive-batching.html

## Dependencies

- **PF-267 (done):** throughput fields on RecipeMeta (prep_active_min, proof_passive_min, oven_occupancy_min, bake_min). Solver consumes these for cheap-filter; falls back to state walks for fine-grained windows.
- **PF-255.4 (design):** scheduler UI base. Overlay renders inside its passive segments.
- **PF-255.1 (pricing):** uplift calc needs revenue per recipe; solver tolerates missing prices (sorted to bottom, warning chip).
- **PF-255.5 (profile schema):** muteList + acceptedBuddies + rankingWeights persistence.

## Adjacent / deferred

- **DRAFT-92 (multi-baker):** `constraints.bakerCount` already parametrized; UX impact only when N > 1.
- **PF-265 (itemsPerBatch):** same-recipe-twice is a separate feature; solver explicitly filters it.

## Follow-up drafts (created in this session)

- DRAFT — Passive-batching solver implementation (engine + tests)
- DRAFT — Passive-batching overlay UI (dotted shadows on scheduler timeline)
- DRAFT — Buddy mute/dismiss persistence in profile JSON
- DRAFT — `public/demo/passive-batching.html` (HITL sign-off demo)

## Sign-off

User sign-off required before status → Done (AC10).
<!-- SECTION:NOTES:END -->
