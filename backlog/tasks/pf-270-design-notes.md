# PF-270 — Passive-Time Batching Across Recipes (Design Notes)

> Companion to the PF-255.4 scheduler UI. The scheduler currently displays
> queued bakes side-by-side; this doc specifies an **active solver** that
> *suggests* which recipes to interleave so a baker can produce two
> products in roughly the time of one. No code in this doc — design only.

---

## 1. Problem Framing

A baker drops Recipe A (e.g. ATK Cinnamon Buns Overnight) onto the
36h timeline. A has an 8h cold retard during which the baker — and the
oven — are idle. The scheduler today shows that empty time honestly but
does nothing with it.

**Goal:** surface Recipe B candidates whose *active* phases fit
*inside* A's *passive* windows, subject to physical constraints, ranked
by economic and ergonomic value.

**Non-goal:** auto-scheduling without consent. The solver only
*proposes*; the baker drags-to-accept.

### Motivating example

```
Recipe A: ATK Cinnamon Buns Overnight
  Fri 6pm  Mix + shape (45m active)
  Fri 7pm  Cold retard (passive, 8h)        ← passive window W
  Sat 3am  Pull from fridge, bench (passive, 1h)
  Sat 4am  Bake (oven 30m)

Suggested Buddy: Sourdough Choc Chip Cookies
  Fits inside W:
    Fri 7:30pm  Mix + autolyse (active 20m + passive 30m)
    Fri 8:30pm  Stretch + fold (active 5m)
    Fri 10:00pm Shape balls (active 20m)
    Fri 10:30pm Chill overnight (passive — overlaps remainder of W)
    Sat 6:00am  Bake (oven 12m — AFTER A's bake window)
```

Net: two products done by Saturday 6:30am instead of A alone at 4:30am.

---

## 2. Inputs and Outputs

### Solver inputs

1. **Queue:** `Bake[]` — accepted bakes with `anchorTime` already placed
   on the timeline. Each carries the `RecipeMeta` throughput fields
   shipped in PF-267:
   - `prep_active_min`
   - `proof_passive_min`
   - `oven_occupancy_min`
   - `bake_min`
   - and per-state `RecipeState[]` walk for fine-grained windows.
2. **Recipe library:** all recipes (`public/recipes/index.json`) not
   currently in the queue, used as candidates.
3. **Constraints config:** `{ fridgeSlots: number, slackMin: number,
   bakerCount: 1, allowOvenStacking: false }` — from profile (PF-255.5).
4. **Mute list:** `[{ recipeA: string, recipeB: string, until?: Date }]`
   from profile — pairs the baker has previously dismissed.

### Solver outputs

`Suggestion[]` ordered by rank:

```
Suggestion {
  primaryBakeId      // already in queue
  buddyRecipeId      // proposed addition
  anchorTime         // ISO timestamp where buddy would start
  fitsInWindow       // reference to the passive window of primary it fills
  uplift_active_perHr   // delta $/hr if accepted vs primary alone
  uplift_elapsed_perHr  // same for elapsed metric
  warnings: Warning[]   // soft constraint hits (fridge crowding, etc.)
  rationale: string     // human-readable "why this pairing"
  rankScore             // for sort
}
```

---

## 3. Phase Decomposition (window extraction)

The PF-267 `meta.*_min` aggregates are summary numbers. The solver needs
**per-state windows**, derived from the state walk:

```
PassiveWindow {
  bakeId
  startMin        // minutes after bake anchorTime
  durationMin     // contiguous span of timer:true non-bake states
  type: 'cold_retard' | 'bulk_ferment' | 'autolyse' | 'bench' | 'cool' | 'generic'
  ovenFree        // true if no overlapping bake/preheat
  fridgeOccupied  // true if this passive lives in a fridge stage
}
```

### Window typing heuristics (recompute on every render)

