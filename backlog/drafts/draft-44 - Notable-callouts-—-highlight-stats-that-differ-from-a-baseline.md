---
id: DRAFT-44
title: Notable callouts — highlight stats that differ from a baseline
status: Draft
assignee: []
created_date: '2026-04-09 00:07'
labels:
  - ux
  - bake-log
  - stats
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Visually call out which stats on a bake are "notable" — either by differing from the recipe's baseline/average or by being explicitly flagged as the headline set for the recipe type.

## Origin

Surfaced during PF-177.8 demo review. When asked about the master "Show all detailed stats" toggle, user said: "might need to be notable callouts that differ from other bakes. or we can keep it simple and define the notable set per recipe."

This replaces the scrapped master-collapse-toggle idea. Instead of expanding/hiding stats, highlight which stats are the interesting ones for each bake.

## Two candidate approaches

### Option A — Auto-computed (delta from baseline)

Compute baseline values per recipe from the set of all bakes, then mark stats on a specific bake as "notable" when they deviate materially:

- `avg dough temp` = 75.8°F on this bake, baseline = 76.5°F → show `↓ 0.7°F`
- `bulk duration` = 20h on this bake, baseline = 14h → show `↑ 6h`
- `final rise %` = 100% on this bake, baseline = 70% → show `↑ 30%` (red accent)

Visually: arrows + deltas next to the stat, possibly colored red/green/neutral.

**Pros:** automatic, updates as you bake more, surfaces outliers
**Cons:** requires baseline math, noisy for early bakes before baseline stabilizes, unclear what "material" deviation means

### Option B — Per-recipe defined notable set (simpler)

Recipe config declares which 3–5 stats are the "headline" metrics for this recipe type:

```ts
interface BakeStatsSchema {
  fields: Array<keyof BakeStatsBlock>
  notable?: Array<string>  // stat IDs that are always called out
}
```

E.g., sourdough's notable set: `['avg_dough_temp', 'bulk_duration', 'final_rise', 'bake_time']`
Sourdough cookies might declare: `['bake_temp', 'bake_time']`

Visually: the notable stats get a visual emphasis (larger font, accent border, or position) on both Panel 1 compact form and Panel 2 full overview. Non-notable stats are still shown, just with less weight.

**Pros:** simple, recipe-author controlled, deterministic
**Cons:** doesn't surface bake-level outliers (e.g., "this bake was way cooler than usual")

### Hybrid?

Option B v1 (simple), upgrade to Option A once baselines stabilize and the delta computation can be trusted. Or Option B always, with Option A as opt-in per-recipe.

## Open questions (for grooming)

- Which approach to ship first (A, B, or hybrid)?
- If B — how does the author flag which stats are notable? Same config block as `bakeStatsSchema.fields` or separate?
- If A — what threshold counts as "notable"? Stddev-based? Fixed percentage? First-N bakes excluded from baseline?
- How does "notable" interact with the 4-stat Panel 3 row glance — do the notable stats become the glance, or is the glance separate?
- Visual treatment — emphasis via size, color, badge, position?

## Scope boundary

Independent of `bake_stats` schema landing. Requires PF-177.3 + PF-177.4 already in place. Not blocked by PF-177.5 UI implementation — can be layered on once the base UI ships.
<!-- SECTION:DESCRIPTION:END -->
