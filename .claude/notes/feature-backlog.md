# Feature Backlog

Captured during cooking sessions. Implement when ready.

---

## Cook Log & Notes System

**Status:** Design complete, not implemented

- `cook_log` array in recipe JSON
- Dated entries with free-form notes
- Can reference specific steps or be recipe-level
- Example: "2026-02-05: Used multiple small foil sheets instead of sling. Will make unmolding harder."

---

## Photo Pipeline

**Status:** Concept captured

**Flow:**
1. User provides photo
2. AI agent analyzes image (separate context window)
3. Extract useful EXIF: timestamp, location weather (via API?), camera info
4. Strip sensitive metadata
5. Downscale for web
6. Generate `{filename}.meta.json` with:
   - AI description
   - Extracted metadata
   - Purpose tag (e.g., "step illustration", "final result", "mistake example")
7. Store in `public/images/{recipe-id}/`

**Placement:**
- In cook_log entries
- In recipe steps (e.g., "rolled dough" photo for ROLL_DOUGH step)

---

## Source Tracking & Change Log

**Status:** Concept captured

**Fields to add to recipe JSON:**
```json
{
  "original_source": {
    "name": "America's Test Kitchen",
    "url": "https://...",
    "found_via": "Reddit post by u/redstaplerguy",
    "access": "paywalled"
  },
  "change_log": [
    {
      "date": "2026-02-05",
      "change": "Increased salt from 4.5g to 6g",
      "reasoning": "Original tasted flat, needed more contrast with sweet filling"
    }
  ]
}
```

---

## Recipe Versioning

**Status:** Concept captured

**Format:** `v{major}.{minor}.{patch}` + date

- Major: Significant recipe change (different method)
- Minor: Ingredient adjustment
- Patch: Note/clarification only

Example: "ATK Cinnamon Buns Ultimate v1.2.0 — cooked 2026-02-05"

---

## System Timers

**Status:** Research needed

- Trigger OS-level timers/alarms instead of in-browser
- Options: Web Notifications API, deep links to clock apps, PWA integration

---

## Recipe Families (Option 4)

**Status:** Design selected, not implemented

Link recipe variants in index.json:
```json
{
  "families": [{
    "id": "atk-cinnamon-buns",
    "name": "ATK Cinnamon Buns",
    "variants": [
      { "id": "quick", "label": "Quick (1.5 hrs)" },
      { "id": "overnight", "label": "Overnight" },
      { "id": "ultimate", "label": "Ultimate (5 hrs)" }
    ]
  }]
}
```

---

## About Page

**Status:** Content captured, not implemented

**Author:** Chris Palmer
**GitHub:** (repo link)
**Instagram:** https://www.instagram.com/rhythm_hawk/

**Site description:**
> proofed. — A personal cooking notebook. Recipes adapted to my kitchen, documented with notes from each cook session.

---

## Guidebook Layout

**Status:** To be designed

- Mock out overall site structure
- Recipe index/browse view
- Individual recipe view
- Cook log timeline?

---

## Nutritional Info

**Status:** Concept captured

**Key questions:**
1. How is it estimated? (show your work)
2. How is it displayed?
3. Normalization: per variant? per version?

**Estimation approach:**
- Store per-ingredient nutrition data in `public/nutrition-db.json`
- Calculate totals from recipe ingredient amounts
- Show calculation breakdown (transparency)

**Data model:**
```json
{
  "nutrition": {
    "per_serving": {
      "calories": 485,
      "fat_g": 22,
      "carbs_g": 65,
      "protein_g": 7,
      "sugar_g": 32,
      "sodium_mg": 380
    },
    "servings": 8,
    "estimation_method": "calculated",
    "sources": ["usda-fdc", "manufacturer-label"],
    "notes": "Glaze adds ~60 cal/serving"
  }
}
```

**Display options:**
- Collapsed by default (badge shows calories only)
- Expand to show full breakdown
- "How calculated" link shows ingredient-by-ingredient math

