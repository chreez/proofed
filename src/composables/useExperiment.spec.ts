import { describe, it, expect } from 'vitest'
import { useExperiment, resolveWaterPercent, findWaterContentItem } from './useExperiment'
import type { FreeformIngredient } from './useExperiment'
import type { Recipe, ExperimentConfig, ExperimentIngredient, WaterContentTable } from '@/types/recipe'

// --- Test fixtures ---

/** Minimal water content table for testing. */
const waterContentTable: WaterContentTable = {
  version: '1.0.0',
  updatedAt: '2026-05-01',
  description: 'Test water content table',
  sources: ['Test'],
  categories: [
    {
      id: 'flour',
      name: 'Flours',
      items: [
        { id: 'bread-flour', name: 'Bread Flour', waterPercent: 11.8, note: '', aliases: ['strong-flour'] }
      ]
    },
    {
      id: 'liquids',
      name: 'Liquids',
      items: [
        { id: 'water', name: 'Water', waterPercent: 100, note: '', aliases: [] }
      ]
    },
    {
      id: 'dairy',
      name: 'Dairy',
      items: [
        { id: 'butter-unsalted', name: 'Butter', waterPercent: 16, note: '', aliases: ['butter'] },
        { id: 'nonfat-milk-powder', name: 'Nonfat Milk Powder', waterPercent: 3.5, note: '', aliases: ['milk-powder'] }
      ]
    },
    {
      id: 'cheese',
      name: 'Cheeses',
      items: [
        { id: 'cheddar', name: 'Cheddar', waterPercent: 36.8, note: '', aliases: ['sharp-cheddar'] }
      ]
    },
    {
      id: 'vegetables',
      name: 'Vegetables',
      items: [
        { id: 'jalapeno-raw', name: 'Jalapeño (raw)', waterPercent: 91.7, note: '', aliases: ['jalapeno', 'jalapenos'] }
      ]
    },
    {
      id: 'leavening',
      name: 'Leavening',
      items: [
        { id: 'sourdough-starter-100', name: 'Sourdough Starter', waterPercent: 46, note: '', aliases: ['starter', 'levain'] },
        { id: 'salt', name: 'Salt', waterPercent: 0, note: '', aliases: [] }
      ]
    },
    {
      id: 'sugars',
      name: 'Sugars',
      items: [
        { id: 'brown-sugar', name: 'Brown Sugar', waterPercent: 1.3, note: '', aliases: [] }
      ]
    }
  ]
}

/**
 * Jalapeño Cheddar Sourdough experiment config.
 * Based on the actual recipe: 550g flour, 360g water, 10g starter,
 * 120g jalapeños, 220g cheddar, 45g butter, 10g salt, 25g milk powder, 28g brown sugar.
 */
const experimentConfig: ExperimentConfig = {
  description: 'Adjust inclusion amounts and hydration for jalapeño cheddar sourdough',
  scaleMode: 'pre_scaled',
  ingredients: [
    { id: 'flour', role: 'base_flour', defaultAmount: 550, min: 450, max: 650, step: 25, waterContentId: 'bread-flour' },
    { id: 'water', role: 'base_liquid', defaultAmount: 360, min: 280, max: 420, step: 10, waterContentId: 'water' },
    { id: 'jalapenos', role: 'inclusion', defaultAmount: 120, min: 0, max: 200, step: 10, waterContentId: 'jalapeno-raw' },
    { id: 'cheddar', role: 'inclusion', defaultAmount: 220, min: 0, max: 350, step: 25, waterContentId: 'cheddar' },
    { id: 'butter', role: 'enrichment', defaultAmount: 45, min: 0, max: 80, step: 5, waterContentId: 'butter-unsalted' },
    { id: 'starter', role: 'enrichment', defaultAmount: 10, min: 5, max: 20, step: 1, waterContentId: 'sourdough-starter-100' },
    { id: 'salt', role: 'enrichment', defaultAmount: 10, min: 5, max: 15, step: 1, waterContentId: 'salt' },
    { id: 'milk-powder', role: 'enrichment', defaultAmount: 25, min: 0, max: 50, step: 5, waterContentId: 'nonfat-milk-powder' },
    { id: 'brown-sugar', role: 'enrichment', defaultAmount: 28, min: 0, max: 50, step: 5, waterContentId: 'brown-sugar' }
  ],
  derived: [
    { id: 'effective-hydration', label: 'Effective Hydration', unit: '%', type: 'effective_hydration' },
    { id: 'inclusion-load', label: 'Inclusion Load', unit: '%', type: 'inclusion_load' },
    { id: 'total-dough', label: 'Total Dough Weight', unit: 'g', type: 'total_dough_weight' }
  ]
}

