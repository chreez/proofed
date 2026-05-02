---
name: feedback
description: Interactive recipe review sessions OR data-driven upgrade mode. Review mode: read through a recipe, ask questions, flag changes, accept/dismiss agent tips. Upgrade mode: scan cook_log for patterns, surface graduation candidates, apply approved changes.
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, WebSearch, WebFetch, AskUserQuestion
model: opus
argument-hint: <recipe-id> [--upgrade] e.g. "atk-cinnamon-buns-ultimate" or "simple-sourdough --upgrade"
---

# Recipe Feedback Skill

Two modes:

1. **Interactive Review** (default) — User reads through a recipe, asks questions, flags issues, and makes notes. Agent contributes tips and technique explanations — each one explicitly accepted or dismissed by the user. Session concludes with a version bump and changelog entry.

2. **Upgrade Mode** (`--upgrade`) — Data-driven recipe review. Agent scans accumulated cook_log entries, surfaces patterns and repeated tweaks as graduation candidates, and the user decides what gets promoted to the recipe baseline.

## Usage

```
/feedback atk-cinnamon-buns-ultimate
/feedback coco-curry
/feedback simple-sourdough --upgrade
/feedback --upgrade simple-sourdough
/feedback
```

If no recipe ID is provided, read `public/recipes/index.json` and present the list for selection.

**Mode detection:** If `--upgrade` appears anywhere in the arguments, run Upgrade Mode. Otherwise, run Interactive Review Mode.

## Phase 1: Load Recipe

1. Read the full recipe JSON from `public/recipes/{recipe-id}.json`
2. This JSON is the **primary source of truth** for the entire session
3. Present a brief session header:

```
## Feedback Session: {recipe name}
Version: {current version}
Stages: {stage count} | States: {state count} | Notes: {existing note count}

Ready to review. Walk through the recipe and I'll answer questions,
record your notes, and suggest tips. Say "done" when finished.
```

## Phase 2: Interactive Review Loop

The user drives the session. They may:

### Ask Questions
- **Always check recipe JSON first.** If the answer is in the data, answer from there.
- If recipe JSON is insufficient, use web search or knowledge — but **always label the source**:
  ```
  From recipe JSON: The dough proofs for 30 minutes at room temperature.

  From external (King Arthur Baking): For a more complex flavor, you can
  cold-proof overnight in the fridge instead. [source: kingarthurbaking.com/guides/yeast]
  ```
- Never present external knowledge as if it came from the recipe.

### Provide Notes (User Input)
- Record **exactly what the user said** — scribe principles from Cook Log Protocol apply
- Never embellish, infer details, or add specifics the user didn't state
- If something is ambiguous, ask to clarify before recording
- User notes are written as `StateNote` with `source: 'user'`

### Flag Issues
- User flags something ("this temperature seems wrong", "shouldn't this be before that step?")
- Agent checks recipe JSON, cross-references if needed, proposes a fix
- Present the fix for user approval before making any changes

### Agent Inferences (Tips, Definitions, Technique Explanations)
When the agent identifies something useful to add — a technique explanation, a helpful tip, a definition — present it as a proposal:

```
Tip for {STATE_ID} — {state title}:
"{the proposed note text}"

Accept or dismiss?
```

**Rules for agent tips:**
- Never set `critical: true` — yellow/critical styling is reserved for user callouts only
- Always present one at a time with accept/dismiss choice
- Accepted tips are written as `StateNote` with `source: 'agent'`, `critical: false`
- Dismissed tips are discarded — not persisted anywhere
- Keep tips concise and actionable — not lecture-length

## Phase 3: Writing Changes

When writing accepted notes to recipe JSON:

```json
{
  "text": "The windowpane test: stretch dough between fingers — should form a translucent membrane without tearing.",
  "critical": false,
  "source": "agent"
}
```

- Append to the target state's `notes` array (do not replace existing notes)
- User-authored notes: `"source": "user"`
- Agent-contributed notes: `"source": "agent"`
- Never set `"critical": true` on agent notes

## Phase 4: Session Conclusion

When the user says "done" (or similar):

