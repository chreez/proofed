# PF-271 Design Notes — Observed step times + granular worker assignment

**Status:** Design only. No code in this task.
**Source draft:** DRAFT-94 (promoted 2026-05-12).
**Relationships:**
- Extends PF-269 (multi-baker shift management) with per-state granularity.
- Displaces PF-267 (agent-estimated `prep_active_min` / `proof_passive_min` / `oven_occupancy_min` / `bake_min`) per-state as empirical data accumulates.
- Adjacent to DRAFT-93 / PF-270 (passive-time batching) — finer per-state windows tighten batch-fit math.
- Provenance / confidence display is a hard requirement of PF-256 (Bakery Ops Assistant).

---

## 1. Scope split

This task tracks two **coupled but separable** features. They share a schema (per-state identity is the join key) but ship as independent slices.

### Part A — Observation collection + aggregation

- Capture real per-state durations from live bakes.
- Aggregate into a running mean / stddev / confidence per `(recipeId, stateId)`.
- Surface confidence to the user; let the scheduler consume empirical means when confidence ≥ medium.

### Part B — Per-state worker capacity + granular assignment

- Add `worker_capacity` + `parallelizable` to `RecipeState`.
- Let PF-269's baker-assignment UI bind specific bakers to specific states (not just whole bakes).
- Enable the scheduler to fan active-prep work across multiple bakers on parallelizable states.

The two parts can ship in either order. Part A is the data flywheel; Part B is the UX leverage on existing data. Each gets its own implementation Draft (see §8).

---

## 2. Part A — Data model

### 2.1 `StateObservation` (raw)

One per `(cook_log entry, state) ` pair where the user marked the state complete.

```ts
interface StateObservation {
  stateId: string                       // matches RecipeState.id
  stageId: string                       // denormalised for fast aggregation
  actualMin: number                     // derived: doneAt - prevDoneAt (or stage start)
  observedAt: string                    // ISO 8601 UTC — when the user tapped "done"
  baker?: string                        // optional — links to Baker.id from PF-269
  source: 'manual' | 'auto' | 'estimated'
  // - manual: user tapped a "done" button live during the bake
  // - auto: derived from existing bake_stats timestamps (shape_time, bake_phases, etc.)
  // - estimated: backfilled retroactively (e.g. user said "took about an hour" post-hoc)
}
```

**Storage location: per cook_log entry** as `cook_log[].step_observations?: StateObservation[]`.

Rationale for co-locating with `cook_log` rather than a separate top-level dataset:
- Consistency with existing patterns (`bake_stats`, `bake_notes`, `weather`, `cost`, `step_notes`, ingredient snapshots) — all per-bake data lives on the cook_log entry.
- Aberration handling is free (`excludeFromStats`, `aberration` flags already filter the entry; observations inherit).
- Versioning is free — observations are pinned to the version the bake ran on.
- Backup / export is one file per recipe, no cross-file joins.

A separate top-level dataset (e.g. `public/observations.json`) was considered and rejected: it forces a cross-file lookup for every recipe page render and re-implements the aberration / exclusion logic that already lives on `CookLogEntry`.

### 2.2 `StateAggregate` (derived)

Computed at read time from the union of `cook_log[*].step_observations[*]` filtered by `stateId`. Not persisted. The aggregator runs on the same trigger as `bake-stats` rollups.

```ts
interface StateAggregate {
  stateId: string
  n: number                             // count of non-excluded observations
  meanMin: number
  stddevMin: number
  medianMin: number                     // robust to outliers
  confidence: Confidence                // 'high' | 'medium' | 'low' from recipe.ts:138
  lastObservedAt: string                // most recent observedAt
  source: 'observed' | 'estimated'      // 'estimated' until n >= MIN_OBSERVATIONS
}
```

**Confidence thresholds** (reuses existing `Confidence` ladder):

| n         | confidence | scheduler behaviour                                  |
|-----------|------------|------------------------------------------------------|
| 0         | —          | fall back to PF-267 heuristic (`meta.*_min`)          |
| 1–2       | `low`      | fall back to heuristic; surface observed mean as info |
| 3–9       | `medium`   | use empirical mean; show "observed (n=X)" badge       |
| ≥10       | `high`     | use empirical mean; show "observed (n=X)" badge       |

Mirrors the existing `bake_stats.confidence` ladder (recipe.ts:303-311). Exclusion is per-observation: any cook_log entry with `excludeFromStats: true` or `aberration: true` drops out of `n`.

### 2.3 Capture flow (UX sketch)

Three input modes, ranked by data quality:

