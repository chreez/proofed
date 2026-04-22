import type { Recipe } from '@/types/recipe'
import { allergenMap, type AllergenType } from '@/data/allergenMap'

/**
 * FDA Big 9 canonical order (FALCPA + FASTER Act).
 * This is the order allergens must be displayed in.
 */
const FDA_CANONICAL_ORDER: AllergenType[] = [
  'Milk',
  'Eggs',
  'Fish',
  'Crustacean Shellfish',
  'Tree Nuts',
  'Peanuts',
  'Wheat',
  'Soybeans',
  'Sesame',
]

/**
 * Derives allergens from recipe ingredients using the allergen lookup table.
 * Returns allergens in FDA Big 9 canonical order.
 *
 * @param recipe - Recipe object with stages and ingredients
 * @returns Array of allergen strings in FDA canonical order
 */
export function deriveAllergens(recipe: Recipe): AllergenType[] {
  const allergenSet = new Set<AllergenType>()

  // Check if recipe has an override
  if (recipe.meta.allergenOverride) {
    recipe.meta.allergenOverride.forEach(allergen => allergenSet.add(allergen as AllergenType))
  } else {
    // Collect allergens from all ingredients across all stages
    for (const stage of recipe.stages) {
      if (stage.gather?.ingredients) {
        for (const ingredient of stage.gather.ingredients) {
          const allergens = allergenMap[ingredient.id] || []
          allergens.forEach(allergen => allergenSet.add(allergen))
        }
      }
    }
  }

  // Sort in FDA canonical order
  const allergenArray = Array.from(allergenSet)
  return allergenArray.sort(
    (a, b) => FDA_CANONICAL_ORDER.indexOf(a) - FDA_CANONICAL_ORDER.indexOf(b)
  )
}
