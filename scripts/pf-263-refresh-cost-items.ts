/**
 * PF-263: Refresh cook_log[].cost.items[] on 5 recipes with missing line-items.
 *
 * For each of: birote-salado, gochujang-garlic-buns, ny-style-pizza,
 * simple-sourdough-wheat, sourdough-cinnamon-buns, this script:
 *
 * 1. Reads the most-recent cook_log[] entry.
 * 2. Rebuilds cost.items[] (CookLogCostItem shape) by pricing each gather
 *    ingredient via cost-rates.json (HEB-derived).
 * 3. Sums to total, computes perServing from existing cost.servings (or
 *    nutrition.servings fallback), preserves cost.servings on entries that
 *    already had it.
 * 4. Drops the legacy `cost.costs[]` field.
 * 5. Bumps the minor version + prepends a change_log[] entry with PF-237
 *    ingredient snapshot.
 *
 * Idempotent: re-running on already-refreshed recipes is a no-op (detected
 * by presence of cost.items[] on the most-recent entry).
 *
 * Usage:
 *   npx tsx scripts/pf-263-refresh-cost-items.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type {
  Recipe,
  Ingredient,
  Stage,
  CookLogEntry,
  CookLogCostItem,
  CookLogCost,
  IngredientSnapshotGroup,
} from '../src/types/recipe'

interface CostRate {
  name: string
  ratePerGram: number
  sourceProduct: string
  updatedAt: string
}

interface CostRatesFile {
  updatedAt: string
  source: string
  rates: Record<string, CostRate>
}

const RECIPES_DIR = resolve(__dirname, '..', 'public', 'recipes')
const RATES_PATH = resolve(RECIPES_DIR, 'cost-rates.json')
const TODAY = '2026-05-14'

const TARGETS: Array<{
  id: string
  newVersion: string
  servings: number
  // human-friendly summary suffix for change_log
}> = [
  { id: 'birote-salado', newVersion: 'v1.2.0', servings: 5 },
  { id: 'gochujang-garlic-buns', newVersion: 'v2.1.0', servings: 12 },
  { id: 'ny-style-pizza', newVersion: 'v1.5.0', servings: 2 },
  { id: 'simple-sourdough-wheat', newVersion: 'v1.1.0', servings: 10 },
  { id: 'sourdough-cinnamon-buns', newVersion: 'v1.2.0', servings: 8 },
]

function loadRates(): CostRatesFile {
  return JSON.parse(readFileSync(RATES_PATH, 'utf-8')) as CostRatesFile
}

function loadRecipe(id: string): Recipe {
  return JSON.parse(
    readFileSync(resolve(RECIPES_DIR, `${id}.json`), 'utf-8')
  ) as Recipe
}

function saveRecipe(id: string, recipe: Recipe): void {
  writeFileSync(
    resolve(RECIPES_DIR, `${id}.json`),
    JSON.stringify(recipe, null, 2) + '\n',
    'utf-8'
  )
}

/**
 * Match an ingredient id against cost-rates.json keys.
 * Tries: exact, underscore<->hyphen, lowercased.
 */
function lookupRate(
  rates: Record<string, CostRate>,
  ingredientId: string
): { rate: CostRate; key: string } | null {
  const candidates = [
    ingredientId,
    ingredientId.replace(/-/g, '_'),
    ingredientId.replace(/_/g, '-'),
    ingredientId.toLowerCase(),
  ]
  for (const c of candidates) {
    if (rates[c]) return { rate: rates[c], key: c }
  }
  return null
}

/**
 * Convert a CostRate sourceProduct string ("H-E-B Whole Milk 1 gal ($4.38)")
 * into the bare product name used as cook_log sourceName, mirroring
 * atk-cinnamon-buns-ultimate convention (no size, no price).
 */
function prettySourceName(sourceProduct: string): string {
  // Strip trailing " <size> ($X.YY)" and " ($X.YY)" patterns.
  // Also strip "(...)" parentheticals like "(est. ...)".
  // Also strip leading "~" before sizes (e.g., "~0.43 lb").
  let name = sourceProduct
    .replace(/\s*\([^)]*\)\s*$/g, '') // trailing parenthetical (often the price)
    .replace(/\s+~?\d+(?:\.\d+)?\s*(?:oz|lb|lbs|gal|qt|ct|g|kg|ml|l)\b.*$/i, '') // trailing size+
    .trim()
  return name || sourceProduct
}

/**
 * Build a CookLogCostItem for one Ingredient using the rates table.
 */
function priceIngredient(
  ing: Ingredient,
  rates: Record<string, CostRate>
): CookLogCostItem & { _matched: boolean } {
  const match = lookupRate(rates, ing.id)
  // eggs / egg unit handling: a "whole" egg is ~50g
  let grams = ing.total
  let unit = ing.unit
  if (ing.unit === 'whole' && /egg/i.test(ing.name)) {
    grams = ing.total * 50
    unit = 'whole'
  }

  if (!match) {
    return {
      ingredientId: ing.id,
      name: ing.name,
      sourceType: 'manual',
      sourceName: 'needs manual pricing',
      amount: ing.total,
      unit: ing.unit,
      cost: 0,
      _matched: false,
    }
  }

  const rawCost = match.rate.ratePerGram * grams
  const cost = Math.round(rawCost * 100) / 100
  // cost-rates.json header says `"source": "HEB store 428"` — most rates are
  // HEB-derived. Free items (water, home-maintained starter) carry a
  // "Tap water (free)" / "Home-maintained starter (free)" sourceProduct
  // string and are labeled `rate` (no HEB SKU). Everything else is `heb`.
  const isFreeDerived = /\bfree\b/i.test(match.rate.sourceProduct)
  const sourceType: 'heb' | 'rate' = isFreeDerived ? 'rate' : 'heb'
  return {
    ingredientId: ing.id,
    name: ing.name,
    sourceType,
    sourceName: prettySourceName(match.rate.sourceProduct),
    amount: ing.total,
    unit: ing.unit,
    cost,
    _matched: true,
  }
}

