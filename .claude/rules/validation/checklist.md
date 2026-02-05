# Validation Checklist

## Workflow Protocol (STRICT ORDER)

```
1. CLARIFY    → Feature request arrives → Ask questions until intent is clear
2. CHECKLIST  → Add new validation criteria HERE before any code
3. IMPLEMENT  → Build the feature
4. VALIDATE   → Run all checks (existing + new)
```

**Gate:** Do NOT proceed to step 3 without completing steps 1 and 2.

---

This checklist MUST be verified after every feature release. Run `/validate` or spawn a validation subagent.

## Design Spec Compliance (11 Checks)

| ID | Check | Criteria | Files to Verify |
|----|-------|----------|-----------------|
| D1 | Units: grams only | No cups, tbsp, tsp in ingredient amounts | `public/recipes/*.json` |
| D2 | Units: Celsius (Fahrenheit) | Temps formatted as `175°C (350°F)` | `public/recipes/*.json` |
| D3 | Units: centimeters | Dimensions in cm, not inches | `public/recipes/*.json` |
| D4 | timer: true only passive | Only RISE, BAKE, COOL states have `timer: true` | `public/recipes/*.json` |
| D5 | exit_condition required | Every state has non-empty `exit_condition` | `public/recipes/*.json` |
| D6 | Breakdown sums match | `sum(breakdown.amount) === total` for all ingredients | `public/recipes/*.json` |
| D7 | gather only on PREP | Only first stage has `gather` section, others `null` | `public/recipes/*.json` |
| D8 | Vessels minimized | ≤5-6 vessels with documented reuse chains | `public/recipes/*.json` |
| D9 | Atomic states | One physical action per state | `public/recipes/*.json` |
| D12 | Technique references | Complex techniques must include reference link OR be self-explanatory in ≤1 sentence | `public/recipes/*.json` |
| D13 | Design system usage | Styling must use shortcuts from `uno.config.ts`; no one-off utility combinations | `src/components/*.vue` |
| D10 | Critical notes styled | `critical: true` notes render with danger styling | `src/components/StateStep.vue` |
| D11 | Auto-advance works | Stage collapses when complete, next expands | `src/composables/useProgress.ts` |

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
   - **Design checks (D1-D11)**: Read recipe JSON and component files, verify compliance
   - **Recipe accuracy (R1-R8)**: Compare recipe JSON against original source text
   - **Feature checks (F1-Fn)**: Verify feature implementation in relevant files

3. Report format:
   ```
   | ID | Status | Details |
   |----|--------|---------|
   | D1 | ✅ | All 13 ingredients in grams |
   | D6 | ❌ | Butter breakdown sums to 138g, expected 140g |
   ```

4. If any check fails, provide specific fix instructions with file paths and line numbers.
