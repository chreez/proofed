# Validation Checklist

## Workflow Protocol (STRICT ORDER)

```
1. CLARIFY    → Feature request arrives → Ask questions until intent is clear
2. CHECKLIST  → Add new validation criteria HERE before any code
3. IMPLEMENT  → Build the feature
4. VALIDATE   → Run all checks (existing + new)
5. BUILD      → npm run build MUST pass before returning to user
```

**Gate:** Do NOT proceed to step 3 without completing steps 1 and 2.
**Gate:** Do NOT return control to user if `npm run build` fails.

---

This checklist MUST be verified after every feature release. Run `/validate` or spawn a validation subagent.

## Design Spec Compliance (11 Checks)

| ID | Check | Criteria | Files to Verify |
|----|-------|----------|-----------------|
| D1 | Units: grams only | No cups, tbsp, tsp in ingredient amounts | `public/recipes/*.json` |
| D2 | Units: Fahrenheit (Celsius) | Temps formatted as `350°F (175°C)` | `public/recipes/*.json` |
| D3 | Units: centimeters | Dimensions in cm, not inches | `public/recipes/*.json` |
| D4 | timer: true only passive | `timer: true` only on passive/waiting states (not active hands-on steps) | `public/recipes/*.json` |
| D5 | exit_condition required | Every state has non-empty `exit_condition` | `public/recipes/*.json` |
| D6 | Breakdown sums match | `sum(breakdown.amount) === total` for all ingredients | `public/recipes/*.json` |
| D7 | gather sections valid | Gather sections on stages that introduce new ingredients; other stages `null` | `public/recipes/*.json` |
| D8 | Vessels minimized | ≤5-6 vessels with documented reuse chains | `public/recipes/*.json` |
| D9 | Atomic states | One physical action per state | `public/recipes/*.json` |
| D12 | Technique references | Complex techniques must include reference link OR be self-explanatory in ≤1 sentence | `public/recipes/*.json` |
| D13 | Design system usage | Styling must use shortcuts from `uno.config.ts`; no one-off utility combinations | `src/components/*.vue` |
| D10 | Critical notes styled | `critical: true` notes render with danger styling | `src/components/StateStep.vue` |
| D11 | Auto-advance works | Stage collapses when complete, next expands | `src/composables/useProgress.ts` |
| D14 | Version summaries | Every `change_log` entry has non-empty `summary` | `public/recipes/*.json` |
| D16 | Nutrition required | All recipes must include a `nutrition` block with non-null `totals` and `perServing` | `public/recipes/*.json` |

## Recipe Accuracy Checks

| ID | Check | Criteria |
|----|-------|----------|
| R1 | Gram conversions | Match original oz/cup weights (±2g tolerance) |
| R2 | Butter allocation | All uses sum to total declared |
| R3 | Salt allocation | All uses sum to total declared |
| R4 | Sugar allocation | All uses sum to total declared |
| R5 | Milk allocation | All uses sum to total declared |
| R6 | Temperature conversions | °F to °C accurate (±1°) |
| R7 | Dimension conversions | Inches to cm accurate (±0.5cm) |
| R8 | Procedural accuracy | States match original recipe instructions |

## Voice & Authenticity Checks

| ID | Check | Criteria |
|----|-------|----------|
| V1 | Notes are first-person experience | `notes` and `step_notes` must describe what the user ACTUALLY did, not suggestions or hypotheticals |
| V2 | Suggestions go in next_time | Untested ideas belong in `next_time` array, not presented as experience |
| V3 | Agent suggestions marked | If agent suggests an improvement, it should be prefixed with "Try:" or "Consider:" and NOT written as if user did it |
| V4 | Sources for suggestions | External suggestions (from research, other recipes) should cite source via `next_time[].source` field |
| V5 | No inferred details | Cook log `notes` must not contain brands, quantities, or specifics the user didn't explicitly state — ask to clarify, don't guess |
| V6 | Clarify loop completed | Cook log entries must go through clarify → echo back → user approval before writing to JSON |

## Source Schema Checks

