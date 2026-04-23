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
2. **Check `config.bakeStatsSchema`** — determine whether this recipe declares structured bake stats. If present, note which fields are declared (e.g. `["dough_temps","bulk_ambient_temps","bake_phases","stretch_folds","aliquot_rises"]`). If absent, the recipe does not track structured stats — skip all structured prompts in Phase 2b entirely. Cookies, pizza, and other recipes without a schema get zero structured prompts.
3. Check for existing `cook_log` entries — show previous bake count and last `next_time` items
4. **Detect existing in-progress entries:**
   - Search for entries with `"status": "in_progress"` in `cook_log[]`
   - If found, surface them: "Found in-progress entry from {date} — use --update to continue or --finalize to complete"
   - If user is NOT using a flag, prompt them to choose: continue the in-progress entry or start a new bake
5. Check for a backlog draft/task with notes for this bake (search for recipe name + "bake" or "cook")
6. Present session header:

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

### Preserve Raw Paste

If the user dumps a structured or timestamped paste (e.g. notepad copy, dictation transcript, voice memo), keep the **verbatim text** exactly as provided. It will be written to `cook_log[entry].raw_notes` alongside the cleaned prose in `notes[]`. Do not reformat, reorder, or strip timestamps from the raw paste — that's the whole point of preserving it.

Structured `bake_stats` (Phase 2b) and prose `notes[]` are **both derived from** the raw paste. All three layers coexist in the final entry.

## Phase 2b: Structured Stats Capture (Optional)

**Gate:** Only run this phase if `recipe.config.bakeStatsSchema?.fields` is present and non-empty. If the recipe has no schema, skip directly to Phase 3 — do not prompt for any structured stats.

**Philosophy:** Non-tedious. One optional ask per declared field group. Each ask is **skippable** — if the user has nothing to record for that group, silently move on. Do not pester. If the user already dumped a structured paste that contains the data, parse it inline and show the user what you captured (Phase 3 echo) instead of re-asking.

**Cook Log Protocol enforcement:**
- Never infer temps, timestamps, or durations the user didn't state
- If a paste contains `"9:42pm — fermentolyse done, 76°F"`, parse `9:42pm` → `YYYY-MM-DD - 21:42` and `76°F` → `temp_f: 76`
- If a paste contains `"around 75°F-ish"` or `"maybe 30 min"`, **ASK** to clarify the exact value before writing a number, or skip the entry entirely. Never guess.
- If the user says "I didn't take any readings" or similar, record nothing — do not fabricate.

### Time Format

All times in `bake_stats` use the format `YYYY-MM-DD - HH:MM` (24-hour, dash-separated). Example: `2026-04-08 - 21:42`. Derive the date from the bake session context (start date or bake date) unless the user specifies otherwise.

### Field Group Prompts

For **each** field declared in `config.bakeStatsSchema.fields`, present **one** optional prompt. Prompts are context-aware — reference real bake stages, not generic JSON field names.

#### 1. `dough_temps` — "Any dough temp readings?"

Prompt:
> "Did you take any dough temp readings during the bake? (e.g. after mix, during bulk, at preshape)"

Parse user response into `DoughTemp[]`:
```json
{ "time": "YYYY-MM-DD - HH:MM", "temp_f": 76 }
```

Skip if user says no or has nothing.

#### 2. `bulk_ambient_temps` — "Room temp during bulk?"

Prompt:
> "What was the room temperature during bulk fermentation? If bulk spanned multiple days, one reading per day is fine."