1. **Live capture (`source: 'manual'`)** — highest quality.
   - On the recipe page, each `RecipeState` has a "Mark done" affordance (already partially present via progress tracking).
   - Tapping captures `observedAt = now()`.
   - `actualMin` derives from `observedAt - prevState.observedAt` (or `stage.startedAt` for the first state in a stage).
   - Edge: skipped state (user fast-forwards) → no observation written, downstream `actualMin` is computed against the most recent observed state.

2. **Auto-derive from existing `bake_stats` (`source: 'auto'`)** — medium quality.
   - `bake_phases[]`, `shape_time`, `stretch_folds[]`, `dough_temps[].time` already capture timestamps for many key transitions.
   - A one-shot backfill walks every cook_log entry and emits `StateObservation` rows where a state's identity can be unambiguously matched to a bake_stats timestamp.
   - Same trustworthiness as the bake_stats `confidence` flag — inherited per-entry.

3. **Retro-fill (`source: 'estimated'`)** — lowest quality.
   - The `/bake-log` flow can interview the user post-hoc ("How long did the autolyse actually take?").
   - These count toward `n` but are weighted into a separate `estimatedN` field if we find aggregation quality suffers. **Open decision** — see §7.

### 2.4 Aggregation surface

A pure function:

```ts
function aggregateState(
  recipe: Recipe,
  stateId: string
): StateAggregate
```

Walks `recipe.cook_log` once, filters by `stateId`, returns the aggregate. Cheap enough for render-time use; can be memoised if needed.

A second function:

```ts
function aggregateAllStates(recipe: Recipe): Map<stateId, StateAggregate>
```

For the recipe-detail and scheduler views that need every state aggregate at once.

---

## 3. Part B — Per-state worker capacity

### 3.1 Schema additions to `RecipeState`

```ts
interface RecipeState {
  // ... existing fields ...

  /**
   * Maximum number of bakers who can productively work on this state in
   * parallel. Default 1 (single-baker assumption — current behaviour).
   *
   * Examples:
   * - turning out dough → 1 (single set of hands, one bowl)
   * - cutting + scaling rolls → 2-3 (multiple cutters at one bench)
   * - assembling 16 rugelach → 4 (parallel rolling stations)
   *
   * Scheduler treats values > 1 as "this state can absorb up to N bakers";
   * actual_min for the state scales as actualMin / min(assignedBakers, worker_capacity).
   */
  worker_capacity?: number

  /**
   * When true, the state is genuinely parallelizable — splitting the work
   * across multiple bakers reduces wall-clock time. When false (default),
   * the state has a fixed wall-clock duration regardless of how many people
   * are assigned (e.g. monitoring a simmer, stirring a roux — adding bakers
   * doesn't help).
   *
   * worker_capacity > 1 with parallelizable: false is valid: the state has
   * room for helpers but no time savings (e.g. social cooking — three
   * people can knead in the same bowl, but it doesn't go faster).
   */
  parallelizable?: boolean
}
```

**Defaults & validation:**
- Absent `worker_capacity` → 1. Existing recipes need no migration.
- Absent `parallelizable` → false.
- `worker_capacity < 1` → invalid (validation test in `tests/validation/recipe-schema.spec.ts`).
- States with `timer: true` (passive) should have `worker_capacity: 0` or `1` — bakers don't help a proof finish faster. **Open decision** — see §7.

### 3.2 Scheduler consumption

The PF-269 scheduler currently assigns one baker per bake. Once per-state capacity exists, the assignment surface expands to `(bake, state) → baker`. The constraint solver:

1. Oven remains a single exclusive resource (unchanged from PF-269).
2. Passive states (`timer: true`) consume 0 baker-minutes regardless of assignment.
3. Active states (`timer: false`) consume `actualMin / min(assignedBakers, worker_capacity)` baker-minutes when `parallelizable: true`, else `actualMin` baker-minutes regardless of assignment count.
4. UI: PF-269's drag-to-assign extends from "drop bake on baker timeline" to "drop state on baker timeline." Bakes auto-distribute states across assigned bakers, respecting capacity.

### 3.3 Empirical input

`actualMin` in the formula above is the StateAggregate.meanMin from Part A when confidence ≥ medium; otherwise the heuristic per-state estimate. Part A and Part B compose cleanly: A produces the number, B distributes the work.

---

## 4. Provenance & confidence display (PF-256 hard requirement)

Every timing estimate that surfaces on the recipe page, scheduler, or print view must render with:

1. A confidence badge — visual ladder (`low` muted / `medium` standard / `high` bold or coloured).
2. A label distinguishing source — `estimated` (PF-267 heuristic), `observed (n=3)`, `observed (n=12, σ=2.4)`, etc.
3. On hover / tap — drill-down to the underlying observations (most recent N bake dates + their actualMin).

