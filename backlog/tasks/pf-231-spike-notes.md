# PF-231.1 Spike Notes — Water Content Lookup Table + Experiment Schema Design

**Spike date:** 2026-05-01
**Status:** Complete
**Artifacts created:**
- `public/data/water-content.json` — lookup table with 60+ ingredient entries across 14 categories
- `src/types/recipe.ts` — added `ExperimentConfig`, `ExperimentExport`, `WaterContentTable` interfaces + related types
- This document

---

## 1. Water Content Research Findings

### Sources consulted
- **USDA FoodData Central** (fdc.nal.usda.gov) — primary source for per-100g water values
- **Prof Steven Abbott** — Water Content for Baking (stevenabbott.co.uk) — practical baking-focused reference
- **Bread, Cakes and Ale** — "The Hydration of Enriched Doughs" — explicit 87%/75%/16% values for milk/eggs/butter
- **Busby's Bakery** — Dough Hydration article — corroborating percentages
- **King Arthur Baking** — bread hydration guide — enriched dough calculation context
- **USDA AMS standards** — regulatory moisture limits for mozzarella (52% max), cream cheese (55% max), nonfat dry milk (4.0% max spray process)

### Key data points (see `water-content.json` for full table)

| Category | Ingredient | Water % | Note |
|----------|-----------|---------|------|
| Flour | Bread flour | 11.8% | Varies 10-14% with storage humidity |
| Flour | Whole wheat | 10.7% | Bran absorbs more water during mixing |
| Dairy | Whole milk | 87% | Cross-source consensus |
| Dairy | Butter | 16% | US standard; European ~15% |
| Dairy | Heavy cream | 58% | 36%+ milkfat |
| Dairy | Cream cheese | 55.5% | FDA max moisture limit |
| Cheese | Cheddar | 36.8% | Sharp/extra-sharp slightly lower |
| Cheese | Mozzarella (whole) | 50% | AMS spec max 52% |
| Cheese | Parmesan | 29.2% | Lowest moisture cheese |
| Eggs | Whole egg | 75% | Cross-source consensus |
| Eggs | Egg white | 87.6% | Mostly water + protein |
| Eggs | Egg yolk | 52.3% | Fat-rich, less water |
| Vegetables | Jalapeño (raw) | 91.7% | USDA FDC — huge moisture contributor |
| Sugars | Honey | 17% | Despite being liquid, low water activity |
| Sugars | Brown sugar | 1.3% | Molasses coating adds slight moisture |
| Nuts | Walnuts | 4.1% | Dried/processed kernels |
| Dried fruit | Raisins | 15.4% | Can absorb water if soaked |
| Cured meats | Pepperoni | 27% | Moderate moisture for a cured product |
| Olives | Kalamata | 69% | High-moisture inclusion |
| Starter | Sourdough (100% hyd) | 46% | Derived: 50% flour + 50% water, adjusted for flour moisture |

### Data quality notes
- Values are **practical approximations** for hydration math, not laboratory-grade measurements
- Real-world variation exists: cheese moisture depends on aging, flour moisture depends on humidity, butter differs by brand/style
- The lookup table includes a `note` field per item with USDA FDC IDs where available for provenance
- Sourdough starter water content is a **derived value** (not a direct USDA measurement) — at 100% hydration it's 50% water by weight plus the ~12% moisture already in the flour component, simplified to 46%

---

## 2. Lookup Table Schema Design

### File location
`public/data/water-content.json` — sits alongside `public/recipes/`, `public/config/`, and the existing `public/cost-rates.json`.

Rationale for `public/data/` rather than `public/recipes/`:
- Water content data is **cross-recipe reference data**, not recipe-specific
- Similar to how `cost-rates.json` and `techniques.json` live at the public root
- A `data/` subdirectory groups reference data that may grow (allergen mapping, unit conversions, etc.)

