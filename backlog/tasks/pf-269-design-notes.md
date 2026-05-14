# PF-269 — Shift Management / Multi-Baker Throughput Design Notes

> Design doc for the multi-baker extension to the bake scheduler. Companion
> to PF-255.4 single-baker design (`backlog/tasks/pf-255.4-design-notes.md`)
> and PF-256 S8 slice. Promoted from DRAFT-92.
>
> **Status: Design only — no code. Awaiting user sign-off (AC10).**

---

## 1. Problem Framing

PF-255.4 designed the scheduler around a single home baker: oven is the only
exclusive resource, and any active-prep block implicitly belongs to "the
baker." That model breaks the moment a second person enters the kitchen, or
the user wants to simulate "what if I hired a part-timer Saturday morning?"

Multi-baker promotes the **baker** into a first-class resource alongside the
oven. Three new questions the scheduler must answer:

1. **Who is doing what?** A bake has multiple active-prep states (mix, fold,
   shape, score, glaze). Each can be done by a different person, or the same
   person — but the assignment must be explicit so the timeline can show
   collisions.
2. **Are these humans overlapping?** Two bakers can do active prep in
   parallel, but only if the bakery has the *workspace* to hold two simul-
   taneous active tasks (this is where DRAFT-94 / `parallelizable` lives —
   see §10).
3. **What is each baker earning me, and what do they cost?** Per-baker
   active hours × that baker's hourly rate gives both *labor cost* (subtract
   from revenue) and *labor productivity* ($/active-hr realized).

This is the design surface for PF-256 S8. It does **not** ship the solver;
it specs the data model, UX, math, and edge cases so the implementer has an
iron-clad target.

---

## 2. Data Model

### 2.1 `Baker` interface

```ts
interface Baker {
  /** Stable id — e.g. 'chris', 'spouse', 'hire-sat-am'. kebab-case. */
  id: string
  /** Display name shown on timeline avatars / lanes. */
  name: string
  /**
   * Hourly rate in USD. Used for both labor-cost subtraction (CP stack
   * factor #3 — see PF-256) and per-baker $/hr realized math.
   * Can be 0 for the owner-operator if they zero-out their own labor.
   */
  hourlyRate: number
  /**
   * Optional skill tags — free-form strings. v1 use case: filter which
   * bakers can be assigned to which states (e.g. only 'lead' baker can
   * shape sourdough). v1 does not enforce; tag drives a soft suggestion
   * only. Future: gate the drag-to-assign drop.
   */
  skills?: string[]
  /**
   * Optional availability windows — recurring weekly slots when this
   * baker is in the kitchen. Empty / undefined = "always available"
   * (the owner-operator case). v1 enforcement: soft warning if an
   * assignment lands outside a window; does not block the drop.
   */
  availableWindows?: AvailabilityWindow[]
  /**
   * Optional ISO-8601 color hex for the baker's timeline lane / avatar.
   * Falls back to a deterministic hash of `id` if absent.
   */
  color?: string
}

interface AvailabilityWindow {
  /** 0 = Sunday, 6 = Saturday. ISO weekday convention. */
  dayOfWeek: number
  /** 24h local time, "HH:MM". */
  start: string
  /** 24h local time, "HH:MM". */
  end: string
}
```

**Roster scope:** the active baker roster is a flat array `Baker[]`. v1 has
no hierarchy (no "shifts" / "teams" — just people). One owner-operator + 1-3
helpers covers every plausible home/small-bakery scenario.

### 2.2 `BakerAssignment` interface

```ts
interface BakerAssignment {
  /** The cook_log entry / scheduled bake this assignment belongs to.
   *  Key shape: `${recipeId}::${bakeDate}` so assignments survive across
   *  reschedules without dangling. */
  bakeKey: string
  /** Recipe.State.id this baker is responsible for. */
  stateId: string
  /** Baker.id assigned to this state. */
  bakerId: string
  /**
   * Optional override for the state's expected duration in this
   * assignment context. v1: omitted; scheduler uses
   * `RecipeState.duration_min`. DRAFT-94 will replace this with
   * observed-time math.
   */
  durationMinOverride?: number
}
```

