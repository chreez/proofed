<script setup lang="ts">
import type { Recipe } from '@/types/recipe'
import { computed } from 'vue'

interface Props {
  recipe: Recipe
}

const props = defineProps<Props>()

// FDA Daily Values for % DV calculations (2000 calorie diet)
const DAILY_VALUES = {
  calories: 2000,
  totalFat: 78, // g
  saturatedFat: 20, // g
  cholesterol: 300, // mg
  sodium: 2300, // mg
  carbohydrates: 275, // g
  fiber: 28, // g
  addedSugars: 50, // g
  protein: 50, // g
  vitaminD: 20, // mcg
  calcium: 1300, // mg
  iron: 18, // mg
  potassium: 4700 // mg
} as const

const nutrition = computed(() => props.recipe.nutrition)

const hasNutrition = computed(() => !!nutrition.value)

const servingSize = computed(() => {
  if (!nutrition.value) return '—'
  return nutrition.value.servingSize || `1 serving (${nutrition.value.servings} servings per recipe)`
})

const servingsPerRecipe = computed(() => {
  if (!nutrition.value) return '—'
  return nutrition.value.servings.toString()
})

// Per-serving values (default display)
const perServing = computed(() => nutrition.value?.perServing)

// Full recipe totals (secondary)
const totals = computed(() => nutrition.value?.totals)

// Calculate % Daily Value
function percentDV(nutrient: keyof typeof DAILY_VALUES, value: number | undefined): string {
  if (value === undefined || value === null) return '—'
  const dv = DAILY_VALUES[nutrient]
  const percent = Math.round((value / dv) * 100)
  return `${percent}%`
}

// Format nutrient value with unit
function formatNutrient(value: number | undefined, defaultValue = '—'): string {
  if (value === undefined || value === null) return defaultValue
  // Round to 1 decimal place if not a whole number
  return value % 1 === 0 ? value.toString() : value.toFixed(1)
}
</script>

<template>
  <div class="nutrition-label">
    <!-- Not calculated state -->
    <div v-if="!hasNutrition" class="not-calculated">
      <h3 class="label-title">Nutrition Facts</h3>
      <p class="text-muted mt-4">Not yet calculated</p>
    </div>

    <!-- Full nutrition facts label -->
    <div v-else class="facts-panel">
      <h3 class="label-title">Nutrition Facts</h3>

      <!-- Serving size -->
      <div class="serving-info">
        <div class="serving-line">
          <span class="serving-label">Serving size</span>
          <span class="serving-value">{{ servingSize }}</span>
        </div>
        <div class="servings-per-recipe">
          Servings per recipe <strong>{{ servingsPerRecipe }}</strong>
        </div>
      </div>

      <div class="divider-thick" />

      <!-- Calories -->
      <div class="calories-section">
        <div class="calories-line">
          <span class="calories-label">Calories</span>
          <span class="calories-value">{{ formatNutrient(perServing?.calories, '—') }}</span>
        </div>
      </div>

      <div class="divider-medium" />

      <!-- Header for % Daily Value -->
      <div class="dv-header">
        <span class="text-right text-xs font-semibold">% Daily Value*</span>
      </div>

      <!-- Total Fat -->
      <div class="nutrient-line">
        <span class="nutrient-name"><strong>Total Fat</strong> {{ formatNutrient(perServing?.totalFat) }}g</span>
        <span class="nutrient-dv">{{ percentDV('totalFat', perServing?.totalFat) }}</span>
      </div>

      <!-- Saturated Fat (indented) -->
      <div class="nutrient-line-indent">
        <span class="nutrient-name">Saturated Fat {{ formatNutrient(perServing?.saturatedFat) }}g</span>
        <span class="nutrient-dv">{{ percentDV('saturatedFat', perServing?.saturatedFat) }}</span>
      </div>

      <!-- Trans Fat (indented, no % DV) -->
      <div class="nutrient-line-indent">
        <span class="nutrient-name"><em>Trans</em> Fat —</span>
        <span class="nutrient-dv" />
      </div>

      <div class="divider-thin" />

      <!-- Cholesterol -->
      <div class="nutrient-line">
        <span class="nutrient-name"><strong>Cholesterol</strong> —</span>
        <span class="nutrient-dv">—</span>
      </div>

      <div class="divider-thin" />

      <!-- Sodium -->
      <div class="nutrient-line">
        <span class="nutrient-name"><strong>Sodium</strong> {{ formatNutrient(perServing?.sodium) }}mg</span>
        <span class="nutrient-dv">{{ percentDV('sodium', perServing?.sodium) }}</span>
      </div>

      <div class="divider-thin" />

      <!-- Total Carbohydrates -->
      <div class="nutrient-line">
        <span class="nutrient-name"><strong>Total Carbohydrate</strong> {{ formatNutrient(perServing?.carbohydrates) }}g</span>
        <span class="nutrient-dv">{{ percentDV('carbohydrates', perServing?.carbohydrates) }}</span>
      </div>

      <!-- Dietary Fiber (indented) -->
      <div class="nutrient-line-indent">
        <span class="nutrient-name">Dietary Fiber {{ formatNutrient(perServing?.fiber) }}g</span>
        <span class="nutrient-dv">{{ percentDV('fiber', perServing?.fiber) }}</span>
      </div>

      <!-- Total Sugars (indented) -->
      <div class="nutrient-line-indent">
        <span class="nutrient-name">Total Sugars {{ formatNutrient(perServing?.sugar) }}g</span>
        <span class="nutrient-dv" />
      </div>

      <!-- Added Sugars (double-indented) -->
      <div class="nutrient-line-double-indent">
        <span class="nutrient-name">Includes — Added Sugars</span>
        <span class="nutrient-dv">—</span>
      </div>

      <div class="divider-thin" />

      <!-- Protein -->
      <div class="nutrient-line">
        <span class="nutrient-name"><strong>Protein</strong> {{ formatNutrient(perServing?.protein) }}g</span>
        <span class="nutrient-dv">{{ percentDV('protein', perServing?.protein) }}</span>
      </div>

      <div class="divider-thick" />

      <!-- Micronutrients -->
      <div class="micronutrients">
        <div class="micronutrient-line">
          <span>Vitamin D —</span>
          <span>—</span>
        </div>
        <div class="micronutrient-line">
          <span>Calcium —</span>
          <span>—</span>
        </div>
        <div class="micronutrient-line">
          <span>Iron —</span>
          <span>—</span>
        </div>
        <div class="micronutrient-line">
          <span>Potassium —</span>
          <span>—</span>
        </div>
      </div>

      <div class="divider-medium" />

      <!-- Footer note -->
      <div class="footer-note">
        * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
      </div>

      <!-- Full recipe totals (secondary info) -->
      <div class="totals-info">
        <p class="text-muted text-xs">
          Full recipe totals: {{ formatNutrient(totals?.calories) }} cal,
          {{ formatNutrient(totals?.protein) }}g protein,
          {{ formatNutrient(totals?.totalFat) }}g fat,
          {{ formatNutrient(totals?.carbohydrates) }}g carbs
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nutrition-label {
  font-family: var(--font-sans);
  max-width: 320px;
  background: white;
  border: 2px solid var(--color-ink);
  border-radius: 0;
}

