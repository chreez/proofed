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

### Default (Complete Entry)
```
/bake-log simple-sourdough
/bake-log simple-sourdough 2026-02-14
/bake-log
```

- If no recipe ID provided, read `public/recipes/index.json` and present list for selection.
- If no date provided, default to today's date.
- Creates a complete cook_log entry in one session (for single-day bakes).

### In-Progress Entry Workflows

For multi-day bakes (e.g., sourdough with overnight ferments):

```
/bake-log simple-sourdough --start           # Create skeleton entry at bake start
/bake-log simple-sourdough --start 2026-02-18

/bake-log simple-sourdough --update          # Add notes during the bake
/bake-log simple-sourdough --update 2026-02-18

/bake-log simple-sourdough --finalize        # Complete the entry with summary and photos
/bake-log simple-sourdough --finalize 2026-02-18
```

- **--start**: Creates minimal entry with `status: "in_progress"`, skips full capture loop
- **--update**: Adds more notes to existing in-progress entry, no summary required yet
- **--finalize**: Completes the entry (removes status field), requires summary, processes photos/cost

## Phase 1: Load Context

1. Read the full recipe JSON from `public/recipes/{recipe-id}.json`
2. Check for existing `cook_log` entries — show previous bake count and last `next_time` items
3. **Detect existing in-progress entries:**
   - Search for entries with `"status": "in_progress"` in `cook_log[]`
   - If found, surface them: "Found in-progress entry from {date} — use --update to continue or --finalize to complete"
   - If user is NOT using a flag, prompt them to choose: continue the in-progress entry or start a new bake
4. Check for a backlog draft/task with notes for this bake (search for recipe name + "bake" or "cook")
5. Present session header:

**Default session (no flags):**
```
## Bake Log: {recipe name}
Version: {current version}
Date: {bake date}
Previous bakes: {count} | Last bake: {last date or "first bake"}

{If in-progress entries exist:}
⚠️ In-progress entry exists from {date} — use --update or --finalize to continue it

{If next_time items exist from last bake:}
From last bake's next_time:
- {item 1}
- {item 2}

Ready to capture. Tell me what happened — raw notes, voice memos,
photos, whatever you've got. Say "done" when finished.
```

**--start flag:**
```
## Bake Log: {recipe name} (starting in-progress entry)
Version: {current version}
Date: {bake date}

Creating skeleton entry with status "in_progress".
Optionally provide any initial notes (e.g., "starting autolyse now"), or just confirm to create the entry.
```

**--update flag:**
```
## Bake Log: {recipe name} (updating in-progress entry)
Version: {current version}
Date: {bake date}

Current state:
- Notes: {count existing notes}
- Photos: {count if any}

Add more notes for this bake session. Say "done" when finished.
```

**--finalize flag:**
```
## Bake Log: {recipe name} (finalizing in-progress entry)
Version: {current version}
Date: {bake date}

Current state:
- Notes: {count existing notes}
- Photos: {count if any}

Add any final notes, then we'll create a summary and process photos/cost.
```

## Phase 1a: Start In-Progress Entry (--start flag only)

When `--start` flag is used, create a minimal skeleton entry immediately:

1. **Create minimal cook_log entry:**
```json
{
  "date": "{bake-date}",
  "version": "{current recipe version}",
  "status": "in_progress",
  "notes": [],
  "summary": null
}
```

2. **Optionally accept initial notes** if user provides them:
   - Add to `notes[]` array if provided
   - User may say "just create it" to skip notes for now

3. **Write to recipe JSON:**
   - Append to existing `cook_log[]` array
   - Create `cook_log[]` if it doesn't exist yet

4. **Commit immediately:** `feat: start in-progress bake log {recipe-name} {date}`

5. **Skip to Phase 7** (commit) — do NOT run Phase 2-6 for --start

## Phase 2: Capture Loop

**For --update flag:**
1. **Load the existing in-progress entry** from recipe JSON
2. **Present current state:**
   - Show count of existing notes
   - Show existing photos if any
3. **Enter capture loop** to add MORE notes (append to existing notes array)

**For default or --finalize flag:**
The user provides raw input. They may dump everything at once or go stage by stage.

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

**For --update:** Skip the full interview — just collect what the user has for this session.

### Collect Metadata
Prompt for (if not already provided):
- **Final weight** (if applicable)
- **Bake time/temp** (if deviated from recipe)
- **Key measurements** (internal temp, rise %, etc.)
- **Taste/texture assessment**
- **Overall impression** (one line)

**For --update:** Metadata collection is optional — save it for --finalize.

### Receive Photos
User may paste photo paths. When photos are provided:
1. Note them for Phase 3
2. View photos (convert HEIC if needed via `sips`) to understand the bake visually
3. Do NOT generate alt text yet — that happens in `/review-photos`