### Schema structure
```
{
  version: string,           // semver for cache-busting
  updatedAt: string,         // ISO date of last update
  description: string,       // what this file is for
  sources: string[],         // provenance
  categories: [{
    id: string,              // e.g., "flour", "dairy", "cheese"
    name: string,            // display name
    items: [{
      id: string,            // stable lookup key, kebab-case
      name: string,          // display name
      waterPercent: number,  // 0-100
      note: string,          // source/caveat
      aliases: string[]      // fuzzy matching support
    }]
  }]
}
```

TypeScript interfaces added to `src/types/recipe.ts`:
- `WaterContentItem` — single ingredient entry
- `WaterContentCategory` — category grouping
- `WaterContentTable` — root schema

### Coverage
60+ ingredients across 14 categories: flours, dairy, cheeses, eggs, fats/oils, sugars/sweeteners, vegetables/peppers, cured meats, olives, nuts/seeds, dried fruit, leavening, chocolate, liquids.

---

## 3. Experiment Config Schema Design

### Where it lives
New optional field on `Recipe`: `experiment?: ExperimentConfig`

This is a recipe-level declaration — not all recipes need it. Only recipes where ingredient variation analysis is useful (e.g., inclusion breads like jalapeño cheddar sourdough, enriched doughs with variable butter/milk) would include an experiment block.

### Key interfaces

**`ExperimentConfig`** — top-level block on Recipe:
```typescript
{
  description: string               // what this experiment explores
  ingredients: ExperimentIngredient[] // adjustable ingredients
  derived: ExperimentDerived[]       // calculated values to display
  scaleMode?: 'pre_scaled' | 'post_scaled'  // see §6
}
```

**`ExperimentIngredient`** — per-ingredient slider config:
```typescript
{
  id: string              // matches Ingredient.id in gather sections
  role: ExperimentRole    // 'base_flour' | 'base_liquid' | 'enrichment' | 'inclusion'
  defaultAmount: number   // grams at 1x recipe
  min: number             // slider min
  max: number             // slider max
  step: number            // slider granularity (grams)
  waterContentId?: string // lookup key into water-content.json
  waterContentOverride?: number // direct override (0-100)
}
```

**`ExperimentRole`** classifies ingredients for hydration math:
- `base_flour` — denominator in baker's percentage (bread flour, AP flour, whole wheat)
- `base_liquid` — primary hydration (water, milk)
- `enrichment` — fat/sugar/dairy that contributes moisture but isn't "liquid" (butter, eggs, cream)
- `inclusion` — add-ins that contribute weight + moisture but aren't part of the base dough formula (cheese, jalapeños, olives, nuts)

**`ExperimentDerived`** — what the UI calculates and shows:
```typescript
{
  id: string
  label: string           // e.g., "Effective Hydration"
  unit: string            // e.g., "%"
  type: 'effective_hydration' | 'inclusion_load' | 'total_dough_weight' | 'custom'
  formula?: string        // for custom type only
}
```

### Design rationale

1. **Role-based classification** rather than just "variable yes/no" — this lets the UI compute hydration correctly. Flour goes in the denominator, everything else contributes water proportionally.

2. **Slider min/max/step per ingredient** — different ingredients need different granularity. Water might move in 10g steps, salt in 1g steps, cheese in 25g steps.

3. **Water content can come from 3 sources** (priority order):
   - `waterContentOverride` on the experiment ingredient (highest priority — recipe author knows their specific product)
   - `waterContentId` lookup into `water-content.json` (standard reference)
   - Auto-match by ingredient `id` against lookup table `id` or `aliases` (fallback)

4. **`derived` is declarative** — the recipe author says "show effective hydration and inclusion load" and the UI handles the math. The `custom` type with a `formula` field is an escape hatch for recipe-specific calculations (e.g., "fat as % of flour" for enriched doughs).

### Example: Jalapeño Cheddar Sourdough experiment block