.not-calculated {
  padding: 1.5rem;
  text-align: center;
}

.facts-panel {
  padding: 0.75rem;
}

.label-title {
  font-family: var(--font-sans);
  font-size: 2rem;
  font-weight: 900;
  color: var(--color-ink);
  margin: 0;
  line-height: 1;
}

/* Serving size section */
.serving-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.serving-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.serving-label {
  font-weight: 700;
}

.serving-value {
  font-weight: 700;
}

.servings-per-recipe {
  font-size: 0.75rem;
  color: var(--color-stone-600);
}

/* Dividers */
.divider-thick {
  height: 10px;
  background: var(--color-ink);
  margin: 0.5rem 0;
}

.divider-medium {
  height: 5px;
  background: var(--color-ink);
  margin: 0.5rem 0;
}

.divider-thin {
  height: 1px;
  background: var(--color-stone-400);
  margin: 0.25rem 0;
}

/* Calories section */
.calories-section {
  margin: 0.5rem 0;
}

.calories-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.calories-label {
  font-size: 1rem;
  font-weight: 700;
}

.calories-value {
  font-size: 2rem;
  font-weight: 900;
  color: var(--color-ink);
}

/* Daily Value header */
.dv-header {
  text-align: right;
  font-size: 0.625rem;
  margin-bottom: 0.5rem;
  padding-right: 0.25rem;
}

/* Nutrient lines */
.nutrient-line,
.nutrient-line-indent,
.nutrient-line-double-indent {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  padding: 0.125rem 0;
}

.nutrient-line-indent {
  padding-left: 1rem;
}

.nutrient-line-double-indent {
  padding-left: 2rem;
}

.nutrient-name {
  flex: 1;
}

.nutrient-dv {
  font-weight: 700;
  min-width: 3rem;
  text-align: right;
}

/* Micronutrients section */
.micronutrients {
  margin-top: 0.5rem;
}

.micronutrient-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  padding: 0.125rem 0;
  border-top: 1px solid var(--color-stone-300);
}

.micronutrient-line:first-child {
  border-top: none;
}

/* Footer note */
.footer-note {
  font-size: 0.625rem;
  color: var(--color-stone-600);
  line-height: 1.3;
  margin-top: 0.5rem;
  border-top: 1px solid var(--color-stone-300);
  padding-top: 0.5rem;
}

/* Totals info */
.totals-info {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 2px solid var(--color-stone-200);
}
</style>
