import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import NutritionSection from './NutritionSection.vue'
import type { RecipeNutrition } from '@/types/recipe'
import { SCALING_MULTIPLIER_KEY } from '@/composables/scalingKey'

vi.mock('@/composables/useClipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined)
}))

const mockNutrition: RecipeNutrition = {
  servings: 8,
  servingSize: '1 bun',
  calculatedDate: '2026-02-06',
  dataSource: 'USDA FoodData Central',
  totals: {
    calories: 6848,
    protein: 92,
    totalFat: 249,
    saturatedFat: 148,
    carbohydrates: 1075,
    sugar: 593,
    fiber: 22,
    sodium: 5062,
  },
  perServing: {
    calories: 856,
    protein: 11.5,
    totalFat: 31.1,
    saturatedFat: 18.5,
    carbohydrates: 134.4,
    sugar: 74.1,
    fiber: 2.8,
    sodium: 632.8,
  },
  breakdown: [
    {
      ingredientId: 'butter',
      ingredientName: 'Unsalted Butter',
      amount: 227,
      fdcId: 173430,
      calories: 1627.6,
      protein: 1.9,
      totalFat: 184.1,
      saturatedFat: 116.6,
      carbohydrates: 0.1,
      sugar: 0.1,
      fiber: 0,
      sodium: 25,
    },
    {
      ingredientId: 'flour',
      ingredientName: 'All-Purpose Flour',
      amount: 531,
      fdcId: 168894,
      calories: 1932.8,
      protein: 54.9,
      totalFat: 5.2,
      saturatedFat: 0.8,
      carbohydrates: 405.2,
      sugar: 1.4,
      fiber: 14.3,
      sodium: 10.6,
    },
    {
      ingredientId: 'salt',
      ingredientName: 'Salt',
      amount: 11,
      fdcId: 173468,
      calories: 0,
      protein: 0,
      totalFat: 0,
      saturatedFat: 0,
      carbohydrates: 0,
      sugar: 0,
      fiber: 0,
      sodium: 4263.4,
    },
  ],
}