Naked agent estimates **must not** persist on the surface once observations exist for the same state. The fallback is explicit, not silent.

This work is its own slice — neither Part A nor Part B requires it to ship, but PF-256 cannot close until this exists end-to-end.

---

## 5. Relationship to existing fields

| Existing field                                        | Relationship                                                                                                  |
|-------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| `RecipeState.duration_min`                            | The author's a-priori estimate. Remains the fallback when no observations exist. Never overwritten.            |
| `RecipeMeta.prep_active_min` etc. (PF-267)            | Recipe-level heuristic rollups. Once enough per-state observations exist, these are re-derived from aggregates, not from `state.duration_min`. PF-267 stays as the cold-start path. |
| `CookLogEntry.bake_stats`                             | Some bake_stats timestamps feed `source: 'auto'` observations (see §2.3). bake_stats remains the source of truth for *what physically happened*; step_observations is the *step-level interpretation* of it. |
| `CookLogEntry.aberration` / `excludeFromStats`        | Already exclude per-bake data from rollups. Inherited automatically — no new code needed.                       |
| `Confidence` (recipe.ts:138)                          | Reused verbatim for `StateAggregate.confidence`. No new enum.                                                  |

---

## 6. Data flywheel timeline (illustrative)

1. **Day 0** — Part A schema lands. Capture UI surfaces on the recipe page. Every recipe shows agent estimates with `confidence: low` badges.
2. **Day 0 → 14** — Auto-backfill from existing `bake_stats` populates ~30% of `(recipe, state)` cells with `source: 'auto'`. Many cells reach `n=1-2` (still `low`).
3. **Day 14 → 60** — Live captures from new bakes accumulate. Frequently-baked recipes (sourdough variants, pizza dough) reach `n ≥ 3` for their key states (autolyse, bulk, shape, bake). Scheduler swaps in empirical means for those states.
4. **Day 60+** — High-cadence recipes hit `n ≥ 10` for their most observed states. PF-267's heuristic becomes the cold-start path only. Scheduler accuracy is observably better.

---

## 7. Open decisions

1. **Estimated observations weight** — should `source: 'estimated'` count fractionally toward `n` (e.g. weight 0.5)? Or be excluded from the mean but shown alongside as a sanity check? Lean: exclude from mean, track separately.
2. **Passive state capacity semantics** — for `timer: true` states, is `worker_capacity` meaningful at all? A bulk ferment doesn't consume bakers regardless. Lean: define `worker_capacity` as **active baker-minutes consumed**, set to 0 for all passive states. PF-269 then ignores them when distributing work.
3. **Cross-recipe state identity** — should the aggregator merge observations across recipes for "the same state" (e.g. "autolyse" appears in 5 sourdough variants)? Lean: no — recipe-scoped only. Cross-recipe rollups invite false generalisation when ingredients/temperatures differ.
4. **Stage-level vs state-level granularity** — should we also aggregate at the stage level (sum of state means) for the scheduler's coarse view? Probably yes, free derivation from state aggregates.
5. **Capture friction tolerance** — how much extra tapping during a live bake is acceptable? If "mark done" is too noisy, fallback is: capture only at stage boundaries (coarser, lower friction).

---

## 8. Follow-up Drafts to spawn

At minimum:

- **Draft: Observation capture UI + step_observations schema** (Part A slice 1)
  - Add `step_observations` to `CookLogEntry`.
  - Add a "mark state done" affordance to the recipe page.
  - Persist live captures.

- **Draft: StateAggregate + scheduler consumption** (Part A slice 2)
  - Pure aggregation function + tests.
  - Scheduler picks empirical mean when confidence ≥ medium.
  - Fallback path documented and tested.

- **Draft: bake_stats → step_observations auto-backfill** (Part A slice 3)
  - One-shot script that emits `source: 'auto'` observations from existing bake_stats timestamps.
  - Idempotent.

- **Draft: worker_capacity + parallelizable schema on RecipeState** (Part B slice 1)
  - Schema additions + validation test.
  - Authoring guidance in CLAUDE.md.

- **Draft: per-state baker assignment in PF-269 scheduler** (Part B slice 2)
  - Extend drag-to-assign from per-bake to per-state.
  - Solver respects capacity + parallelizability.

- **Draft: Provenance + confidence display surface** (cross-cut)
  - Confidence badges on every timing estimate (recipe page, scheduler, print).
  - Drill-down popover showing recent observations.
  - Hard requirement of PF-256.

These get created as actual Drafts (`backlog draft create`) once the user signs off on this design.