Parse into `BulkAmbientTemp[]` — **one entry per room-temp day** (AC #4):
```json
{ "date": "YYYY-MM-DD", "temp_f": 68, "note": "morning" }
```

If bulk is a single day, a single entry is fine. If the user mentions bulk started Friday evening and finished Saturday morning, capture **two** entries — one for Friday, one for Saturday — each at whatever temp the user reported. Never collapse multi-day bulks into a single scalar.

#### 3. `bake_phases` — "Bake phase times and temps?"

Prompt:
> "How did the bake phases go? (preheat, covered, uncovered — temp and duration for each)"

Parse into `BakePhase[]`:
```json
{ "stage": "preheat", "temp_f": 500, "duration_min": 60 }
{ "stage": "covered", "temp_f": 500, "duration_min": 20, "start_time": "2026-04-08 - 08:15" }
{ "stage": "uncovered", "temp_f": 450, "duration_min": 25 }
```

`start_time` is optional — only include if the user states it. `temp_f` and `duration_min` are required per phase.

#### 4. `stretch_folds` — "Stretch and fold times?"

Prompt:
> "When did you do your stretch and folds (or coils)? Times and type if you remember."

Parse into `StretchFold[]`:
```json
{ "time": "YYYY-MM-DD - 10:15", "type": "stretch_fold" }
{ "time": "YYYY-MM-DD - 10:45", "type": "coil", "note": "dough felt tight" }
```

Skip if user did no folds or can't recall times.

#### 5. `aliquot_rises` — "Aliquot rise checks?"

Prompt:
> "Did you track aliquot rise percentages during bulk or proof?"

Parse into `AliquotRise[]`:
```json
{ "time": "YYYY-MM-DD - 14:00", "rise_pct": 50, "stage": "bulk" }
{ "time": "YYYY-MM-DD - 17:30", "rise_pct": 75, "stage": "bulk", "note": "domed top" }
```

### Auto-Parse From Paste (Preferred Path)

If the user's raw paste already contains timestamped readings, **parse inline** and skip the per-field prompts. Present what you extracted in the Phase 3 echo for confirmation. Only fall back to explicit prompts if the paste is prose-only or structured data is missing.

### Skip Entirely

If the user says "just notes" or "no stats today" or similar, skip Phase 2b entirely. Do not prompt for any field groups. `bake_stats` will be omitted from the entry.

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

**bake_stats** (only shown if captured):
- dough_temps: {count} readings
- bulk_ambient_temps: {count} days
- bake_phases: {count} phases
- stretch_folds: {count} folds
- aliquot_rises: {count} checks
{Show the parsed values inline so the user can spot incorrect inferences — do not just show counts.}

**raw_notes:** {yes/no — preserving verbatim paste of N chars}
**Photos:** {count} received (not yet processed)
**Version:** {current} (bake recorded against this version)

Confirm notes, summary, and stats are accurate?
```

Wait for explicit user confirmation. If they correct anything, update and re-echo. Stats corrections are **critical** — if the user says "no wait, that was 74 not 76" or "that fold was at 10:30 not 10:15", fix the structured data before writing.

**For --update:** Summary is NOT required until --finalize.
**For --finalize:** Summary is MANDATORY before completing the entry.

## Phase 4: Write cook_log Entry

After user confirms:

**For --update flag (update in-place):**
1. **Find the existing in-progress entry** in `cook_log[]` array by matching date
2. **Update the entry in-place:**
   - Merge new notes into existing `notes[]` array
   - Merge new `next_time` items if added
   - Merge any new `bake_stats` arrays into existing ones (append entries to `dough_temps`, `bulk_ambient_temps`, `stretch_folds`, etc. — don't overwrite)
   - Append new raw paste to `raw_notes` with a separator (`\n\n---\n\n`) if preserving multi-session paste
   - Keep `status: "in_progress"` (DO NOT remove)
   - Summary remains `null` (not required for updates)
3. **Do NOT append a new entry** — update the existing one

**For --finalize flag (remove status, complete the entry):**
1. **Find the existing in-progress entry** in `cook_log[]` array by matching date
2. **Update the entry in-place:**
   - Merge any final notes into `notes[]` array
   - Merge any final `bake_stats` arrays (append to existing)
   - Append final raw paste to `raw_notes` if provided
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
  ],
  "bake_stats": {
    "dough_temps": [ { "time": "...", "temp_f": 76 } ],
    "bulk_ambient_temps": [ { "date": "...", "temp_f": 68 } ],
    "bake_phases": [ { "stage": "preheat", "temp_f": 500, "duration_min": 60 } ],
    "stretch_folds": [ { "time": "...", "type": "coil" } ],
    "aliquot_rises": [ { "time": "...", "rise_pct": 75, "stage": "bulk" } ]
  },
  "raw_notes": "{verbatim paste of user's notes, timestamps preserved}"
}
```

2. **Both `bake_stats` and `raw_notes` are optional.** Omit them if not captured:
   - `bake_stats`: omit entirely if Phase 2b was skipped or yielded nothing. Omit individual field arrays within `bake_stats` if that field was skipped or had no data.
   - `raw_notes`: omit if the user's input was conversational only (no structured paste to preserve).
3. **Append to existing `cook_log[]` array** (do not replace)
4. If `cook_log` doesn't exist yet, create it

## Phase 4a: Weather Fetch (PF-193.1)

After writing the cook_log entry (Phase 4), silently fetch outdoor weather for the bake date:

1. **Run** `./scripts/fetch-weather.sh {bake-date}` — returns JSON matching `BakeWeather` type
2. **Parse the output** — verify it has `temp_high_f`, `temp_low_f`, `humidity_avg_percent`, `condition`
3. **Add `weather` field** to the cook_log entry just written (edit recipe JSON in-place)
4. **If the script fails** (network error, API down), skip silently — do not block the pipeline. Log a warning: "Weather fetch failed — weather field omitted."
5. **Do not prompt the user** — this is a silent background fetch

**Skip conditions:**
- `--start` flag: skip (skeleton entry, no weather yet)
- `--update` flag: skip (weather only added on finalize/default)
- `--finalize` or default: always attempt

### Scratchpad Pre-Bake Kitchen Temp (PF-193.1)

If the user's scratchpad export contains a `_pre_bake` entry (stepId `_pre_bake`, prompt `Kitchen temp (°F)?`), extract the value and wire it into `bake_stats.bulk_ambient_temps[0]`:

```json
{ "date": "{bake-date}", "temp_f": {value}, "note": "pre-bake" }
```

Insert as the **first** element of `bulk_ambient_temps` (before any mid-bulk readings). If the user didn't capture a pre-bake temp, do nothing — don't prompt for it here (the scratchpad UI handles the prompt at bake time).

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
   - Limit: 20 results per ingredient (show exhaustive results — user filters on review page)
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
6. **ALWAYS open the bake review page** — detect the LAN IP (`ipconfig getifaddr en0`) and open: `open http://<LAN_IP>:<PORT>/review/bake/{recipe-id}/{date}`
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

## Phase 6b: Print Validation Gate

After cost data is wired into the cook_log entry (user pastes review JSON back):

1. **Run `/validate-print {recipe-id}`** -- automated checks against the updated recipe
2. **If all pass:** Open print preview for HITL review:
   - `open http://<LAN_IP>:<PORT>/recipe/{recipe-id}/print`
   - "Print validation passed. Review the print page -- does it look correct?"
   - Wait for user confirmation
3. **If any fail:** Report failures. Do NOT open print preview.
   - "Print validation has {N} failures -- print page will show 'not yet generated' until fixed."
   - List failures with fix suggestions
4. **Continue to Phase 7 regardless** -- print validation doesn't block the bake log commit. Print issues are tracked separately.

**Skip conditions:**
- `--start` flag: skip (skeleton entry)
- `--update` flag: skip (incomplete entry)
- No cost data wired: skip (nothing to validate against)

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
2. **Stage and commit**: recipe JSON + task file (if any) + photo manifest (if any) + photo images + review data

**One commit per complete bake log.** A default (no flags) session should produce a single commit that includes the entry text, photos, cost data, and review artifacts all together. Do NOT split the entry write and the photo/cost wiring into separate commits — wait until all data is wired in before committing.

**Exception:** `--start` creates a skeleton commit immediately (the whole point is to get a deployable page fast, e.g., for QR code printing). Subsequent `--update` or `--finalize` sessions are their own commits.

**For --start and --update:** Skip Phase 5-6 (photos/cost). Commit immediately after writing the entry.
**For --finalize:** Run full Phase 5-6 flow before committing. Single commit with everything.

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

### Structured Stats Rules
- **Schema gates prompts** — only prompt for field groups declared in `config.bakeStatsSchema.fields`. No schema → no structured prompts, ever.
- **Scribe Protocol applies to stats** — never infer temps, timestamps, or durations the user didn't state. Ask to clarify if ambiguous.
- **Parse inline from paste** — if the raw paste already contains structured data (timestamped temps, fold times, rise %), parse it directly; don't re-prompt the user.
- **Skip silently** — if a field group has nothing to record, move on. Do not pester.
- **Preserve raw** — verbatim paste always goes to `raw_notes` when provided, even if structured data is also extracted. Both layers coexist.
- **Multi-day bulks → multiple `bulk_ambient_temps` entries** — one per room-temp day, never a single scalar collapsing multiple days.
- **Stats correction in echo check is critical** — the user must see parsed values (not just counts) and confirm before write.

### Stats Gap Detection (MANDATORY)
After parsing all structured stats, scan for **time gaps >1 hour** between known timestamps where a trackable phase is missing. Common gaps:
- **Proof timing** — gap between last fold/turn-out and bake start usually means bench rest + cold retard. Work backwards from bake start to infer.
- **Bench rest** — gap between shaping and fridge entry
- **Cold retard** — gap between fridge entry and bake preheat

When a gap is detected:
1. **Flag it** — notify the user: "I see a ~{N} hour gap between {event A} and {event B}. This is likely {bench rest / cold retard / etc}."
2. **Best-effort inference** — propose timing based on available timestamps (e.g., "Shaped at 12:21am, baked at ~4:45pm → ~15.5hr cold retard"). Present the inference.
3. **Quiz the user** — ask to confirm or correct: "Does that sound right? Did you pull from fridge to warm up, or go straight to oven?"
4. **Record confirmed data** — add the missing phase(s) to `bake_stats` only after user confirms.
5. **Never silently skip** — untracked phases that would appear as bake stat tags on the recipe page must be surfaced. Missing data is acceptable if the user confirms they don't have it; unasked gaps are not.

## Example Session: Structured Capture End-to-End

Realistic simple-sourdough flow. The user pastes dictated notes, the agent parses both prose and structured stats.

### Input (user paste)

```
Simple sourdough bake — 2026-04-06

Friday 4/5:
- 8:00pm — fed starter 1:5:5, 50g starter + 250g flour + 250g water
- 10:30pm — starter peaked, doubled, smelled sweet
- 10:45pm — mixed dough: 500g bread flour, 350g water (70% hydration),
  100g levain, 10g salt. Fermentolyse. DDT was 76°F.
- 11:15pm — first coil fold, dough felt tight
- 11:45pm — second coil fold, smoother
- 12:15am (4/6) — third coil, into fridge at 68°F kitchen temp
- Slept

Saturday 4/6:
- 7:30am — out of fridge, kitchen was 70°F. Dough looked puffy.
  Aliquot jar at 75% rise.
- 8:00am — preshape, 15 min bench rest
- 8:15am — final shape, into banneton, back in fridge
- 9:00am — preheat Dutch oven, 500°F for 60 min
- 10:00am — score + bake covered 500°F, 20 min
- 10:20am — uncovered, dropped to 450°F, baked 25 more min
- 10:45am — out of oven. Internal temp 208°F. Loaf sounded hollow.
- Crumb was open, ear was sharp. Best bake yet.

Next time: try a longer autolyse, maybe 1 hour before adding levain.
```

### Agent Processing

1. **Read schema** — `simple-sourdough.json` → `config.bakeStatsSchema.fields = ["dough_temps","bulk_ambient_temps","bake_phases","stretch_folds","aliquot_rises"]`. All 5 groups declared.
2. **Parse raw paste inline** — auto-extract structured data from the timestamped lines instead of re-prompting.
3. **Clarify gaps** — user mentioned "DDT was 76°F" after mix. User did not state dough temp at any other time. Agent records only the one reading.
4. **Echo back** — present parsed stats alongside notes and summary for confirmation.

### Agent Echo Check

```
## Echo Check

**Summary:** Fermentolyse + three coil folds overnight, cold retard, baked
Saturday morning. Best crumb and ear yet.

**Notes (7):**
1. Fed starter 1:5:5 Friday 8pm; peaked by 10:30pm, sweet smell
2. Mixed dough 10:45pm — 500g bread flour, 350g water (70% hydration), 100g
   levain, 10g salt. Fermentolyse. DDT 76°F.
3. Three coil folds at 11:15pm, 11:45pm, 12:15am. Dough tightened then smoothed.
4. Cold retard overnight in 68°F kitchen.
5. Saturday 7:30am — out of fridge, kitchen 70°F, aliquot at 75% rise.
6. Preshape 8am, 15 min bench rest, final shape into banneton, back in fridge.
7. Bake: preheat Dutch oven 500°F/60min, covered 500°F/20min, uncovered
   450°F/25min. Internal 208°F, hollow sound.

**next_time (1):**
- Try a longer autolyse, maybe 1 hour before adding levain

**bake_stats:**
- dough_temps (1):
  - 2026-04-05 - 22:45 → 76°F
- bulk_ambient_temps (2):
  - 2026-04-05 → 68°F (Friday night kitchen, into fridge)
  - 2026-04-06 → 70°F (Saturday morning kitchen)
- bake_phases (3):
  - preheat: 500°F, 60 min
  - covered: 500°F, 20 min, start 2026-04-06 - 10:00
  - uncovered: 450°F, 25 min
- stretch_folds (3):
  - 2026-04-05 - 23:15 → coil (tight)
  - 2026-04-05 - 23:45 → coil (smoother)
  - 2026-04-06 - 00:15 → coil
- aliquot_rises (1):
  - 2026-04-06 - 07:30 → 75%, bulk

**raw_notes:** yes — preserving verbatim paste (821 chars)
**Photos:** 0
**Version:** 3.2.0

Confirm notes, summary, and stats are accurate?
```

### Final JSON Write (cook_log[])

```json
{
  "date": "2026-04-06",
  "start_date": "2026-04-05",
  "version": "3.2.0",
  "summary": "Fermentolyse + three coil folds overnight, cold retard, baked Saturday morning. Best crumb and ear yet.",
  "notes": [
    "Fed starter 1:5:5 Friday 8pm; peaked by 10:30pm, sweet smell",
    "Mixed dough 10:45pm — 500g bread flour, 350g water (70% hydration), 100g levain, 10g salt. Fermentolyse. DDT 76°F.",
    "Three coil folds at 11:15pm, 11:45pm, 12:15am. Dough tightened then smoothed.",
    "Cold retard overnight in 68°F kitchen.",
    "Saturday 7:30am — out of fridge, kitchen 70°F, aliquot at 75% rise.",
    "Preshape 8am, 15 min bench rest, final shape into banneton, back in fridge.",
    "Bake: preheat Dutch oven 500°F/60min, covered 500°F/20min, uncovered 450°F/25min. Internal 208°F, hollow sound."
  ],
  "next_time": [
    { "text": "Try a longer autolyse, maybe 1 hour before adding levain" }
  ],
  "bake_stats": {
    "dough_temps": [
      { "time": "2026-04-05 - 22:45", "temp_f": 76 }
    ],
    "bulk_ambient_temps": [
      { "date": "2026-04-05", "temp_f": 68, "note": "Friday night kitchen, into fridge" },
      { "date": "2026-04-06", "temp_f": 70, "note": "Saturday morning kitchen" }
    ],
    "bake_phases": [
      { "stage": "preheat", "temp_f": 500, "duration_min": 60 },
      { "stage": "covered", "temp_f": 500, "duration_min": 20, "start_time": "2026-04-06 - 10:00" },
      { "stage": "uncovered", "temp_f": 450, "duration_min": 25 }
    ],
    "stretch_folds": [
      { "time": "2026-04-05 - 23:15", "type": "coil", "note": "tight" },
      { "time": "2026-04-05 - 23:45", "type": "coil", "note": "smoother" },
      { "time": "2026-04-06 - 00:15", "type": "coil" }
    ],
    "aliquot_rises": [
      { "time": "2026-04-06 - 07:30", "rise_pct": 75, "stage": "bulk" }
    ]
  },
  "raw_notes": "Simple sourdough bake — 2026-04-06\n\nFriday 4/5:\n- 8:00pm — fed starter 1:5:5, 50g starter + 250g flour + 250g water\n- 10:30pm — starter peaked, doubled, smelled sweet\n- 10:45pm — mixed dough: 500g bread flour, 350g water (70% hydration), 100g levain, 10g salt. Fermentolyse. DDT was 76°F.\n- 11:15pm — first coil fold, dough felt tight\n- 11:45pm — second coil fold, smoother\n- 12:15am (4/6) — third coil, into fridge at 68°F kitchen temp\n- Slept\n\nSaturday 4/6:\n- 7:30am — out of fridge, kitchen was 70°F. Dough looked puffy. Aliquot jar at 75% rise.\n- 8:00am — preshape, 15 min bench rest\n- 8:15am — final shape, into banneton, back in fridge\n- 9:00am — preheat Dutch oven, 500°F for 60 min\n- 10:00am — score + bake covered 500°F, 20 min\n- 10:20am — uncovered, dropped to 450°F, baked 25 more min\n- 10:45am — out of oven. Internal temp 208°F. Loaf sounded hollow.\n- Crumb was open, ear was sharp. Best bake yet.\n\nNext time: try a longer autolyse, maybe 1 hour before adding levain."
}
```

### Counter-Example: Prose-Only Bake

If the user provides only conversational input — "cookies came out great, crispier edges this time, used a little more salt" — the recipe (cookies) has no `bakeStatsSchema`. Phase 2b is skipped entirely. No prompts, no `bake_stats`, no `raw_notes` (no structured paste to preserve). The entry writes just `notes[]`, `summary`, and `next_time[]` as before.

## Relationship to Other Skills

| Skill | Purpose | Writes to |
|---|---|---|
| `/bake-log` | Post-bake capture (what happened) | `cook_log[]` entry + HEB results JSON |
| `/feedback` | Recipe review (improve the recipe) | `states[].notes[]` (StateNotes) |
| `/review-photos` | Photo processing + tagging | `manifest.json` + `cook_log[].photos[]` |

`/bake-log` invokes `/review-photos` for photo tagging and opens the bake review page (`/review/bake/`) for cost capture. `/feedback` is always separate.