/**
 * Build a per-stage ingredient snapshot from a recipe's current gather state.
 */
function buildSnapshot(recipe: Recipe): IngredientSnapshotGroup[] {
  return recipe.stages
    .filter((s: Stage) => s.gather?.ingredients && s.gather.ingredients.length > 0)
    .map((s: Stage) => ({
      stageId: s.id,
      stageName: s.title,
      ingredients: JSON.parse(JSON.stringify(s.gather!.ingredients!)) as Ingredient[],
    }))
}

/**
 * Collect all gather ingredients from all stages (flat list, preserving order).
 */
function flatIngredients(recipe: Recipe): Ingredient[] {
  const out: Ingredient[] = []
  for (const s of recipe.stages) {
    if (s.gather?.ingredients) {
      for (const i of s.gather.ingredients) out.push(i)
    }
  }
  return out
}

/**
 * Increment the minor version of a semver-like string.
 * Inputs like "v1.1.0" -> "v1.2.0". Patch resets to 0.
 */
function bumpMinor(version: string): string {
  const m = version.match(/^v(\d+)\.(\d+)\.(\d+)$/)
  if (!m) throw new Error(`Cannot parse version: ${version}`)
  const major = Number(m[1])
  const minor = Number(m[2])
  return `v${major}.${minor + 1}.0`
}

function processRecipe(target: typeof TARGETS[number]): void {
  const ratesFile = loadRates()
  const recipe = loadRecipe(target.id)

  if (!recipe.cook_log || recipe.cook_log.length === 0) {
    console.log(`[${target.id}] no cook_log — skipping`)
    return
  }

  const last: CookLogEntry = recipe.cook_log[recipe.cook_log.length - 1]
  if (last.cost?.items && last.cost.items.length > 0) {
    console.log(`[${target.id}] last entry already has cost.items[] — skipping`)
    return
  }

  // Price each ingredient
  const ingredients = flatIngredients(recipe)
  const priced = ingredients.map((i) => priceIngredient(i, ratesFile.rates))

  const items: CookLogCostItem[] = priced.map((p) => {
    // Strip our internal _matched flag from the persisted object
    const { _matched, ...rest } = p as CookLogCostItem & { _matched?: boolean }
    return rest
  })

  const unmatched = priced.filter((p) => !p._matched)
  const hebHits = priced.filter((p) => p._matched).length

  const total = Math.round(items.reduce((s, i) => s + i.cost, 0) * 100) / 100
  const servings = target.servings
  const perServing = Math.round((total / servings) * 100) / 100

  // Preserve any legacy `cost.note`, drop `cost.costs[]` (legacy) and any
  // other stray fields. Build the new canonical CookLogCost.
  const newCost: CookLogCost = {
    total,
    perServing,
    servings,
    items,
  }
  if (last.cost && typeof (last.cost as { note?: string }).note === 'string') {
    newCost.note = (last.cost as { note?: string }).note
  }
  last.cost = newCost

  // Version bump + change_log entry with snapshot
  const oldVersion = recipe.version
  if (oldVersion === target.newVersion) {
    console.log(
      `[${target.id}] version already at ${target.newVersion} — odd state, aborting`
    )
    return
  }
  recipe.version = target.newVersion

  const fallbackNote = unmatched.length
    ? ` Manual fallback for ${unmatched
        .map((u) => u.ingredientId)
        .join(', ')} — not in cost-rates.json.`
    : ''
  const summary =
    `Refresh cook_log[].cost.items[] line-items from HEB-derived ` +
    `pantry rates (cost-rates.json @ HEB store 428).` +
    ` Total $${total.toFixed(2)} / $${perServing.toFixed(2)} per ` +
    `serving (×${servings}). PF-263.${fallbackNote}`

  const entry = {
    version: target.newVersion,
    date: TODAY,
    summary,
    ingredients: buildSnapshot(recipe),
  }
  recipe.change_log = [entry, ...(recipe.change_log ?? [])]

  saveRecipe(target.id, recipe)

  console.log(
    `[${target.id}] ${oldVersion} -> ${target.newVersion} | ` +
      `items=${items.length} hebHits=${hebHits} unmatched=${unmatched.length} | ` +
      `total $${total.toFixed(2)} perServing $${perServing.toFixed(2)} (×${servings})` +
      (unmatched.length
        ? ` | fallbacks: ${unmatched.map((u) => u.ingredientId).join(',')}`
        : '')
  )
}

function main(): void {
  for (const t of TARGETS) {
    processRecipe(t)
  }
}

main()
