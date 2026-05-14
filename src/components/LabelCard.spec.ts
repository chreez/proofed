import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LabelCard from './LabelCard.vue'
import type { Recipe } from '@/types/recipe'
import type { ProductionEntry } from '@/types/production'

// Mock QR rendering to keep tests deterministic + fast (no canvas timing).
vi.mock('@/composables/useQrLabel', () => ({
  renderBrandedQr: vi.fn(() => Promise.resolve(document.createElement('canvas'))),
  generateQrLabelDataUrl: vi.fn(() => 'data:image/png;base64,FAKEQR'),
}))

function makeEntry(overrides: Partial<ProductionEntry> = {}): ProductionEntry {
  return {
    id: 'entry-1',
    recipeId: 'atk-cinnamon-buns-ultimate',
    batches: 1,
    yieldOverride: null,
    unit: 'roll',
    addedBy: 'user',
    addedAt: '2026-05-12T10:00:00Z',
    ...overrides,
  }
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    meta: {
      name: 'ATK Ultimate Cinnamon Buns',
      yields: '8 rolls',
      total_time: '1 hour',
    },
    config: { early_check_percent: 80 },
    vessels: [],
    stages: [
      {
        id: 'dough',
        title: 'Dough',
        states: ['mix'],
        gather: {
          ingredients: [
            { id: 'flour', name: 'all-purpose flour', total: 390, unit: 'g', breakdown: null },
            { id: 'milk', name: 'whole milk', total: 250, unit: 'g', breakdown: null },
            { id: 'butter', name: 'unsalted butter', total: 140, unit: 'g', breakdown: null },
            { id: 'eggs', name: 'large eggs', total: 2, unit: 'whole', breakdown: null },
            { id: 'salt', name: 'salt', total: 5, unit: 'g', breakdown: null },
          ],
        },
      },
    ],
    states: [],
    version: 'v1.2.0',
    nutrition: {
      servings: 8,
      calculatedDate: '2026-04-01',
      dataSource: 'USDA',
      totals: {
        calories: 2400, protein: 40, totalFat: 100, saturatedFat: 50,
        carbohydrates: 320, sugar: 80, fiber: 10, sodium: 1600,
      },
      perServing: {
        calories: 300, protein: 5, totalFat: 12.5, saturatedFat: 6.25,
        carbohydrates: 40, sugar: 10, fiber: 1.25, sodium: 200,
      },
      breakdown: [],
    },
    ...overrides,
  } as Recipe
}

