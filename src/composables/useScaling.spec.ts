import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useScaling } from './useScaling'
import type { Recipe } from '@/types/recipe'

function makeRecipe(overrides = {}): Recipe {
  return {
    meta: { name: 'Test', source: { name: 'Test' }, yields: '2 pizzas', total_time: '1h' },
    config: { early_check_percent: 75 },
    vessels: [],
    stages: [
      {
        id: 'prep',
        title: 'Prep',
        gather: {
          ingredients: [
            { id: 'flour', name: 'Flour', total: 390, unit: 'g', breakdown: null },
            {
              id: 'butter',
              name: 'Butter',
              total: 140,
              unit: 'g',
              breakdown: [
                { label: 'filling', amount: 14 },
                { label: 'dough', amount: 28 }
              ]
            }
          ]
        },
        states: ['mix']
      }
    ],
    states: [
      {
        id: 'mix',
        title: 'Mix',
        direction: 'Mix everything',
        components: null,
        exit_condition: 'Done',
        notes: null
      }
    ],
    scaling: {
      tested_range: { min: 1, max: 2 },
      ingredients: [
        { id: 'flour', behavior: 'linear' as const, note: 'Scales linearly' },
        { id: 'yeast', behavior: 'fixed' as const, note: 'Does not scale' }
      ],
      process_caveats: ['Watch vessel size', 'Fermentation timing changes'],
      researched_date: '2026-04-08',
      sources: ['Test source']
    },
    version: 'v1.0.0',
    ...overrides
  } as unknown as Recipe
}

describe('useScaling', () => {
  it('initializes with multiplier 1 when no external ref', () => {
    const scaling = useScaling(makeRecipe())
    expect(scaling.multiplier.value).toBe(1)
  })

  it('uses external multiplier ref when provided', () => {
    const ext = ref(3)
    const scaling = useScaling(makeRecipe(), ext)
    expect(scaling.multiplier.value).toBe(3)
  })

  describe('availableMultipliers', () => {
    it('returns [1] when no scaling block', () => {
      const scaling = useScaling(makeRecipe({ scaling: undefined }))
      expect(scaling.availableMultipliers.value).toEqual([1])
    })

    it('returns range from min to max+2', () => {
      const scaling = useScaling(makeRecipe())
      expect(scaling.availableMultipliers.value).toEqual([1, 2, 3, 4])
    })
  })

  describe('isUntested', () => {
    it('returns false when no scaling block', () => {
      const scaling = useScaling(makeRecipe({ scaling: undefined }))
      expect(scaling.isUntested.value).toBe(false)
    })

    it('returns false when within tested range', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      expect(scaling.isUntested.value).toBe(false)
    })

    it('returns true when beyond tested range', () => {
      const ext = ref(3)
      const scaling = useScaling(makeRecipe(), ext)
      expect(scaling.isUntested.value).toBe(true)
    })
  })

  describe('scaleIngredient', () => {
    it('returns original at 1×', () => {
      const scaling = useScaling(makeRecipe())
      const ing = { id: 'flour', name: 'Flour', total: 390, unit: 'g', breakdown: null }
      const result = scaling.scaleIngredient(ing)
      expect(result.total).toBe(390)
    })

    it('scales total by multiplier', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      const ing = { id: 'flour', name: 'Flour', total: 390, unit: 'g', breakdown: null }
      const result = scaling.scaleIngredient(ing)
      expect(result.total).toBe(780)
    })

    it('scales breakdown amounts', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      const ing = {
        id: 'butter',
        name: 'Butter',
        total: 140,
        unit: 'g',
        breakdown: [{ label: 'filling', amount: 14 }, { label: 'dough', amount: 28 }]
      }
      const result = scaling.scaleIngredient(ing)
      expect(result.total).toBe(280)
      expect(result.breakdown![0].amount).toBe(28)
      expect(result.breakdown![1].amount).toBe(56)
    })
  })

  describe('getScaledIngredients', () => {
    it('returns all ingredients from all stages', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      const result = scaling.getScaledIngredients()
      expect(result.length).toBe(2)
      expect(result[0].total).toBe(780)
      expect(result[1].total).toBe(280)
    })

    it('skips stages without gather', () => {
      const recipe = makeRecipe({
        stages: [
          { id: 'bake', title: 'Bake', gather: null, states: ['mix'] }
        ]
      })
      const scaling = useScaling(recipe)
      expect(scaling.getScaledIngredients()).toEqual([])
    })
  })

  describe('scaleComponentAmount', () => {
    it('scales numeric prefix', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      expect(scaling.scaleComponentAmount('390g')).toBe('780g')
    })

    it('returns original for non-numeric', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      expect(scaling.scaleComponentAmount('to taste')).toBe('to taste')
    })
  })

  describe('scaleNutrition', () => {
    const totals = {
      calories: 100,
      protein: 10,
      totalFat: 5,
      saturatedFat: 2,
      carbohydrates: 20,
      sugar: 8,
      fiber: 3,
      sodium: 500
    }

    it('returns original at 1×', () => {
      const scaling = useScaling(makeRecipe())
      expect(scaling.scaleNutrition(totals)).toBe(totals)
    })

    it('scales all fields by multiplier', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      const result = scaling.scaleNutrition(totals)
      expect(result.calories).toBe(200)
      expect(result.protein).toBe(20)
      expect(result.sodium).toBe(1000)
    })
  })

  describe('getScaledYields', () => {
    it('returns original at 1×', () => {
      const scaling = useScaling(makeRecipe())
      expect(scaling.getScaledYields()).toBe('2 pizzas')
    })

    it('scales numeric yields with multiplier badge', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      expect(scaling.getScaledYields()).toBe('4 pizzas (×2)')
    })

    it('returns original for non-numeric yields', () => {
      const ext = ref(2)
      const recipe = makeRecipe({ meta: { name: 'T', source: { name: 'S' }, yields: 'one batch', total_time: '1h' } })
      const scaling = useScaling(recipe, ext)
      expect(scaling.getScaledYields()).toBe('one batch')
    })
  })

  describe('processCaveats', () => {
    it('returns empty at 1×', () => {
      const scaling = useScaling(makeRecipe())
      expect(scaling.processCaveats.value).toEqual([])
    })

    it('returns caveats when multiplier > 1', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      expect(scaling.processCaveats.value).toEqual(['Watch vessel size', 'Fermentation timing changes'])
    })

    it('returns empty when no scaling block', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe({ scaling: undefined }), ext)
      expect(scaling.processCaveats.value).toEqual([])
    })
  })

  describe('getIngredientNote', () => {
    it('returns undefined at 1×', () => {
      const scaling = useScaling(makeRecipe())
      expect(scaling.getIngredientNote('yeast')).toBeUndefined()
    })

    it('returns undefined for linear ingredients', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      expect(scaling.getIngredientNote('flour')).toBeUndefined()
    })

    it('returns note for non-linear ingredients', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      expect(scaling.getIngredientNote('yeast')).toBe('Does not scale')
    })

    it('returns undefined for unknown ingredient', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe(), ext)
      expect(scaling.getIngredientNote('unknown')).toBeUndefined()
    })

    it('returns undefined when no scaling block', () => {
      const ext = ref(2)
      const scaling = useScaling(makeRecipe({ scaling: undefined }), ext)
      expect(scaling.getIngredientNote('yeast')).toBeUndefined()
    })
  })
})
