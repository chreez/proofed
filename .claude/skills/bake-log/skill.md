---
name: bake-log
description: Post-bake capture session. Records cook log notes, processes photos, writes cook_log entry to recipe JSON. Version bump and commit.
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task, AskUserQuestion
model: opus
argument-hint: <recipe-id> [date] e.g. "simple-sourdough 2026-02-14"
---

# Bake Log Skill

Post-bake capture session. The user just finished a bake and wants to record what happened. Agent is a **scribe, not an author** — record what was said, clarify what's unclear, never embellish.

This is distinct from `/feedback` (recipe-level review with agent tips). `/bake-log` captures a specific bake session into `cook_log[]`.

## Usage

```
/bake-log simple-sourdough
/bake-log simple-sourdough 2026-02-14
/bake-log
```

- If no recipe ID provided, read `public/recipes/index.json` and present list for selection.
- If no date provided, default to today's date.

## Phase 1: Load Context

1. Read the full recipe JSON from `public/recipes/{recipe-id}.json`
2. Check for existing `cook_log` entries — show previous bake count and last `next_time` items
3. Check for a backlog draft/task with notes for this bake (search for recipe name + "bake" or "cook")
4. Present session header:

```
## Bake Log: {recipe name}
Version: {current version}
Date: {bake date}
Previous bakes: {count} | Last bake: {last date or "first bake"}

{If next_time items exist from last bake:}
From last bake's next_time:
- {item 1}
- {item 2}

Ready to capture. Tell me what happened — raw notes, voice memos,
photos, whatever you've got. Say "done" when finished.
```

## Phase 2: Capture Loop

The user provides raw input. They may dump everything at once or go stage by stage. Agent's job:

### Record Notes (Scribe Protocol)
- Record **exactly what the user said** — never embellish, infer details, or add specifics
- If something is ambiguous, **ask to clarify** before recording
- Reference the Cook Log Protocol in CLAUDE.md — the Mozzarella Rule applies
- Organize notes by relevance but preserve the user's voice

### Clarify Gaps
After initial input, actively interview for missing context:
- Check `next_time` items from previous bakes — "Did you try {X} from last session?"
- Reference recipe stages — "How did the {stage} go? Anything notable?"
- Ask about results — "How was the crumb? Flavor? Anything you'd change?"
- Ask about deviations — "Did you change anything from the recipe?"

### Collect Metadata
Prompt for (if not already provided):
- **Final weight** (if applicable)
- **Bake time/temp** (if deviated from recipe)
- **Key measurements** (internal temp, rise %, etc.)
- **Taste/texture assessment**
- **Overall impression** (one line)

### Receive Photos
User may paste photo paths. When photos are provided:
1. Note them for Phase 3
2. View photos (convert HEIC if needed via `sips`) to understand the bake visually
3. Do NOT generate alt text yet — that happens in `/review-photos`

## Phase 3: Echo Back

Before writing anything, present the full organized capture:

```
## Echo Check

**Notes ({count}):**
1. {note 1}
2. {note 2}
...

**next_time ({count}):**
- {item 1}
- {item 2}

**Photos:** {count} received (not yet processed)
**Version:** {current} (bake recorded against this version)

Confirm notes are accurate?
```

Wait for explicit user confirmation. If they correct anything, update and re-echo.

## Phase 4: Write cook_log Entry

After user confirms:

1. Write the `cook_log` entry to recipe JSON:

```json
{
  "date": "{bake-date}",
  "version": "{current recipe version}",
  "notes": [
    "{note 1}",
    "{note 2}"
  ],
  "photos": [],
  "next_time": [
    { "text": "{item 1}" },
    { "text": "{item 2}", "source": "{if from external research}" }
  ]
}
```

2. Append to existing `cook_log[]` array (do not replace)
3. If `cook_log` doesn't exist yet, create it

## Phase 5: Photo Pipeline (if photos provided)

If the user provided photos:

1. **Copy source photos** to `photos-source/{recipe-id}/{date}/` with descriptive filenames
2. **Run pipeline**: `npm run photos photos-source/{recipe-id}/{date}/`
3. **Run `/review-photos`**: `{recipe-id} {date}` — generates AI summaries and opens review page
4. Remind user: "Tag your photos on the review page, then copy feedback JSON back here to wire into cook_log"
5. When user pastes feedback JSON, wire approved photos into the cook_log entry

If no photos provided, skip this phase entirely.

## Phase 6: Version Bump + Commit

1. **Propose version bump** (patch for notes-only, minor if photos or significant changes):

```
Version bump: v1.0.0 -> v1.0.1

Proposed changelog entry:
"Bake log: {one-line summary of bake}"

Confirm version bump?
```

2. **Only write version bump after explicit user confirmation**
3. **Run `npm run build`** to verify
4. **Stage and commit**: recipe JSON + task file (if any) + photo manifest (if any)
5. Commit message: `feat: {recipe-name} bake log {date} (PF-XX)`

## Phase 7: Update Backlog

If a draft/task existed for this bake session:
- Mark it Done with final summary
- Include note count, next_time count, photo count

## Rules

- **Scribe, not author.** Record what was said. Never embellish. The Mozzarella Rule is law.
- **Clarify before recording.** If ambiguous, ask. Wrong data is worse than missing data.
- **Echo back is mandatory.** Never write to JSON without user confirmation.
- **No agent tips in cook_log.** This is the user's bake record. Agent tips go in `/feedback`.
- **Photos are optional.** Not every bake has photos.
- **Version bump requires confirmation.** Never auto-bump.
- **next_time items are forward-looking.** Things to try, not things that happened.
- **Previous bake context matters.** Always surface last bake's next_time items.

## Relationship to Other Skills

| Skill | Purpose | Writes to |
|---|---|---|
| `/bake-log` | Post-bake capture (what happened) | `cook_log[]` entry |
| `/feedback` | Recipe review (improve the recipe) | `states[].notes[]` (StateNotes) |
| `/review-photos` | Photo processing + tagging | `manifest.json` + `cook_log[].photos[]` |

`/bake-log` may invoke `/review-photos` as a sub-step. `/feedback` is always separate.
