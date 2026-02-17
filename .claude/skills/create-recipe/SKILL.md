---
name: create-recipe
description: Create a new recipe JSON from research synthesis or raw source text. Handles ID generation, JSON assembly, index wiring, source preservation, and nutrition subtask creation.
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, mcp__backlog__task_create, mcp__backlog__task_view, mcp__backlog__task_edit, mcp__backlog__task_search
model: opus
argument-hint: <id-or-subject> e.g. "tartine-baguette" or "Mom's chicken soup"
---

# Create Recipe Skill

Build a new recipe JSON file from either a research synthesis or raw source text. Walks through the full creation pipeline: source identification, ID confirmation, JSON assembly with validation reminders, HITL review, file wiring, and nutrition subtask.

## Usage

```
/create-recipe tartine-baguette
/create-recipe Mom's chicken soup
/create-recipe ny-style-pizza
```

## Entry Paths

There are two ways a recipe enters this skill. Determine which one applies before proceeding.

### Path A: Research Synthesis

The recipe has already been researched via `/research`. A synthesis report exists at:

```
photos-source/{recipe-id}/research/{recipe-id}-research-synthesis.md
```

**How to detect**: Check if `photos-source/{id}/research/` exists. If the argument is a subject (not kebab-case ID), derive a candidate ID and check.

**What to use**: The synthesis report contains confidence-rated ingredients, technique consensus, and a master recipe. Use these directly — the research is the source of truth.

### Path B: Raw Source

The user has an original recipe to enter — pasted text, a URL, photos of a cookbook page, or dictated notes.

**How to detect**: No research directory exists, or user explicitly provides source text.

**What to do**: Collect the full source text before proceeding. Ask the user to paste the complete recipe or point to the source.

## Phase 1: Input & ID Confirmation

### 1a. Identify the recipe

Parse `$ARGUMENTS` to understand what recipe is being created:
- If it looks like a kebab-case ID (e.g., `tartine-baguette`), use it as the candidate ID
- If it's a descriptive subject (e.g., "Mom's chicken soup"), generate a kebab-case candidate

### 1b. Check for conflicts

```
Read: public/recipes/index.json
```

Verify the candidate ID doesn't already exist in the manifest. If it does, alert the user and ask for a variant ID (e.g., `moms-chicken-soup-v2`).

### 1c. Confirm ID with user

Present the proposed ID and wait for explicit confirmation:

```
Proposed recipe ID: moms-chicken-soup
This will create:
  - public/recipes/moms-chicken-soup.json
  - Entry in public/recipes/index.json

Confirm this ID? (or suggest alternative)
```

**Do NOT proceed until the user confirms the ID.**

## Phase 2: Source Preservation

**Path A (research synthesis)**: Source is already preserved in `photos-source/{id}/research/`. No additional action needed. Note the synthesis path for reference during assembly.

**Path B (raw source)**: The original text MUST be preserved before any JSON is created.

### Where to save

Choose based on source type:

| Source Type | Save Location | Format |
|-------------|---------------|--------|
| Pasted text from a known source | Append to `.claude/rules/validation/original-recipes.md` | Markdown section with source attribution |
| Cookbook photos | `photos-source/{id}/source/` | Copy original files + transcribe key details |
| URL/online source | `photos-source/{id}/source/` | Save as markdown with URL and access date |
| Personal/family recipe | Append to `.claude/rules/validation/original-recipes.md` | Markdown section noting it's a personal recipe |

### Format for original-recipes.md

Follow the existing pattern (see ATK Cinnamon Buns entry):

```markdown
## {Recipe Name}

**Original Source:** {source name}
**Found via:** {how user found it}
**Links:**
- {relevant URLs}

### Original Ingredients

{exact original ingredient list as written}

### Original Instructions

{exact original instructions as written}

### Conversion Reference

| Original | Metric | Notes |
|----------|--------|-------|
| {imperial} | {grams/cm} | {conversion notes} |
```

**Do NOT modify the original text.** Preserve it exactly as written for future validation (R1-R8 checks).

## Phase 3: Recipe JSON Assembly

Build the complete recipe JSON following the `Recipe` interface from `src/types/recipe.ts`. Work through each section methodically, with validation checks at each step.

### Read the Recipe type first

```
Read: src/types/recipe.ts
```

