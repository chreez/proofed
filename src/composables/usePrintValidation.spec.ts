import { describe, it, expect } from 'vitest'
import {
  validatePrintSections,
  isPrintReady,
  getValidationSummary,
} from './usePrintValidation'
import type { Recipe } from '@/types/recipe'

// Minimal valid recipe fixture
const minimalRecipe: Recipe = {
  meta: {
    name: 'Test Recipe',
    yields: '8 rolls',
    total_time: '2 hours',
  },
  config: {
    early_check_percent: 0.9,
  },
  vessels: [],
  stages: [
    {
      id: 'stage-1',
      title: 'Prepare',
      gather: {
        ingredients: [
          {
            id: 'flour',
            name: 'All-purpose flour',
            total: 390,
            unit: 'g',
            breakdown: null,
          },
        ],
      },
      states: [],
    },
  ],
  states: [],
  version: '1.0',
}

// Complete recipe fixture with all data
const completeRecipe: Recipe = {
  ...minimalRecipe,
  nutrition: {
    servings: 8,
    calculatedDate: '2024-01-15',
    dataSource: 'USDA FoodData Central',
    totals: {
      calories: 1800,
      protein: 50,
      totalFat: 60,
      saturatedFat: 20,
      carbohydrates: 240,
      sugar: 80,
      fiber: 10,
      sodium: 1200,
    },
    perServing: {
      calories: 225,
      protein: 6.25,
      totalFat: 7.5,
      saturatedFat: 2.5,
      carbohydrates: 30,
      sugar: 10,
      fiber: 1.25,
      sodium: 150,
    },
    breakdown: [],
  },
  cook_log: [
    {
      date: '2024-01-15',
      version: '1.0',
      notes: ['Bake went well'],
      cost: {
        total: 8.5,
        perServing: 1.06,
        servings: 8,
        items: [],
      },
    },
  ],
}

// Recipe with no ingredients
const emptyRecipe: Recipe = {
  ...minimalRecipe,
  stages: [
    {
      id: 'stage-1',
      title: 'Prepare',
      gather: null,
      states: [],
    },
  ],
}

// Recipe with nutrition but no cost
const partialRecipe: Recipe = {
  ...minimalRecipe,
  nutrition: completeRecipe.nutrition,
}