```json
{
  "experiment": {
    "description": "Adjust inclusion amounts and hydration to explore moisture balance in jalapeño cheddar sourdough",
    "scaleMode": "pre_scaled",
    "ingredients": [
      { "id": "water", "role": "base_liquid", "defaultAmount": 360, "min": 280, "max": 420, "step": 10 },
      { "id": "flour", "role": "base_flour", "defaultAmount": 550, "min": 450, "max": 650, "step": 25 },
      { "id": "jalapenos", "role": "inclusion", "defaultAmount": 120, "min": 0, "max": 200, "step": 10, "waterContentId": "jalapeno-raw" },
      { "id": "cheddar", "role": "inclusion", "defaultAmount": 220, "min": 0, "max": 350, "step": 25, "waterContentId": "cheddar" },
      { "id": "butter", "role": "enrichment", "defaultAmount": 45, "min": 0, "max": 80, "step": 5, "waterContentId": "butter-unsalted" },
      { "id": "starter", "role": "enrichment", "defaultAmount": 10, "min": 5, "max": 20, "step": 1, "waterContentId": "sourdough-starter-100" }
    ],
    "derived": [
      { "id": "effective-hydration", "label": "Effective Hydration", "unit": "%", "type": "effective_hydration" },
      { "id": "inclusion-load", "label": "Inclusion Load", "unit": "%", "type": "inclusion_load" },
      { "id": "total-dough", "label": "Total Dough Weight", "unit": "g", "type": "total_dough_weight" }
    ]
  }
}
```

With defaults: effective hydration = (360 + 120×0.917 + 220×0.368 + 45×0.16 + 10×0.46) / 550 = ~90% effective hydration (this is why the recipe specifies 67% *base* hydration — inclusions contribute a lot of water).

---

## 4. Experiment Export Schema Design

### Purpose
When a user dials in a variation they want to bake, the export captures:
- What changed (adjustments array — only modified ingredients)
- What the derived values were at export time
- Context (recipe id, multiplier, timestamp, optional notes)

### Interface: `ExperimentExport`
```typescript
{
  recipeId: string
  exportedAt: string                    // ISO 8601
  multiplier: number                    // 1 = unscaled
  scaleMode: 'pre_scaled' | 'post_scaled'
  adjustments: ExperimentAdjustment[]   // only changed ingredients
  derivedValues: ExperimentDerivedSnapshot[]
  notes?: string                        // user annotation
}
```

### Where it goes
- **Scratchpad export**: `BakeScratchpad.experimentExport` (new optional field added)
- **Cook log**: could be referenced as a note or stored as structured data on a future `CookLogEntry.experimentVariation` field (deferred — not adding to cook log type yet)

### Export flow (future UI)
1. User adjusts sliders in experiment panel
2. User clicks "Use this variation" / "Export"
3. System snapshots current adjustments + derived values into `ExperimentExport`
4. Export is attached to the active scratchpad (persisted in localStorage)
5. When scratchpad is exported to JSON for bake-log processing, the experiment export travels with it

### Example export
```json
{
  "recipeId": "jalapeno-cheddar-sourdough",
  "exportedAt": "2026-05-15T14:30:00Z",
  "multiplier": 1,
  "scaleMode": "pre_scaled",
  "adjustments": [
    {
      "ingredientId": "jalapenos",
      "ingredientName": "Fresh Jalapeños",
      "originalAmount": 120,
      "adjustedAmount": 80,
      "delta": -40
    },
    {
      "ingredientId": "cheddar",
      "ingredientName": "Sharp Cheddar Cheese (block)",
      "adjustedAmount": 300,
      "originalAmount": 220,
      "delta": 80
    },
    {
      "ingredientId": "water",
      "ingredientName": "Water",
      "originalAmount": 360,
      "adjustedAmount": 330,
      "delta": -30
    }
  ],
  "derivedValues": [
    { "id": "effective-hydration", "label": "Effective Hydration", "value": 83.2, "unit": "%" },
    { "id": "inclusion-load", "label": "Inclusion Load", "value": 69.1, "unit": "%" },
    { "id": "total-dough", "label": "Total Dough Weight", "value": 1343, "unit": "g" }
  ],
  "notes": "Less jalapeño heat, more cheese. Reduced water to compensate for higher cheese moisture."
}
```

---

## 5. Interaction with Existing Scaling System

### Current scaling behavior
The existing `useScaling` composable:
- Stores a `multiplier` ref
- Scales all ingredient amounts linearly by `multiplier`
- Supports non-linear ingredient behaviors via `ScalingIngredient.behavior`
- Renders process caveats and untested-range warnings
- Scaling config lives on `Recipe.scaling` — recipes without it show no multiplier UI