function makeRecipe(experimentOverrides?: Partial<ExperimentConfig>): Recipe {
  return {
    meta: { name: 'Jalapeño Cheddar Sourdough', source: { name: 'Proof Bread' }, yields: '2 loaves', total_time: '26h' },
    config: { early_check_percent: 0.8 },
    vessels: [],
    stages: [
      {
        id: 'LEVAIN',
        title: 'Levain Build',
        gather: {
          ingredients: [
            { id: 'flour', name: 'Bread Flour', total: 550, unit: 'g', breakdown: [{ label: 'levain', amount: 50 }, { label: 'dough', amount: 500 }] },
            { id: 'water', name: 'Water', total: 360, unit: 'g', breakdown: [{ label: 'levain', amount: 50 }, { label: 'dough', amount: 310 }] },
            { id: 'starter', name: 'Ripe Sourdough Starter', total: 10, unit: 'g', breakdown: null }
          ]
        },
        states: ['levain-ferment']
      },
      {
        id: 'PREP',
        title: 'Mise en Place',
        gather: {
          ingredients: [
            { id: 'salt', name: 'Fine Sea Salt', total: 10, unit: 'g', breakdown: null },
            { id: 'milk-powder', name: 'Nonfat Milk Powder', total: 25, unit: 'g', breakdown: null },
            { id: 'brown-sugar', name: 'Brown Sugar', total: 28, unit: 'g', breakdown: null },
            { id: 'jalapenos', name: 'Fresh Jalapeños', total: 120, unit: 'g', breakdown: null },
            { id: 'cheddar', name: 'Sharp Cheddar Cheese (block)', total: 220, unit: 'g', breakdown: null }
          ]
        },
        states: []
      },
      {
        id: 'MIX',
        title: 'Dough Mixing',
        gather: {
          ingredients: [
            { id: 'butter', name: 'Unsalted Butter (room temp)', total: 45, unit: 'g', breakdown: null }
          ]
        },
        states: []
      }
    ],
    states: [],
    version: 'v1.0.0',
    experiment: { ...experimentConfig, ...experimentOverrides }
  } as unknown as Recipe
}

// --- Tests ---

describe('resolveWaterPercent', () => {
  it('returns waterContentOverride when set', () => {
    const ing: ExperimentIngredient = {
      id: 'custom',
      role: 'enrichment',
      defaultAmount: 50,
      min: 0, max: 100, step: 5,
      waterContentOverride: 42
    }
    expect(resolveWaterPercent(ing, waterContentTable)).toBe(42)
  })

  it('looks up by waterContentId', () => {
    const ing: ExperimentIngredient = {
      id: 'my-cheese',
      role: 'inclusion',
      defaultAmount: 200,
      min: 0, max: 300, step: 25,
      waterContentId: 'cheddar'
    }
    expect(resolveWaterPercent(ing, waterContentTable)).toBe(36.8)
  })

  it('falls back to ingredient id match', () => {
    const ing: ExperimentIngredient = {
      id: 'bread-flour',
      role: 'base_flour',
      defaultAmount: 500,
      min: 400, max: 600, step: 25
    }
    expect(resolveWaterPercent(ing, waterContentTable)).toBe(11.8)
  })

  it('matches by alias', () => {
    const ing: ExperimentIngredient = {
      id: 'strong-flour',
      role: 'base_flour',
      defaultAmount: 500,
      min: 400, max: 600, step: 25
    }
    expect(resolveWaterPercent(ing, waterContentTable)).toBe(11.8)
  })

  it('returns 0 when no match found', () => {
    const ing: ExperimentIngredient = {
      id: 'unknown-ingredient',
      role: 'enrichment',
      defaultAmount: 10,
      min: 0, max: 20, step: 1
    }
    expect(resolveWaterPercent(ing, waterContentTable)).toBe(0)
  })
})

describe('findWaterContentItem', () => {
  it('finds by exact id', () => {
    const item = findWaterContentItem('cheddar', waterContentTable)
    expect(item).toBeDefined()
    expect(item!.waterPercent).toBe(36.8)
  })

  it('finds by alias', () => {
    const item = findWaterContentItem('jalapeno', waterContentTable)
    expect(item).toBeDefined()
    expect(item!.waterPercent).toBe(91.7)
  })

  it('returns undefined for unknown id', () => {
    const item = findWaterContentItem('unknown', waterContentTable)
    expect(item).toBeUndefined()
  })
})