- `type = 'cold_retard'` if state id matches `/cold|retard|chill/i`
- `type = 'bulk_ferment'` if state id matches `/bulk|ferment/i` and not cold
- `type = 'autolyse'` if state id matches `/autolyse|fermentolyse/i`
- `type = 'cool'` if state id matches `/cool/i`
- otherwise `'generic'`

`fridgeOccupied = type === 'cold_retard'`. Used for fridge-slot
constraint accounting.

### Active-burst extraction (for candidate B)

For each candidate recipe B, decompose its state walk into
`ActiveBurst[]` plus mandatory `PassiveLink[]` between bursts:

```
ActiveBurst { startOffset, durationMin }     // hands-on slice
PassiveLink { afterBurstIdx, minDuration }   // forced wait (e.g. 30m rest)
```

A buddy "fits" inside a primary's passive window iff:
1. Sum of `ActiveBurst.durationMin` + intervening `PassiveLink.minDuration`
   + `slackMin` ≤ `PassiveWindow.durationMin`.
2. Every `ActiveBurst` falls within the window's time span when anchored
   to the proposed `anchorTime`.
3. No active burst overlaps another bake's active burst in the queue
   (baker attention constraint).

---

## 4. Solver Pseudocode

```
function suggestBuddies(queue, library, constraints, muteList):
  suggestions = []

  for primary in queue:
    passiveWindows = extractPassiveWindows(primary)
    for window in passiveWindows:
      if not window.ovenFree:
        continue   // can't slip a bake-needing buddy in here

      for candidate in library:
        if isMuted(primary.recipeId, candidate.id, muteList):
          continue
        if candidate.id == primary.recipeId:
          continue   // not a duplicate-self suggestion (separate feature)

        // CHEAP FILTERS first
        if candidate.meta.prep_active_min + slackMin > window.durationMin:
          continue
        if candidate.meta.bake_min > 0 and not bakeFitsAfterWindow(window, candidate, queue):
          continue

        // FULL FIT ATTEMPT
        anchor = window.startMin + slackMin/2
        plan = tryPlace(candidate, window, anchor, queue, constraints)
        if plan.fits:
          warnings = collectWarnings(plan, queue, constraints)
          uplift = computeUplift(primary, candidate, plan)
          suggestions.push({
            primaryBakeId: primary.id,
            buddyRecipeId: candidate.id,
            anchorTime: plan.anchorAbsolute,
            fitsInWindow: window.id,
            uplift_active_perHr: uplift.active,
            uplift_elapsed_perHr: uplift.elapsed,
            warnings,
            rationale: explain(plan, uplift),
            rankScore: score(uplift, warnings, plan),
          })

  return suggestions.sort(byRankScore).take(TOP_N)
```

### `tryPlace` — micro-scheduler

Walks candidate state-by-state from `anchor`:

- Each `ActiveBurst` checks queue for baker-attention overlap (1 baker,
  1 attention slot). If overlap, attempt to shift by ±slackMin; else
  fail.
- Each `PassiveLink` advances clock without contention.
- A trailing `bake_min` phase requires oven-free at that time.

Returns `{ fits: bool, anchorAbsolute, ovenSlot, fridgeSlots, activeSlots }`.

### `bakeFitsAfterWindow`

If candidate needs the oven, place its bake either:
- Inside a different oven-free passive window of the primary, or
- After all queued bakes (extends elapsed time but still feasible).

If neither, this candidate is dropped — its active phases might fit but
the bake step would clash with primary's bake.

---

## 5. Constraint Rules

### 5.1 Oven exclusivity (HARD)

Only one bake/preheat state may occupy the oven at any instant. Two
recipes both wanting 350°F can theoretically share — but **v1 treats the
oven as exclusive** to avoid temperature-mismatch and tray-juggling
errors. Future enhancement: same-temp stacking (PF-???).

### 5.2 Fridge slot capacity (SOFT/HARD)

`constraints.fridgeSlots = 2` by default. Each
`fridgeOccupied` window counts as 1 slot for its duration. If a
suggestion pushes concurrent fridge occupancy > slots:
- 1 slot over → soft warning ("Fridge crowded — clear space")
- 2+ slots over → hard reject

