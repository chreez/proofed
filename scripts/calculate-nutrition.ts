/**
 * Calculate nutrition for a recipe JSON file using USDA data.
 *
 * Usage:
 *   npx tsx scripts/calculate-nutrition.ts public/recipes/atk-cinnamon-buns-ultimate.json
 *   npx tsx scripts/calculate-nutrition.ts --dry-run public/recipes/atk-cinnamon-buns-ultimate.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { USDA_NUTRIENTS, WHOLE_UNIT_GRAMS } from './usda-mappings'
import type { NutrientsPer100g } from './usda-mappings'

interface RecipeIngredient {
  id: string
  name: string
  total: number
  unit: string
}

interface RecipeStats {
  defaultYield: number
  unit: string
  servingsPerItem: number
  servingUnit: string
}

interface RecipeJSON {
  meta: { yields: string }
  config?: { stats?: RecipeStats | null }
  stages: { gather: { ingredients?: RecipeIngredient[] } | null }[]
  nutrition?: unknown
  [key: string]: unknown
}

interface IngredientNutrition {
  ingredientId: string
  ingredientName: string
  amount: number
  fdcId: number
  calories: number
  protein: number
  totalFat: number
  saturatedFat: number
  carbohydrates: number
  sugar: number
  fiber: number
  sodium: number
}

interface NutrientTotals {
  calories: number
  protein: number
  totalFat: number
  saturatedFat: number
  carbohydrates: number
  sugar: number
  fiber: number
  sodium: number
}

const NUTRIENT_KEYS: (keyof NutrientTotals)[] = [
  'calories', 'protein', 'totalFat', 'saturatedFat',
  'carbohydrates', 'sugar', 'fiber', 'sodium'
]

function round(n: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor) / factor
}

function resolveGrams(ingredient: RecipeIngredient): number {
  if (ingredient.unit === 'whole') {
    const gramsPerUnit = WHOLE_UNIT_GRAMS[ingredient.id]
    if (!gramsPerUnit) {
      console.warn(`  ⚠ No weight conversion for "${ingredient.id}" (unit: whole). Skipping.`)
      return 0
    }
    return ingredient.total * gramsPerUnit
  }
  // Assume grams
  return ingredient.total
}

function calculateForIngredient(
  ingredient: RecipeIngredient,
  nutrients: NutrientsPer100g
): IngredientNutrition {
  const grams = resolveGrams(ingredient)
  const factor = grams / 100

  return {
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    amount: grams,
    fdcId: nutrients.fdcId,
    calories: round(nutrients.calories * factor),
    protein: round(nutrients.protein * factor),
    totalFat: round(nutrients.totalFat * factor),
    saturatedFat: round(nutrients.saturatedFat * factor),
    carbohydrates: round(nutrients.carbohydrates * factor),
    sugar: round(nutrients.sugar * factor),
    fiber: round(nutrients.fiber * factor),
    sodium: round(nutrients.sodium * factor),
  }
}

function sumTotals(breakdown: IngredientNutrition[]): NutrientTotals {
  const totals: NutrientTotals = {
    calories: 0, protein: 0, totalFat: 0, saturatedFat: 0,
    carbohydrates: 0, sugar: 0, fiber: 0, sodium: 0,
  }
  for (const item of breakdown) {
    for (const key of NUTRIENT_KEYS) {
      totals[key] += item[key]
    }
  }
  // Round totals
  for (const key of NUTRIENT_KEYS) {
    totals[key] = round(totals[key])
  }
  return totals
}

function divideByServings(totals: NutrientTotals, servings: number): NutrientTotals {
  const perServing: NutrientTotals = {} as NutrientTotals
  for (const key of NUTRIENT_KEYS) {
    perServing[key] = round(totals[key] / servings)
  }
  return perServing
}

function parseServings(yields: string): { count: number; label: string } {
  // Strip approximate prefix (e.g., "~8 servings" → "8 servings")
  // Also strip trailing parenthetical notes (e.g., "100 crackers (2 sheet pans)" → "100 crackers")
  const cleaned = yields.replace(/^~\s*/, '').replace(/\s*\(.+\)\s*$/, '').trim()
  // Handle range yields like "2–3 baguettes" or "6-8 servings" (en-dash or hyphen)
  const rangeMatch = cleaned.match(/^(\d+)\s*[–\-]\s*(\d+)\s+(.+)$/)
  if (rangeMatch) {
    const high = parseInt(rangeMatch[2], 10)
    return { count: high, label: `1 ${rangeMatch[3].replace(/s$/, '')}` }
  }
  const match = cleaned.match(/^(\d+)\s+(.+)$/)
  if (!match) {
    throw new Error(`Cannot parse yields: "${yields}". Expected format: "8 buns" or "2–3 baguettes"`)
  }
  return { count: parseInt(match[1], 10), label: `1 ${match[2].replace(/s$/, '')}` }
}