describe('NutritionSection', () => {
  it('shows placeholder when no nutrition data', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: undefined, sectionId: 'nutrition-section' },
    })

    expect(wrapper.text()).toContain('Not yet calculated')
  })

  it('renders section title', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    expect(wrapper.find('h3').text()).toBe('Nutrition')
  })

  it('shows per-serving values by default', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    expect(wrapper.text()).toContain('1 bun')
    expect(wrapper.text()).toContain('856')
  })

  it('toggles to full recipe values', async () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    const fullBtn = wrapper.findAll('button').find(b => b.text() === 'Full Recipe')!
    await fullBtn.trigger('click')

    expect(wrapper.text()).toContain('Full recipe (8 servings)')
    expect(wrapper.text()).toContain('6848')
  })

  it('toggles back to per-serving', async () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    // Go to full
    const fullBtn = wrapper.findAll('button').find(b => b.text() === 'Full Recipe')!
    await fullBtn.trigger('click')
    expect(wrapper.text()).toContain('6848')

    // Back to per-serving
    const perBtn = wrapper.findAll('button').find(b => b.text() === 'Per Serving')!
    await perBtn.trigger('click')
    expect(wrapper.text()).toContain('856')
  })

  it('renders all nutrient rows', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    expect(wrapper.text()).toContain('Calories')
    expect(wrapper.text()).toContain('Protein')
    expect(wrapper.text()).toContain('Total Fat')
    expect(wrapper.text()).toContain('Saturated Fat')
    expect(wrapper.text()).toContain('Carbohydrates')
    expect(wrapper.text()).toContain('Sugar')
    expect(wrapper.text()).toContain('Fiber')
    expect(wrapper.text()).toContain('Sodium')
  })

  it('shows ingredient breakdown with non-zero calorie items only', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    // Salt has 0 calories — should be excluded
    const html = wrapper.html()
    expect(html).toContain('Unsalted Butter')
    expect(html).toContain('All-Purpose Flour')
    // Salt in breakdown table should be filtered out (0 calories)
    const detailsHtml = wrapper.find('details').html()
    expect(detailsHtml).not.toContain('Salt')
  })

  it('sorts breakdown by calories descending', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    const rows = wrapper.find('details').findAll('tbody tr')
    expect(rows[0].text()).toContain('All-Purpose Flour') // 1932.8
    expect(rows[1].text()).toContain('Unsalted Butter')   // 1627.6
  })

  it('shows data source and disclaimer', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    expect(wrapper.text()).toContain('USDA FoodData Central')
    expect(wrapper.text()).toContain('Estimates only')
  })

  it('uses fallback serving label when servingSize is undefined', () => {
    const nutritionNoSize = {
      ...mockNutrition,
      servingSize: undefined,
    }
    const wrapper = mount(NutritionSection, {
      props: { nutrition: nutritionNoSize, sectionId: 'nutrition-section' },
    })

    expect(wrapper.text()).toContain('1 of 8')
  })

  it('formats mg values correctly', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    // Sodium should be formatted as mg
    expect(wrapper.text()).toContain('mg')
  })

  it('renders indented rows for sub-nutrients', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    // Saturated Fat, Sugar, and Fiber are indented
    const indentedCells = wrapper.findAll('td.pl-4')
    expect(indentedCells.length).toBe(3) // saturatedFat, sugar, fiber
  })

  it('renders empty breakdown gracefully', () => {
    const nutritionNoBreakdown = {
      ...mockNutrition,
      breakdown: [],
    }
    const wrapper = mount(NutritionSection, {
      props: { nutrition: nutritionNoBreakdown, sectionId: 'nutrition-section' },
    })

    // No details element should render
    expect(wrapper.find('details').exists()).toBe(false)
  })

  it('calories row has font-semibold', () => {
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    const rows = wrapper.findAll('table:first-of-type tr')
    // First row should be Calories with font-semibold
    expect(rows[0].classes()).toContain('font-semibold')
  })

  it('calls copyToClipboard when permalink button clicked', async () => {
    const { copyToClipboard } = await import('@/composables/useClipboard')
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
    })

    const linkButton = wrapper.find('button[title="Copy link"]')
    expect(linkButton.exists()).toBe(true)
    await linkButton.trigger('click')

    expect(copyToClipboard).toHaveBeenCalledWith(
      expect.stringContaining('#nutrition-section')
    )
  })
})

describe('NutritionSection scaling', () => {
  it('scales full recipe totals when multiplier > 1', async () => {
    const multiplier = ref(2)
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
      global: { provide: { [SCALING_MULTIPLIER_KEY]: multiplier } }
    })

    // Switch to Full Recipe view
    const fullBtn = wrapper.findAll('button').find(b => b.text() === 'Full Recipe')!
    await fullBtn.trigger('click')

    // Calories should be doubled: 6848 * 2 = 13696
    expect(wrapper.text()).toContain('13696')
    // Servings label should also scale
    expect(wrapper.text()).toContain('Full recipe (16 servings)')
  })

  it('does not scale per-serving values', () => {
    const multiplier = ref(2)
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
      global: { provide: { [SCALING_MULTIPLIER_KEY]: multiplier } }
    })

    // Per-serving (default view) should show original values
    expect(wrapper.text()).toContain('856')
    expect(wrapper.text()).toContain('1 bun')
  })

  it('scales breakdown amounts and calories when multiplier > 1', async () => {
    const multiplier = ref(2)
    const wrapper = mount(NutritionSection, {
      props: { nutrition: mockNutrition, sectionId: 'nutrition-section' },
      global: { provide: { [SCALING_MULTIPLIER_KEY]: multiplier } }
    })

    // Breakdown should show scaled amounts
    const detailsHtml = wrapper.find('details').html()
    // Flour amount: 531 * 2 = 1062
    expect(detailsHtml).toContain('1062g')
    // Butter amount: 227 * 2 = 454
    expect(detailsHtml).toContain('454g')
  })
})
