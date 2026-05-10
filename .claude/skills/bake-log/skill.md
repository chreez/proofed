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

### Preserve Raw Input as BakeNote[]

If the user dumps a structured or timestamped paste (e.g. notepad copy, dictation transcript, voice memo, scratchpad export), capture each discrete observation as a `BakeNote` in the `bake_notes[]` array. Each note gets:
- `timestamp`: ISO 8601 UTC (e.g. `2026-04-10T21:42:00Z`)
- `raw`: verbatim user text — never edited, never trimmed
- `notable`: `true` if the observation is highlight-worthy (key measurement, deviation, result)
- `stepId`: recipe step ID if the note was captured against a specific step
- `prompt`: scratchpad prompt text if this was a prompted response
- `curated`: cleaned-up version of raw — always populate unless raw is already clean, properly capitalized prose with correct unit formatting. Omit ONLY when raw needs zero edits.
  **Curation rules:**
  - Fix typos and spelling errors
  - Expand shorthand/abbreviations (e.g., "bf" → "bread flour", "ddt" → "DDT", "sf" → "stretch fold")
  - Capitalize sentence starts and proper nouns
  - Format units consistently (°F, g, ml, min)
  - Fix grammar and punctuation without changing voice
  - Never add information the user didn't state
  - Never change the user's voice beyond cleanup — preserve their phrasing, just make it readable
- `processing`: stage context (e.g. `"bulk_ferment"`, `"bake"`, `"shaping"`)

**Legacy field `raw_notes` is deprecated (PF-216).** New entries MUST write `bake_notes[]` instead. Do NOT write `raw_notes` on new entries. Existing entries with `raw_notes` have been backfilled with `bake_notes[]`.

Structured `bake_stats` (Phase 2b) and `bake_notes[]` are **both derived from** the raw input. Both layers coexist in the final entry.

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

When timestamps are available for bake phase starts (e.g., oven-in time and oven-out time), compute `duration_min` from the time difference rather than relying on the user to state it. For example, if covered bake started at 10:00am and uncovered started at 10:20am, `duration_min: 20` for the covered phase.

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

## Phase 2c: Relative Time Inference

When the user's raw input contains relative time references ("20 minutes ago", "started about an hour ago"), resolve them to absolute timestamps before writing `bake_notes[]` or `bake_stats`. This is a clear inference from stated facts, not speculation — it follows Cook Log Protocol because the user explicitly stated the offset.

### Detection Patterns

Case-insensitive regex patterns to match relative time references in raw note text:

| Pattern | Example | Captures |
|---------|---------|----------|
| `(\d+)\s*(minutes?\|mins?)\s*ago` | "placed in oven 20 minutes ago" | amount=20, unit=minutes |
| `(\d+)\s*(hours?\|hrs?)\s*ago` | "started 2 hours ago" | amount=2, unit=hours |
| `about\s+an?\s+hour\s+ago` | "started about an hour ago" | amount=1, unit=hours |
| `half\s+an?\s+hour\s+ago` | "mixed half an hour ago" | amount=30, unit=minutes |
| `(\d+)\s*(minutes?\|mins?)\s*(prior\|earlier\|before)` | "scored 5 min prior" | amount=5, unit=minutes |
| `(\d+)\s*(hours?\|hrs?)\s*(prior\|earlier\|before)` | "started 3 hrs earlier" | amount=3, unit=hours |
| `a\s+few\s+minutes\s+ago` | "checked a few minutes ago" | **AMBIGUOUS** — flag for clarification |
| `a\s+while\s+ago` | "started a while ago" | **AMBIGUOUS** — flag for clarification |

### Resolution Algorithm

1. **Identify the reference time (T):**
   - If the note has a scratchpad `timestamp` (ISO 8601 UTC), use that as T.
   - If the note was typed live in the capture session with no timestamp, use the current session time as T.
   - If neither is available, **ask the user** for the time the note was made.

2. **Parse the offset:**
   - Extract the numeric amount and unit from the matched pattern.
   - Convert to minutes: hours × 60, "half an hour" = 30, "about an hour" = 60.

