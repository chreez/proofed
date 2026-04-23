---
name: cost
description: Estimate recipe cost using three-tier resolution cascade (stored rates, HEB MCP, manual fallback). Writes estimatedCost to recipe JSON.
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, mcp__heb__heb_product_search
model: opus
argument-hint: <recipe-id> [--refresh-rates] e.g. "simple-sourdough" or "all" or "--refresh-rates"
---

# Cost Estimation Skill

Estimate recipe ingredient cost without requiring a bake session. Uses a three-tier resolution cascade to price every ingredient, then writes `estimatedCost` to the recipe JSON as a top-level field.

## Usage

```
/cost <recipe-id>          # Estimate cost for one recipe
/cost all                  # Estimate cost for every recipe in index.json
/cost --refresh-rates      # Update cost-rates.json from current HEB prices
```

## Three-Tier Resolution Cascade

For each ingredient, resolve cost in this order:

1. **Stored rates** (`public/recipes/cost-rates.json`) -- pantry staples with known per-gram rates. No network needed. Check by ingredient `id` first, then try normalized name match.
2. **HEB product search** (`mcp__heb__heb_product_search` tool, store 428) -- live price lookup. Auto-select cheapest per-unit in-stock product. Use the ONLINE context price (this is the in-store price, not the curbside markup).
3. **Manual fallback** -- `$0.00` cost with `sourceType: "manual"` flag. Used when both above fail.

## Process: `/cost <recipe-id>`

### Phase 1: Load Recipe

1. Read `public/recipes/index.json` to validate recipe-id exists
2. Read `public/recipes/{recipe-id}.json`
3. Read `public/recipes/cost-rates.json`

### Phase 2: Extract & Consolidate Ingredients

1. Iterate all `stages[].gather.ingredients[]`
2. Build a consolidated ingredient map: if the same ingredient `id` appears in multiple stages, sum the `total` amounts
3. Record each ingredient's `id`, `name`, `total`, and `unit`

### Phase 3: Price Each Ingredient

For each consolidated ingredient:

#### Tier 1: Check cost-rates.json
- Look up ingredient by `id` in `rates` object
- Also try common aliases (e.g., `ap-flour` maps to `ap_flour` or `flour`)
- If found: `cost = ratePerGram * total` (when unit is "g")
- For non-gram units (e.g., "whole" for eggs): estimate grams first (1 large egg ~ 50g)
- Record `sourceType: "rate"`, `sourceName` from the rate entry

#### Tier 2: HEB Product Search
- Call `mcp__heb__heb_product_search` with query = ingredient name, storeId = 428
- Filter to in-stock products only
- Parse product sizes to grams (oz * 28.35, lb * 453.59, etc.)
- Select the cheapest per-gram option
- Calculate cost: `(recipe_amount_grams / package_size_grams) * package_price`
- Record `sourceType: "heb"`, `sourceName` = product name + brand

#### Tier 3: Manual Fallback
- Set cost to `$0.00`
- Record `sourceType: "manual"`, `sourceName: "needs manual pricing"`

### Phase 4: Calculate Totals

1. Sum all ingredient costs for `total`
2. Derive servings using the `getServings()` priority:
   - `nutrition.servings` (first priority)
   - `config.stats.defaultYield * config.stats.servingsPerItem` (second priority)
   - `1` (fallback)
3. Calculate `perServing = total / servings`
4. Round all monetary values to 2 decimal places

### Phase 5: Output Summary Table

Print a formatted table to terminal:

```
## Cost Estimate: {recipe name}

| Ingredient          | Amount  | Source | Cost   |
|---------------------|---------|--------|--------|
| Bread Flour         | 1000g   | rate   | $1.54  |
| Salt                | 20g     | rate   | $0.01  |
| Sourdough Starter   | 200g    | rate   | $0.00  |
| Water               | 700g    | rate   | $0.00  |
|---------------------|---------|--------|--------|
| **Total**           |         |        | $1.55  |
| **Per Serving** (20)|         |        | $0.08  |
```

### Phase 6: Write to Recipe JSON

Write `estimatedCost` as a top-level field on the recipe object:

```json
{
  "estimatedCost": {
    "total": 1.55,
    "perServing": 0.08,
    "servings": 20,
    "estimatedAt": "2026-04-23",
    "items": [
      {
        "ingredientId": "bread_flour",
        "name": "Bread Flour",
        "sourceType": "rate",
        "sourceName": "H-E-B Bread Flour 5 lb ($3.49)",
        "amount": 1000,
        "unit": "g",
        "cost": 1.54
      }
    ]
  }
}
```

Shape matches `CookLogCost` from `src/types/recipe.ts` plus an `estimatedAt` date field (ISO date string).

**Important:** Only write the recipe JSON after ALL ingredients have been priced successfully. No partial writes.

### Phase 7: Update cost-rates.json (if new rates discovered)

If any HEB lookups were performed and returned good results for common ingredients (flour, sugar, butter, eggs, milk, etc.), consider adding them to `cost-rates.json` for future lookups. This avoids redundant HEB API calls across recipes.

## Process: `/cost --refresh-rates`

1. Read `public/recipes/cost-rates.json`
2. For each entry in `rates`:
   - Call `mcp__heb__heb_product_search` with the ingredient name
   - Filter to in-stock products
   - Find cheapest per-gram option
   - Update `ratePerGram`, `sourceProduct`, and `updatedAt`
3. Write updated `cost-rates.json`
4. Output summary of changes

## Process: `/cost all`

1. Read `public/recipes/index.json`
2. For each recipe, run the full `/cost <recipe-id>` process sequentially
3. Output a final summary table of all recipes with totals

## Unit Conversion Reference

When calculating per-gram costs from HEB products:
- 1 oz = 28.35g
- 1 lb = 453.59g
- 1 gal = 3785.41g (for milk/water)
- 1 qt = 946.35g
- 1 fl oz = 29.57ml (use density ~1.0 for water-like liquids, ~0.92 for oils)
- 1 large egg ~ 50g (without shell)

## Ingredient ID Normalization

Recipes use inconsistent IDs across the catalog. When matching against cost-rates.json:
- Try exact `id` match first
- Normalize: replace hyphens with underscores, lowercase
- Common aliases:
  - `ap_flour`, `ap-flour`, `flour` -> all-purpose flour rate
  - `bread_flour`, `bread-flour` -> bread flour rate
  - `granulated_sugar`, `granulated-sugar`, `sugar` -> sugar rate
  - `fine-salt`, `fine-sea-salt`, `fine_salt` -> salt rate
  - `sourdough-discard`, `sourdough_discard`, `discard` -> sourdough discard rate (free)
  - `starter`, `sourdough_starter` -> starter rate (free)
  - `instant_yeast`, `instant-yeast`, `yeast` -> yeast rate
  - `whole_milk`, `whole-milk`, `milk` -> milk rate
  - `unsalted-butter`, `glaze-butter` -> butter rate
  - `levain_water`, `warm_water`, `warm-water`, `cold_water_*`, `water_*`, `*_water` -> water rate (free)
  - `ice` -> water rate (free)

## Notes

- This skill does NOT modify any UI components. It only writes data to recipe JSON files.
- The `estimatedCost` field is separate from `cook_log[].cost` (per-bake actual cost).
- Recipes with existing `estimatedCost` will be overwritten on re-run.
- The skill is agent-invocable: other skills can call `/cost` to populate cost data.