Refresh your understanding of every interface. The JSON must conform exactly.

### 3a. meta

```typescript
{
  "meta": {
    "name": "Full Recipe Name",
    "source": {
      "name": "Source Name",          // required, non-empty
      "url": "https://...",           // if available
      "type": "original | adapted | inspired",
      "author": "Author name"        // if known
    },
    "yields": "e.g., 8 buns, 12-16 slices",
    "total_time": "e.g., ~2 hrs (45 min active, 1.25 hrs passive)",
    "description": "1-2 sentence description of what makes this recipe notable"
  }
}
```

**Check S1-S3**: `source` is an object, `name` is non-empty string, `type` is valid enum if present.

### 3b. config

```typescript
{
  "config": {
    "early_check_percent": 0.8   // default; adjust if recipe has critical timing
  }
}
```

### 3c. version & change_log

```typescript
{
  "version": "v1.0.0",
  "change_log": [
    {
      "version": "v1.0.0",
      "date": "YYYY-MM-DD",        // today's date
      "summary": "Initial recipe from {source description}"
    }
  ]
}
```

**Check D14**: Every change_log entry has a non-empty `summary`.

### 3d. vessels

```typescript
{
  "vessels": [
    {
      "id": "V1",
      "name": "Large Mixing Bowl",
      "reuse": "Dough mix → clean → second use"  // document reuse chains
    }
  ]
}
```

**Check D8**: Keep vessels to 5-6 max. Document reuse chains to minimize vessel count.

### 3e. stages & gather sections

Each stage groups related states and has an optional gather section for mise en place.

```typescript
{
  "stages": [
    {
      "id": "PREP",
      "title": "Mise en Place",
      "gather": {
        "vessels": ["Large Mixing Bowl", "..."],
        "equipment": ["Kitchen Scale", "..."],
        "ingredients": [/* see 3f */]
      },
      "states": ["mix-dry", "mix-wet", "combine"]
    },
    {
      "id": "BAKE",
      "title": "Bake",
      "gather": null,   // null when no NEW ingredients are introduced
      "states": ["shape", "proof", "bake"]
    }
  ]
}
```

**Check D7**: Gather sections only on stages that introduce new ingredients. All other stages have `gather: null`.

### 3f. ingredients (inside gather sections)

```typescript
{
  "id": "flour",
  "name": "All-Purpose Flour",
  "total": 390,            // GRAMS ONLY
  "unit": "g",             // always "g"
  "breakdown": [           // null if used in one place
    { "label": "dough", "amount": 350 },
    { "label": "dusting", "amount": 40 }
  ],
  // Research provenance (Path A only):
  "sourcedFrom": "Tier 1: 7/7 agents",
  "confidence": "high",
  "rationale": "Universal across all sources"
}
```

**Check D1**: All weights in grams. No cups, tablespoons, teaspoons in amounts.
**Check D6**: `sum(breakdown[].amount)` MUST equal `total` for every ingredient with breakdown. Verify this mathematically for EACH ingredient before presenting to user.

### Breakdown Sum Verification

For every ingredient with a non-null breakdown, compute and verify:

```
flour: 350 + 40 = 390 === total 390 ✓
butter: 14 + 28 + 14 + 28 + 28 + 28 = 140 === total 140 ✓
```

Present this verification table to the user during HITL review.

### 3g. states

```typescript
{
  "id": "mix-dry",
  "title": "Whisk Dry Ingredients",
  "direction": "Whisk flour, baking powder, and salt together in large bowl.",
  "duration_min": 2,
  "timer": false,           // false for active/hands-on steps
  "parallel": false,
  "components": [
    { "name": "flour", "amount": "390g" },
    { "name": "baking powder", "amount": "10g" }
  ],
  "exit_condition": "Dry ingredients evenly combined, no visible pockets of flour",
  "notes": null,            // or array of StateNote
  "reminders": null         // or array of StepReminder (see 3g-reminders)
}
```

**Check D4**: `timer: true` ONLY on passive/waiting states (rise, proof, bake, cool, rest, chill). Active hands-on steps are `timer: false`.
**Check D5**: Every state MUST have a non-empty `exit_condition`. No exceptions.
**Check D9**: One physical action per state. If a state has "mix X, then fold Y" — split it.
**Check D2**: Temperatures as `"350°F (175°C)"` in directions and exit conditions.
**Check D3**: Dimensions in centimeters: `"Roll to 30x23cm rectangle"`.
**Check D12**: Complex techniques must include `technique_url` OR be self-explanatory in one sentence.