3. **Compute the absolute timestamp:**
   - `absolute_time = T - offset_minutes`
   - Convert to ISO 8601 UTC (e.g., `2026-04-23T19:30:00Z`).
   - Also compute the `YYYY-MM-DD - HH:MM` format for `bake_stats` fields.

4. **Write the BakeNote:**
   - `timestamp`: the **computed** absolute time (the event time, not the note time)
   - `raw`: verbatim user text — never modified
   - `processing`: include provenance annotation explaining the inference
     - Format: `"Timestamp inferred: '{original text}' relative to {T} → {computed_time}"`
     - Example: `"bulk_ferment | Timestamp inferred: '30 minutes ago' relative to 2026-04-23T20:00:00Z → 2026-04-23T19:30:00Z"`
   - `notable`: set based on content as usual

5. **Write bake_stats entries (if applicable):**
   - If the inferred event corresponds to a trackable stat (dough temp, fold, bake phase start), write it to the appropriate `bake_stats` array.
   - Add a `note` annotation on the stat entry with provenance: `"inferred: '20 min ago' at 17:21 UTC → 17:01 UTC"`
   - Set `bake_stats.confidence` to `'medium'` if the block contains any inferred times (unless already `'low'` for other reasons).

### Confidence Rules

| Input quality | Confidence | Action |
|---------------|------------|--------|
| Exact number stated: "20 minutes ago" | `medium` | Resolve and mark provenance |
| Approximate stated: "about 30 minutes ago" | `medium` | Resolve and mark provenance |
| Vague/ambiguous: "a few minutes ago", "a while ago", "some time ago" | — | **Do not resolve.** Ask the user to clarify. |
| Hedged: "probably around 20 minutes", "I think maybe an hour" | — | **Do not resolve.** Ask the user to confirm the number before computing. |
| Conflicting: note says "30 min ago" but context suggests impossible timing | — | **Flag for user.** Present the computed time and ask if it looks right. |

### Cook Log Protocol Enforcement

- **Only infer from explicitly stated relative times.** The user must have said a number and a unit.
- **Never guess unstated durations.** If the user says "I put it in the oven earlier" with no time offset, ask: "How long ago did you put it in the oven?"
- **"About" and "roughly" are acceptable** — the user is stating their best estimate. Mark as `medium` confidence, not `low`.
- **"Probably" and "maybe" require clarification** — these signal the user is unsure of the number itself, not just rounding. Ask to confirm before resolving.
- **Stale notes:** If the computed absolute time would be more than 24 hours in the past, flag it for user confirmation — it may indicate the reference time T is wrong (e.g., old notes pasted later).

### Echo Check Display (Phase 3)

During the echo check, any inferred timestamps MUST show both the raw reference and the computed absolute time so the user can verify:

```
**bake_notes (5):** (raw → curated where different)
| # | Time | Raw | Curated | Notable | Provenance |
|---|------|-----|---------|---------|------------|
| 3 | 7:01pm | Placed in oven 20 minutes ago | — | no | Inferred: "20 minutes ago" at 7:21pm → 7:01pm |
| 4 | 6:30pm | Started bulk about an hour ago | — | yes | Inferred: "about an hour ago" at 7:30pm → 6:30pm |
```

The Provenance column appears **only** when at least one note has an inferred timestamp. If all timestamps are direct (from scratchpad or explicit user input), omit the column.

For `bake_stats` entries derived from inferred times, show the provenance inline:

```
**bake_stats:**
- bake_phases (1):
  - covered: 500°F, start 2026-04-23 - 19:01 *(inferred: "20 min ago" at 19:21)*
```

### Examples

**Example 1: Simple resolution**
User note at 7:21pm UTC: "Placed in oven 20 minutes ago at 500°F"
- Pattern match: "20 minutes ago" → offset = 20 min
- T = 2026-04-23T19:21:00Z
- Computed: 2026-04-23T19:01:00Z
- BakeNote: `{ "timestamp": "2026-04-23T19:01:00Z", "raw": "Placed in oven 20 minutes ago at 500°F", "processing": "bake | Timestamp inferred: '20 minutes ago' relative to 2026-04-23T19:21:00Z → 2026-04-23T19:01:00Z" }`
- bake_stats.bake_phases: `{ "stage": "covered", "temp_f": 500, "start_time": "2026-04-23 - 19:01", "note": "inferred: '20 min ago' at 19:21 UTC → 19:01 UTC" }`