**For --update:** Photos are optional — can add them incrementally or wait for --finalize.

## Phase 3: Echo Back

Before writing anything, present the full organized capture:

**For --update flag (incremental notes):**
```
## Echo Check (Update)

**Existing notes:** {count from previous sessions}
**New notes this session:** {count just added}

**All notes (combined):**
1. {existing note 1}
2. {existing note 2}
3. {new note 1}
4. {new note 2}
...

**next_time ({count}):**
- {existing items}
- {new items if added}

**Photos:** {count total} (existing + new if any)
**Status:** in_progress (will remain until --finalize)

Confirm new notes are accurate? Entry will be updated in-place.
```

**For default or --finalize flag (complete entry):**
```
## Echo Check

**Summary:** {1-2 sentence first-person headline of the bake — what was tried, what happened}

**Notes ({count}):**
1. {note 1}
2. {note 2}
...

**next_time ({count}):**
- {item 1}
- {item 2}

**Photos:** {count} received (not yet processed)
**Version:** {current} (bake recorded against this version)

Confirm notes and summary are accurate?
```

Wait for explicit user confirmation. If they correct anything, update and re-echo.

**For --update:** Summary is NOT required until --finalize.
**For --finalize:** Summary is MANDATORY before completing the entry.

## Phase 4: Write cook_log Entry

After user confirms:

**For --update flag (update in-place):**
1. **Find the existing in-progress entry** in `cook_log[]` array by matching date
2. **Update the entry in-place:**
   - Merge new notes into existing `notes[]` array
   - Merge new `next_time` items if added
   - Keep `status: "in_progress"` (DO NOT remove)
   - Summary remains `null` (not required for updates)
3. **Do NOT append a new entry** — update the existing one

**For --finalize flag (remove status, complete the entry):**
1. **Find the existing in-progress entry** in `cook_log[]` array by matching date
2. **Update the entry in-place:**
   - Merge any final notes into `notes[]` array
   - Add the MANDATORY `summary` field (1-2 sentence first-person headline)
   - **Remove the `status` field entirely** (omitted = complete)
   - Update `next_time` if final items added
3. **Continue to Phase 5-6** for photos and cost processing

**For default flag (new complete entry):**
1. Write a new `cook_log` entry to recipe JSON:

```json
{
  "date": "{bake-date}",
  "version": "{current recipe version}",
  "summary": "{1-2 sentence first-person bake headline}",
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

2. **Append to existing `cook_log[]` array** (do not replace)
3. If `cook_log` doesn't exist yet, create it

## Phase 5+6: Photos, Cost & Bake Review Page (COMBINED)

Photo processing and cost lookup happen together. The user reviews BOTH on the bake review page in a single pass — never open the photo review page separately.

**IMPORTANT:** Do NOT invoke `/review-photos` as a separate skill with its own review page. Instead, generate photo summaries inline (spawn a sub-agent to read photos via vision and write summaries to manifest.json), then proceed directly to cost lookup and open the combined bake review page.

### Photo Pipeline (if photos provided)

1. **Copy source photos** to `photos-source/{recipe-id}/{date}/` with descriptive filenames
2. **Run pipeline**: `npm run photos photos-source/{recipe-id}/{date}/`
3. **Generate summaries** — spawn a sub-agent to read each processed photo via multimodal vision and write summaries to `manifest.json` (see Sub-Agent Prompt in `/review-photos` skill for voice rules)
4. Continue to cost lookup below — do NOT open a separate review page

If no photos provided, skip the photo steps but still run cost lookup.

### Cost Data

Populate HEB product data so the bake review page can show the cost picker.

1. **Read recipe ingredients** from the recipe JSON's `stages[].gather.ingredients[]`
2. **For each ingredient**, call `heb_product_search` MCP tool:
   - Query: ingredient name (e.g., "unsalted butter")
   - StoreId: 428 (default H-E-B store)
   - Limit: 5 results per ingredient
3. **Convert package sizes to grams** where possible (oz × 28.35, lbs × 453.59)
4. **Write results** to `public/review-data/{recipe-id}/{date}/heb-results.json`:

```json
{
  "recipeId": "{recipe-id}",
  "date": "{bake-date}",
  "storeId": 428,
  "ingredients": [
    {
      "ingredientId": "{ingredient.id}",
      "name": "{ingredient.name}",
      "recipeAmount": {ingredient.total},
      "recipeUnit": "{ingredient.unit}",
      "products": [
        {
          "name": "{product name}",
          "brand": "{brand}",
          "size": "{size string}",
          "sizeGrams": {converted grams},
          "price": {inStorePrice},
          "salePrice": {salePrice or null},
          "unitPrice": "{unitPrice string}",
          "inStock": {boolean}
        }
      ]
    }
  ]
}
```

5. **Create directory** if needed: `mkdir -p public/review-data/{recipe-id}/{date}/`
6. **ALWAYS open the bake review page** — this is the single review surface for BOTH photos and cost: `open http://192.168.1.213:5173/review/bake/{recipe-id}/{date}`
7. **Tell the user**:

```
HEB product data loaded for {ingredient count} ingredients.
Bake review page opened — tag photos, select cost products, then click "Copy review data" at the bottom of the page.
Paste the combined JSON back here to wire into the cook_log entry.
```

8. When user pastes combined review JSON back, extract the `cost` section and merge it into the cook_log entry. The combined payload format is:
```json
{
  "recipeId": "...",
  "date": "...",
  "photos": [ ... ],
  "cost": {
    "costs": [ ... ],
    "total": 1.34,
    "perServing": 1.34,
    "servings": 1
  }
}
```

**Skip conditions:**
- If user says "skip cost" or "no cost" — skip this phase entirely
- If HEB MCP server is unavailable (tool errors) — warn and skip gracefully

## Phase 7: Commit (No Version Bump)

Cook log entries are **observational data** — they do NOT change the recipe itself. Therefore:

- **No version bump** for adding cook_log entries (notes, photos, cost)
- **No change_log entry** for cook_log additions

**Commit messages by flag:**
- **--start**: `feat: start in-progress bake log {recipe-name} {date}`
- **--update**: `feat: update in-progress bake log {recipe-name} {date}`
- **--finalize**: `feat: finalize bake log {recipe-name} {date}`
- **default (no flag)**: `feat: {recipe-name} bake log {date} (PF-XX)`

Recipe changes *informed by* bake data (e.g., adding StateNotes, updating directions, tightening exit conditions) are a **separate action** with their own version bump and commit. These are typically done via `/feedback` or manual recipe editing after reviewing accumulated cook_log data.

| Action | Version Bump? | Commit |
|--------|--------------|--------|
| Adding cook_log entry (any mode) | No | `feat: [start/update/finalize] in-progress bake log {recipe} {date}` or `feat: {recipe} bake log {date}` |
| Recipe changes from bake learnings | Yes (minor for new states/directions, patch for notes-only) | `feat: {recipe} improvements from bake data` |

1. **Run `npm run build`** to verify
2. **Stage and commit**: recipe JSON + task file (if any) + photo manifest (if any)

**For --start and --update:** Skip Phase 5-6 (photos/cost). Commit immediately after writing the entry.
**For --finalize:** Run full Phase 5-6 flow before committing.

## Phase 8: Update Backlog

If a draft/task existed for this bake session:
- Mark it Done with final summary
- Include note count, next_time count, photo count

## Rules

### General
- **Every COMPLETE entry needs a summary.** Draft a 1-2 sentence first-person headline after notes are captured. Captures what was tried and what happened — like a commit message for the bake. User approves it in the echo check.
- **Scribe, not author.** Record what was said. Never embellish. The Mozzarella Rule is law.
- **Clarify before recording.** If ambiguous, ask. Wrong data is worse than missing data.
- **Echo back is mandatory.** Never write to JSON without user confirmation.
- **No agent tips in cook_log.** This is the user's bake record. Agent tips go in `/feedback`.
- **Photos are optional.** Not every bake has photos.
- **Version bump requires confirmation.** Never auto-bump.
- **next_time items are forward-looking.** Things to try, not things that happened.
- **Previous bake context matters.** Always surface last bake's next_time items.

### In-Progress Entry Rules
- **In-progress entries MUST have `status: "in_progress"`** — this is the only valid status value
- **Finalization removes the status field** — completed entries have no status field (omitted = complete)
- **Summary is optional for --start and --update** — can be null until --finalize
- **Summary is MANDATORY for --finalize** — cannot complete an entry without a summary
- **Update in-place, don't append** — --update and --finalize modify the existing entry, they don't create new ones
- **Default (no flags) creates complete entries** — for single-day bakes that don't need multi-session tracking
- **Detect existing in-progress entries** — always warn if an in-progress entry exists when starting a new default session

## Relationship to Other Skills

| Skill | Purpose | Writes to |
|---|---|---|
| `/bake-log` | Post-bake capture (what happened) | `cook_log[]` entry + HEB results JSON |
| `/feedback` | Recipe review (improve the recipe) | `states[].notes[]` (StateNotes) |
| `/review-photos` | Photo processing + tagging | `manifest.json` + `cook_log[].photos[]` |

`/bake-log` invokes `/review-photos` for photo tagging and opens the bake review page (`/review/bake/`) for cost capture. `/feedback` is always separate.
