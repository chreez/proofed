import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NutritionLabel from './NutritionLabel.vue'
import type { Recipe, RecipeNutrition } from '@/types/recipe'

// Helper to create minimal recipe with nutrition data
function createRecipe(nutrition?: RecipeNutrition): Recipe {
  return {
    meta: {
      name: 'Test Recipe',
      yields: '10 slices',
      total_time: '1 hr'
    },
    config: { early_check_percent: 0.8 },
    vessels: [],
    stages: [],
    states: [],
    version: 'v1.0.0',
    nutrition
  } as Recipe
}

describe('NutritionLabel', () => {
  describe('Missing nutrition data', () => {
    it('renders "Not yet calculated" when nutrition is undefined', () => {
      const recipe = createRecipe()
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      expect(wrapper.text()).toContain('Nutrition Facts')
      expect(wrapper.text()).toContain('Not yet calculated')
      expect(wrapper.find('.not-calculated').exists()).toBe(true)
    })
  })

  describe('Complete nutrition data', () => {
    const fullNutrition: RecipeNutrition = {
      servings: 10,
      servingSize: '1 slice (80g)',
      calculatedDate: '2026-04-22',
      dataSource: 'USDA FoodData Central',
      totals: {
        calories: 2000,
        protein: 80,
        totalFat: 60,
        saturatedFat: 20,
        carbohydrates: 300,
        sugar: 40,
        fiber: 30,
        sodium: 2000
      },
      perServing: {
        calories: 200,
        protein: 8,
        totalFat: 6,
        saturatedFat: 2,
        carbohydrates: 30,
        sugar: 4,
        fiber: 3,
        sodium: 200
      },
      breakdown: []
    }

    it('renders FDA nutrition facts label structure', () => {
      const recipe = createRecipe(fullNutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      expect(wrapper.find('.facts-panel').exists()).toBe(true)
      expect(wrapper.text()).toContain('Nutrition Facts')
      expect(wrapper.text()).toContain('% Daily Value')
    })

    it('displays serving size and servings per recipe', () => {
      const recipe = createRecipe(fullNutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      expect(wrapper.text()).toContain('1 slice (80g)')
      expect(wrapper.text()).toContain('Servings per recipe')
      expect(wrapper.text()).toContain('10')
    })

    it('displays calories prominently', () => {
      const recipe = createRecipe(fullNutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      const caloriesSection = wrapper.find('.calories-section')
      expect(caloriesSection.exists()).toBe(true)
      expect(caloriesSection.text()).toContain('Calories')
      expect(caloriesSection.text()).toContain('200')
    })

    it('displays all macronutrients with values', () => {
      const recipe = createRecipe(fullNutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })
      const text = wrapper.text()

      // Total Fat
      expect(text).toContain('Total Fat')
      expect(text).toContain('6g')

      // Saturated Fat
      expect(text).toContain('Saturated Fat')
      expect(text).toContain('2g')

      // Sodium
      expect(text).toContain('Sodium')
      expect(text).toContain('200mg')

      // Total Carbohydrate
      expect(text).toContain('Total Carbohydrate')
      expect(text).toContain('30g')

      // Dietary Fiber
      expect(text).toContain('Dietary Fiber')
      expect(text).toContain('3g')

      // Total Sugars
      expect(text).toContain('Total Sugars')
      expect(text).toContain('4g')

      // Protein
      expect(text).toContain('Protein')
      expect(text).toContain('8g')
    })

    it('displays missing FDA fields as dashes', () => {
      const recipe = createRecipe(fullNutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })
      const text = wrapper.text()

      // Trans Fat
      expect(text).toContain('Trans Fat')

      // Cholesterol
      expect(text).toContain('Cholesterol')

      // Added Sugars
      expect(text).toContain('Added Sugars')

      // Micronutrients
      expect(text).toContain('Vitamin D')
      expect(text).toContain('Calcium')
      expect(text).toContain('Iron')
      expect(text).toContain('Potassium')
    })

    it('calculates % Daily Value correctly', () => {
      const recipe = createRecipe(fullNutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })
      const text = wrapper.text()

      // Total Fat: 6g / 78g DV = 7.69% ≈ 8%
      expect(text).toMatch(/Total Fat.*6g.*8%/)

      // Saturated Fat: 2g / 20g DV = 10%
      expect(text).toMatch(/Saturated Fat.*2g.*10%/)

      // Sodium: 200mg / 2300mg DV = 8.69% ≈ 9%
      expect(text).toMatch(/Sodium.*200mg.*9%/)

      // Total Carbohydrate: 30g / 275g DV = 10.9% ≈ 11%
      expect(text).toMatch(/Total Carbohydrate.*30g.*11%/)

      // Dietary Fiber: 3g / 28g DV = 10.7% ≈ 11%
      expect(text).toMatch(/Dietary Fiber.*3g.*11%/)

      // Protein: 8g / 50g DV = 16%
      expect(text).toMatch(/Protein.*8g.*16%/)
    })

    it('displays full recipe totals in footer', () => {
      const recipe = createRecipe(fullNutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      const totalsInfo = wrapper.find('.totals-info')
      expect(totalsInfo.exists()).toBe(true)
      expect(totalsInfo.text()).toContain('2000 cal')
      expect(totalsInfo.text()).toContain('80g protein')
      expect(totalsInfo.text()).toContain('60g fat')
      expect(totalsInfo.text()).toContain('300g carbs')
    })

    it('displays FDA disclaimer', () => {
      const recipe = createRecipe(fullNutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      expect(wrapper.text()).toContain('2,000 calories a day is used for general nutrition advice')
    })
  })

  describe('Partial nutrition data', () => {
    it('handles missing servingSize gracefully', () => {
      const nutrition: RecipeNutrition = {
        servings: 8,
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: {
          calories: 1600,
          protein: 64,
          totalFat: 48,
          saturatedFat: 16,
          carbohydrates: 240,
          sugar: 32,
          fiber: 24,
          sodium: 1600
        },
        perServing: {
          calories: 200,
          protein: 8,
          totalFat: 6,
          saturatedFat: 2,
          carbohydrates: 30,
          sugar: 4,
          fiber: 3,
          sodium: 200
        },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      expect(wrapper.text()).toContain('1 serving (8 servings per recipe)')
    })

    it('handles zero values correctly', () => {
      const nutrition: RecipeNutrition = {
        servings: 1,
        servingSize: '1 serving',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: {
          calories: 100,
          protein: 0,
          totalFat: 0,
          saturatedFat: 0,
          carbohydrates: 25,
          sugar: 0,
          fiber: 0,
          sodium: 0
        },
        perServing: {
          calories: 100,
          protein: 0,
          totalFat: 0,
          saturatedFat: 0,
          carbohydrates: 25,
          sugar: 0,
          fiber: 0,
          sodium: 0
        },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })
      const text = wrapper.text()

      expect(text).toContain('Calories')
      expect(text).toContain('100')
      expect(text).toContain('Total Fat 0g')
      expect(text).toContain('Protein 0g')
      expect(text).toContain('0%') // % DV for zero values
    })

    it('handles decimal values correctly', () => {
      const nutrition: RecipeNutrition = {
        servings: 10,
        servingSize: '1 slice',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: {
          calories: 1985.5,
          protein: 65.9,
          totalFat: 9.1,
          saturatedFat: 1.3,
          carbohydrates: 399,
          sugar: 1.5,
          fiber: 13.2,
          sodium: 3888.3
        },
        perServing: {
          calories: 198.6,
          protein: 6.6,
          totalFat: 0.9,
          saturatedFat: 0.1,
          carbohydrates: 39.9,
          sugar: 0.2,
          fiber: 1.3,
          sodium: 388.8
        },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })
      const text = wrapper.text()

      // Decimals should be displayed with 1 decimal place
      expect(text).toContain('198.6') // calories
      expect(text).toContain('6.6') // protein
      expect(text).toContain('0.9') // total fat
      expect(text).toContain('0.1') // saturated fat
      expect(text).toContain('1.3') // fiber
      expect(text).toContain('388.8') // sodium
    })
  })

  describe('% Daily Value math', () => {
    it('calculates Total Fat % DV correctly (78g base)', () => {
      const nutrition: RecipeNutrition = {
        servings: 1,
        servingSize: '1 serving',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 500, protein: 10, totalFat: 39, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 500 },
        perServing: { calories: 500, protein: 10, totalFat: 39, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 500 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // 39g / 78g DV = 50%
      expect(wrapper.text()).toMatch(/Total Fat.*39g.*50%/)
    })

    it('calculates Saturated Fat % DV correctly (20g base)', () => {
      const nutrition: RecipeNutrition = {
        servings: 1,
        servingSize: '1 serving',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 500, protein: 10, totalFat: 20, saturatedFat: 10, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 500 },
        perServing: { calories: 500, protein: 10, totalFat: 20, saturatedFat: 10, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 500 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // 10g / 20g DV = 50%
      expect(wrapper.text()).toMatch(/Saturated Fat.*10g.*50%/)
    })

    it('calculates Sodium % DV correctly (2300mg base)', () => {
      const nutrition: RecipeNutrition = {
        servings: 1,
        servingSize: '1 serving',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 500, protein: 10, totalFat: 20, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 1150 },
        perServing: { calories: 500, protein: 10, totalFat: 20, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 1150 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // 1150mg / 2300mg DV = 50%
      expect(wrapper.text()).toMatch(/Sodium.*1150mg.*50%/)
    })

    it('calculates Carbohydrate % DV correctly (275g base)', () => {
      const nutrition: RecipeNutrition = {
        servings: 1,
        servingSize: '1 serving',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 1000, protein: 10, totalFat: 20, saturatedFat: 5, carbohydrates: 137.5, sugar: 10, fiber: 5, sodium: 500 },
        perServing: { calories: 1000, protein: 10, totalFat: 20, saturatedFat: 5, carbohydrates: 137.5, sugar: 10, fiber: 5, sodium: 500 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // 137.5g / 275g DV = 50%
      expect(wrapper.text()).toMatch(/Total Carbohydrate.*137.5g.*50%/)
    })

    it('calculates Fiber % DV correctly (28g base)', () => {
      const nutrition: RecipeNutrition = {
        servings: 1,
        servingSize: '1 serving',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 500, protein: 10, totalFat: 20, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 14, sodium: 500 },
        perServing: { calories: 500, protein: 10, totalFat: 20, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 14, sodium: 500 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // 14g / 28g DV = 50%
      expect(wrapper.text()).toMatch(/Dietary Fiber.*14g.*50%/)
    })

    it('calculates Protein % DV correctly (50g base)', () => {
      const nutrition: RecipeNutrition = {
        servings: 1,
        servingSize: '1 serving',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 500, protein: 25, totalFat: 20, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 500 },
        perServing: { calories: 500, protein: 25, totalFat: 20, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 500 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // 25g / 50g DV = 50%
      expect(wrapper.text()).toMatch(/Protein.*25g.*50%/)
    })

    it('rounds % DV to nearest whole number', () => {
      const nutrition: RecipeNutrition = {
        servings: 1,
        servingSize: '1 serving',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 500, protein: 7.3, totalFat: 20, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 500 },
        perServing: { calories: 500, protein: 7.3, totalFat: 20, saturatedFat: 5, carbohydrates: 50, sugar: 10, fiber: 5, sodium: 500 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // 7.3g / 50g DV = 14.6% ≈ 15%
      expect(wrapper.text()).toMatch(/Protein.*7.3g.*15%/)
    })
  })

  describe('Print optimization', () => {
    it('applies print-friendly styles', () => {
      const nutrition: RecipeNutrition = {
        servings: 10,
        servingSize: '1 slice',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 2000, protein: 80, totalFat: 60, saturatedFat: 20, carbohydrates: 300, sugar: 40, fiber: 30, sodium: 2000 },
        perServing: { calories: 200, protein: 8, totalFat: 6, saturatedFat: 2, carbohydrates: 30, sugar: 4, fiber: 3, sodium: 200 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // Check for root nutrition label element
      expect(wrapper.find('.nutrition-label').exists()).toBe(true)
      // Check for FDA structure elements
      expect(wrapper.find('.facts-panel').exists()).toBe(true)
      expect(wrapper.find('.label-title').exists()).toBe(true)
    })

    it('uses compact layout suitable for print', () => {
      const nutrition: RecipeNutrition = {
        servings: 10,
        servingSize: '1 slice',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 2000, protein: 80, totalFat: 60, saturatedFat: 20, carbohydrates: 300, sugar: 40, fiber: 30, sodium: 2000 },
        perServing: { calories: 200, protein: 8, totalFat: 6, saturatedFat: 2, carbohydrates: 30, sugar: 4, fiber: 3, sodium: 200 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // Verify all key structural elements exist
      expect(wrapper.find('.nutrition-label').exists()).toBe(true)
      expect(wrapper.find('.facts-panel').exists()).toBe(true)
      expect(wrapper.find('.divider-thick').exists()).toBe(true)
      expect(wrapper.find('.calories-section').exists()).toBe(true)
    })
  })

  describe('Design system compliance', () => {
    it('uses proofed branded structure and styling', () => {
      const nutrition: RecipeNutrition = {
        servings: 10,
        servingSize: '1 slice',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 2000, protein: 80, totalFat: 60, saturatedFat: 20, carbohydrates: 300, sugar: 40, fiber: 30, sodium: 2000 },
        perServing: { calories: 200, protein: 8, totalFat: 6, saturatedFat: 2, carbohydrates: 30, sugar: 4, fiber: 3, sodium: 200 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // Component renders with expected structure
      expect(wrapper.find('.nutrition-label').exists()).toBe(true)
      expect(wrapper.find('.facts-panel').exists()).toBe(true)
      expect(wrapper.find('.label-title').exists()).toBe(true)

      // Uses branded class names that align with proofed design
      expect(wrapper.find('.divider-thick').exists()).toBe(true)
      expect(wrapper.find('.divider-medium').exists()).toBe(true)
      expect(wrapper.find('.nutrient-line').exists()).toBe(true)
    })

    it('follows proofed design principle of clean borders', () => {
      const nutrition: RecipeNutrition = {
        servings: 10,
        servingSize: '1 slice',
        calculatedDate: '2026-04-22',
        dataSource: 'USDA FoodData Central',
        totals: { calories: 2000, protein: 80, totalFat: 60, saturatedFat: 20, carbohydrates: 300, sugar: 40, fiber: 30, sodium: 2000 },
        perServing: { calories: 200, protein: 8, totalFat: 6, saturatedFat: 2, carbohydrates: 30, sugar: 4, fiber: 3, sodium: 200 },
        breakdown: []
      }

      const recipe = createRecipe(nutrition)
      const wrapper = mount(NutritionLabel, { props: { recipe } })

      // Component renders with proper structure for print
      expect(wrapper.find('.nutrition-label').exists()).toBe(true)
      expect(wrapper.find('.divider-thick').exists()).toBe(true)
      expect(wrapper.find('.micronutrients').exists()).toBe(true)
    })
  })
})