**Example 2: Ambiguous — requires clarification**
User note: "Started bulk a while ago"
- Pattern match: "a while ago" → **AMBIGUOUS**
- Agent response: "How long ago did you start bulk? I need a rough time to record it."
- User: "Maybe 45 minutes"
- Agent: "So bulk started about 45 minutes ago — does that sound right?"
- User: "Yeah"
- Now resolve: offset = 45 min from confirmation time

**Example 3: Hedged — requires confirmation**
User note at 3:00pm: "I think I put it in maybe 2 hours ago"
- Pattern match: "maybe 2 hours ago" → hedged language detected
- Agent: "You mentioned putting it in about 2 hours ago — so around 1:00pm. Does that sound right?"
- User: "Actually it was closer to 1:30"
- Agent records 1:30pm as stated time (no longer inferred)

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

**bake_notes ({count}):** (raw → curated where different)
| # | Time | Raw | Curated | Notable |
|---|------|-----|---------|---------|
| 1 | {local time} | {raw text} | {curated or "—"} | {yes/no} |
| 2 | ... | ... | ... | ... |

**Photos:** {count} received (not yet processed)
**Version:** {current} (bake recorded against this version)

Confirm notes, summary, bake_notes, and stats are accurate?
```

Wait for explicit user confirmation. If they correct anything, update and re-echo. Stats corrections are **critical** — if the user says "no wait, that was 74 not 76" or "that fold was at 10:30 not 10:15", fix the structured data before writing.

**For --update:** Summary is NOT required until --finalize.
**For --finalize:** Summary is MANDATORY before completing the entry.

### Default-flow shortcut (skip text echo)

In the **default (no-flag) flow**, the explicit text echo is a friction step — the bake review page in Phase 5+6 is itself a richer, visual echo. After the clarify loop closes (no outstanding questions, raw input parsed, deviations confirmed inline), proceed directly to Phase 4 write + Phase 5+6 page open. The user reviews on the page; if anything is wrong, they say so and you patch the cook_log entry in place.

**Still mandatory** — text echo before page open in any of these cases:
- `bake_stats` were captured (stats corrections must be made before the page renders cost/photos)
- The clarify loop produced ambiguous parsing (e.g., relative time inferences, hedged numbers)
- `--finalize` flag (the summary is the user's commit-message-for-the-bake; never auto-write it)

For other defaults, write entry → open page → treat the page as the echo.

## Phase 4: Write cook_log Entry

After user confirms:

**For --update flag (update in-place):**
1. **Find the existing in-progress entry** in `cook_log[]` array by matching date
2. **Update the entry in-place:**
   - Merge new notes into existing `notes[]` array
   - Merge new `next_time` items if added
   - Merge any new `bake_stats` arrays into existing ones (append entries to `dough_temps`, `bulk_ambient_temps`, `stretch_folds`, etc. — don't overwrite)
   - Append new `BakeNote` entries to existing `bake_notes[]` array
   - Keep `status: "in_progress"` (DO NOT remove)
   - Summary remains `null` (not required for updates)
3. **Do NOT append a new entry** — update the existing one

**For --finalize flag (remove status, complete the entry):**
1. **Find the existing in-progress entry** in `cook_log[]` array by matching date
2. **Update the entry in-place:**
   - Merge any final notes into `notes[]` array
   - Merge any final `bake_stats` arrays (append to existing)
   - Append new `BakeNote` entries to existing `bake_notes[]` array
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
  "bake_notes": [
    { "timestamp": "2026-04-06T22:45:00Z", "raw": "DDT 76°F after mix", "notable": true, "stepId": "mix", "processing": "mix" },
    { "timestamp": "2026-04-06T23:15:00Z", "raw": "First coil fold — dough felt tight", "notable": false, "processing": "bulk_ferment" }
  ],
  "bake_stats": {
    "dough_temps": [ { "time": "...", "temp_f": 76 } ],
    "bulk_ambient_temps": [ { "date": "...", "temp_f": 68 } ],
    "bake_phases": [ { "stage": "preheat", "temp_f": 500, "duration_min": 60 } ],
    "stretch_folds": [ { "time": "...", "type": "coil" } ],
    "aliquot_rises": [ { "time": "...", "rise_pct": 75, "stage": "bulk" } ]
  }
}
```

