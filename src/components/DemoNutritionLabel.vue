<script setup lang="ts">
import NutritionLabel from './NutritionLabel.vue'
import type { Recipe, RecipeNutrition } from '@/types/recipe'

// Complete nutrition data example
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

const recipeWithNutrition = {
  meta: {
    name: 'Test Recipe with Full Nutrition',
    yields: '10 slices',
    total_time: '1 hr'
  },
  config: { early_check_percent: 0.8 },
  vessels: [],
  stages: [],
  states: [],
  version: 'v1.0.0',
  nutrition: fullNutrition
} as Recipe

const recipeWithoutNutrition = {
  meta: {
    name: 'Test Recipe without Nutrition',
    yields: '8 servings',
    total_time: '45 min'
  },
  config: { early_check_percent: 0.8 },
  vessels: [],
  stages: [],
  states: [],
  version: 'v1.0.0'
} as Recipe
</script>

<template>
  <div class="p-8 bg-stone-50">
    <h1 class="text-2xl font-bold mb-8">NutritionLabel Component Demo</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 class="text-lg font-semibold mb-4">With Complete Nutrition Data</h2>
        <NutritionLabel :recipe="recipeWithNutrition" />
      </div>

      <div>
        <h2 class="text-lg font-semibold mb-4">Without Nutrition Data</h2>
        <NutritionLabel :recipe="recipeWithoutNutrition" />
      </div>
    </div>

    <div class="mt-8 p-4 bg-cream border-2 border-stone-300">
      <h3 class="font-semibold mb-2">Notes:</h3>
      <ul class="list-disc list-inside text-sm text-stone-700 space-y-1">
        <li>FDA-style Nutrition Facts label with proofed. branding</li>
        <li>Shows per-serving values by default, full recipe totals in footer</li>
        <li>Calculates % Daily Value for all applicable nutrients</li>
        <li>Displays "—" for missing FDA-required fields (trans fat, cholesterol, micronutrients)</li>
        <li>Print-optimized: clean borders, readable fonts, compact layout</li>
        <li>Uses proofed design tokens: stone palette, Inter font, 2px borders, 0-radius</li>
      </ul>
    </div>
  </div>
</template>
