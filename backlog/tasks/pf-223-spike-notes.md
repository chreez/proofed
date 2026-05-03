---
id: TASK-TASK-
title: ''
status: Done
assignee: []
created_date: ''
updated_date: '2026-04-23 23:21'
labels: []
dependencies: []
---

# PF-223 Spike Notes — Journey Mode P0

## AC1: Three-Recipe Audit

### Recipe 1: Gochujang & Garlic Savoury Buns

**Stages:** 5 (CONFIT → DOUGH → SHAPE → BAKE → GLAZE)
**States:** 17
**Complexity:** High — confit can be done days ahead, tangzhong + bloom are parallelizable

**Journey Readiness:**
- Stages are well-defined and map cleanly to journey checkpoints
- `parallel: true` exists on `bloom-yeast` and `mix-glaze` — journey needs to handle these as concurrent checkpoints (not sequential)
- `reminders` already exist on `first-rise`, `second-rise`, `bake-buns` — these become natural journey tool attachment points
- Has 3 bake logs with timestamps (`bake_notes` on bake 3) — good test data for split derivation

**Gaps:**
1. **CONFIT stage is optional/pre-bake** — confit can happen days before the actual bake. Journey needs a concept of "pre-work" vs "active bake." Possible solutions: mark CONFIT as `journey_optional: true` or allow journey to start at DOUGH stage with CONFIT as a prerequisite gate.
2. **No split targets defined** — need `duration_min` on every state (some exist, some don't). Most active states have `duration_min` but it's not designed as a target to beat.
3. **Parallel states** — `bloom-yeast` is `parallel: true` alongside `make-tangzhong`. Journey must handle "start these together, gate on slowest" logic. Current `parallel` field is boolean but doesn't say *what* it's parallel with.

### Recipe 2: Sourdough Bread — 70% Hydration

**Stages:** 8 (PREP → MIX → STRETCH_FOLD → BULK_FERMENT → SHAPE → COLD_PROOF → BAKE → COOL)
**States:** 22+
**Complexity:** Highest — overnight bulk, cold proof, sequential 2-loaf bake, extensive bake stats

**Journey Readiness:**
- Most complex recipe, best stress test for the schema
- `bakeStatsSchema` already declares tracked fields (dough_temps, aliquot_rises, stretch_folds, etc.) — these map directly to journey tools
- `reminders` on many states — journey tool attachment points
- 14 bake logs with rich `bake_stats` and `bake_notes` — massive test data

**Gaps:**
1. **Multi-day bake** — overnight bulk ferment means the journey spans 2 days. Timer-based splits don't make sense for 8-12hr passive waits. Journey needs to distinguish active segments (hands-on) from passive segments (waiting) for split calculation.
2. **Stretch & fold repetition** — FOLD_1 → REST_1 → FOLD_2 → REST_2 → FOLD_3 forms a loop. Journey could either track each individually (6 checkpoints) or treat the whole block as one "S&F session" checkpoint. Recommendation: individual, because each fold has its own timing.
3. **Sequential 2-loaf bake** — BAKE stage covers 2 loaves baked one after another in the Dutch oven. Each loaf goes through SCORE → BAKE_COVERED → BAKE_UNCOVERED. Journey needs to handle "repeat this block" or define checkpoints per loaf.
4. **Cold proof duration varies wildly** — 2hr to 48hr. Not a useful split target. Mark as `split_target: null` (uncapped passive wait).

### Recipe 3: ATK Cinnamon Buns Ultimate

**Stages:** 8 (PREP → DOUGH → FIRST_RISE → FILL → ASSEMBLE → SECOND_RISE → BAKE → FINISH)
**States:** 16
**Complexity:** Medium — straightforward linear flow, good baseline

**Journey Readiness:**
- Cleanest linear flow of the three — ideal for v1 journey implementation
- `reminders` on `SHAPE_BALL`, `RISE_1`, `BAKE` — journey tool attachment points
- `parallel: true` on `MIX_FILLING` (can be done during first rise) and `MAKE_GLAZE` (during cooling)
- Has 2 bake logs — minimal but usable

**Gaps:**
1. **Minimal `duration_min` coverage** — some states have it, some don't. Need consistent timing targets for split tracking.
2. **Parallel filling prep** — `MIX_FILLING` is `parallel: true` during `RISE_1`. Same parallel-grouping gap as gochujang buns.
3. **No bake_stats schema** — unlike sourdough, no structured measurement capture. Journey tools would be minimal (temp at bake, maybe dough temp).

---

## AC2: Journey Checkpoint Schema

```typescript
/**
 * Journey checkpoint — lives on RecipeState as an optional attribute.
 * Lightweight: recipes without journey support simply omit the field.
 */
export interface JourneyCheckpoint {
  /** Unique checkpoint ID — matches state ID by default, overridable for sub-checkpoints */
  id: string

  /** Split target in minutes. null = passive wait (no target). 0 = instantaneous. */
  splitTarget: number | null

  /** Checkpoint category for split aggregation */
  category: 'active' | 'passive' | 'parallel'

  /** Smart input tools available at this checkpoint */
  tools?: JourneyToolDeclaration[]

  /** Contextual reminders at checkpoint transitions */
  reminders?: string[]

  /** Whether this checkpoint is optional (e.g., CONFIT done ahead of time) */
  optional?: boolean

  /** Parallel group ID — checkpoints sharing the same group run concurrently */
  parallelGroup?: string
}

/**
 * Tool declaration — which smart inputs appear at a given checkpoint.
 * Recipe declares capabilities, components render accordingly.
 */
export interface JourneyToolDeclaration {
  /** Tool type determines which component renders */
  type: 'aliquot' | 'dough_temp' | 'weight' | 'kitchen_temp' | 'freeform' | 'rating'

  /** Display label for the input */
  label?: string

  /** Tool-specific config */
  config?: Record<string, unknown>
}
```

## AC3: Where Checkpoints Live

**Chosen approach: Attribute on RecipeState (hybrid)**

```typescript
export interface RecipeState {
  id: string
  title: string
  direction: string
  duration_min?: number
  timer?: boolean
  parallel?: boolean
  components: StateComponent[] | null
  exit_condition: string
  notes: StateNote[] | null
  technique_url?: string
  reminders?: StepReminder[]

  /** Journey checkpoint data — present when this state participates in a journey */
  journey?: JourneyCheckpoint
}
```

**Rationale:**
1. **Co-location** — checkpoint data lives with the state it describes. No cross-referencing between two arrays.
2. **Opt-in** — recipes without journey support have no `journey` field. Zero breaking changes.
3. **Grep-friendly** — `journey?.splitTarget` answers "how long should this take?" directly on the state.
4. **Rejected alternative: separate `checkpoints[]` block** — requires maintaining ID references between states and checkpoints, adds indirection, easy to get out of sync.
5. **Rejected alternative: stage-level only** — too coarse. Sourdough STRETCH_FOLD stage has 6 states that each need individual tracking.

## AC4: Tool Declaration Format

Recipes declare which smart inputs appear at each checkpoint via `journey.tools[]`:

```json
{
  "id": "FOLD_1",
  "title": "Stretch & Fold — Set 1",
  "journey": {
    "id": "FOLD_1",
    "splitTarget": 2,
    "category": "active",
    "tools": [
      { "type": "aliquot", "label": "Aliquot rise %" },
      { "type": "dough_temp", "label": "Dough temp" }
    ],
    "reminders": ["Take aliquot sample before folding"]
  }
}
```

**Unused tools don't mount** — if a recipe omits `"type": "aliquot"` from a checkpoint's tools, the aliquot slider component never renders. The component registry maps `type` → Vue component:

```
'aliquot'      → AliquotSlider.vue
'dough_temp'   → DoughTempInput.vue
'weight'       → WeightCalculator.vue
'kitchen_temp' → KitchenTempInput.vue
'freeform'     → FreeformInput.vue
'rating'       → RatingInput.vue
```

## AC5: Scratchpad Integration

### Current Flow
1. `useScratchpad(recipeId)` creates entries keyed by `stepId` with ISO timestamps
2. Entry types: `note`, `reminder_response`, `rating`
3. Stored in `scratchpad-{recipeId}` localStorage
4. Exported as JSON for bake-log pipeline

### Journey Integration
Journey checkpoints write to the **same scratchpad** — no new storage. New entry types extend the existing `ScratchpadEntry`:

```typescript
export interface ScratchpadEntry {
  stepId: string
  timestamp: string           // ISO 8601
  type: 'reminder_response' | 'note' | 'rating'
      | 'checkpoint_complete'  // NEW: journey checkpoint completion
      | 'tool_reading'         // NEW: smart input data capture
  prompt?: string
  value: string
  rating?: 'good' | 'ok' | 'bad'
  toolType?: string           // NEW: which tool generated this entry
}
```

### Split Time Derivation
Split times are derived on every component mount — **no polling, no setInterval**:

```
elapsed = now - lastCheckpointTimestamp
```

Where `lastCheckpointTimestamp` comes from the most recent `checkpoint_complete` entry for the previous checkpoint in the scratchpad.

### Multi-bake Concurrency
Already supported. Each recipe has its own `scratchpad-{recipeId}` key. Journey state would follow the same pattern: `journey-{recipeId}` in localStorage.

### PF-133.4 Integration
The `useBakeSession` composable proposed in PF-133.4 spike maps directly to journey lifecycle:
- `startBake()` → `startJourney()`
- `endBake()` → `endJourney()`
- `isActive` → `journeyActive`
- `BakeResumeBanner` → `JourneyResumeBanner`

DRAFT-59's "bake mode" concept is **superseded** by Journey Mode. DRAFT-59 describes a subset of what Journey Mode delivers. Recommend closing DRAFT-59 as superseded.

## AC6: Speedrun → proofed. Conceptual Translation

| Speedrun Term | proofed. Equivalent | Concrete Example |
|--------------|---------------------|------------------|
| **Game** | Recipe JSON | `simple-sourdough.json` |
| **Category** | Recipe variant | "Quick" vs "Overnight" cinnamon buns |
| **Route** | Journey (checkpoint sequence) | PREP → MIX → FOLD → BULK → SHAPE → BAKE → COOL |
| **Run** | Bake session (one cook_log entry) | 2026-04-22 sourdough bake |
| **Split** | Checkpoint duration | "Mix Dough: 5:23 (target 5:00, +0:23)" |
| **Segment** | Stage duration (sum of its checkpoint splits) | "DOUGH stage: 25:12 total" |
| **PB (Personal Best)** | Fastest total active time for a recipe | "Best sourdough active time: 22 min" |
| **Gold Split** | Fastest individual checkpoint time across all runs | "Best FOLD_1: 1:45 (from bake #7)" |
| **Sum of Best** | Theoretical perfect bake (all golds combined) | "If every split was your best: 19:30" |
| **Ghost** | Historical comparison during active journey | "You're +0:15 behind PB at this checkpoint" |
| **Active Time** | Hands-on time (excludes passive waits) | Sum of all `category: 'active'` splits |
| **Passive Time** | Waiting time (bulk ferment, proofing, baking) | Sum of all `category: 'passive'` splits |
| **Route Deviation** | Skipped or reordered checkpoints | "Skipped CONFIT (done yesterday)" |
| **Reset** | Abandon current journey, start fresh | Clear journey state, keep scratchpad |

### Key Conceptual Differences from Gaming Speedruns

1. **Passive time is expected** — unlike games where all time counts, baking has unavoidable waits (proofing, baking). PB and gold splits only track `active` category checkpoints.
2. **Quality matters** — a faster bake isn't always better. The scoring/points system (P3) accounts for data capture quality, not just speed.
3. **No frame-perfect tricks** — the "optimization" in baking is mise en place efficiency, cleanup timing, and reducing dead time between active steps. Journey mode surfaces this.
4. **Multi-bake sessions** — a baker might have 2 recipes going simultaneously. Each has its own independent journey. Like running two games at once.

## AC7: Existing Work Inventory

| Task | Status | Relationship to Journey Mode |
|------|--------|------------------------------|
| **DRAFT-59** (bake mode) | Draft | **SUPERSEDED** — Journey Mode is the full realization of this concept. DRAFT-59 describes workflow-driven data gathering; Journey Mode does that plus checkpoints, splits, tools, gamification. Close DRAFT-59 with reference to PF-222. |
| **PF-177** (stats block) | Done | **COMPLEMENT** — BakeStatsBlock types (dough_temps, aliquot_rises, etc.) are the structured output. Journey Mode's smart inputs feed into these exact types. No conflict. |
| **PF-133** (scratchpad) | Done | **REUSE** — useScratchpad.ts is the foundation. Journey checkpoints write to the same scratchpad with new entry types. Zero rewrites needed. |
| **PF-133.4** (bake session lifecycle) | Done (spike) | **REUSE** — useBakeSession recommendation maps directly to journey lifecycle. The "Start Bake" → "End Bake" flow becomes "Start Journey" → "End Journey". Implementation hasn't shipped yet — build it as part of P1. |
| **PF-124** (timer cleanup) | Done | **COMPLEMENT** — TimerDisplay.vue handles countdown timers on passive states. Journey Mode handles elapsed time tracking. Different concerns, both useful during a bake. |

## AC8: Checkpoint Granularity Recommendation

**Recommendation: State-level checkpoints (fine) with flexible opt-out**

### Trade-off Analysis

| Approach | Pros | Cons |
|----------|------|------|
| **Stage-level (coarse)** | Simple, few checkpoints per recipe (5-8) | Loses intra-stage timing, can't track fold-by-fold improvement |
| **State-level (fine)** | Full split visibility, matches recipe structure, each action trackable | More checkpoints to complete (16-22 per recipe), potential fatigue |
| **Flexible (mixed)** | Best of both — author controls granularity | Schema complexity, inconsistent comparison across recipes |

**Decision: State-level with opt-out via `journey: null` on trivial states.**

**Reasoning:**
1. **Recipe JSON already defines states at the right granularity** — each state is one physical action. That's exactly what a speedrun split represents.
2. **Opt-out is simple** — states without a `journey` field are skipped in the journey. This lets recipe authors keep trivial states (like "Cool on Rack") out of the journey while tracking every hands-on step.
3. **Roll-up is computed** — stage-level splits are just `sum(state.journey.splitTarget)` for states in that stage. No need to define stage-level checkpoints separately.
4. **Fatigue mitigation** — the journey UI auto-advances on completion. Checking off a checkpoint is a single tap. The smart inputs appear contextually and are optional. Fatigue comes from UI overhead, not checkpoint count — and the UI will be minimal.

### Granularity Examples

**Simple Sourdough (22 states → ~18 journey checkpoints):**
- Trivial states opted out: PREP_WORKSPACE (just setting up)
- Passive states: OVERNIGHT_BULK, REFRIGERATE, COOL_ON_RACK — tracked with `category: 'passive'`, `splitTarget: null`
- Active states: FERMENTOLYSE, ADD_SALT, FOLD_1-3, DIVIDE, PRE_SHAPE, etc. — full split tracking

**ATK Cinnamon Buns (16 states → ~14 journey checkpoints):**
- Cleanest flow — most states are journey-relevant
- PREP_OVEN opted out (just turning on oven)
- MIX_FILLING parallel with RISE_1

**Gochujang Buns (17 states → ~15 journey checkpoints):**
- CONFIT stage optional (can be done ahead)
- bloom-yeast parallel with make-tangzhong

---

## Implementation Strategy: Single Pilot Recipe

**Start with ATK Cinnamon Buns** — cleanest linear flow, fewest edge cases (no multi-day, no optional pre-work, minimal parallelism). Build journey infrastructure against this one recipe, validate on iPhone, then expand to sourdough and gochujang buns.

The three-recipe audit above is reference material for later expansion, not a mandate to wire all three at once. Sourdough's multi-day gaps and gochujang's optional confit are complexity that should be tackled after the core journey loop works on a simple recipe.

**Expansion order (when ready):**
1. ATK Cinnamon Buns — v1 pilot
2. Gochujang Buns — introduces parallel checkpoints, optional stages
3. Simple Sourdough — stress test with multi-day, S&F loops, sequential bake

---

## Summary of Decisions

1. **Checkpoints live as `journey?` attribute on RecipeState** — co-located, opt-in, no breaking changes
2. **State-level granularity** with opt-out — matches recipe structure, supports fine-grained splits
3. **Scratchpad is the storage layer** — new entry types (`checkpoint_complete`, `tool_reading`) extend existing system
4. **Split times derived on mount** — no timers, no polling
5. **DRAFT-59 superseded** — close with reference to PF-222
6. **PF-133.4 useBakeSession → useJourneySession** — same concept, journey-scoped
7. **Parallel checkpoints use `parallelGroup` ID** — states sharing a group run concurrently, gate on slowest
8. **Active vs passive categorization** — PB/golds only count active time
9. **Single pilot recipe** — ATK Cinnamon Buns first, expand after validation