**Coverage rule:** a bake is "fully assigned" when every state with
`timer: false` (i.e. active prep, including bake-start and bake-pull
moments where someone has to be present) has a BakerAssignment. Passive
states (`timer: true`) never need an assignment — they consume no human.

**Default behavior:** when a bake is dropped on the timeline, the scheduler
auto-assigns all of its active states to the **owner-operator** (the first
baker in the roster, conventionally the user). The user can then re-assign
individual states by dragging onto a different baker's lane (see §4).

### 2.3 Storage

Two localStorage keys, both JSON-encoded:

| Key | Shape | Notes |
|-----|-------|-------|
| `proofed.bakers.roster` | `Baker[]` | The full roster, ordered. Index 0 = owner-operator default. |
| `proofed.bakers.assignments` | `BakerAssignment[]` | Flat list. Lookup by `(bakeKey, stateId)` is O(N) but N is small (≤ ~50 states across a 36h window). |

The roster is **profile-scoped** — when PF-256 lands its profile system
(home baker / side-hustle / portfolio-demo), each profile has its own
roster. Assignments are scheduler-scoped (tied to the production plan).

**Why localStorage and not a JSON file in `public/`:** baker data is
personal and per-installation; it shouldn't be checked into the repo. (A
portfolio-demo profile could ship a sample roster as a one-time seed via
`public/data/sample-bakers.json` that the app imports on first load if the
user opts in. Out of scope for v1.)

---

## 3. Roster Management UI

A new settings panel `/ops/bakers` (or a sidebar accordion inside
`/ops/schedule` — open question). Bare-bones table:

```
ROSTER
┌──────────────┬──────────┬────────┬──────────────────────┬─────────┐
│ Name         │ $/hr     │ Color  │ Availability         │ Skills  │
├──────────────┼──────────┼────────┼──────────────────────┼─────────┤
│ Chris (you)  │ $0       │ ●      │ Always               │ all     │
│ Spouse       │ $25      │ ●      │ Sat/Sun 6a-12p       │ shape   │
│ + Add baker  │          │        │                      │         │
└──────────────┴──────────┴────────┴──────────────────────┴─────────┘
```

Inline edit on click; "Add baker" opens a row-form. No drag-reorder in v1
(owner-operator is always index 0 by convention).

**Empty state:** single owner-operator pre-populated as `{ id: 'me', name:
'Me', hourlyRate: 0 }`. User can rename. Roster is never empty.

---

## 4. Scheduler Interaction Spec

### 4.1 Timeline layout (multi-baker mode)