describe('usePrintValidation', () => {
  describe('validatePrintSections', () => {
    it('validates all sections for complete recipe', () => {
      const validation = validatePrintSections(completeRecipe)

      expect(validation.sections.header).toBe(true)
      expect(validation.sections.ingredients).toBe(true)
      expect(validation.sections.allergens).toBe(true)
      expect(validation.sections.nutrition).toBe(true)
      expect(validation.sections.cost).toBe(true)
      expect(validation.ready).toBe(true)
      expect(validation.summary).toBe('Ready to print')
    })

    it('validates minimal recipe with only ingredients', () => {
      const validation = validatePrintSections(minimalRecipe)

      expect(validation.sections.header).toBe(true)
      expect(validation.sections.ingredients).toBe(true)
      expect(validation.sections.allergens).toBe(true)
      expect(validation.sections.nutrition).toBe(false)
      expect(validation.sections.cost).toBe(false)
      expect(validation.ready).toBe(true)
      expect(validation.summary).toBe(
        'Ready to print (nutrition, cost will show placeholder)'
      )
    })

    it('validates partial recipe with nutrition but no cost', () => {
      const validation = validatePrintSections(partialRecipe)

      expect(validation.sections.header).toBe(true)
      expect(validation.sections.ingredients).toBe(true)
      expect(validation.sections.allergens).toBe(true)
      expect(validation.sections.nutrition).toBe(true)
      expect(validation.sections.cost).toBe(false)
      expect(validation.ready).toBe(true)
      expect(validation.summary).toBe('Ready to print (cost will show placeholder)')
    })

    it('blocks empty recipe with no ingredients', () => {
      const validation = validatePrintSections(emptyRecipe)

      expect(validation.sections.header).toBe(true)
      expect(validation.sections.ingredients).toBe(false)
      expect(validation.sections.allergens).toBe(true)
      expect(validation.sections.nutrition).toBe(false)
      expect(validation.sections.cost).toBe(false)
      expect(validation.ready).toBe(false)
      expect(validation.summary).toBe('Missing critical data: ingredients')
    })

    it('handles null recipe', () => {
      const validation = validatePrintSections(null)

      expect(validation.sections.header).toBe(false)
      expect(validation.sections.ingredients).toBe(false)
      expect(validation.sections.allergens).toBe(false)
      expect(validation.sections.nutrition).toBe(false)
      expect(validation.sections.cost).toBe(false)
      expect(validation.ready).toBe(false)
      expect(validation.summary).toBe('No recipe loaded')
    })

    it('validates recipe with zero-calorie nutrition as invalid', () => {
      const zeroCalorieRecipe: Recipe = {
        ...minimalRecipe,
        nutrition: {
          ...completeRecipe.nutrition!,
          totals: {
            ...completeRecipe.nutrition!.totals,
            calories: 0,
          },
        },
      }

      const validation = validatePrintSections(zeroCalorieRecipe)

      expect(validation.sections.nutrition).toBe(false)
      expect(validation.ready).toBe(true)
      expect(validation.summary).toBe(
        'Ready to print (nutrition, cost will show placeholder)'
      )
    })

    it('validates recipe with cost but no nutrition', () => {
      const costOnlyRecipe: Recipe = {
        ...minimalRecipe,
        cook_log: completeRecipe.cook_log,
      }

      const validation = validatePrintSections(costOnlyRecipe)

      expect(validation.sections.nutrition).toBe(false)
      expect(validation.sections.cost).toBe(true)
      expect(validation.ready).toBe(true)
      expect(validation.summary).toBe('Ready to print (nutrition will show placeholder)')
    })

    it('validates recipe with multiple cook_log entries (uses most recent)', () => {
      const multiLogRecipe: Recipe = {
        ...minimalRecipe,
        cook_log: [
          {
            date: '2024-01-01',
            version: '1.0',
            notes: ['First bake'],
            cost: {
              total: 5.0,
              perServing: 0.63,
              servings: 8,
              items: [],
            },
          },
          {
            date: '2024-02-01',
            version: '1.0',
            notes: ['Second bake'],
            cost: {
              total: 7.0,
              perServing: 0.88,
              servings: 8,
              items: [],
            },
          },
        ],
      }

      const validation = validatePrintSections(multiLogRecipe)

      expect(validation.sections.cost).toBe(true)
    })

    it('validates recipe with cook_log but no cost data', () => {
      const noCostRecipe: Recipe = {
        ...minimalRecipe,
        cook_log: [
          {
            date: '2024-01-15',
            version: '1.0',
            notes: ['Bake went well'],
          },
        ],
      }

      const validation = validatePrintSections(noCostRecipe)

      expect(validation.sections.cost).toBe(false)
      expect(validation.ready).toBe(true)
    })
  })

  describe('isPrintReady', () => {
    it('returns true for complete recipe', () => {
      expect(isPrintReady(completeRecipe)).toBe(true)
    })

    it('returns true for minimal recipe', () => {
      expect(isPrintReady(minimalRecipe)).toBe(true)
    })

    it('returns false for empty recipe', () => {
      expect(isPrintReady(emptyRecipe)).toBe(false)
    })

    it('returns false for null recipe', () => {
      expect(isPrintReady(null)).toBe(false)
    })
  })

  describe('getValidationSummary', () => {
    it('returns "Ready to print" for complete recipe', () => {
      expect(getValidationSummary(completeRecipe)).toBe('Ready to print')
    })

    it('returns placeholder summary for minimal recipe', () => {
      expect(getValidationSummary(minimalRecipe)).toBe(
        'Ready to print (nutrition, cost will show placeholder)'
      )
    })

    it('returns missing critical data for empty recipe', () => {
      expect(getValidationSummary(emptyRecipe)).toBe('Missing critical data: ingredients')
    })

    it('returns no recipe loaded for null', () => {
      expect(getValidationSummary(null)).toBe('No recipe loaded')
    })
  })
})