### StateNote format

If adding notes from the source or agent knowledge:

```typescript
{
  "text": "The note content",
  "critical": false,        // true only for safety/critical timing
  "source": "agent"         // "user" for cook log notes, "agent" for recipe-creation notes
}
```

**Check F25**: Every StateNote must have `source: 'user' | 'agent'`.

### 3g-reminders. StepReminder format

Reminders are per-state prompts that appear as bell-icon banners during a bake, prompting the user to record a measurement, observation, or rating. They feed into the scratchpad system.

```typescript
{
  "prompt": "Record dough temperature",
  "type": "measurement"    // "measurement" | "observation" | "rating"
}
```

- `measurement` — numeric data: temps, weights, times (placeholder: "e.g. 748g")
- `observation` — freeform notes: what does it look/feel like (placeholder: "Your observation...")
- `rating` — quick assessment (placeholder: "good / ok / bad")

Add reminders to states where bake data has been inconsistently captured or where tracking improves future bakes. Common uses:
- Dough temperature at key stages (folds, pre-bulk, post-bulk)
- Ambient/kitchen temperature during fermentation
- Internal bread temperature out of the oven
- Visual assessments (oven spring, crust color, crumb)

### 3h. nutrition (placeholder)

Always include a null/placeholder nutrition block. The actual calculation is a separate subtask.

```typescript
{
  "nutrition": null
}
```

**Check D16**: Nutrition is required but will be filled by the subtask. The placeholder `null` triggers the "Not yet calculated" UI (F20).

### 3i. research (Path A only)

If the recipe came from `/research`, include provenance data:

```typescript
{
  "research": {
    "sources": [/* RecipeSource[] from synthesis */],
    "techniques": [/* ResearchTechnique[] */],
    "strategy": "Multi-agent parallel research with N agents",
    "sourceCount": 64,
    "date": "YYYY-MM-DD"
  }
}
```

### 3j. Optional sections

- `summary`: Omit on initial creation (added after first bake)
- `cook_log`: Omit on initial creation (added after first bake)

## Phase 4: HITL Review

**Do NOT write any files until the user approves the recipe JSON.**

### Present for review

1. Show the complete recipe JSON (formatted, readable)
2. Include the breakdown sum verification table
3. Highlight any design check concerns:
   - Flag any state without `exit_condition` (should be none — but verify)
   - Flag any active state with `timer: true`
   - Flag any non-gram units
   - Flag any breakdown sum mismatches
4. State the entry count: N vessels, N stages, N states, N ingredients

### Wait for approval

The user may:
- **Approve** → proceed to Phase 5
- **Request changes** → revise and re-present
- **Ask questions** → answer and re-present if changes result

**Do NOT proceed until explicit approval.**

## Phase 5: Wiring

After user approval, write files and update the manifest.

### 5a. Write recipe JSON

```
Write: public/recipes/{id}.json
```

### 5b. Update index manifest

```
Read: public/recipes/index.json
Edit: add new entry to the recipes array
```

Add in alphabetical order by `id`:

```json
{ "id": "{id}", "name": "{Full Recipe Name}", "file": "{id}.json" }
```

### 5c. Update categoryMap

The `categoryMap` in `src/components/RecipeIndex.vue` needs a new entry. Read the current map to determine the right category.

```
Read: src/components/RecipeIndex.vue (find categoryMap)
```

**Existing categories** (in display order):
1. `baking` — breads, cakes, pastries
2. `pizza & dough` — pizza, focaccia, dough-focused recipes
3. `mains` — entrees, curries, ramen, main courses
4. `drinks` — beverages, boba, smoothies
5. `other` — fallback

Present the category recommendation to the user:

```
Category assignment: "{id}" → "{category}"
Based on: {reasoning}
Existing entries in this category: {list}

Confirm? (or assign different category)
```

**Only suggest a new category if the recipe clearly doesn't fit ANY existing category.** If suggesting a new category, also recommend where it goes in `CATEGORY_ORDER`.

After confirmation, edit `RecipeIndex.vue` to add the entry to `categoryMap`.

## Phase 6: Nutrition Subtask