| ID | Check | Criteria | Files to Verify |
|----|-------|----------|-----------------|
| S1 | meta.source is object | `meta.source` is an object with required `name` (non-empty string) | `public/recipes/*.json` |
| S2 | source.url valid format | `meta.source.url` is a valid URL when present | `public/recipes/*.json` |
| S3 | source.type valid enum | `meta.source.type` is one of `original`, `adapted`, `inspired` when present | `public/recipes/*.json` |
| S4 | next_time items structured | `next_time[]` items are objects with required non-empty `text` field | `public/recipes/*.json` |
| S5 | next_time source non-empty | `next_time[].source` is a non-empty string when present | `public/recipes/*.json` |
| S6 | Scaling ingredients ref existing | `scaling.ingredients[].id` must reference existing gather section ingredient IDs | `public/recipes/*.json` |
| S7 | Scaling range & metadata valid | When `scaling` present: `tested_range.min >= 0.5`, `max >= min`, `researched_date` is valid ISO date, `sources.length >= 1` | `public/recipes/*.json` |
| S8 | Recipes without scaling no multiplier | Recipes WITHOUT `scaling` block must not render multiplier UI; multiplier only shows if `recipe.scaling` exists | `src/components/RecipeMeta.vue`, `src/components/ScalingControl.vue` |

## Feature-Specific Checks

Add checks here for new features:

| ID | Feature | Check | Added |
|----|---------|-------|-------|
| F1 | Timer system | Early check fires at config.early_check_percent | 2026-02-03 |
| F2 | Progress tracking | 4 categories checkable: vessels, equipment, ingredients, states | 2026-02-03 |
| F3 | Auto-advance | Completing all stage items triggers collapse/expand | 2026-02-03 |
| F4 | Complete All | Each gather section has "Complete All" checkbox | 2026-02-04 |
| F5 | Complete All toggle | Unchecking "Complete All" clears all items in section | 2026-02-04 |
| F6 | Sink checked | Checked items move to bottom of list + shrink | 2026-02-04 |
| F7 | Section collapse | Section collapses to badge when all items complete | 2026-02-04 |
| F8 | Section expand | Clicking collapsed badge expands section | 2026-02-04 |
| F9 | Native checkboxes | Gather items use native checkbox with accent-color | 2026-02-05 |
| F10 | Copy full recipe | Header "Copy Recipe" button copies plain text for Paprika | 2026-02-05 |
| F11 | Copy mise en place | Per-section "Copy" button copies stage gather list | 2026-02-05 |
| F12 | Technique glossary | Keywords (softened, room temp, etc.) show tooltip on hover | 2026-02-05 |
| F13 | TOC navigation | Sidebar TOC navigates to stages, cook log, version history | 2026-02-06 |
| F14 | TOC auto-expand | Clicking completed/collapsed stage in TOC expands it | 2026-02-06 |
| F15 | TOC completed styling | Completed stages show crossed out in sidebar | 2026-02-06 |
| F16 | TOC mobile FAB | Mobile shows FAB button that opens bottom sheet TOC | 2026-02-06 |
| F17 | Nutrition data | servings > 0, matches parsed yields | 2026-02-06 |
| F18 | Nutrition totals | sum(breakdown.calories) = totals.calories ±1 | 2026-02-06 |
| F19 | Nutrition per-serving | perServing = totals / servings ±0.1 | 2026-02-06 |
| F20 | Nutrition placeholder | Missing nutrition → "Not yet calculated" | 2026-02-06 |
| F21 | Nutrition toggle | Per-serving / Full toggle switches all values | 2026-02-06 |
| F22 | Nutrition breakdown | All ingredients with >0 calories listed | 2026-02-06 |
| F23 | Photo paths valid | All cook_log photo src/thumb paths exist on disk | 2026-02-07 |
| F24 | Photo alt text | All cook_log photos have non-empty alt text | 2026-02-07 |
| F25 | Note source field | All `StateNote` entries in recipe JSON have `source: 'user' \| 'agent'` | 2026-02-11 |
| F26 | Bake detail back link | Bake detail page (`/recipe/:id/bake/:date`) has working link back to recipe page | 2026-02-13 |
| F27 | OG meta per route | Every route in the router must call `useSeoMeta` or `useRecipeMeta` with route-appropriate values (index defaults, recipe-specific, bake-specific) | 2026-02-13 |
| F28 | Clipboard via utility | All clipboard calls must use shared `copyToClipboard` from `useClipboard.ts`, not `navigator.clipboard` directly | 2026-02-16 |
| F29 | Reheat required | All recipes must include a `reheat` block with at least one method | 2026-02-16 |
| F30 | Reheat version bump | Changes to `reheat` data must bump minor version + add `change_log` entry | 2026-02-16 |
| F31 | Print ingredient swap | Print page ingredient amounts override from `selectedCostSource.items[]` by `ingredientId`; items absent from cost source fall back to recipe defaults | 2026-05-05 |
| F32 | IG story export | Bake detail page (`/recipe/:id/bake/:date`) renders a Share button next to QR + Print; click opens a bottom sheet with optional rate step (failure/meh/mid/success/skip), then a 3-line caption preview that copies via `copyToClipboard`. L1 = lifetime cadence, L2 = lifetime cals + typeCounts + spend, L3 = current bake (recipeBakeCount, recipeName, optional outcome/cost/servings). Outcome resolution: entry.outcome → scratchpad.outcome → show rate step. | 2026-05-05 |
| F33 | Cook_log ingredient snapshot | Every `cook_log[]` entry has a non-empty `ingredients[]` snapshot — `IngredientSnapshotGroup[]` mirroring `stages[].gather.ingredients` shape. Validated in `tests/validation/recipe-schema.spec.ts`. Backfill via `scripts/sync-ingredient-snapshots.ts`. | 2026-05-07 |
| F34 | Change_log ingredient snapshot | Every `change_log[]` entry has a non-empty `ingredients[]` snapshot — frozen at write time, never auto-mutated by later version bumps. Source of truth for "what the recipe said at vX.Y.Z". | 2026-05-07 |
| F35 | Snapshot breakdown sums | For each snapshot ingredient with `breakdown[]`, sum of breakdown amounts equals `total` (±2g tolerance). Extension of D6 to per-bake / per-version snapshots. | 2026-05-07 |
| F36 | Print snapshot resolution | `RecipePrintView.vue` ingredient amounts read from `cook_log[].ingredients` when a bake is selected, `change_log[].ingredients` when "Estimated" is selected; falls back to `stages[].gather.ingredients` only when neither snapshot is present. `cost.items[]` no longer drives ingredient amounts. | 2026-05-07 |
| F37 | TagSearch renders | `TagSearch.vue` mounts on `/bake-log` and `/` above the timeline/list; chips inline left of input. | 2026-05-11 |
| F38 | Tag dropdown sections | Dropdown opens on non-empty input, shows two labeled sections: "Add filter tag" (max 4) and "Jump to result" (max 4). Counts in tag rows are scoped to the current chip-filtered subset. | 2026-05-11 |
| F39 | Multi-chip AND filter | When multiple chips are active, only items whose tokens include ALL chip keys remain in the list. `tokensFn(item)` is the source of truth for matching. | 2026-05-11 |
| F40 | Keyboard nav | ArrowDown/ArrowUp moves `activeIdx` across all dropdown rows (tag + preview); Enter activates the active row; Esc closes dropdown; Backspace on empty input pops the last chip. | 2026-05-11 |
| F41 | Preview nav targets | Bake log previews navigate to `/recipe/:id/bake/:date`. Recipe index previews navigate to `/recipe/:id`. Wired via `navigate` prop / emit. | 2026-05-11 |
| F42 | Recipe index filter coherence | When recipes are filtered by chips, existing groupings still render correctly: in-progress section, baked category groups, outdated section, and "+N more" unbaked toggle all operate on the filtered subset. | 2026-05-11 |

## Print Validation