**Normalization:**
- Store at **variant** level (Quick vs Ultimate have different ingredients)
- Version changes that affect nutrition bump the calculation
- `nutrition.version` field tracks when last recalculated

**Validation:**
- Sum of ingredient calories ≈ total (±5% tolerance for rounding)
- Flag if recipe changes but nutrition not updated

---

## Regression Testing (90% Coverage)

**Status:** Plan formulated, not implemented

**Goal:** 90% unit test coverage to catch bugs like recipe-switching state leak.

### Test Framework Setup

```bash
npm install -D vitest @vue/test-utils jsdom @vitest/coverage-v8
```

**vitest.config.ts:**
```ts
export default {
  test: {
    environment: 'jsdom',
    coverage: { reporter: ['text', 'html'], threshold: { global: 90 } }
  }
}
```

### Test Plan by Layer

#### 1. Composables (Priority: HIGH)

| File | Tests | Coverage Target |
|------|-------|-----------------|
| `useProgress.ts` | State isolation per recipe, load/save localStorage, toggle functions, auto-advance logic, stage collapse | 95% |
| `useRecipe.ts` | Load manifest, load recipe, restore last recipe, error handling | 95% |
| `useTechniques.ts` | Load techniques, keyword matching, longest-first priority, case-insensitive | 95% |

**Critical test case (regression):**
```ts
it('clears state when switching recipes', () => {
  const p1 = useProgress('recipe-a')
  p1.load()
  p1.toggleItem('item-1', 'stage-1')

  const p2 = useProgress('recipe-b')
  p2.load()

  const p1Again = useProgress('recipe-a')
  p1Again.load()

  expect(p1Again.isItemChecked('item-1')).toBe(true) // persisted
  // No leftover state from recipe-b
})
```

#### 2. Components (Priority: MEDIUM)

| Component | Tests |
|-----------|-------|
| `TechniqueText.vue` | Renders plain text, highlights keywords, shows tooltip on hover |
| `CheckableItem.vue` | Renders checkbox, emits toggle, shows checked state |
| `GatherCategory.vue` | Complete all, clear all, sink checked items, collapse when done |
| `GatherSection.vue` | Copy to clipboard formats correctly |
| `StageCard.vue` | Collapse/expand, progress count display |
| `StateStep.vue` | Timer display, critical notes styling |
| `RecipeMeta.vue` | Copy recipe formats correctly |

#### 3. Integration Tests (Priority: MEDIUM)

| Scenario | Test |
|----------|------|
| Recipe switching | Load A → check items → Load B → Load A → verify A's state intact |
| Auto-advance | Complete all items + states → verify stage collapses, next expands |
| Technique tooltips | Render ingredient with "softened" → verify tooltip appears |
| Copy to clipboard | Click copy → verify clipboard contains formatted text |

#### 4. Recipe JSON Validation (Priority: HIGH)

| Check | Test |
|-------|------|
| Schema compliance | All recipes pass TypeScript type check |
| D1-D13 criteria | Automated validation of all design spec rules |
| Breakdown sums | `sum(breakdown.amount) === total` for all ingredients |

### Test File Structure

```
src/
├── composables/
│   ├── useProgress.ts
│   └── useProgress.spec.ts
├── components/
│   ├── TechniqueText.vue
│   └── TechniqueText.spec.ts
tests/
├── integration/
│   └── recipe-switching.spec.ts
└── validation/
    └── recipe-schema.spec.ts
```

### npm Scripts

```json
{
  "test": "vitest",
  "test:coverage": "vitest --coverage",
  "test:watch": "vitest --watch"
}
```

### CI Integration

Add to GitHub Actions:
```yaml
- run: npm test
- run: npm run test:coverage
- uses: codecov/codecov-action@v3
```

### Execution Order

1. Setup vitest + coverage
2. Composable tests (useProgress, useRecipe, useTechniques)
3. Component tests (TechniqueText, CheckableItem, etc.)
4. Integration tests
5. Recipe validation tests
6. CI pipeline integration
