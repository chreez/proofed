import { describe, it, expect } from 'vitest'
import {
  validatePrintSections,
  isPrintReady,
  getValidationSummary,
} from './usePrintValidation'
import type { Recipe, CookLogCostItem } from '@/types/recipe'

// Helper to make cost items
function makeCostItem(overrides: Partial<CookLogCostItem> = {}): CookLogCostItem {
  return {
    ingredientId: 'flour',
    name: 'All-purpose flour',
    sourceType: 'heb',
    sourceName: 'H-E-B All Purpose Flour 5lb',
    amount: 390,
    unit: 'g',
    cost: 1.25,
    ...overrides,
  }
}

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
        items: [makeCostItem()],
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
      expect(validation.checks).toHaveLength(9)
      expect(validation.checks.every((c) => c.pass)).toBe(true)
    })

    it('blocks recipe missing nutrition (PV3)', () => {
      const validation = validatePrintSections(minimalRecipe)

      expect(validation.sections.ingredients).toBe(true)
      expect(validation.sections.nutrition).toBe(false)
      expect(validation.ready).toBe(false)
      expect(validation.checks.find((c) => c.id === 'PV3')?.pass).toBe(false)
    })

    it('blocks empty recipe with no ingredients (PV1)', () => {
      const validation = validatePrintSections(emptyRecipe)

      expect(validation.sections.ingredients).toBe(false)
      expect(validation.ready).toBe(false)
      expect(validation.checks.find((c) => c.id === 'PV1')?.pass).toBe(false)
    })

    it('handles null recipe', () => {
      const validation = validatePrintSections(null)

      expect(validation.sections.header).toBe(false)
      expect(validation.ready).toBe(false)
      expect(validation.summary).toBe('No recipe loaded')
      expect(validation.checks).toHaveLength(0)
    })

    it('validates recipe with zero-calorie nutrition as PV3 fail', () => {
      const zeroCalorieRecipe: Recipe = {
        ...completeRecipe,
        nutrition: {
          ...completeRecipe.nutrition!,
          totals: {
            ...completeRecipe.nutrition!.totals,
            calories: 0,
          },
        },
      }

      const validation = validatePrintSections(zeroCalorieRecipe)
      expect(validation.checks.find((c) => c.id === 'PV3')?.pass).toBe(false)
      expect(validation.ready).toBe(false)
    })
  })

  describe('PV4: Cost data new schema', () => {
    it('fails when cook_log has cost with empty items[]', () => {
      const recipe: Recipe = {
        ...completeRecipe,
        cook_log: [
          {
            date: '2024-01-15',
            version: '1.0',
            notes: ['test'],
            cost: {
              total: 8.5,
              perServing: 1.06,
              servings: 8,
              items: [],
            },
          },
        ],
      }

      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV4')
      expect(check?.pass).toBe(false)
    })

    it('passes when cook_log has cost with populated items[]', () => {
      const check = validatePrintSections(completeRecipe).checks.find((c) => c.id === 'PV4')
      expect(check?.pass).toBe(true)
    })

    it('fails when no cook_log exists', () => {
      const check = validatePrintSections(minimalRecipe).checks.find((c) => c.id === 'PV4')
      expect(check?.pass).toBe(false)
    })

    it('passes when estimatedCost has populated items[]', () => {
      const recipe: Recipe = {
        ...minimalRecipe,
        estimatedCost: {
          items: [
            { ingredientId: 'flour', name: 'Flour', amount: 500, unit: 'g', cost: 1.5, sourceType: 'rate', sourceName: 'HEB Flour 5lb' },
          ],
          total: 1.5,
          perServing: 0.19,
          servings: 8,
          estimatedAt: '2026-04-23',
        },
      }
      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV4')
      expect(check?.pass).toBe(true)
      expect(check?.detail).toContain('estimatedCost')
    })

    it('passes with estimatedCost and counts bake cost sources', () => {
      const recipe: Recipe = {
        ...completeRecipe,
        estimatedCost: {
          items: [
            { ingredientId: 'flour', name: 'Flour', amount: 500, unit: 'g', cost: 1.5, sourceType: 'rate', sourceName: 'HEB Flour 5lb' },
          ],
          total: 1.5,
          perServing: 0.19,
          servings: 8,
          estimatedAt: '2026-04-23',
        },
      }
      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV4')
      expect(check?.pass).toBe(true)
      expect(check?.detail).toContain('2 cost sources')
    })
  })

  describe('PV5: Serving label coherence', () => {
    it('fails when servings mismatch without meta.yields', () => {
      const recipe: Recipe = {
        ...completeRecipe,
        meta: { ...completeRecipe.meta, yields: '' },
        nutrition: { ...completeRecipe.nutrition!, servings: 8 },
        cook_log: [
          {
            date: '2024-01-15',
            version: '1.0',
            notes: ['test'],
            cost: {
              total: 8.5,
              perServing: 0.85,
              servings: 10, // different from nutrition.servings=8
              items: [makeCostItem()],
            },
          },
        ],
      }

      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV5')
      expect(check?.pass).toBe(false)
      expect(check?.detail).toContain('10')
      expect(check?.detail).toContain('8')
    })

    it('passes when servings mismatch but meta.yields present', () => {
      const recipe: Recipe = {
        ...completeRecipe,
        meta: { ...completeRecipe.meta, yields: '10 buns' },
        nutrition: { ...completeRecipe.nutrition!, servings: 8 },
        cook_log: [
          {
            date: '2024-01-15',
            version: '1.0',
            notes: ['test'],
            cost: {
              total: 8.5,
              perServing: 0.85,
              servings: 10,
              items: [makeCostItem()],
            },
          },
        ],
      }

      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV5')
      expect(check?.pass).toBe(true)
    })

    it('passes when servings match', () => {
      const check = validatePrintSections(completeRecipe).checks.find((c) => c.id === 'PV5')
      expect(check?.pass).toBe(true)
    })
  })

  describe('PV6: No stale terminology', () => {
    it('fails when sourceName contains "negligible"', () => {
      const recipe: Recipe = {
        ...completeRecipe,
        cook_log: [
          {
            date: '2024-01-15',
            version: '1.0',
            notes: ['test'],
            cost: {
              total: 8.5,
              perServing: 1.06,
              servings: 8,
              items: [
                makeCostItem(),
                makeCostItem({
                  ingredientId: 'salt',
                  name: 'Salt',
                  sourceName: 'Negligible cost',
                  cost: 0,
                }),
              ],
            },
          },
        ],
      }

      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV6')
      expect(check?.pass).toBe(false)
      expect(check?.detail).toContain('Salt')
    })

    it('passes when no stale terminology', () => {
      const check = validatePrintSections(completeRecipe).checks.find((c) => c.id === 'PV6')
      expect(check?.pass).toBe(true)
    })
  })

  describe('PV7: Cost items sourced', () => {
    it('fails when sourceName is empty', () => {
      const recipe: Recipe = {
        ...completeRecipe,
        cook_log: [
          {
            date: '2024-01-15',
            version: '1.0',
            notes: ['test'],
            cost: {
              total: 8.5,
              perServing: 1.06,
              servings: 8,
              items: [
                makeCostItem(),
                makeCostItem({
                  ingredientId: 'yeast',
                  name: 'Yeast',
                  sourceName: '',
                  cost: 0.10,
                }),
              ],
            },
          },
        ],
      }

      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV7')
      expect(check?.pass).toBe(false)
      expect(check?.detail).toContain('Yeast')
    })

    it('passes when all items have sourceName', () => {
      const check = validatePrintSections(completeRecipe).checks.find((c) => c.id === 'PV7')
      expect(check?.pass).toBe(true)
    })
  })

  describe('PV8: Recipe has yields', () => {
    it('fails when yields is empty', () => {
      const recipe: Recipe = {
        ...completeRecipe,
        meta: { ...completeRecipe.meta, yields: '' },
      }

      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV8')
      expect(check?.pass).toBe(false)
    })

    it('passes when yields is present', () => {
      const check = validatePrintSections(completeRecipe).checks.find((c) => c.id === 'PV8')
      expect(check?.pass).toBe(true)
    })
  })

  describe('PV9: Estimation provenance', () => {
    it('fails when nutrition has no dataSource or calculatedDate', () => {
      const recipe: Recipe = {
        ...completeRecipe,
        nutrition: {
          ...completeRecipe.nutrition!,
          dataSource: '',
          calculatedDate: '',
        },
      }

      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV9')
      expect(check?.pass).toBe(false)
      expect(check?.detail).toContain('dataSource')
    })

    it('passes when dataSource exists', () => {
      const check = validatePrintSections(completeRecipe).checks.find((c) => c.id === 'PV9')
      expect(check?.pass).toBe(true)
    })

    it('passes when only calculatedDate exists', () => {
      const recipe: Recipe = {
        ...completeRecipe,
        nutrition: {
          ...completeRecipe.nutrition!,
          dataSource: '',
          calculatedDate: '2024-01-15',
        },
      }

      const check = validatePrintSections(recipe).checks.find((c) => c.id === 'PV9')
      expect(check?.pass).toBe(true)
    })
  })

  describe('isPrintReady', () => {
    it('returns true for complete recipe', () => {
      expect(isPrintReady(completeRecipe)).toBe(true)
    })

    it('returns false for minimal recipe (missing nutrition + cost)', () => {
      expect(isPrintReady(minimalRecipe)).toBe(false)
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

    it('returns failure summary for minimal recipe', () => {
      const summary = getValidationSummary(minimalRecipe)
      expect(summary).toContain('failed')
      expect(summary).toContain('PV3')
      expect(summary).toContain('PV4')
    })

    it('returns no recipe loaded for null', () => {
      expect(getValidationSummary(null)).toBe('No recipe loaded')
    })
  })
})
