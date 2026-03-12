---
name: review-photos
description: Reads processed photos via multimodal vision, generates descriptive summaries, writes them to manifest.json, and opens the review page.
user-invocable: true
allowed-tools: Read, Bash, Task
model: opus
argument-hint: <recipe-id> <date> e.g. "atk-cinnamon-buns-ultimate 2025-01-15"
---

# Review Photos Skill

Automated photo summary generation workflow. Reads processed photos via multimodal vision, extracts targeted recipe context, generates neutral descriptive summaries, and launches the review UI.

## Usage

```
/review-photos atk-cinnamon-buns-ultimate 2025-01-15
/review-photos tartine-baguette 2025-02-10
```

## Voice Direction

- **Context level:** Targeted — stage names, state descriptions, matching cook_log entry (notes, step_notes, existing photos)
- **Voice:** Neutral descriptive — factual, describes what's visible, references recipe stage when identifiable
- No personal pronouns, no inferred personal details (Mozzarella Rule)
- Example: "Pressing brown sugar–cinnamon filling into buttered dough by hand, spreading to edges."

## Phase 1: Validate

1. Parse arguments: `$ARGUMENTS[0]` = recipeId (required), `$ARGUMENTS[1]` = date (required)
2. If either argument missing, report error and stop
3. Verify `public/images/{recipeId}/{date}/manifest.json` exists via `Read`
4. Verify `public/recipes/{recipeId}.json` exists via `Read`
5. If either file missing, report error with file path and stop

## Phase 2: Load Context

1. Read recipe JSON from `public/recipes/{recipeId}.json`
2. Extract targeted context:
   - `meta.name` — recipe name
   - `stages[]` — for each stage: `id`, `title`
   - `states[]` — for each state: `id`, `description`, `exit_condition`
   - `cook_log[]` — find entry where `date` matches `$ARGUMENTS[1]`, extract:
     - `notes[]` — session-level observations
     - `step_notes[]` — per-step notes (if present)
     - `photos[].alt` — existing photo descriptions (if any)
3. Read manifest.json from `public/images/{recipeId}/{date}/manifest.json`
4. Extract photo list: for each photo, note `src` path

## Phase 3: Generate Summaries

1. Spawn a sub-agent using `Task` tool with `subagent_type: "general-purpose"`
2. Sub-agent prompt should include:
   - The targeted recipe context from Phase 2
   - Voice instructions: "Neutral descriptive voice. Describe what's visible in each photo. Reference recipe stage when identifiable. No personal pronouns. No inferred personal details. 1-2 sentences max."
   - Instructions to read each photo file using the `Read` tool (multimodal vision)
   - Photo file paths: `public/images/{recipeId}/{date}/{photo.src}` for each photo in manifest
   - Instructions to write the updated manifest.json with `summary` fields filled in for each photo
3. Wait for sub-agent to complete
4. Verify manifest.json was updated (read it back and confirm summaries are present)

## Phase 4: Open Review

1. Use `Bash` tool to open the review page: `open http://localhost:5173/review/photos/{recipeId}/{date}`
2. Detect the LAN IP (`ipconfig getifaddr en0`) and print the mobile URL: `http://<LAN_IP>:<PORT>/review/photos/{recipeId}/{date}`
3. Remind user to clear localStorage if they had a previous session:
   ```
   localStorage.removeItem('photo-review:{recipeId}:{date}')
   ```
4. Report completion: number of photos processed, manifest path, review URL

## Sub-Agent Prompt Template

When spawning the photo reading sub-agent in Phase 3, use this structure:

```
You are a photo analysis agent for the proofed. recipe notebook.

RECIPE CONTEXT:
- Recipe: {meta.name}
- Bake date: {date}
- Stages: {list of stage id + title}
- Key states: {list of state id + description}
- Cook log notes: {notes from matching cook_log entry}

TASK:
Read each photo file using the Read tool (multimodal vision) and generate a short descriptive summary.

VOICE RULES:
- Neutral descriptive voice
- Describe what's visible in the photo
- Reference recipe stage when identifiable
- No personal pronouns ("I", "my", "the baker")
- No inferred personal details (brands, quantities, specifics not visible)
- 1-2 sentences max per photo

PHOTOS TO PROCESS:
{list of photo file paths from manifest}

OUTPUT:
Update the manifest.json file at public/images/{recipeId}/{date}/manifest.json
For each photo, write the generated summary into the "summary" field.
```

## Rules

- **No code execution.** This skill orchestrates sub-agents and file I/O only.
- **Fail fast.** If validation fails in Phase 1, stop immediately with clear error message.
- **Vision via Read tool.** The Read tool supports image files — use it to read each photo.
- **Sub-agent pattern.** Use Task tool to spawn the photo reading work as a discrete sub-agent task.
- **Manifest integrity.** Verify the manifest.json was updated before opening the review page.

## Arguments

- `$ARGUMENTS[0]` — Recipe ID (required). Must match a file in `public/recipes/{recipeId}.json`
- `$ARGUMENTS[1]` — Bake date (required). Must match a directory in `public/images/{recipeId}/{date}/` and a cook_log entry date

## Error Handling

- Missing arguments → report usage and stop
- Missing manifest.json → report full path and stop
- Missing recipe JSON → report full path and stop
- No matching cook_log entry → proceed but note no cook log context available
- Sub-agent fails → report error and do not open review page
