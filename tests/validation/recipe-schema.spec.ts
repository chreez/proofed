import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { Recipe, RecipeManifest, Ingredient } from '@/types/recipe'

// Helper to load all recipe files (excluding index.json)
function loadAllRecipes(): Array<{ id: string } & Recipe> {
  const recipesDir = join(process.cwd(), 'public/recipes')
  const files = readdirSync(recipesDir).filter(
    (f) => f.endsWith('.json') && f !== 'index.json'
  )
  return files.map((file) => {
    const content = JSON.parse(
      readFileSync(join(recipesDir, file), 'utf-8')
    ) as Recipe
    return { id: file.replace('.json', ''), ...content }
  })
}

// Helper to load recipe manifest
function loadManifest(): RecipeManifest {
  const manifestPath = join(process.cwd(), 'public/recipes/index.json')
  return JSON.parse(readFileSync(manifestPath, 'utf-8')) as RecipeManifest
}

// Valid units - grams or 'whole' for count-based items like eggs
const VALID_UNITS = ['g', 'whole']
const INVALID_UNITS = ['cups', 'cup', 'tbsp', 'tsp', 'tablespoon', 'teaspoon', 'oz', 'ounce', 'lb', 'pound']

describe('Recipe JSON Validation', () => {
  const recipes = loadAllRecipes()

  describe.each(recipes)('$id', (recipe) => {
    // D1: Units - grams only (with exception for count-based items)
    it('uses grams only for ingredient amounts', () => {
      const allIngredients: Ingredient[] = []

      // Collect all ingredients from all stages
      for (const stage of recipe.stages) {
        if (stage.gather?.ingredients) {
          allIngredients.push(...stage.gather.ingredients)
        }
      }

      for (const ingredient of allIngredients) {
        // Check that unit is valid
        expect(
          VALID_UNITS.includes(ingredient.unit),
          `Ingredient "${ingredient.name}" has invalid unit "${ingredient.unit}". Must be one of: ${VALID_UNITS.join(', ')}`
        ).toBe(true)

        // Ensure no invalid units are used
        expect(
          INVALID_UNITS.includes(ingredient.unit.toLowerCase()),
          `Ingredient "${ingredient.name}" uses prohibited unit "${ingredient.unit}"`
        ).toBe(false)
      }
    })

    // D5: Exit conditions required on all states
    it('has exit_condition on all states', () => {
      for (const state of recipe.states) {
        expect(
          state.exit_condition,
          `State "${state.id}" is missing exit_condition`
        ).toBeDefined()

        expect(
          state.exit_condition.trim().length > 0,
          `State "${state.id}" has empty exit_condition`
        ).toBe(true)
      }
    })

    // D6: Breakdown sums match total
    it('ingredient breakdown amounts sum to total', () => {
      const allIngredients: Ingredient[] = []

      // Collect all ingredients from all stages
      for (const stage of recipe.stages) {
        if (stage.gather?.ingredients) {
          allIngredients.push(...stage.gather.ingredients)
        }
      }

      for (const ingredient of allIngredients) {
        if (ingredient.breakdown && ingredient.breakdown.length > 0) {
          const breakdownSum = ingredient.breakdown.reduce(
            (sum, b) => sum + b.amount,
            0
          )

          expect(
            breakdownSum,
            `Ingredient "${ingredient.name}" breakdown sum (${breakdownSum}) does not match total (${ingredient.total})`
          ).toBeCloseTo(ingredient.total, 2)
        }
      }
    })

    // D14: Version summaries on changelog entries
    it('has non-empty summary on all changelog entries', () => {
      if (recipe.change_log) {
        for (const entry of recipe.change_log) {
          expect(
            entry.summary,
            `Changelog entry for version "${entry.version}" is missing summary`
          ).toBeDefined()

          expect(
            entry.summary.trim().length > 0,
            `Changelog entry for version "${entry.version}" has empty summary`
          ).toBe(true)
        }
      }
    })

    // D4: Timer only on passive states (RISE, BAKE, COOL, REST, PROOF, FERMENT, RETARD, TEMPER)
    it('has timer: true only on passive states', () => {
      const passivePatterns = [
        /rise/i,
        /bake/i,
        /cool/i,
        /rest/i,
        /proof/i,
        /ferment/i,
        /retard/i,
        /temper/i,
        /autolyse.*rest/i
      ]

      for (const state of recipe.states) {
        if (state.timer === true) {
          const isPassive = passivePatterns.some((pattern) =>
            pattern.test(state.id) || pattern.test(state.title)
          )

          expect(
            isPassive,
            `State "${state.id}" (${state.title}) has timer: true but is not a passive state`
          ).toBe(true)
        }
      }
    })

    // D7: Gather only on first stage (PREP)
    it('has gather section only on stages meant for gathering', () => {
      let firstGatherFound = false

      for (const stage of recipe.stages) {
        if (stage.gather !== null) {
          // First gather section should be on a PREP stage
          if (!firstGatherFound) {
            expect(
              stage.id.includes('PREP') || stage.states.length === 0,
              `First gather section should be on a PREP stage, found on "${stage.id}"`
            ).toBe(true)
            firstGatherFound = true
          }
        }
      }
    })
  })
})

// Manifest validation
describe('Recipe Manifest Validation', () => {
  let manifest: RecipeManifest
  let recipes: Array<{ id: string } & Recipe>

  beforeAll(() => {
    manifest = loadManifest()
    recipes = loadAllRecipes()
  })

  // D15: All family variant recipeIds exist in recipes array
  it('all family variant recipeIds exist in recipes array', () => {
    const recipeIds = manifest.recipes.map((r) => r.id)

    if (manifest.families) {
      for (const family of manifest.families) {
        for (const variant of family.variants) {
          expect(
            recipeIds.includes(variant.recipeId),
            `Family "${family.name}" variant "${variant.label}" references non-existent recipe "${variant.recipeId}"`
          ).toBe(true)
        }
      }
    }
  })

  // Verify all recipes in manifest have corresponding files
  it('all manifest recipes have corresponding files', () => {
    const loadedRecipeIds = recipes.map((r) => r.id)

    for (const entry of manifest.recipes) {
      const expectedId = entry.file.replace('.json', '')
      expect(
        loadedRecipeIds.includes(expectedId),
        `Manifest recipe "${entry.id}" references file "${entry.file}" which does not exist`
      ).toBe(true)
    }
  })

  // Verify manifest recipe IDs match file-derived IDs
  it('manifest recipe IDs are consistent with filenames', () => {
    for (const entry of manifest.recipes) {
      const fileBasedId = entry.file.replace('.json', '')
      expect(
        entry.id,
        `Manifest entry ID "${entry.id}" does not match filename "${entry.file}"`
      ).toBe(fileBasedId)
    }
  })
})