1. **Summarize the session:**
   ```
   ## Session Summary

   Notes added: 3 (2 agent, 1 user)
   - KNEAD_DOUGH: "The windowpane test..." (agent)
   - RISE_1: "Covered with damp towel this time" (user)
   - SHAPE_BALL: "Bench scraper makes portioning easier..." (agent)

   Notes dismissed: 1
   Issues flagged: 0
   ```

2. **Propose version bump:**
   ```
   Version bump: 2.1.0 → 2.2.0

   Proposed changelog entry:
   "Feedback session: added agent-sourced technique notes to KNEAD_DOUGH, SHAPE_BALL; added user note to RISE_1"

   Confirm version bump? (y/n)
   ```

3. **Only write the version bump and changelog after explicit user confirmation.**

4. **No `CookLogEntry` is created.** Feedback sessions are recipe-level, not bake sessions.

5. **Run `npm run build`** to verify all changes pass.

6. **Stage and commit** recipe JSON + task file changes together.

## Rendering Convention

Agent-sourced notes render with the `// Agent Tip` monospace label (Option A from PF-118.2 demo), using `bg-stone-100 text-stone-600` styling. This is handled by `StateStep.vue` which checks the `source` field.

User-authored notes render as before — `bg-stone-100` for regular, `bg-accent-tint` with accent border for `critical: true`.

**Yellow/critical styling is reserved exclusively for user callouts.** Agent notes never get yellow styling.

## Rules

- **Recipe JSON is primary authority.** Always check it before offering external knowledge.
- **Scribe, not author.** For user input, record what was said — never embellish.
- **One tip at a time.** Don't batch agent suggestions. Present, get accept/dismiss, move on.
- **No cook log entries.** This is recipe feedback, not a bake session.
- **Version bump requires confirmation.** Never auto-bump.
- **Yellow is user-only.** Agent notes are never `critical: true`.

## Dependencies

- PF-118.1: `StateNote.source` field must exist in `src/types/recipe.ts`
- PF-118.2: Rendering design chosen (Option A — monospace label)

---

# Upgrade Mode (`--upgrade`)

Data-driven recipe upgrade pipeline. Scans all cook_log entries for a recipe, identifies patterns and repeated adjustments, and presents graduation candidates for the user to approve or dismiss. Approved changes are applied to the recipe baseline with a version bump.

## Agent-Executable Interface

Upgrade mode is designed to be invocable by other skills/agents with structured input. When called programmatically, the agent can pass:

```
{
  "recipeId": "simple-sourdough",
  "mode": "upgrade",
  "preApproved": []  // optional: list of candidate IDs to auto-approve (for batch workflows)
}
```

When invoked interactively (`/feedback simple-sourdough --upgrade`), all candidates require explicit user approval.

## Upgrade Phase 1: Load and Scan

1. Read the full recipe JSON from `public/recipes/{recipe-id}.json`
2. Extract all `cook_log[]` entries (require at least 2 entries to proceed — a single bake is insufficient for pattern detection)
3. Extract `experiment` config if present (for ExperimentExport data)
4. Present session header:

```
## Upgrade Review: {recipe name}
Version: {current version}
Bakes analyzed: {cook_log count} ({earliest date} → {latest date})

Scanning for graduation candidates...
```

## Upgrade Phase 2: Pattern Detection

Scan all cook_log entries looking for graduation candidates across these categories:

### 2a. Repeated Ingredient Adjustments

Search `notes[]`, `bake_notes[].raw`, `bake_notes[].curated`, and `step_notes` for mentions of ingredient amount changes. Look for:
- Explicit quantity mentions that differ from recipe baseline (e.g., "used 310g water instead of 330g")
- Patterns like "reduced X", "added more Y", "cut Z in half"
- Same adjustment appearing in 2+ bakes = candidate

**Detection heuristics:**
- Parse numbers + unit patterns near ingredient names (e.g., "water.*(\d+)g", "(\d+)g.*flour")
- Compare parsed amounts against recipe `stages[].gather.ingredients[].total`
- Flag when the same ingredient is adjusted in the same direction across multiple bakes

### 2b. Consistent Observations