/**
 * Prefer config.stats (defaultYield × servingsPerItem) when available — it is
 * the authoritative per-serving denominator used throughout the app. Falls
 * back to parsing meta.yields when stats are absent.
 */
function resolveServings(recipe: RecipeJSON): { count: number; label: string } {
  const stats = recipe.config?.stats
  if (stats && stats.defaultYield > 0 && stats.servingsPerItem > 0) {
    const count = stats.defaultYield * stats.servingsPerItem
    const unit = stats.servingUnit.replace(/s$/, '')
    return { count, label: `1 ${unit}` }
  }
  return parseServings(recipe.meta.yields)
}

function main(): void {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const filePath = args.find(a => !a.startsWith('--'))

  if (!filePath) {
    console.error('Usage: npx tsx scripts/calculate-nutrition.ts [--dry-run] <recipe.json>')
    process.exit(1)
  }

  console.log(`\nReading: ${filePath}`)
  const recipe: RecipeJSON = JSON.parse(readFileSync(filePath, 'utf-8'))

  // Resolve servings: prefer config.stats, fall back to yields parsing
  const { count: servings, label: servingSize } = resolveServings(recipe)
  console.log(`Servings: ${servings} (${servingSize})`)

  // Collect all ingredients from all stages
  const ingredients: RecipeIngredient[] = []
  for (const stage of recipe.stages) {
    if (stage.gather?.ingredients) {
      ingredients.push(...stage.gather.ingredients)
    }
  }
  console.log(`Found ${ingredients.length} ingredients\n`)

  // Calculate per-ingredient nutrition
  const breakdown: IngredientNutrition[] = []
  const missing: string[] = []

  for (const ing of ingredients) {
    const nutrients = USDA_NUTRIENTS[ing.id]
    if (!nutrients) {
      missing.push(ing.id)
      console.warn(`  ⚠ No USDA mapping for: ${ing.id} (${ing.name})`)
      continue
    }
    const result = calculateForIngredient(ing, nutrients)
    breakdown.push(result)

    const grams = resolveGrams(ing)
    console.log(`  ${ing.name.padEnd(30)} ${String(grams).padStart(5)}g → ${String(result.calories).padStart(7)} kcal`)
  }

  if (missing.length > 0) {
    console.error(`\n✗ Missing USDA mappings: ${missing.join(', ')}`)
    process.exit(1)
  }

  // Calculate totals and per-serving
  const totals = sumTotals(breakdown)
  const perServing = divideByServings(totals, servings)

  // Build nutrition block
  const nutrition = {
    servings,
    servingSize,
    calculatedDate: new Date().toISOString().split('T')[0],
    dataSource: 'USDA FoodData Central',
    totals,
    perServing,
    breakdown,
  }

  // Print summary
  console.log('\n── Full Recipe Totals ──')
  for (const key of NUTRIENT_KEYS) {
    const unit = key === 'sodium' ? 'mg' : key === 'calories' ? 'kcal' : 'g'
    console.log(`  ${key.padEnd(16)} ${String(totals[key]).padStart(8)} ${unit}`)
  }

  console.log(`\n── Per Serving (1 of ${servings}) ──`)
  for (const key of NUTRIENT_KEYS) {
    const unit = key === 'sodium' ? 'mg' : key === 'calories' ? 'kcal' : 'g'
    console.log(`  ${key.padEnd(16)} ${String(perServing[key]).padStart(8)} ${unit}`)
  }

  // Validation
  const sumCal = breakdown.reduce((s, b) => s + b.calories, 0)
  const diff = Math.abs(round(sumCal) - totals.calories)
  console.log(`\n── Validation ──`)
  console.log(`  sum(breakdown.calories) = ${round(sumCal)}, totals.calories = ${totals.calories}, diff = ${diff}`)
  if (diff > 1) {
    console.error('  ✗ Totals mismatch!')
  } else {
    console.log('  ✓ Totals match')
  }

  if (dryRun) {
    console.log('\n[DRY RUN] No file written.')
    return
  }

  // Write back to recipe JSON
  recipe.nutrition = nutrition
  writeFileSync(filePath, JSON.stringify(recipe, null, 2) + '\n', 'utf-8')
  console.log(`\n✓ Wrote nutrition block to ${filePath}`)
}

main()