2. **Both `bake_stats` and `bake_notes` are optional.** Omit them if not captured:
   - `bake_stats`: omit entirely if Phase 2b was skipped or yielded nothing. Omit individual field arrays within `bake_stats` if that field was skipped or had no data.
   - `bake_notes`: always write when any notes are captured (replaces deprecated `raw_notes`). Omit only for skeleton `--start` entries with no initial notes.
3. **`excludeFromStats` default (PF-240):** If `recipe.config.excludeFromStatsDefault === true`, pre-fill the new entry's `excludeFromStats: true`. During the echo check (Phase 3), surface this default and offer the user a chance to override per-bake (set `excludeFromStats: false` to opt this entry into stats). If the recipe does NOT set the default, do not add the field unless the user explicitly asks to exclude this bake.
4. **Append to existing `cook_log[]` array** (do not replace)
5. If `cook_log` doesn't exist yet, create it

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

## Phase 5+6: Photos, Cost & Bake Review Page (TWO-PASS)

The bake review page hosts BOTH photo tagging and cost picking. Run it in two passes so the user isn't blocked waiting for photos to be ready:

**Pass 1 — Cost first (open page immediately):**
1. Skip photos entirely on the first pass (even if user says "I'll attach photos") — the goal is to get the page in front of them fast.
2. Run HEB lookup for all ingredients and write `heb-results.json`.
3. Open the review page. The user picks cost products; photo grid is empty.
4. User pastes the cost-only review payload back. Wire the `cost` block into the cook_log entry.

**Pass 2 — Photos (when user drops paths OR auto-scan surfaces candidates):**

When entering Pass 2, do a **cursory Downloads scan first** before asking the user to paste paths. iPhone-to-Mac transfers (AirDrop, iCloud) usually land in `~/Downloads`, and a recent bake's assets typically have an **access time of today** even if their creation time is the day prior (a multi-day cook might capture photos the night before serving).

1. **Auto-scan** `~/Downloads` for image/video files accessed today:
   ```bash
   find ~/Downloads -maxdepth 1 -type f \
     \( -iname "*.heic" -o -iname "*.heif" -o -iname "*.jpg" -o -iname "*.jpeg" \
        -o -iname "*.png" -o -iname "*.mov" -o -iname "*.mp4" \) \
     -newerat "$(date +%Y-%m-%d) 00:00:00" \
     -exec stat -f "%SB | %Sa | %z | %N" -t "%Y-%m-%d %H:%M" {} \; | sort
   ```
   Display creation time (`%SB`), access time (`%Sa`), size, and path so the user can spot which set belongs to this bake.
2. **Surface candidates** to the user as a table. Always require confirmation before copying — never auto-process the scan results. Phrasing: "Found N candidates accessed today. Match? Proceed to copy + process?"
3. **Filter prompts** the user might give:
   - "exclude the screenshots" — drop `.png` files that look like daytime UI captures (typical iPhone screenshot timing/sizes)
   - "only the ones from after Xpm" — narrow by creation time
   - "check again" — re-run the scan (e.g., user just AirDropped more)
4. **If the scan returns nothing** OR the user says "I'll paste paths instead", fall back to manual path collection.
5. After confirmation, copy the chosen files to `photos-source/{recipe-id}/{date}/`, run `npm run photos`, and spawn a vision sub-agent to populate `summary` fields in `manifest.json`.
6. **Re-open the same review page** — the photos now appear in the grid alongside the costs already tagged from Pass 1.
7. User tags photos (hero/step/process/exclude) and pastes the combined review payload back. Wire `photos[]` into the cook_log entry.

If user says "skip photos" or "no photos this bake", skip Pass 2 entirely.

**Why auto-scan + confirm:** the bake-log session usually runs minutes-to-hours after the cook, so the user's photos are likely already on disk. Surfacing them removes a friction step. But Downloads also accumulates unrelated screenshots, receipts, and other agents' output — so the user MUST confirm the candidate set, and they can always ask the agent to re-scan or hand-pick.