The PF-255.4 timeline gains a **baker lane stack**: one horizontal lane per
baker, plus the existing **OVEN** lane. Passive segments float above the
lanes in a shared "PASSIVE" band that's not assigned to any baker.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Fri 4p  6p  8p  10p  12a  2a  4a  6a  8a  10a  12p  2p  4p Sat..    │
├──────────────────────────────────────────────────────────────────────┤
│ OVEN     │                              ▓▓▓ buns ▓▓▓                │
│ Chris ●  │ ▓ mix ▓                 ▓shape▓                          │
│ Spouse ● │                                         ▓glaze▓          │
│ PASSIVE  │       ░░░░░░░░ cold retard 8h ░░░░░░░░                   │
└──────────────────────────────────────────────────────────────────────┘
```

- Each baker has their own lane, colored by `baker.color`.
- Oven lane is unchanged from PF-255.4 — still exclusive, still single.
- Passive segments render in a separate band, not in any baker lane,
  because they don't consume a baker.

### 4.2 Drag-to-assign

Two distinct drag interactions:

**(a) Drag bake from library → timeline** (unchanged from PF-255.4): drops
the bake onto a time slot, auto-assigns all active states to the
owner-operator. Block visually spans multiple lanes (one block fragment
per assigned state, on its baker's lane).

**(b) Drag a state fragment → different baker lane** (new): grab the
fragment for one active state of an already-scheduled bake, drag it down
to a different baker's lane. Drop reassigns that state to the new baker.

- Snap-to-15-min still applies on the time axis.
- Vertical drop snaps to the nearest baker lane.
- Soft warning chip if the new baker has no overlapping availability
  window — e.g. "Spouse is off-shift at 9pm — proceed?"
- Skill-tag mismatch shows an info chip but does not block.

### 4.3 Auto-suggest distribution

A toolbar button **"Distribute work →"** that, given the current scheduled
queue, proposes assignments to flatten per-baker active-hour load. v1
algorithm: greedy round-robin across active states ordered by start time,
skipping bakers outside availability and skipping skill-mismatched states
when the user has toggled **"Respect skills"**.

This is a one-click suggestion — user reviews and accepts, doesn't run
silently. Out of scope for v1: optimal solver (NP-hard; greedy is fine).

### 4.4 Constraint rules

Hard constraints (drop refuses / shakes):

1. **Oven exclusivity** — unchanged from PF-255.4. Two oven-states cannot
   overlap.
2. **Baker exclusivity per active state** — a single baker cannot be
   assigned to two active states whose time ranges overlap. (You can't
   shape one bake and glaze another simultaneously.)

Soft constraints (warning chip, allowed):

3. **Active-prep collision across bakers** — two bakers doing active prep
   simultaneously is fine **if** workspace allows. v1 shows a small
   "parallel work" indicator and trusts the user; PF-256 S8.2 (separate
   future task) can add a `workspace_capacity` constraint.
4. **Off-window assignment** — assigning a state to a baker outside their
   availability window. Allowed (the user might be staying late) but
   flagged.
5. **Skill mismatch** — assigning to a baker who lacks a required skill.
   Informational only in v1.

Passive states **never** generate conflicts based on baker count — they
sit in the PASSIVE band and consume no one.

---

## 5. Sort + Filter Modes on Recipe Library

The recipe library (left rail of the scheduler) gains baker-aware sort
modes that re-rank recipes for the **currently-focused baker** (a select
chip at the top of the rail). Selecting "Chris" vs "Spouse" reshuffles the
ranking.

| Sort mode | Math | Use case |
|-----------|------|----------|
| `$/hr per baker` | `(yield × unit_price - other_costs) / (assigned active_min for this baker × 60)` | "Best margin work I personally do" |
| `Fastest to bake` | `total_elapsed_min` ascending | "Tightest deadline" |
| `Highest CP` | `(yield × unit_price) / total_cp` desc | "Most profitable absolute" |
| `Most units/day` | `defaultYield / total_elapsed_min × 1440` | "Throughput maxing" |

The first mode is the new contribution; the other three are sharpened
restatements of PF-255.4 metrics, gated to baker context where relevant.

**Filter chips** (combine with sort):

- `Fits my window` — hide recipes whose total active time exceeds the
  selected baker's nearest availability window.
- `Skill: shape` (etc.) — filter to recipes whose states require a skill
  the baker has.

Filters compose multiplicatively (AND), not OR.

---

## 6. Reporting Spec

A new lens **`/ops/reports`** (or a subview of `/ops/schedule`) with a
per-baker rollup:

```
PER-BAKER REPORT — Window: 2026-05-12 to 2026-05-18

┌──────────────┬──────────┬──────────┬───────────┬────────────┐
│ Baker        │ Active h │ Pay      │ Revenue   │ $/active-h │
├──────────────┼──────────┼──────────┼───────────┼────────────┤
│ Chris (you)  │ 4.5      │ $0       │ $76       │ $16.9      │
│ Spouse       │ 2.0      │ $50      │ $48       │ $24.0      │
├──────────────┼──────────┼──────────┼───────────┼────────────┤
│ TOTAL        │ 6.5      │ $50      │ $124      │ $19.1      │
└──────────────┴──────────┴──────────┴───────────┴────────────┘
NET (revenue - pay): $74        Labor cost share: 40%
```

### 6.1 Math

For each baker `b` over window `[W_start, W_end]`:

```
active_minutes(b) = Σ over BakerAssignments where bakerId == b.id
                     and the assigned state's scheduled start ∈ window
                    of (durationMinOverride ?? state.duration_min)