Profile (PF-255.5) lets the baker raise `fridgeSlots` for a beverage
fridge / second unit.

### 5.3 Baker attention (HARD, 1 baker)

Only one `ActiveBurst` may run at a time across the queue. Multi-baker
is out of scope (deferred to DRAFT-92 / DRAFT-94). Slack buffer
(`slackMin`, default 10 min) is required between adjacent active
bursts of different recipes — context switching cost.

### 5.4 Temperature/hydration adjacency (SOFT)

When two doughs share counter space, a soft warning fires if:
- One is in active `autolyse` / `bulk_ferment` (warm, 75-80°F target)
- The other is in `cold_retard` (cold, must stay <40°F)

Worded as: *"Sourdough autolyse next to chilled cinnamon dough — give
the cold one fridge real estate, not counter."* Not a blocker; bakers
manage this routinely.

### 5.5 Sleep window (SOFT, inherited from PF-255.4 §6)

If accepting a buddy pushes any `ActiveBurst` into the 12am–4am
"brutal" band, surface the alarm severity in the suggestion's
`warnings[]`. Baker can accept anyway.

---

## 6. Suggestion Ranking

### Primary: active-$/hr uplift

```
uplift_active = ($/hr_active_with_buddy) − ($/hr_active_alone)
```

Computed using PF-255.1 pricing snapshot. A buddy that doubles revenue
for ~30 min extra active labor yields a large uplift. Negative uplift
candidates are filtered out before ranking — never suggest a money loser.

### Secondary: sequence simplicity

Ergonomic cost penalty:
```
simplicity = − (numContextSwitches × 0.5)
            − (numOvenTempChanges × 1.0)
            − (numAlarmsInBrutalBand × 2.0)
```

Context switch = baker pivots from recipe A action to recipe B action
within 5 min. Oven temp change = the queue forces a preheat/cooldown
between bakes.

### Tertiary: cleanup load

```
cleanup = − (distinctNewVessels − sharedVesselsReused) × 0.25
```

Pairing two doughs that both use a stand mixer counts the mixer once,
not twice. Pulled from each recipe's `vessels[]`.

### Composite

```
rankScore = uplift_active × 1.0
          + simplicity     × 0.3
          + cleanup        × 0.2
```

Weights tunable in profile. UI exposes a single "Optimize for: profit |
ease | minimal cleanup" toggle that re-weights without surfacing the
math.

---

## 7. Storage Model

### Recompute-on-render (chosen)

Suggestions are **derived state**, recomputed from `(queue,
constraints, muteList)` every time the timeline changes.

- **Pro:** no staleness; queue edits immediately re-rank.
- **Pro:** no schema churn — nothing new written to recipe JSONs or
  cook log.
- **Con:** compute cost scales with `O(|queue| × |library| × |windows|)`.
  For a queue of 5 and a library of 30, that's ~150 candidate checks
  per render. Each check is a state walk + arithmetic — well under
  10ms total in practice. Acceptable.

### What DOES persist (in profile JSON, PF-255.5)

