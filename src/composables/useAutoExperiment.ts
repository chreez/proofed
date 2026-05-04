import type {
  Recipe,
  Ingredient,
  ExperimentConfig,
  ExperimentIngredient,
  ExperimentDerived,
  ExperimentRole,
  WaterContentTable
} from '@/types/recipe'
import { findWaterContentItem } from './useExperiment'

/** Keyword sets for role detection. Order matters — first match wins. */
const FLOUR_KEYWORDS = ['flour', 'semolina']
const LIQUID_KEYWORDS = [
  'water', 'milk', 'buttermilk', 'juice', 'cream', 'broth', 'stock',
  'yogurt', 'kefir', 'starter'
]
const INCLUSION_KEYWORDS = [
  'chocolate', 'chip', 'cheese', 'mozzarella', 'olive', 'walnut', 'pecan',
  'raisin', 'cranberry', 'jalapeno', 'jalapeño', 'pepperoni', 'nut',
  'seed', 'fruit', 'berry', 'almond', 'hazelnut', 'pistachio', 'cashew',
  'currant', 'fig', 'apricot', 'cherry', 'bacon', 'ham', 'sausage'
]

/** Classify an ingredient name into an experiment role. */
export function classifyRole(name: string): ExperimentRole {
  const lower = name.toLowerCase()
  if (FLOUR_KEYWORDS.some(k => lower.includes(k))) return 'base_flour'
  if (LIQUID_KEYWORDS.some(k => lower.includes(k))) return 'base_liquid'
  if (INCLUSION_KEYWORDS.some(k => lower.includes(k))) return 'inclusion'
  return 'enrichment'
}

/** Default slider ranges by role. */
const RANGE_DEFAULTS: Record<ExperimentRole, { minPct: number; maxPct: number; step: number }> = {
  base_flour:  { minPct: 0.8,  maxPct: 1.2,  step: 25 },
  base_liquid: { minPct: 0.7,  maxPct: 1.3,  step: 10 },
  inclusion:   { minPct: 0,    maxPct: 1.5,  step: 10 },
  enrichment:  { minPct: 0,    maxPct: 2.0,  step: 5 }
}

/** Pick adaptive step size based on amount. */
function adaptiveStep(amount: number, role: ExperimentRole): number {
  const defaultStep = RANGE_DEFAULTS[role].step
  if (amount <= 10) return 1
  if (amount <= 50) return Math.min(defaultStep, 5)
  return defaultStep
}

/** Try to find a waterContentId for an ingredient by matching against the table. */
function resolveWaterContentId(
  ingredientId: string,
  table: WaterContentTable
): string | undefined {
  const item = findWaterContentItem(ingredientId, table)
  return item?.id
}

/**
 * Collect all gram-based ingredients from a recipe, deduplicating by ID.
 * Returns ingredients in stage order, first occurrence wins.
 */
function collectGramIngredients(recipe: Recipe): Ingredient[] {
  const seen = new Set<string>()
  const result: Ingredient[] = []
  for (const stage of recipe.stages) {
    if (!stage.gather?.ingredients) continue
    for (const ing of stage.gather.ingredients) {
      if (ing.unit === 'g' && !seen.has(ing.id)) {
        seen.add(ing.id)
        result.push(ing)
      }
    }
  }
  return result
}

/**
 * Generate an ExperimentConfig from recipe ingredients automatically.
 * Returns null if recipe has no gram-based ingredients.
 */
export function generateExperimentConfig(
  recipe: Recipe,
  waterContentTable: WaterContentTable
): ExperimentConfig | null {
  const ingredients = collectGramIngredients(recipe)
  if (ingredients.length === 0) return null

  const experimentIngredients: ExperimentIngredient[] = ingredients.map(ing => {
    const role = classifyRole(ing.name)
    const range = RANGE_DEFAULTS[role]
    const step = adaptiveStep(ing.total, role)
    const min = Math.round(ing.total * range.minPct)
    const max = Math.round(ing.total * range.maxPct)

    const expIng: ExperimentIngredient = {
      id: ing.id,
      role,
      defaultAmount: ing.total,
      min,
      max,
      step
    }

    const wcId = resolveWaterContentId(ing.id, waterContentTable)
    if (wcId) {
      expIng.waterContentId = wcId
    }

    return expIng
  })

  const derived: ExperimentDerived[] = [
    { id: 'effective_hydration', label: 'Effective Hydration', unit: '%', type: 'effective_hydration' },
    { id: 'inclusion_load', label: 'Inclusion Load', unit: '%', type: 'inclusion_load' },
    { id: 'total_dough_weight', label: 'Total Dough Weight', unit: 'g', type: 'total_dough_weight' }
  ]

  return {
    description: 'Auto-generated experiment config — adjust any ingredient to explore variations',
    ingredients: experimentIngredients,
    derived,
    scaleMode: 'pre_scaled'
  }
}