describe('LabelCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders recipe name in the header', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry(),
        recipe: makeRecipe(),
        recipeName: 'ATK Ultimate Cinnamon Buns',
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('ATK Ultimate Cinnamon Buns')
  })

  it('renders batch count + scaled unit count in subheader', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry({ batches: 2 }),
        recipe: makeRecipe(),
        recipeName: 'ATK Ultimate Cinnamon Buns',
      },
    })
    await flushPromises()
    // 2 batches × baseYield(8) = 16 rolls
    expect(wrapper.text()).toContain('2 batches')
    expect(wrapper.text()).toContain('16 rolls')
    expect(wrapper.text()).not.toContain('custom')
  })

  it('renders override yield with (custom) tag when yieldOverride is set', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry({ batches: 1, yieldOverride: 15 }),
        recipe: makeRecipe(),
        recipeName: 'ATK Ultimate Cinnamon Buns',
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('15 rolls')
    expect(wrapper.text()).toContain('(custom)')
  })

  it('renders allergens line in FDA canonical order and uppercase', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry(),
        recipe: makeRecipe(),
        recipeName: 'ATK Ultimate Cinnamon Buns',
      },
    })
    await flushPromises()
    const allergens = wrapper.find('[data-testid="label-allergens"]')
    expect(allergens.exists()).toBe(true)
    // FDA canonical: Milk, Eggs, Wheat — derived from flour/milk/butter/eggs
    expect(allergens.text()).toContain('Contains:')
    expect(allergens.text()).toContain('MILK')
    expect(allergens.text()).toContain('EGGS')
    expect(allergens.text()).toContain('WHEAT')
  })

  it('renders ingredient list with allergens bolded', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry(),
        recipe: makeRecipe(),
        recipeName: 'ATK Ultimate Cinnamon Buns',
      },
    })
    await flushPromises()
    const list = wrapper.find('[data-testid="label-ingredients"]')
    expect(list.exists()).toBe(true)
    // Largest gram weight (flour = 390g) first
    expect(list.text()).toContain('all-purpose flour')
    // Allergens are bolded — flour, milk, butter, eggs should be <strong>
    const bolded = list.findAll('strong').map(s => s.text())
    expect(bolded).toContain('all-purpose flour')
    expect(bolded).toContain('whole milk')
    expect(bolded).toContain('unsalted butter')
    expect(bolded).toContain('large eggs')
    // Non-allergen ingredients (salt) are NOT bolded
    expect(bolded).not.toContain('salt')
  })

  it('renders nutrition facts grid when nutrition data exists', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry(),
        recipe: makeRecipe(),
        recipeName: 'ATK Ultimate Cinnamon Buns',
      },
    })
    await flushPromises()
    const nutrition = wrapper.find('[data-testid="label-nutrition"]')
    expect(nutrition.exists()).toBe(true)
    expect(nutrition.text()).toContain('Calories')
    expect(nutrition.text()).toContain('300')
    expect(nutrition.text()).toContain('Fat')
    expect(nutrition.text()).toContain('12.5g')
    expect(nutrition.text()).toContain('Carbs')
    expect(nutrition.text()).toContain('40g')
    expect(nutrition.text()).toContain('Protein')
    expect(nutrition.text()).toContain('5g')
    expect(nutrition.text()).toContain('Sodium')
    expect(nutrition.text()).toContain('200mg')
    // Pending state is NOT shown when data exists
    expect(wrapper.find('[data-testid="label-nutrition-pending"]').exists()).toBe(false)
  })

  it('renders "Nutrition data pending" when recipe has no nutrition block', async () => {
    const recipe = makeRecipe()
    delete (recipe as Partial<Recipe>).nutrition
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry(),
        recipe,
        recipeName: 'ATK Ultimate Cinnamon Buns',
      },
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="label-nutrition-pending"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nutrition data pending')
    expect(wrapper.find('[data-testid="label-nutrition"]').exists()).toBe(false)
  })

  it('renders QR link pointing at /recipe/:id', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry({ recipeId: 'tartine-baguette' }),
        recipe: makeRecipe({
          meta: { name: 'Tartine Baguette', yields: '2 loaves', total_time: '8 hours' },
        }),
        recipeName: 'Tartine Baguette',
      },
    })
    await flushPromises()
    const qr = wrapper.find('[data-testid="label-qr"]')
    expect(qr.exists()).toBe(true)
    expect(qr.attributes('href')).toBe('/recipe/tartine-baguette')
  })

  it('renders the version string when present', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry(),
        recipe: makeRecipe({ version: 'v2.1.0' } as Partial<Recipe>),
        recipeName: 'ATK Ultimate Cinnamon Buns',
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('v2.1.0')
  })

  it('falls back gracefully when recipe is null', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry(),
        recipe: null,
        recipeName: 'Unknown Recipe',
      },
    })
    await flushPromises()
    // Still renders header + nutrition-pending + ingredient-empty
    expect(wrapper.text()).toContain('Unknown Recipe')
    expect(wrapper.find('[data-testid="label-nutrition-pending"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="label-ingredients-empty"]').exists()).toBe(true)
    // No allergens line on null recipe
    expect(wrapper.find('[data-testid="label-allergens"]').exists()).toBe(false)
  })

  it('matches snapshot — full nutrition + multi-batch override', async () => {
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry({ batches: 2, yieldOverride: 20 }),
        recipe: makeRecipe(),
        recipeName: 'ATK Ultimate Cinnamon Buns',
        dateOverride: 'May 12, 2026',
      },
    })
    await flushPromises()
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches snapshot — recipe missing nutrition', async () => {
    const recipe = makeRecipe()
    delete (recipe as Partial<Recipe>).nutrition
    const wrapper = mount(LabelCard, {
      props: {
        entry: makeEntry(),
        recipe,
        recipeName: 'ATK Ultimate Cinnamon Buns',
        dateOverride: 'May 12, 2026',
      },
    })
    await flushPromises()
    expect(wrapper.html()).toMatchSnapshot()
  })
})