pay(b)     = active_minutes(b) / 60 × b.hourlyRate
revenue(b) = Σ over bakes where b owns ≥1 active state
              of (yield × unit_price) × (b's share of that bake's
              active minutes / bake's total active minutes)
$/active-h(b) = revenue(b) / (active_minutes(b) / 60)
```

**Revenue allocation rule:** revenue is split proportionally to active
minutes owned. A baker who does 30 of a recipe's 60 active minutes gets
credited with 50% of that recipe's revenue. This is the cleanest
allocation for a personal-notebook context; a real bakery might use
different rules (per-state weights, role multipliers) but that's out of
scope for v1.

### 6.2 Per-recipe drill-down

Clicking a baker row expands a recipe-level breakdown (which bakes drove
this baker's hours, in what proportion). Echoes the PF-255.4 per-recipe
profit table.

---

## 7. Edge Cases

| Case | Handling |
|------|----------|
| **Baker leaves mid-bake** (e.g. spouse called away during bulk ferment) | User opens the bake, clicks the in-flight state, reassigns to a different baker via the same drag-to-assign UX. The state's start time is preserved; no rescheduling happens. The handoff is implicit (we don't model literal handoffs in v1). |
| **Sick day / single-day unavailability** | v1: user adds a one-off "blackout" by dragging a grey "OFF" block onto the baker's lane. Any existing assignments in that block surface a re-assign prompt. Out of scope: persistent illness windows, sick-leave accounting. |
| **Overlapping availability windows** | When `availableWindows[]` has overlapping entries, treat the union as the available time. UI displays merged windows in the roster table. |
| **Parallel-prep states** (kneading next to mixing) | Soft-allowed: two bakers can have overlapping active assignments as long as they're on different bakes. The "parallel work" indicator surfaces; user can ignore. Future (PF-256 S8.2) adds `workspace_capacity` to gate this hard. DRAFT-94's per-state `worker_capacity` extends this further by encoding "this single state needs 2 people simultaneously." |
| **No owner-operator** (user deletes themselves from the roster) | Refused. Roster must have ≥1 baker; if the user tries to delete the last entry, the row is preserved and the action is canceled with a toast. |
| **Baker with `hourlyRate: 0`** | Valid (owner-operator default). Reporting shows `$0` pay and treats `$/active-h` as raw revenue/hour for that baker. |
| **Assignment to deleted baker** | If a baker is removed from the roster while they own assignments, the assignments fall back to the owner-operator (baker index 0). Toast confirms the reassignment count. |
| **Rescheduled bake (timeline drag)** | All BakerAssignments for that bake stay attached — the bakeKey is `recipeId::bakeDate`, but the assignment is keyed on `(bakeKey, stateId)`. Need to handle bakeDate changes by rewriting the assignment's bakeKey when a scheduled bake's date shifts. Open: alternate keying on a stable `scheduleId` instead. (Open Q in §9.) |
| **Cross-day windows** (e.g. 10pm Sat → 2am Sun) | `AvailabilityWindow.end < start` interpreted as "wraps midnight." UI shows the window as a single bar that crosses the midnight tick. |

---

## 8. UX Specs — Open Visual Decisions

The following deferred to a demo / HITL review (would be a spike under
PF-269 if we end up disagreeing on the look):

- Exact rendering of the "fragment block" when one bake has 3 active
  states assigned to 3 different bakers (single block with 3 sub-bars? 3
  separate blocks linked by a hairline?).
- Baker color palette — derive from existing UnoCSS stone/crust tokens,
  or introduce a new tertiary palette?
- Density: do baker lanes scroll when roster > 4 people, or compress
  vertically?

Demo task would be: `public/demo/multi-baker-scheduler.html` showing the
4-state-3-baker scenario with the legend.

---

## 9. Open Questions

1. **Assignment key stability:** is `bakeKey = recipeId::bakeDate` stable
   enough across reschedules? Alternative: introduce a `ScheduledBake.id`
   (uuid) that BakerAssignment references. Cleaner, but adds a layer. Lean
   toward bakeKey for v1 simplicity; revisit if reschedule churn is high.
2. **Owner-operator labor cost:** when `hourlyRate: 0`, is the owner's
   time still subtracted from revenue in the CP stack (PF-256 factor #3)?
   Lean: no — zero means zero. Document explicitly.
3. **Skill-tag vocabulary:** free-form vs canonical list (`shape`, `mix`,
   `score`, `glaze`, `bake-watch`)? Free-form for v1; surface a usage
   audit later if the list explodes.
4. **Availability windows weekly vs date-specific:** v1 ships weekly
   recurring only. Date-specific blackouts handled via the OFF-block UX
   (§7) rather than persistent calendar entries. Out of scope: vacation
   plans, holidays.
5. **Per-state `worker_capacity` from DRAFT-94:** does this design
   pre-bake the field name, or wait for DRAFT-94? Lean: don't pre-bake.
   v1 assumes every active state needs exactly 1 worker. DRAFT-94 lifts
   this; until then, parallel-prep is the only multi-baker-per-state
   handling (different bakers, different bakes).
6. **Multi-profile rosters:** if PF-256's profile system ships first, do
   we scope the roster per-profile, or share across profiles? Lean:
   per-profile, matches the "portfolio demo can have a stub roster"
   pattern.
7. **Reporting period:** fixed week / month, or arbitrary? v1: arbitrary
   date range with quick chips (this week, last week, MTD).

---

## 10. Relationship to DRAFT-94 (and DRAFT-93)

**DRAFT-94 — observed step times + per-state worker assignment** is the
direct extension of this design at a finer granularity:

- **This design (PF-269):** baker is assigned to a *state* — one human
  per state, multiple bakers across the bake's state graph.
- **DRAFT-94:** each *state* can declare `worker_capacity` (1, 2, …) and
  `parallelizable`, allowing **multiple bakers on a single state** (e.g.
  "scaling + cutting up to 2 in parallel"). Plus: observed times replace
  the author-estimated `duration_min` with empirical means.

DRAFT-94 extends, doesn't replace. The PF-269 BakerAssignment shape
remains valid; DRAFT-94 adds an optional `assignments: BakerAssignment[]`
(plural) on the state instead of one-per-state, gated by
`worker_capacity > 1`.

**DRAFT-93 — passive batching** is adjacent. PF-269 surfaces passive
windows in a separate band; DRAFT-93 uses those windows to suggest
batch-buddy recipes. Multi-baker doesn't change the batching math
directly, but it does affect the **active-prep window count** available
to fit a buddy recipe into: with 2 bakers, you have 2 parallel active
streams to drop a buddy bake into.

---

## 11. Out of Scope for v1

- Optimal solver (greedy round-robin only).
- Workspace-capacity constraint (parallel-work hard gate).
- Multi-baker single-state (DRAFT-94 territory).
- Persistent illness / vacation calendar.
- Per-state pay-rate overrides (e.g. "shaping pays $35/hr but scaling
  pays $20").
- Real-time handoff modeling (mid-state baker swaps).
- Time-clock integration (clock in / clock out).
- Hierarchical roles / shifts.

---

## 12. Acceptance for PF-269

- [x] AC1: This design doc exists.
- [x] AC2: §2.1 specifies `Baker` interface with fields + semantics.
- [x] AC3: §2.2 specifies `BakerAssignment` shape and storage pattern.
- [x] AC4: §4 covers drag-to-assign UX + auto-suggest distribution.
- [x] AC5: §4.4 encodes constraint rules.
- [x] AC6: §5 specifies sort + filter modes.
- [x] AC7: §6 specifies reporting view + math.
- [x] AC8: §7 enumerates edge cases; §9 lists open decisions.
- [x] AC9: §10 references DRAFT-94 + relationship documented.
- [ ] AC10: User sign-off pending.