- `muteList: { recipeA, recipeB, mutedAt, expiresAt? }[]`
- `acceptedBuddies: { primary, buddy, anchoredAt }[]` — these are just
  queue entries with a `parentBakeId` link, used for stats ("how often
  do you batch cinnamon buns + cookies?")
- `rankingWeights: { uplift, simplicity, cleanup }` — user-tunable
  via the "Optimize for" toggle.

### What DOES NOT persist

Raw suggestion lists. They're regenerated on demand.

---

## 8. Scheduler Overlay UX

### Default display

Inside a primary bake's passive segment on the timeline, render up to
**3 buddy shadows** as dotted, translucent (40% opacity) blocks. Each
shadow shows:

- Buddy recipe name (truncated to fit window)
- Compact uplift readout: `+$14/hr`
- Warning badges (fridge crowded, late alarm, etc.)

```
┌──────────────────────────────────────────────────────────────────┐
│  CINNAMON BUNS  ░░░░░░░░ COLD RETARD 8h ░░░░░░░░  │ BENCH │ BAKE │
│                  ┌··············· buddy ··············┐         │
│                  ┊ SD COOKIES — +$14/hr active        ┊         │
│                  ┊ [Add buddy →]                       ┊         │
│                  └······································┘         │
│                  ┌·· buddy ··┐                                  │
│                  ┊ FOCACCIA  ┊  +$8/hr · ⚠ fridge               │
│                  └···········┘                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Hover shadow** → side panel shows full rationale, warnings,
  per-burst timeline preview.
- **Click "Add buddy →"** → shadow promotes to a solid block, joins the
  queue with `parentBakeId` set, profit/hour rollup re-renders.
- **Click "Dismiss"** (small × on hover) → adds pair to `muteList`
  with 30-day decay.
- **Long-press / right-click "Never suggest"** → permanent mute (no
  expiry), profile-scoped.

### Empty / single states

- **No suggestions** → small inline hint: *"No buddies fit this
  window's 8h passive. Try shortening the queue or relaxing fridge
  slots in profile."*
- **Single bake in queue** → solver still runs, shadows still render
  (this is the entry point for "let's batch two things").

### Toolbar toggle

`[Suggest buddies: ON / OFF]` — global kill switch. Defaults ON.
Useful when the baker is in "execute" mode and wants the timeline
quiet.

### Optimize-for selector

`Optimize for: [Profit ▼ | Ease | Cleanup]` — re-weights ranking
(§6) without surfacing the math.

---

## 9. Mute / Dismiss Semantics

### Why three flavors of "no"

1. **Session mute** — one click, lasts until tab close. For "not
   right now." No storage.
2. **30-day decay mute** — default for the dismiss × button. After 30
   days, the suggestion reappears (baker's tastes may have shifted).
3. **Permanent never-suggest** — long-press / right-click. Profile-
   scoped, only revocable from a settings panel.

### Mute scope

Mute keys are **unordered pairs** of recipe IDs:
`(min(id1, id2), max(id1, id2))`. Muting "cinnamon buns + cookies"
also mutes "cookies + cinnamon buns."

### Decay

```
muteList = muteList.filter(m => !m.expiresAt || m.expiresAt > now())
```

Run on every solver invocation. Decayed entries silently drop out.

---

## 10. Edge Cases

### 10.1 Empty queue
Solver returns []. UI hides the suggestion overlay entirely.

### 10.2 Single bake, no passive windows
Some recipes (ny-pizza-sauce, quick biscuits) have `proof_passive_min
≈ 0`. Solver finds no windows on primary → returns []. UI hint:
*"This recipe has no passive time to fill."*

### 10.3 Partial fit
Candidate B's active bursts fit but B's `bake_min` lands inside
primary's `bake_min`. Solver attempts to shift B's bake later (after
primary's bake). If that pushes B's active phases outside the
window, drop the candidate.

### 10.4 Conflicting buddies
Buddies B and C both fit in the same window but their active bursts
overlap each other. Solver returns both as separate suggestions
(ranked independently). UI shows both shadows; accepting one removes
the other from the next solver pass (because the queue now contains
B, making C non-fitting).

### 10.5 Recursive batching
Primary A + accepted buddy B leaves residual passive time inside W.
On next render, solver re-evaluates with `queue = [A, B]` and may
suggest a third recipe C inside the leftover window. No special
recursion — natural emergent behavior from recompute-on-render.

### 10.6 Same recipe twice
Suggesting "make another batch of A inside A's passive" is a
**different feature** (multi-batch sequencing — see PF-265
`itemsPerBatch`). Solver filters `candidate.id === primary.recipeId`.

### 10.7 Cross-day windows
A primary's passive window spans midnight (e.g. 7pm → 3am). Buddy's
active bursts may legitimately fall in the brutal alarm band.
`warnings[]` carries alarm severity per §5.5; rank penalty applies via
§6 secondary.

### 10.8 Fridge over-commit by buddy alone
Buddy has its own cold retard that exceeds remaining fridge slots
even without primary's retard. Hard reject.

### 10.9 Pricing missing on candidate
Candidate has no PF-255.1 price → `uplift_active = 0`. Candidate falls
to bottom of rank but is not filtered (some bakers may want to
batch unprofitable items for personal reasons). Warning chip:
*"No price set — uplift unknown."*

### 10.10 Buddy needs ingredients not in pantry
**Out of scope.** Pantry tracking is a separate feature. Solver
assumes all ingredients are available.

---

## 11. Open Decisions

1. **Per-recipe `passiveWindows[]` authoring?** Currently derived from
   state walks. Authored windows (in JSON) would let the baker mark a
   passive as "half-attended" (e.g. stretch-fold sets need a glance
   every 30 min) → solver would penalize active-burst overlap there.
   *Recommendation:* defer to PF-261 audit; v1 uses inferred windows.
2. **Slack buffer learning?** `slackMin = 10` is a guess. Could
   observe accepted vs dismissed suggestions over time and adapt per
   baker. *Recommendation:* fixed in v1; revisit after 20+ bake-days
   of accept/dismiss data.
3. **Multi-baker integration (DRAFT-92).** If a second baker exists,
   baker-attention constraint relaxes from 1 to N. Solver pseudocode
   already parametrized via `constraints.bakerCount` — UX impact only.
4. **Cross-bake ingredient sharing.** If A and B both call for 100g
   butter, melting once for both is a real ergonomic win. Not modeled
   in v1. *Recommendation:* draft follow-up after solver ships.
5. **"Profitable solo, unprofitable batched"?** Edge case where
   batching introduces enough delay (e.g. shared oven shift) that A
   alone earns more per hour than A+B together. Solver currently only
   filters negative-uplift candidates; should it also flag a "batching
   makes A worse" case? *Recommendation:* yes — show as warning, not
   a hard reject.
6. **Snapshot-aware costing.** Buddy pricing should use latest
   PF-255.1 snapshot or a per-bake override? *Recommendation:* same
   resolution cascade as the rest of the scheduler — defer to
   PF-255.2 outcome.

---

## 12. Demo Plan (for AC sign-off)

Static HTML demo at `public/demo/passive-batching.html` showing:

1. **Primary bake placed** — cinnamon buns overnight on the timeline,
   8h cold retard visible.
2. **Two buddy shadows** — SD cookies (high uplift, no warnings) and
   focaccia (medium uplift, fridge-crowded warning).
3. **Accept one buddy** — shadow promotes to solid block, $/hr rollup
   updates, second shadow re-renders narrower (cookies' presence
   shrinks remaining baker-attention slots inside W).
4. **Mute one buddy** — × click → shadow fades out with toast
   "Won't suggest cinnamon buns + focaccia for 30 days. [Undo]."
5. **Optimize-for toggle** — flip from Profit → Ease → ranks reshuffle.
6. **Edge state: zero buddies fit** — short biscuit recipe queued
   alone, hint shown.

Demo file is throwaway — cleaned up when real implementation ships.

---

## 13. Acceptance for PF-270

- [ ] AC1: This file exists. ✅ (rendered)
- [ ] AC2: §4 solver pseudocode documented.
- [ ] AC3: §3 time-window matching with slack buffer.
- [ ] AC4: §5 constraint catalog (oven, fridge, baker, temp).
- [ ] AC5: §6 ranking heuristic (uplift / simplicity / cleanup).
- [ ] AC6: §8 overlay UX with dotted shadows + Add buddy affordance.
- [ ] AC7: §9 mute/dismiss with three flavors + decay.
- [ ] AC8: §7 storage decision (recompute on render).
- [ ] AC9: §10 edge cases documented.
- [ ] AC10: User sign-off pending.