**Always** create a nutrition calculation subtask. Never calculate nutrition inline — it requires FDC database lookups and careful per-ingredient analysis.

### Find the parent task

Search backlog for the task associated with this recipe creation:

```
task_search: "{recipe name}" or "{recipe id}"
```

### Create subtask

```
task_create:
  title: "Calculate nutrition data for {recipe name}"
  description: "Use USDA FDC database to calculate per-ingredient nutrition for {id}.json. Follow the nutrition calculation pattern established in existing recipes."
  parentTaskId: "{parent-task-id}"   // if found
  status: "To Do"
  labels: ["nutrition"]
  acceptanceCriteria:
    - "nutrition block in {id}.json has non-null totals and perServing"
    - "servings matches parsed yields"
    - "sum(breakdown.calories) = totals.calories ±1"
    - "perServing = totals / servings ±0.1"
    - "All ingredients with >0 calories listed in breakdown"
    - "Each breakdown entry has fdcId for traceability"
```

Report the created subtask ID to the user.

## Phase 7: Gates

### Build Gate

Run the full build to verify the new recipe doesn't break anything:

```bash
npm run build
```

**If the build fails:**
1. Read the error output
2. Fix the issue (usually a JSON syntax error or missing comma in index.json)
3. Re-run `npm run build`
4. Do NOT return to the user with a broken build

### Validation Gate

After the build passes, either:
- Run `/validate` to check all design criteria
- Or remind the user: "Run `/validate` to verify D1-D9, D12, D14 compliance on the new recipe."

At minimum, perform a quick self-check of these critical items:

| Check | How to Verify |
|-------|---------------|
| D1 | Grep the new JSON for cups, tbsp, tsp — should find none |
| D5 | Count states, count exit_conditions — must match |
| D6 | Re-verify all breakdown sums |
| D14 | Confirm change_log has non-empty summary |
| S1-S3 | Confirm source is an object with non-empty name |

## Design Check Quick Reference

Keep these in mind throughout assembly. Refer back to this table if uncertain.

| ID | Rule | Common Mistakes |
|----|------|-----------------|
| D1 | Grams only | Forgetting to convert tablespoons of spices (1 tbsp ≈ varies by spice) |
| D2 | °F (°C) | Missing Celsius in parentheses |
| D3 | Centimeters | Using inches for pan sizes or dough dimensions |
| D4 | timer: true = passive only | Setting timer on "knead for 5 min" (active, not passive) |
| D5 | exit_condition everywhere | States that just say "done" — be specific |
| D6 | Breakdown sums | Off-by-one from rounding during conversion |
| D7 | Gather validity | Adding gather to a stage that uses no new ingredients |
| D8 | Vessels ≤5-6 | Not planning reuse chains |
| D9 | Atomic states | Multi-step directions crammed into one state |
| D12 | Technique refs | "Windowpane test" with no explanation or URL |
| D14 | Version summaries | Empty or missing summary in change_log |
| D16 | Nutrition required | Handled via subtask — include null placeholder |

## Arguments

- `$ARGUMENTS` — Recipe ID (kebab-case) or subject description (required)

## Checklist Summary

Before completing, verify all 13 acceptance criteria:

1. Skill file exists at `.claude/skills/create-recipe/SKILL.md`
2. Two entry paths documented (research synthesis + raw source)
3. Recipe ID confirmed with user before file creation
4. Recipe JSON matches Recipe type with all design checks
5. Index manifest updated
6. Category assigned with user confirmation
7. Source preserved (Path B) or already saved (Path A)
8. Nutrition subtask created (never calculated inline)
9. `npm run build` passes
10. `/validate` run or user reminded
11. Complete JSON presented for user approval before writing
12. Skill is user-invocable via `/create-recipe`
13. `/research` skill updated with cross-reference

## Notes

- For Path A (research synthesis), the research report is the primary source. Trust the confidence ratings.
- For Path B (raw source), conversion accuracy is critical. Double-check gram conversions against the original (R1 checks).
- The agent assembling the JSON should use `source: 'agent'` for any StateNotes it adds. Only cook log notes from the user get `source: 'user'`.
- If the recipe is adapted (not a direct copy), set `meta.source.type` to `"adapted"` and note what was changed.
- Vessel reuse chains are important for the user's workflow — think about what gets dirty when and what can be washed between uses.
