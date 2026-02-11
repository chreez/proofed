---
name: feedback
description: Interactive recipe review sessions. Read through a recipe, ask questions, flag changes, accept/dismiss agent tips. Concludes with version bump and changelog.
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, WebSearch, WebFetch, AskUserQuestion
model: opus
argument-hint: <recipe-id> e.g. "atk-cinnamon-buns-ultimate" or "coco-curry"
---

# Recipe Feedback Skill

Interactive recipe review session. User reads through a recipe, asks questions, flags issues, and makes notes. Agent contributes tips and technique explanations — each one explicitly accepted or dismissed by the user. Session concludes with a version bump and changelog entry.

## Usage

```
/feedback atk-cinnamon-buns-ultimate
/feedback coco-curry
/feedback
```

If no recipe ID is provided, read `public/recipes/index.json` and present the list for selection.

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