### Recommended interaction: experiment operates on pre-scaled amounts

**`scaleMode: 'pre_scaled'` (recommended default):**
1. User selects a multiplier (e.g., 0.5x for a single loaf)
2. Experiment sliders show/adjust the **1x recipe amounts**
3. Derived values (hydration %, inclusion load %) are computed from 1x amounts — these **ratios don't change with scale** so they're meaningful at any multiplier
4. The actual grams used for baking are: `adjustedAmount * multiplier`

This is the correct mental model because:
- Baker's percentages and hydration ratios are scale-invariant
- The user thinks "I want 70% hydration" not "I want 350g water" — the grams are a consequence
- Non-linear scaling behaviors (e.g., yeast doesn't scale linearly) are already handled by `useScaling`

**`scaleMode: 'post_scaled'` (alternative):**
- Sliders show the **already-scaled amounts** (final grams for this batch)
- Useful when the user thinks in absolute terms ("I have 150g of cheddar, how does that affect hydration?")
- Derived values are still computed correctly — they just use post-scaled flour as the denominator

### Implementation note
The experiment composable (future `useExperiment.ts`) should:
1. Accept the scaling `multiplier` ref from `useScaling`
2. If `scaleMode === 'pre_scaled'`: compute derived values from slider amounts, show scaled amounts separately as "bake amounts"
3. If `scaleMode === 'post_scaled'`: compute derived values from slider amounts directly (they already include the multiplier)
4. The export should record which mode was active + the multiplier for traceability

### No conflict with existing scaling
The experiment tool does NOT modify recipe JSON or scaling behavior. It's a **read-only calculation layer** — sliders adjust ephemeral state (localStorage / composable ref), and the export is a snapshot. The experiment block on the recipe is config, not data.

---

## 6. Follow-up Tasks (to be created as Drafts)

Based on this spike, the implementation path is:

1. **Composable: `useExperiment.ts`** — loads water-content.json, provides slider state, computes derived values. Depends on `useScaling` for multiplier. Pure computation, no UI.

2. **Component: `ExperimentPanel.vue`** — slider UI with derived value readouts. Collapsible panel on the recipe page. Only renders if `recipe.experiment` exists.

3. **Scratchpad integration** — wire `ExperimentExport` into scratchpad export flow. Update `useScratchpad.exportJson()` to include experiment data.

4. **Water content lookup composable: `useWaterContent.ts`** — fetches and caches `water-content.json`, provides lookup by id/alias. Shared across experiment tool and any future hydration display.

5. **Add experiment blocks to recipes** — start with jalapeño cheddar sourdough (highest value — heavy inclusions), then simple sourdough (basic hydration slider).

6. **Hydration formula definitions** — the `effective_hydration` calculation needs to be precisely defined and documented:
   - `effective_hydration = (sum of water from all ingredients) / (sum of flour weight) * 100`
   - Water from each ingredient = `amount * (waterPercent / 100)`
   - Flour weight = sum of all `base_flour` role ingredients (using their dry weight, i.e., `amount * (1 - waterPercent/100)`)
   - Decision: should flour moisture count toward hydration? Traditional baker's math ignores it. The experiment tool should show both: "baker's hydration" (water / flour, ignoring flour moisture) and "effective hydration" (all water / all dry flour).

---

## 7. Open Questions for User Review

1. **Should the experiment panel be always visible or behind a toggle?** Recommendation: collapsible panel, collapsed by default, with a "Experiment" button in the recipe header.

2. **Should experiment adjustments persist across page loads?** Recommendation: yes, in localStorage keyed by recipe id (same pattern as scratchpad). The user may want to keep a variation dialed in across sessions.

3. **Should we support "save named variations"?** e.g., "Low heat version", "Extra cheesy". Deferred — start with single active variation + export, add named presets later if user requests.

4. **Mobile UX**: sliders are harder to use on small screens. Consider a number input + stepper buttons as an alternative/complement. Deferred to design phase.