describe('useExperiment', () => {
  describe('base hydration', () => {
    it('calculates base hydration at default amounts', () => {
      // 360g water / 550g flour = 65.45...%
      const { baseHydration } = useExperiment(makeRecipe(), waterContentTable)
      expect(baseHydration.value.percent).toBeCloseTo(65.5, 1)
      expect(baseHydration.value.grams).toBe(360)
    })

    it('updates when water is adjusted', () => {
      const { baseHydration, adjustIngredient } = useExperiment(makeRecipe(), waterContentTable)
      adjustIngredient('water', 400)
      // 400 / 550 = 72.7%
      expect(baseHydration.value.percent).toBeCloseTo(72.7, 1)
      expect(baseHydration.value.grams).toBe(400)
    })

    it('updates when flour is adjusted', () => {
      const { baseHydration, adjustIngredient } = useExperiment(makeRecipe(), waterContentTable)
      adjustIngredient('flour', 500)
      // 360 / 500 = 72%
      expect(baseHydration.value.percent).toBe(72)
      expect(baseHydration.value.grams).toBe(360)
    })

    it('returns 0 when flour is 0', () => {
      const { baseHydration, adjustIngredient } = useExperiment(makeRecipe(), waterContentTable)
      adjustIngredient('flour', 0)
      expect(baseHydration.value.percent).toBe(0)
      expect(baseHydration.value.grams).toBe(0)
    })
  })

  describe('effective hydration', () => {
    it('calculates effective hydration including all water contributions', () => {
      const { effectiveHydration } = useExperiment(makeRecipe(), waterContentTable)
      // Water contributions at defaults:
      // flour: 550 * 0.118 = 64.9
      // water: 360 * 1.0 = 360
      // jalapenos: 120 * 0.917 = 110.04
      // cheddar: 220 * 0.368 = 80.96
      // butter: 45 * 0.16 = 7.2
      // starter: 10 * 0.46 = 4.6
      // salt: 10 * 0 = 0
      // milk powder: 25 * 0.035 = 0.875
      // brown sugar: 28 * 0.013 = 0.364
      // total water = 628.939
      // flour = 550
      // effective = 628.939 / 550 * 100 = 114.35..%
      expect(effectiveHydration.value.percent).toBeCloseTo(114.4, 0)
      expect(effectiveHydration.value.grams).toBeCloseTo(628.9, 0)
    })

    it('updates when inclusions are adjusted', () => {
      const { effectiveHydration, adjustIngredient } = useExperiment(makeRecipe(), waterContentTable)
      // Remove all jalapeños — subtract 120 * 0.917 = 110.04g water
      adjustIngredient('jalapenos', 0)
      // New total water: 628.939 - 110.04 = 518.899
      // effective = 518.899 / 550 = 94.3%
      expect(effectiveHydration.value.percent).toBeCloseTo(94.3, 0)
    })

    it('freeform additions do NOT affect effective hydration', () => {
      const { effectiveHydration, addFreeform } = useExperiment(makeRecipe(), waterContentTable)
      const before = effectiveHydration.value.percent

      addFreeform({ id: 'olives', name: 'Kalamata Olives', amount: 100, role: 'inclusion' })
      // Should remain unchanged — freeform excluded from hydration calc
      expect(effectiveHydration.value.percent).toBe(before)
    })
  })

  describe('inclusion load', () => {
    it('calculates inclusion load at defaults', () => {
      const { inclusionLoad } = useExperiment(makeRecipe(), waterContentTable)
      // (120 + 220) / 550 * 100 = 61.8%
      expect(inclusionLoad.value.percent).toBeCloseTo(61.8, 1)
      expect(inclusionLoad.value.grams).toBe(340)
    })

    it('updates when cheddar is adjusted', () => {
      const { inclusionLoad, adjustIngredient } = useExperiment(makeRecipe(), waterContentTable)
      adjustIngredient('cheddar', 300)
      // (120 + 300) / 550 * 100 = 76.4%
      expect(inclusionLoad.value.percent).toBeCloseTo(76.4, 1)
      expect(inclusionLoad.value.grams).toBe(420)
    })

    it('includes freeform inclusions in load calculation', () => {
      const { inclusionLoad, addFreeform } = useExperiment(makeRecipe(), waterContentTable)
      addFreeform({ id: 'olives', name: 'Kalamata Olives', amount: 50, role: 'inclusion' })
      // (120 + 220 + 50) / 550 * 100 = 70.9%
      expect(inclusionLoad.value.percent).toBeCloseTo(70.9, 1)
      expect(inclusionLoad.value.grams).toBe(390)
    })

    it('does NOT include freeform enrichments in load', () => {
      const { inclusionLoad, addFreeform } = useExperiment(makeRecipe(), waterContentTable)
      addFreeform({ id: 'honey', name: 'Honey', amount: 30, role: 'enrichment' })
      // Should remain (120 + 220) / 550 = 61.8%
      expect(inclusionLoad.value.percent).toBeCloseTo(61.8, 1)
    })
  })

  describe('per-inclusion baker\'s %', () => {
    it('calculates per-inclusion percentages at defaults', () => {
      const { perInclusionBakers } = useExperiment(makeRecipe(), waterContentTable)
      expect(perInclusionBakers.value).toHaveLength(2)

      const jalapeno = perInclusionBakers.value.find(e => e.id === 'jalapenos')!
      // 120 / 550 * 100 = 21.8%
      expect(jalapeno.percent).toBeCloseTo(21.8, 1)
      expect(jalapeno.grams).toBe(120)

      const cheddar = perInclusionBakers.value.find(e => e.id === 'cheddar')!
      // 220 / 550 * 100 = 40%
      expect(cheddar.percent).toBe(40)
      expect(cheddar.grams).toBe(220)
    })

    it('includes freeform inclusions', () => {
      const { perInclusionBakers, addFreeform } = useExperiment(makeRecipe(), waterContentTable)
      addFreeform({ id: 'olives', name: 'Kalamata Olives', amount: 55, role: 'inclusion' })
      expect(perInclusionBakers.value).toHaveLength(3)
      const olives = perInclusionBakers.value.find(e => e.id === 'olives')!
      // 55 / 550 * 100 = 10%
      expect(olives.percent).toBe(10)
      expect(olives.grams).toBe(55)
      expect(olives.name).toBe('Kalamata Olives')
    })

    it('resolves ingredient names from recipe', () => {
      const { perInclusionBakers } = useExperiment(makeRecipe(), waterContentTable)
      const jalapeno = perInclusionBakers.value.find(e => e.id === 'jalapenos')!
      expect(jalapeno.name).toBe('Fresh Jalapeños')
    })
  })

  describe('total dough weight', () => {
    it('calculates total at defaults', () => {
      const { totalDoughWeight } = useExperiment(makeRecipe(), waterContentTable)
      // 550 + 360 + 120 + 220 + 45 + 10 + 10 + 25 + 28 = 1368
      expect(totalDoughWeight.value).toBe(1368)
    })

    it('includes freeform ingredients', () => {
      const { totalDoughWeight, addFreeform } = useExperiment(makeRecipe(), waterContentTable)
      addFreeform({ id: 'olives', name: 'Olives', amount: 50, role: 'inclusion' })
      expect(totalDoughWeight.value).toBe(1418)
    })

    it('reflects adjustments', () => {
      const { totalDoughWeight, adjustIngredient } = useExperiment(makeRecipe(), waterContentTable)
      adjustIngredient('water', 400) // +40
      expect(totalDoughWeight.value).toBe(1408)
    })
  })

  describe('adjustIngredient', () => {
    it('overrides default amount', () => {
      const { getAmount, adjustIngredient } = useExperiment(makeRecipe(), waterContentTable)
      const flourIng = experimentConfig.ingredients[0]
      expect(getAmount(flourIng)).toBe(550)
      adjustIngredient('flour', 600)
      expect(getAmount(flourIng)).toBe(600)
    })

    it('triggers recomputation of derived values', () => {
      const { baseHydration, adjustIngredient } = useExperiment(makeRecipe(), waterContentTable)
      const before = baseHydration.value.percent
      adjustIngredient('water', 400)
      expect(baseHydration.value.percent).not.toBe(before)
    })
  })

  describe('resetIngredient', () => {
    it('restores default amount', () => {
      const { getAmount, adjustIngredient, resetIngredient } = useExperiment(makeRecipe(), waterContentTable)
      const flourIng = experimentConfig.ingredients[0]
      adjustIngredient('flour', 600)
      expect(getAmount(flourIng)).toBe(600)
      resetIngredient('flour')
      expect(getAmount(flourIng)).toBe(550)
    })

    it('does not affect other adjustments', () => {
      const { getAmount, adjustIngredient, resetIngredient } = useExperiment(makeRecipe(), waterContentTable)
      adjustIngredient('flour', 600)
      adjustIngredient('water', 400)
      resetIngredient('flour')
      const waterIng = experimentConfig.ingredients[1]
      expect(getAmount(waterIng)).toBe(400)
    })
  })

  describe('resetAll', () => {
    it('clears all adjustments', () => {
      const { getAmount, adjustIngredient, resetAll } = useExperiment(makeRecipe(), waterContentTable)
      adjustIngredient('flour', 600)
      adjustIngredient('water', 400)
      resetAll()
      const flourIng = experimentConfig.ingredients[0]
      const waterIng = experimentConfig.ingredients[1]
      expect(getAmount(flourIng)).toBe(550)
      expect(getAmount(waterIng)).toBe(360)
    })

    it('clears freeform ingredients', () => {
      const { freeformIngredients, addFreeform, resetAll } = useExperiment(makeRecipe(), waterContentTable)
      addFreeform({ id: 'olives', name: 'Olives', amount: 50, role: 'inclusion' })
      expect(freeformIngredients.value).toHaveLength(1)
      resetAll()
      expect(freeformIngredients.value).toHaveLength(0)
    })
  })

  describe('addFreeform / removeFreeform', () => {
    it('adds a freeform ingredient', () => {
      const { freeformIngredients, addFreeform } = useExperiment(makeRecipe(), waterContentTable)
      const olive: FreeformIngredient = { id: 'olives', name: 'Kalamata Olives', amount: 50, role: 'inclusion' }
      addFreeform(olive)
      expect(freeformIngredients.value).toHaveLength(1)
      expect(freeformIngredients.value[0]).toEqual(olive)
    })

    it('removes a freeform ingredient by id', () => {
      const { freeformIngredients, addFreeform, removeFreeform } = useExperiment(makeRecipe(), waterContentTable)
      addFreeform({ id: 'olives', name: 'Olives', amount: 50, role: 'inclusion' })
      addFreeform({ id: 'walnuts', name: 'Walnuts', amount: 30, role: 'inclusion' })
      removeFreeform('olives')
      expect(freeformIngredients.value).toHaveLength(1)
      expect(freeformIngredients.value[0].id).toBe('walnuts')
    })

    it('freeform inclusion affects total dough weight', () => {
      const { totalDoughWeight, addFreeform } = useExperiment(makeRecipe(), waterContentTable)
      const before = totalDoughWeight.value
      addFreeform({ id: 'pecans', name: 'Pecans', amount: 75, role: 'inclusion' })
      expect(totalDoughWeight.value).toBe(before + 75)
    })
  })

  describe('edge cases', () => {
    it('handles recipe with no inclusions', () => {
      const noInclusionConfig: ExperimentConfig = {
        description: 'Basic bread experiment',
        ingredients: [
          { id: 'flour', role: 'base_flour', defaultAmount: 500, min: 400, max: 600, step: 25, waterContentId: 'bread-flour' },
          { id: 'water', role: 'base_liquid', defaultAmount: 350, min: 280, max: 420, step: 10, waterContentId: 'water' }
        ],
        derived: []
      }
      const recipe = makeRecipe(noInclusionConfig)
      const { inclusionLoad, perInclusionBakers } = useExperiment(recipe, waterContentTable)
      expect(inclusionLoad.value.percent).toBe(0)
      expect(inclusionLoad.value.grams).toBe(0)
      expect(perInclusionBakers.value).toEqual([])
    })

    it('handles multiple base_flour ingredients', () => {
      const multiFlourConfig: ExperimentConfig = {
        description: 'Mixed flour experiment',
        ingredients: [
          { id: 'bread-flour', role: 'base_flour', defaultAmount: 400, min: 300, max: 500, step: 25, waterContentId: 'bread-flour' },
          { id: 'ww-flour', role: 'base_flour', defaultAmount: 100, min: 0, max: 200, step: 25, waterContentOverride: 10.7 },
          { id: 'water', role: 'base_liquid', defaultAmount: 350, min: 280, max: 420, step: 10, waterContentId: 'water' }
        ],
        derived: []
      }
      const recipe = makeRecipe(multiFlourConfig)
      const { baseHydration } = useExperiment(recipe, waterContentTable)
      // 350 / (400 + 100) * 100 = 70%
      expect(baseHydration.value.percent).toBe(70)
      expect(baseHydration.value.grams).toBe(350)
    })
  })
})