| ID | Check | Criteria | Files to Verify |
|----|-------|----------|-----------------|
| PV1 | Ingredients exist | >=1 stage with >=1 ingredient in gather | `public/recipes/*.json` |
| PV2 | Allergens derivable | `deriveAllergens(recipe)` runs without throwing | `public/recipes/*.json` |
| PV3 | Nutrition complete | `nutrition.totals.calories > 0` AND `nutrition.perServing` populated | `public/recipes/*.json` |
| PV4 | Cost data (new schema) | >=1 cook_log entry with `cost.items[]` array (not old `costs[]`) | `public/recipes/*.json` |
| PV5 | Serving label coherence | If `cost.servings !== nutrition.servings`, recipe must have `meta.yields` | `public/recipes/*.json` |
| PV6 | No stale terminology | No cost item `sourceName` contains "negligible" | `public/recipes/*.json` |
| PV7 | Cost items sourced | Every `cost.items[]` entry has non-empty `sourceName` | `public/recipes/*.json` |
| PV8 | Recipe has yields | `meta.yields` is non-empty string | `public/recipes/*.json` |
| PV9 | Estimation provenance | Nutrition has `dataSource` OR `calculatedDate`; most recent cost entry has valid `date` | `public/recipes/*.json` |
| PV10 | Print render (HITL) | Manual visual review of print page — not automatable | Browser |

## Build Validation (MANDATORY)

| ID | Check | Criteria |
|----|-------|----------|
| BV1 | Build passes | `npm run build` exits 0 (includes type-check + tests) |
| BV2 | No type errors | `vue-tsc` reports no errors |
| BV3 | Tests pass | All vitest tests pass |

## Brand Validation (proofed.)

| ID | Check | Criteria | Files to Verify |
|----|-------|----------|-----------------|
| B1 | Brand name | "proofed." with dot in accent color (#a65d45) | `src/App.vue`, `index.html` |
| B2 | Stone palette | Header bg stone-200 (#e8e4dc), text ink (#1a1816) | `uno.config.ts`, `src/App.vue` |
| B3 | Typography | JetBrains Mono for brand, Inter for body | `index.html`, `uno.config.ts` |
| B4 | Border style | 2px solid borders, 0 border-radius on cards | `uno.config.ts` shortcuts |
| B5 | Accent usage | Red dot in logo, checkbox fills, active states | `src/components/*.vue` |

## Recipe Variants

| ID | Recipe | Variant | Key Differences |
|----|--------|---------|-----------------|
| V1 | ATK Cinnamon Buns | Quick (original) | Baking powder + yeast, 30-min proof, ~1.5 hrs total |
| V2 | ATK Cinnamon Buns | Overnight | No baking powder, autolyse, cold ferment, ~12-14 hrs total |

## Validation Agent Instructions

When running validation:

1. Read this checklist first
2. For each check category, spawn appropriate subagent:
   - **Design checks (D1-D14, D16)**: Read recipe JSON and component files, verify compliance
   - **Recipe accuracy (R1-R8)**: Compare recipe JSON against original source text
   - **Source schema (S1-S5)**: Verify structured source fields in recipe JSON
   - **Feature checks (F1-Fn)**: Verify feature implementation in relevant files

3. Report format:
   ```
   | ID | Status | Details |
   |----|--------|---------|
   | D1 | ✅ | All 13 ingredients in grams |
   | D6 | ❌ | Butter breakdown sums to 138g, expected 140g |
   ```

4. If any check fails, provide specific fix instructions with file paths and line numbers.

## Recipe Accuracy Gate (MANDATORY)

**Trigger:** Any modification to `public/recipes/*.json` MUST include a recipe accuracy validation against the original source text.

**Process:**
1. Read the source material (stored in `.claude/rules/validation/original-recipes.md` or `photos-source/{recipe-id}/source/`)
2. Run R1-R8 checks comparing JSON values against source
3. Verify all gram weights, temperatures, dimensions, and procedural steps match
4. Flag any interpretive conversions (e.g., "1 tablespoon" → grams) as informational

**Source material locations:**
- ATK Cinnamon Buns: `.claude/rules/validation/original-recipes.md`
- Tartine Baguette: `photos-source/tartine-baguette/source/` (3 HEIC photos, pp.128-130)

This gate cannot be skipped. If source material is unavailable, the modification must be flagged for manual review.