Search `notes[]` and `bake_notes[].raw` for repeated observations:
- Same complaint/observation in 2+ bakes (e.g., "dough too wet", "crust too pale")
- Same positive observation repeated (e.g., "longer autolyse made a difference")
- Use semantic similarity, not exact string matching — "dough was too slack" and "dough too wet" are the same signal

### 2c. next_time Items That Were Tried

For each bake N, check if any `next_time[]` item from bake N-1 appears as an observation in bake N's `notes[]` or `bake_notes[]`:
- Match by keyword/concept overlap (not exact string)
- If the tried suggestion produced a positive result (no complaints, or explicit "this worked"), it's a strong graduation candidate
- If it produced a negative result ("tried X but didn't help"), note it as a failed experiment — NOT a candidate

### 2d. Experiment Data (when `recipe.experiment` exists)

If the recipe has an `experiment` config AND any cook_log entries have `experimentExport` data (via scratchpad):
- Look for slider adjustments that appear in 2+ bakes
- Look for adjustments that consistently move in the same direction
- Cross-reference with bake outcomes (positive notes = candidate, negative = not)

**Also check:** `bake_notes` and `notes` for freeform mentions of experimental ingredients or amounts that recur across bakes — even without formal ExperimentExport data, users often mention "added X" or "tried Y" in their notes.

### 2e. Technique Refinements

Search for repeated technique observations:
- Timing changes ("let it proof longer", "autolyse for 45 min" appearing multiple times)
- Temperature changes ("baked at 475 instead of 500")
- Method changes ("coil folds work better than stretch folds for this dough")
- These become candidates for updating `states[].direction`, `states[].duration_min`, or adding `StateNote` entries

## Upgrade Phase 3: Present Candidates

Organize candidates into categories and present with evidence:

```
## Graduation Candidates for {recipe name}

Analyzed {N} bakes from {earliest} to {latest}.

### Ingredient Adjustments

1. **Reduce water from 330g to 310g**
   - Evidence: Bakes 2026-04-10, 2026-04-15, 2026-04-24 all noted "dough too wet at 330g"
   - Bake 2026-04-15: "Dropped to 310g, much better handling"
   - Bake 2026-04-24: "310g again, good result"
   - Proposed change: Update `water` ingredient total from 330 to 310

2. **Increase salt from 10g to 12g**
   - Evidence: Bakes 2026-03-20, 2026-04-10 both noted "could use more salt"
   - Bake 2026-04-15 next_time: "Try 12g salt" → Bake 2026-04-24: "12g salt was perfect"
   - Proposed change: Update `salt` ingredient total from 10 to 12

### Technique Changes

3. **Extend autolyse to 45 min (currently 25 min)**
   - Evidence: next_time from 2026-04-10, tried in 2026-04-15 with positive result
   - Bake 2026-04-15: "45 min autolyse — dough was noticeably more extensible"
   - Proposed change: Update AUTOLYSE state duration_min from 25 to 45, update direction text

### New Recipe Notes

4. **Add note to SHAPE state: "Score deeper on high-hydration days — shallow scores seal up"**
   - Evidence: Consistent observation in bakes 2026-04-10, 2026-04-15, 2026-04-24
   - Proposed change: Append StateNote to SHAPE state (source: 'user')

### Failed Experiments (not graduating)

- "Try bread flour only (no AP)" — tried 2026-04-01, result was "too tight, prefer the blend"
- "Overnight cold proof for 16 hrs" — tried 2026-03-15, "over-proofed, lost spring"

---

Select candidates to graduate:
- "all" — approve all candidates above
- "1, 3, 4" — approve specific candidates by number
- "none" — skip all, end session
```

### Candidate Numbering

Each candidate gets a sequential number (1, 2, 3...). The user references candidates by number when approving.

### Evidence Requirements

Every candidate MUST include:
- Which bakes support it (dates)
- Direct quotes from notes/bake_notes showing the pattern
- The specific proposed change to recipe JSON

Candidates without evidence from 2+ bakes are NOT presented (single-occurrence observations are noise, not signal).

## Upgrade Phase 4: Apply Approved Changes