**IMPORTANT:** Do NOT invoke `/review-photos` as a separate skill with its own review page. Photo summaries are generated inline; tagging happens on the bake review page.

### Photo Pipeline (Pass 2 only — when photos provided)

1. **Copy source photos** to `photos-source/{recipe-id}/{date}/` with descriptive filenames
2. **Run pipeline**: `npm run photos photos-source/{recipe-id}/{date}/`
3. **Generate summaries** — spawn a sub-agent to read each processed photo via multimodal vision and write summaries to `manifest.json` (see Sub-Agent Prompt in `/review-photos` skill for voice rules)
4. Re-open the bake review page (same URL) — do NOT open a separate review page

If no photos provided in Pass 2, skip these steps. The cost-only entry is already complete.

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

## Phase 6b: Print Validation Gate (automated)

After cost data is wired into the cook_log entry (user pastes review JSON back):

1. **Run `/validate-print {recipe-id}`** -- automated checks against the updated recipe
2. **If all pass:** Note "print validation passed" inline and continue. Do NOT open print preview here -- the bake detail page is the user's HITL gate (Phase 6c).
3. **If any fail:** Report failures inline. Do NOT block.
   - "Print validation has {N} failures -- print page will show 'not yet generated' until fixed."
   - List failures with fix suggestions
4. **Continue to Phase 6c regardless** -- print validation is informational; it does not gate the bake log commit. Print issues are tracked separately.

**Skip conditions:**
- `--start` flag: skip (skeleton entry)
- `--update` flag: skip (incomplete entry)
- No cost data wired: skip (nothing to validate against)

## Phase 6c: Bake Detail Final HITL

This is the user's commit gate. The review page validates inputs (costs, photos); the **bake detail page validates the rendered output** — what the user actually sees on their bake archive.

1. **Run `npm run build`** silently to confirm the recipe JSON is well-formed and tests pass. If the build fails, fix the issue before opening the page.
2. **Open the bake detail page**: `open http://<LAN_IP>:<PORT>/recipe/{recipe-id}/bake/{date}`
3. **Print iPhone URL** for cross-device check.
4. **Summarize what's wired** in chat (notes count, cost total, photo count + hero, weather, any flags like `excludeFromStats`).
5. **Wait for explicit approval** ("approved", "ship it", "looks good"). If the user requests changes, patch the cook_log entry in place and re-open the page.

**Skip conditions:**
- `--start` flag: skip (skeleton entry; no detail page worth showing yet)
- `--update` flag: skip (entry incomplete)

For `--finalize` and default flows, this gate is **mandatory** — never commit without explicit user sign-off on the bake detail page.

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
- **Preserve raw** — verbatim text always captured as `BakeNote.raw` in `bake_notes[]`. Each discrete observation becomes its own entry with timestamp. Both `bake_notes` and `bake_stats` layers coexist.
- **Multi-day bulks → multiple `bulk_ambient_temps` entries** — one per room-temp day, never a single scalar collapsing multiple days.
- **Stats correction in echo check is critical** — the user must see parsed values (not just counts) and confirm before write.

### Stats Gap Detection (MANDATORY)
After parsing all structured stats, scan for **time gaps >1 hour** between known timestamps where a trackable phase is missing. Common gaps:
- **Proof timing** — gap between last fold/turn-out and bake start usually means bench rest + cold retard. Work backwards from bake start to infer.
- **Bench rest** — gap between shaping and fridge entry
- **Cold retard** — gap between fridge entry and bake preheat
- **Proof duration** — if bake start time and shaping time are known, proof duration = bake_start - shape_time (minus preheat overlap if oven was preheating during proof). Add as `proof_phases[].duration_min` when computable.

When a gap is detected:
1. **Flag it** — notify the user: "I see a ~{N} hour gap between {event A} and {event B}. This is likely {bench rest / cold retard / etc}."
2. **Best-effort inference** — propose timing based on available timestamps (e.g., "Shaped at 12:21am, baked at ~4:45pm → ~15.5hr cold retard"). Compute `duration_min` for proof phases when start and end timestamps are available: e.g., shaped at 12:21am, into oven at 10:00am → cold retard ~9.6 hours (577 min). Present the inference.
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

