---
name: validate-print
description: Validate recipe data quality for print page generation. Checks ingredients, allergens, nutrition, cost schema, serving coherence, and provenance.
user-invocable: true
allowed-tools: Read, Grep, Glob, Task
model: sonnet
argument-hint: [recipe-id] or blank for all recipes
---

# Print Validation Skill

Validates that a recipe has all required data for the print page to render correctly. Catches data quality issues (stale terminology, old schemas, missing provenance) that are invisible in the normal recipe page but produce broken print output.

## Usage

```
/validate-print simple-sourdough       # Validate one recipe
/validate-print                        # Validate all recipes
```

## Validation Criteria (10 Checks)

| ID | Check | Logic |
|----|-------|-------|
| PV1 | Ingredients exist | >=1 stage with >=1 ingredient in gather |
| PV2 | Allergens derivable | `deriveAllergens(recipe)` doesn't throw |
| PV3 | Nutrition complete | `nutrition.totals.calories > 0` AND `nutrition.perServing` populated |
| PV4 | Cost data present (new schema) | >=1 cook_log entry with `cost.items[]` array (not old `costs[]`) |
| PV5 | Serving label coherence | If `cost.servings !== nutrition.servings`, recipe must have `meta.yields` (so UI can say "per unit" instead of "per serving") |
| PV6 | No stale terminology | No cost item `sourceName` contains "negligible" |
| PV7 | Cost items sourced | Every `cost.items[]` entry has non-empty `sourceName` |
| PV8 | Recipe has yields | `meta.yields` is non-empty string |
| PV9 | Estimation provenance | Nutrition has `dataSource` OR `calculatedDate`; most recent cost entry has a valid `date` |
| PV10 | Print render (HITL) | Manual check -- not automatable. Flagged in output as "requires visual review" |

## Execution

### Step 1: Load Recipe(s)

- If argument provided: read `public/recipes/{recipe-id}.json`
- If no argument: read `public/recipes/index.json`, validate each recipe

### Step 2: Run PV1-PV9

All checks are fast JSON reads -- no subagents needed. Single pass per recipe:

1. **PV1** -- `recipe.stages.some(s => s.gather?.ingredients?.length > 0)`
2. **PV2** -- import and call `deriveAllergens(recipe)` in a try/catch
3. **PV3** -- check `nutrition.totals.calories > 0` AND `nutrition.perServing` exists with non-zero calories
4. **PV4** -- find cook_log entries with `cost.items` array. Fail if only old `costs[]` schema found.
5. **PV5** -- if both cost and nutrition exist, compare servings. If different, require `meta.yields` to be non-empty.
6. **PV6** -- scan all cost `items[].sourceName` for case-insensitive "negligible"
7. **PV7** -- verify every `cost.items[]` entry has non-empty `sourceName`
8. **PV8** -- check `meta.yields` is non-empty string
9. **PV9** -- nutrition must have `dataSource` or `calculatedDate`; most recent cost entry's parent cook_log entry must have valid `date`

### Step 3: Output Report

```markdown
## Print Validation: {recipe-name}

| ID | Status | Details |
|----|--------|---------|
| PV1 | PASS | 4 ingredients across 2 stages |
| PV4 | FAIL | Cost uses old costs[] schema -- needs migration |
| PV10 | HITL | Requires visual review after automated checks pass |

**Result: 8/9 automated checks passed. 1 failure blocks print generation.**
```

### Step 4: Summary

- If all PV1-PV9 pass: "Print page ready. Open `/recipe/{id}/print` for visual review (PV10)."
- If any fail: "Print page will show 'not yet generated' until failures are fixed."

## Arguments

- `$ARGUMENTS[0]` -- Optional recipe ID (e.g., `simple-sourdough`)
- If blank, validate all recipes from `public/recipes/index.json`

## Integration

This skill is invoked automatically by `/bake-log` (Phase 6b) after cost data is wired in. It can also be run standalone for ad-hoc validation.

## Notes

- Read-only analysis, no file modifications
- PV10 is always flagged as HITL -- it cannot pass without human review
- The `usePrintValidation.ts` composable implements PV1-PV9 programmatically in the app, gating the print page render