After user selects which candidates to graduate:

### 4a. Apply Each Change

For each approved candidate, apply the appropriate modification:

**Ingredient adjustments:**
- Update `stages[].gather.ingredients[].total` to the new amount
- If the ingredient has `breakdown[]`, adjust the relevant breakdown entry proportionally
- Verify breakdown still sums to new total (D6 check)

**Technique changes:**
- Update `states[].duration_min` if timing changed
- Update `states[].direction` text if procedure changed
- Add/update `states[].exit_condition` if the graduation implies a new condition

**New recipe notes:**
- Append to `states[].notes[]` as `{ "text": "...", "critical": false, "source": "user" }`
- User-observed patterns are `source: 'user'` (the data came from their bakes)
- Agent-synthesized observations (combining multiple notes into one note) are `source: 'agent'`

**Experiment-informed changes:**
- If graduating an experiment slider position, update the ingredient total AND update `experiment.ingredients[].defaultAmount` to match the new baseline

### 4b. Version Bump

A single minor version bump covers the entire upgrade session:

```
Version bump: v3.6.0 → v3.7.0

Changelog entry:
"Upgrade session: graduated {N} changes from {bake_count} bakes — {brief list of changes}"

Confirm? (y/n)
```

- Minor bump (X.Y.0 → X.Y+1.0) for ingredient or technique changes
- Only ONE bump per session regardless of how many candidates were approved
- Write to `version` field and append to `change_log[]`

### 4c. Changelog Entry Format

```json
{
  "version": "v3.7.0",
  "date": "{today ISO date}",
  "summary": "Upgrade session: reduced water to 310g, increased salt to 12g, extended autolyse to 45 min (evidence from 5 bakes)"
}
```

## Upgrade Phase 5: Finalize

1. **Run `npm run build`** to verify all changes pass
2. **Stage and commit** recipe JSON changes:
   - Commit message: `feat: upgrade {recipe-name} from bake data (PF-XXX)` (reference backlog task if applicable)
3. **Present summary:**

```
## Upgrade Complete

Changes applied: {count}
- Reduced water: 330g → 310g
- Increased salt: 10g → 12g
- Extended autolyse: 25 → 45 min
- Added scoring depth note to SHAPE state

Skipped: {count}
- "Try bread flour only" (failed experiment)

Version: v3.6.0 → v3.7.0
```

## Upgrade Mode Rules

- **2+ bakes minimum.** Cannot run upgrade mode on a recipe with fewer than 2 cook_log entries.
- **Evidence-based only.** Every candidate must cite specific bakes and quotes. No speculation.
- **User decides.** Agent surfaces candidates; agent never auto-applies changes.
- **Failed experiments are surfaced but not proposed.** Show them in a separate "not graduating" section so the user knows the agent considered them.
- **Single version bump.** One bump per session, not per candidate.
- **Existing feedback mode unaffected.** Without `--upgrade`, the skill operates exactly as before.
- **Cook Log Protocol applies.** When quoting bake notes, quote exactly — never paraphrase or embellish.
- **No cook_log modifications.** Upgrade mode reads cook_log but never writes to it. Changes go to the recipe baseline (ingredients, states, notes, version).
- **Breakdown integrity.** After modifying an ingredient total, verify `sum(breakdown[].amount) === total`. Fix proportionally if needed.

## Edge Cases

### Recipe has experiment config but no ExperimentExport in cook_log
- Skip Phase 2d formal experiment analysis
- Still look for freeform mentions of experimental ingredients in notes

### All candidates are single-occurrence
- Present message: "No strong patterns detected across {N} bakes. All observations appeared only once. Consider running again after more bakes."
- End session without changes

### User approves "all" but one candidate conflicts with another
- Example: Candidate 1 says "reduce water to 310g" and Candidate 4 says "add note about dough being too dry at 310g"
- Agent must detect conflicts and flag them: "Candidates 1 and 4 appear to conflict. Approve both, or select one?"

### Recipe has no cook_log
- Present error: "No cook_log entries found for {recipe}. Run /bake-log first to capture bake data."
- End session immediately