**bake_notes (12):** (raw → curated where different)
| # | Time | Raw | Curated | Notable |
|---|------|-----|---------|---------|
| 1 | Fri 8:00pm | fed starter 1:5:5 50g/250g/250g | Fed starter 1:5:5 — 50g starter, 250g flour, 250g water | no |
| 2 | Fri 10:30pm | starter peaked doubled sweet smell | Starter peaked, doubled, sweet smell | yes |
| 3 | Fri 10:45pm | mixed dough 500 bf 350 water 100 levain 10 salt ddt 76 | Mixed dough: 500g bread flour, 350g water, 100g levain, 10g salt. DDT 76°F | yes |
| ... | ... | ... | ... | ... |

**Photos:** 0
**Version:** 3.2.0

Confirm notes, summary, bake_notes, and stats are accurate?
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
  "bake_notes": [
    { "timestamp": "2026-04-06T01:00:00Z", "raw": "Fed starter 1:5:5, 50g starter + 250g flour + 250g water", "notable": false, "processing": "prep" },
    { "timestamp": "2026-04-06T03:30:00Z", "raw": "Starter peaked, doubled, smelled sweet", "notable": true, "processing": "prep" },
    { "timestamp": "2026-04-06T03:45:00Z", "raw": "Mixed dough: 500g bread flour, 350g water (70% hydration), 100g levain, 10g salt. Fermentolyse. DDT was 76°F.", "notable": true, "processing": "mix" },
    { "timestamp": "2026-04-06T04:15:00Z", "raw": "First coil fold, dough felt tight", "notable": false, "processing": "bulk_ferment" },
    { "timestamp": "2026-04-06T04:45:00Z", "raw": "Second coil fold, smoother", "notable": false, "processing": "bulk_ferment" },
    { "timestamp": "2026-04-06T05:15:00Z", "raw": "Third coil, into fridge at 68°F kitchen temp", "notable": false, "processing": "bulk_ferment" },
    { "timestamp": "2026-04-06T12:30:00Z", "raw": "Out of fridge, kitchen was 70°F. Dough looked puffy. Aliquot jar at 75% rise.", "notable": true, "processing": "bulk_ferment" },
    { "timestamp": "2026-04-06T13:00:00Z", "raw": "Preshape, 15 min bench rest", "notable": false, "processing": "shaping" },
    { "timestamp": "2026-04-06T13:15:00Z", "raw": "Final shape, into banneton, back in fridge", "notable": false, "processing": "shaping" },
    { "timestamp": "2026-04-06T14:00:00Z", "raw": "Preheat Dutch oven, 500°F for 60 min", "notable": false, "processing": "bake" },
    { "timestamp": "2026-04-06T15:00:00Z", "raw": "Score + bake covered 500°F, 20 min", "notable": false, "processing": "bake" },
    { "timestamp": "2026-04-06T15:20:00Z", "raw": "Uncovered, dropped to 450°F, baked 25 more min", "notable": false, "processing": "bake" },
    { "timestamp": "2026-04-06T15:45:00Z", "raw": "Out of oven. Internal temp 208°F. Loaf sounded hollow.", "notable": true, "processing": "bake" },
    { "timestamp": "2026-04-06T15:46:00Z", "raw": "Crumb was open, ear was sharp. Best bake yet.", "notable": true, "processing": "result" }
  ]
}
```

### Counter-Example: Prose-Only Bake

If the user provides only conversational input — "cookies came out great, crispier edges this time, used a little more salt" — the recipe (cookies) has no `bakeStatsSchema`. Phase 2b is skipped entirely. No prompts, no `bake_stats`. The entry writes `notes[]`, `summary`, `next_time[]`, and `bake_notes[]` (each conversational observation becomes a BakeNote with approximate timestamp).

## Relationship to Other Skills

| Skill | Purpose | Writes to |
|---|---|---|
| `/bake-log` | Post-bake capture (what happened) | `cook_log[]` entry + HEB results JSON |
| `/feedback` | Recipe review (improve the recipe) | `states[].notes[]` (StateNotes) |
| `/review-photos` | Photo processing + tagging | `manifest.json` + `cook_log[].photos[]` |

`/bake-log` invokes `/review-photos` for photo tagging and opens the bake review page (`/review/bake/`) for cost capture. `/feedback` is always separate.
