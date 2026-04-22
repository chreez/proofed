<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as QRCode from 'qrcode'

const qrCodeDataUrl = ref<string>('')

const TEST_URL = 'https://proofeddot.netlify.app/recipe/atk-cinnamon-buns-ultimate'

// Hardcoded sample data (ATK Cinnamon Buns)
const recipeData = {
  name: 'ATK Cinnamon Buns (Quick)',
  version: 'v2.4',
  yield: '8 buns',
  prepTime: '20 min',
  bakeTime: '30 min',
  totalTime: '1.5 hrs',
  ingredients: {
    dough: [
      { name: 'all-purpose flour', amount: '390g' },
      { name: 'baking powder', amount: '10g' },
      { name: 'salt', amount: '5g' },
      { name: 'whole milk (warm)', amount: '296g' },
      { name: 'instant yeast', amount: '8g' },
      { name: 'granulated sugar', amount: '50g' },
      { name: 'unsalted butter (melted)', amount: '28g' }
    ],
    filling: [
      { name: 'dark brown sugar', amount: '149g' },
      { name: 'ground cinnamon', amount: '4g' },
      { name: 'ground cloves', amount: '0.5g' },
      { name: 'unsalted butter (melted)', amount: '84g' }
    ],
    glaze: [
      { name: 'cream cheese (softened)', amount: '85g' },
      { name: 'confectioners\' sugar', amount: '113g' },
      { name: 'unsalted butter (melted)', amount: '28g' },
      { name: 'whole milk', amount: '30g' },
      { name: 'vanilla extract', amount: '2g' }
    ]
  },
  nutrition: {
    servings: 8,
    perServing: {
      calories: 398,
      totalFat: '18g',
      saturatedFat: '11g',
      cholesterol: '48mg',
      sodium: '249mg',
      totalCarbs: '58g',
      dietaryFiber: '2g',
      totalSugars: '34g',
      protein: '5g'
    },
    fullRecipe: {
      calories: 3184,
      totalFat: '144g',
      saturatedFat: '88g',
      cholesterol: '384mg',
      sodium: '1992mg',
      totalCarbs: '464g',
      dietaryFiber: '16g',
      totalSugars: '272g',
      protein: '40g'
    }
  },
  allergens: ['Wheat', 'Milk', 'Eggs'],
  cost: {
    total: 4.50,
    perServing: 0.56
  }
}

onMounted(async () => {
  qrCodeDataUrl.value = await QRCode.toDataURL(TEST_URL, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 200,
    color: {
      dark: '#1a1816', // proofed ink
      light: '#ffffff'
    }
  })
})
</script>

<template>
  <div class="demo-page">
    <div class="demo-header">
      <h1 class="text-2xl font-mono font-medium text-ink">
        Recipe Printout Layout <span class="text-accent">.</span>
      </h1>
      <p class="text-body mt-2">
        3 FDA nutrition label variations. Pick a direction for the print layout.
      </p>
    </div>

    <div class="demo-grid">
      <!-- Variation A: Exact FDA -->
      <div class="printout-card">
        <div class="variant-label">
          <span class="font-mono text-xs text-accent font-semibold">VARIATION A</span>
          <span class="text-xs text-muted ml-2">Exact FDA</span>
        </div>
        <div class="printout-content">
          <!-- Recipe Header -->
          <div class="print-header">
            <div>
              <h2 class="text-lg font-semibold text-ink">{{ recipeData.name }}</h2>
              <div class="text-xs text-muted font-mono mt-1">{{ recipeData.version }}</div>
            </div>
            <div class="text-sm text-body text-right">
              <div>Yield: {{ recipeData.yield }}</div>
              <div class="text-xs text-muted mt-0.5">
                Prep {{ recipeData.prepTime }} • Bake {{ recipeData.bakeTime }} • Total {{ recipeData.totalTime }}
              </div>
            </div>
          </div>

          <!-- Ingredients by Component -->
          <div class="ingredients-section">
            <h3 class="section-title">Ingredients</h3>
            <div class="ingredient-groups">
              <div v-for="(group, key) in recipeData.ingredients" :key="key" class="ingredient-group">
                <div class="group-label">{{ key }}</div>
                <ul class="ingredient-list">
                  <li v-for="item in group" :key="item.name" class="ingredient-item">
                    <span class="ingredient-amount">{{ item.amount }}</span>
                    <span class="ingredient-name">{{ item.name }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FDA Nutrition Label (Exact) -->
          <div class="nutrition-fda-exact">
            <div class="fda-header">
              <div class="fda-title">Nutrition Facts</div>
              <div class="fda-servings">{{ recipeData.nutrition.servings }} servings per recipe</div>
              <div class="fda-serving-size">Serving size: 1 bun ({{ (recipeData.cost.total / recipeData.nutrition.servings * 100).toFixed(0) }}g)</div>
            </div>
            <div class="fda-divider-thick" />
            <div class="fda-row-large">
              <span class="fda-label-small">Amount per serving</span>
            </div>
            <div class="fda-row-calories">
              <span class="fda-calories-label">Calories</span>
              <span class="fda-calories-value">{{ recipeData.nutrition.perServing.calories }}</span>
            </div>
            <div class="fda-divider-medium" />
            <div class="fda-dv-header">% Daily Value*</div>
            <div class="fda-divider-thin" />
            <div class="fda-row">
              <span class="fda-nutrient"><strong>Total Fat</strong> {{ recipeData.nutrition.perServing.totalFat }}</span>
              <span class="fda-dv"><strong>23%</strong></span>
            </div>
            <div class="fda-divider-thin" />
            <div class="fda-row fda-indent">
              <span class="fda-nutrient">Saturated Fat {{ recipeData.nutrition.perServing.saturatedFat }}</span>
              <span class="fda-dv"><strong>55%</strong></span>
            </div>
            <div class="fda-divider-thin" />
            <div class="fda-row">
              <span class="fda-nutrient"><strong>Cholesterol</strong> {{ recipeData.nutrition.perServing.cholesterol }}</span>
              <span class="fda-dv"><strong>16%</strong></span>
            </div>
            <div class="fda-divider-thin" />
            <div class="fda-row">
              <span class="fda-nutrient"><strong>Sodium</strong> {{ recipeData.nutrition.perServing.sodium }}</span>
              <span class="fda-dv"><strong>11%</strong></span>
            </div>
            <div class="fda-divider-thin" />
            <div class="fda-row">
              <span class="fda-nutrient"><strong>Total Carbohydrate</strong> {{ recipeData.nutrition.perServing.totalCarbs }}</span>
              <span class="fda-dv"><strong>21%</strong></span>
            </div>
            <div class="fda-divider-thin" />
            <div class="fda-row fda-indent">
              <span class="fda-nutrient">Dietary Fiber {{ recipeData.nutrition.perServing.dietaryFiber }}</span>
              <span class="fda-dv"><strong>7%</strong></span>
            </div>
            <div class="fda-divider-thin" />
            <div class="fda-row fda-indent">
              <span class="fda-nutrient">Total Sugars {{ recipeData.nutrition.perServing.totalSugars }}</span>
            </div>
            <div class="fda-divider-medium" />
            <div class="fda-row">
              <span class="fda-nutrient"><strong>Protein</strong> {{ recipeData.nutrition.perServing.protein }}</span>
            </div>
            <div class="fda-divider-thick" />
            <div class="fda-footer">
              <div class="text-xs">* Percent Daily Values are based on a 2,000 calorie diet.</div>
            </div>
          </div>

          <!-- Allergen Declaration -->
          <div class="allergen-section">
            <span class="font-semibold text-ink">Contains:</span>
            <span class="text-body">{{ recipeData.allergens.join(', ') }}</span>
          </div>

          <!-- Cost Breakdown -->
          <div class="cost-section">
            <div class="cost-row">
              <span class="text-body">Full recipe cost:</span>
              <span class="font-semibold text-ink">${{ recipeData.cost.total.toFixed(2) }}</span>
            </div>
            <div class="cost-row">
              <span class="text-body">Per serving:</span>
              <span class="font-semibold text-ink">${{ recipeData.cost.perServing.toFixed(2) }}</span>
            </div>
          </div>

          <!-- QR Code -->
          <div class="qr-section">
            <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="Recipe QR code" class="qr-image" />
          </div>
        </div>
      </div>

      <!-- Variation B: Proofed-Branded -->
      <div class="printout-card">
        <div class="variant-label">
          <span class="font-mono text-xs text-accent font-semibold">VARIATION B</span>
          <span class="text-xs text-muted ml-2">Proofed-Branded</span>
        </div>
        <div class="printout-content">
          <!-- Recipe Header -->
          <div class="print-header">
            <div>
              <h2 class="text-lg font-semibold text-ink">{{ recipeData.name }}</h2>
              <div class="text-xs text-muted font-mono mt-1">{{ recipeData.version }}</div>
            </div>
            <div class="text-sm text-body text-right">
              <div>Yield: {{ recipeData.yield }}</div>
              <div class="text-xs text-muted mt-0.5">
                Prep {{ recipeData.prepTime }} • Bake {{ recipeData.bakeTime }} • Total {{ recipeData.totalTime }}
              </div>
            </div>
          </div>

          <!-- Ingredients by Component -->
          <div class="ingredients-section">
            <h3 class="section-title">Ingredients</h3>
            <div class="ingredient-groups">
              <div v-for="(group, key) in recipeData.ingredients" :key="key" class="ingredient-group">
                <div class="group-label">{{ key }}</div>
                <ul class="ingredient-list">
                  <li v-for="item in group" :key="item.name" class="ingredient-item">
                    <span class="ingredient-amount">{{ item.amount }}</span>
                    <span class="ingredient-name">{{ item.name }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FDA Nutrition Label (Proofed-Branded) -->
          <div class="nutrition-proofed">
            <div class="proofed-header">
              <div class="proofed-title">Nutrition Facts</div>
              <div class="proofed-servings">{{ recipeData.nutrition.servings }} servings per recipe</div>
              <div class="proofed-serving-size">Serving size: 1 bun</div>
            </div>
            <div class="proofed-divider" />
            <div class="proofed-row-calories">
              <span class="proofed-calories-label">Calories</span>
              <span class="proofed-calories-value">{{ recipeData.nutrition.perServing.calories }}</span>
            </div>
            <div class="proofed-divider" />
            <div class="proofed-dv-header">% Daily Value*</div>
            <div class="proofed-divider-thin" />
            <div class="proofed-row">
              <span class="proofed-nutrient"><strong>Total Fat</strong> {{ recipeData.nutrition.perServing.totalFat }}</span>
              <span class="proofed-dv"><strong>23%</strong></span>
            </div>
            <div class="proofed-divider-thin" />
            <div class="proofed-row proofed-indent">
              <span class="proofed-nutrient">Saturated Fat {{ recipeData.nutrition.perServing.saturatedFat }}</span>
              <span class="proofed-dv"><strong>55%</strong></span>
            </div>
            <div class="proofed-divider-thin" />
            <div class="proofed-row">
              <span class="proofed-nutrient"><strong>Cholesterol</strong> {{ recipeData.nutrition.perServing.cholesterol }}</span>
              <span class="proofed-dv"><strong>16%</strong></span>
            </div>
            <div class="proofed-divider-thin" />
            <div class="proofed-row">
              <span class="proofed-nutrient"><strong>Sodium</strong> {{ recipeData.nutrition.perServing.sodium }}</span>
              <span class="proofed-dv"><strong>11%</strong></span>
            </div>
            <div class="proofed-divider-thin" />
            <div class="proofed-row">
              <span class="proofed-nutrient"><strong>Total Carbohydrate</strong> {{ recipeData.nutrition.perServing.totalCarbs }}</span>
              <span class="proofed-dv"><strong>21%</strong></span>
            </div>
            <div class="proofed-divider-thin" />
            <div class="proofed-row proofed-indent">
              <span class="proofed-nutrient">Dietary Fiber {{ recipeData.nutrition.perServing.dietaryFiber }}</span>
              <span class="proofed-dv"><strong>7%</strong></span>
            </div>
            <div class="proofed-divider-thin" />
            <div class="proofed-row proofed-indent">
              <span class="proofed-nutrient">Total Sugars {{ recipeData.nutrition.perServing.totalSugars }}</span>
            </div>
            <div class="proofed-divider" />
            <div class="proofed-row">
              <span class="proofed-nutrient"><strong>Protein</strong> {{ recipeData.nutrition.perServing.protein }}</span>
            </div>
            <div class="proofed-divider" />
            <div class="proofed-footer">
              <div class="text-xs text-muted">* Based on 2,000 calorie diet</div>
            </div>
          </div>

          <!-- Allergen Declaration -->
          <div class="allergen-section">
            <span class="font-semibold text-ink">Contains:</span>
            <span class="text-body">{{ recipeData.allergens.join(', ') }}</span>
          </div>

          <!-- Cost Breakdown -->
          <div class="cost-section">
            <div class="cost-row">
              <span class="text-body">Full recipe cost:</span>
              <span class="font-semibold text-ink">${{ recipeData.cost.total.toFixed(2) }}</span>
            </div>
            <div class="cost-row">
              <span class="text-body">Per serving:</span>
              <span class="font-semibold text-ink">${{ recipeData.cost.perServing.toFixed(2) }}</span>
            </div>
          </div>

          <!-- QR Code -->
          <div class="qr-section">
            <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="Recipe QR code" class="qr-image" />
          </div>
        </div>
      </div>

      <!-- Variation C: Hybrid -->
      <div class="printout-card">
        <div class="variant-label">
          <span class="font-mono text-xs text-accent font-semibold">VARIATION C</span>
          <span class="text-xs text-muted ml-2">Hybrid (FDA + Proofed Typography)</span>
        </div>
        <div class="printout-content">
          <!-- Recipe Header -->
          <div class="print-header">
            <div>
              <h2 class="text-lg font-semibold text-ink">{{ recipeData.name }}</h2>
              <div class="text-xs text-muted font-mono mt-1">{{ recipeData.version }}</div>
            </div>
            <div class="text-sm text-body text-right">
              <div>Yield: {{ recipeData.yield }}</div>
              <div class="text-xs text-muted mt-0.5">
                Prep {{ recipeData.prepTime }} • Bake {{ recipeData.bakeTime }} • Total {{ recipeData.totalTime }}
              </div>
            </div>
          </div>

          <!-- Ingredients by Component -->
          <div class="ingredients-section">
            <h3 class="section-title">Ingredients</h3>
            <div class="ingredient-groups">
              <div v-for="(group, key) in recipeData.ingredients" :key="key" class="ingredient-group">
                <div class="group-label">{{ key }}</div>
                <ul class="ingredient-list">
                  <li v-for="item in group" :key="item.name" class="ingredient-item">
                    <span class="ingredient-amount">{{ item.amount }}</span>
                    <span class="ingredient-name">{{ item.name }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FDA Nutrition Label (Hybrid) -->
          <div class="nutrition-hybrid">
            <div class="hybrid-header">
              <div class="hybrid-title">Nutrition Facts</div>
              <div class="hybrid-servings">{{ recipeData.nutrition.servings }} servings per recipe</div>
              <div class="hybrid-serving-size">Serving size: 1 bun</div>
            </div>
            <div class="hybrid-divider-thick" />
            <div class="hybrid-row-calories">
              <span class="hybrid-calories-label">Calories</span>
              <span class="hybrid-calories-value">{{ recipeData.nutrition.perServing.calories }}</span>
            </div>
            <div class="hybrid-divider-medium" />
            <div class="hybrid-dv-header">% Daily Value*</div>
            <div class="hybrid-divider-thin" />
            <div class="hybrid-row">
              <span class="hybrid-nutrient"><strong>Total Fat</strong> {{ recipeData.nutrition.perServing.totalFat }}</span>
              <span class="hybrid-dv"><strong>23%</strong></span>
            </div>
            <div class="hybrid-divider-thin" />
            <div class="hybrid-row hybrid-indent">
              <span class="hybrid-nutrient">Saturated Fat {{ recipeData.nutrition.perServing.saturatedFat }}</span>
              <span class="hybrid-dv"><strong>55%</strong></span>
            </div>
            <div class="hybrid-divider-thin" />
            <div class="hybrid-row">
              <span class="hybrid-nutrient"><strong>Cholesterol</strong> {{ recipeData.nutrition.perServing.cholesterol }}</span>
              <span class="hybrid-dv"><strong>16%</strong></span>
            </div>
            <div class="hybrid-divider-thin" />
            <div class="hybrid-row">
              <span class="hybrid-nutrient"><strong>Sodium</strong> {{ recipeData.nutrition.perServing.sodium }}</span>
              <span class="hybrid-dv"><strong>11%</strong></span>
            </div>
            <div class="hybrid-divider-thin" />
            <div class="hybrid-row">
              <span class="hybrid-nutrient"><strong>Total Carbohydrate</strong> {{ recipeData.nutrition.perServing.totalCarbs }}</span>
              <span class="hybrid-dv"><strong>21%</strong></span>
            </div>
            <div class="hybrid-divider-thin" />
            <div class="hybrid-row hybrid-indent">
              <span class="hybrid-nutrient">Dietary Fiber {{ recipeData.nutrition.perServing.dietaryFiber }}</span>
              <span class="hybrid-dv"><strong>7%</strong></span>
            </div>
            <div class="hybrid-divider-thin" />
            <div class="hybrid-row hybrid-indent">
              <span class="hybrid-nutrient">Total Sugars {{ recipeData.nutrition.perServing.totalSugars }}</span>
            </div>
            <div class="hybrid-divider-medium" />
            <div class="hybrid-row">
              <span class="hybrid-nutrient"><strong>Protein</strong> {{ recipeData.nutrition.perServing.protein }}</span>
            </div>
            <div class="hybrid-divider-thick" />
            <div class="hybrid-footer">
              <div class="text-xs text-muted">* Based on 2,000 calorie diet</div>
            </div>
          </div>

          <!-- Allergen Declaration -->
          <div class="allergen-section">
            <span class="font-semibold text-ink">Contains:</span>
            <span class="text-body">{{ recipeData.allergens.join(', ') }}</span>
          </div>

          <!-- Cost Breakdown -->
          <div class="cost-section">
            <div class="cost-row">
              <span class="text-body">Full recipe cost:</span>
              <span class="font-semibold text-ink">${{ recipeData.cost.total.toFixed(2) }}</span>
            </div>
            <div class="cost-row">
              <span class="text-body">Per serving:</span>
              <span class="font-semibold text-ink">${{ recipeData.cost.perServing.toFixed(2) }}</span>
            </div>
          </div>

          <!-- QR Code -->
          <div class="qr-section">
            <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="Recipe QR code" class="qr-image" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-page {
  padding: 2rem 0;
}

.demo-header {
  margin-bottom: 2rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

.printout-card {
  background: var(--color-surface);
  border: 2px solid var(--color-stone-200);
  border-radius: 0;
  overflow: hidden;
}

.variant-label {
  background: var(--color-stone-100);
  padding: 0.75rem 1rem;
  border-bottom: 2px solid var(--color-stone-200);
}

.printout-content {
  padding: 1.5rem;
  font-size: 10pt;
  line-height: 1.3;
  max-height: 800px;
  overflow-y: auto;
}

/* Print Header */
.print-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-stone-200);
}

/* Ingredients Section */
.ingredients-section {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 12pt;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: 0.5rem;
}

.ingredient-groups {
  display: grid;
  gap: 0.5rem;
}

.ingredient-group {
  margin-bottom: 0.5rem;
}

.group-label {
  font-size: 9pt;
  font-weight: 600;
  color: var(--color-stone-600);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 0.25rem;
}

.ingredient-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredient-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.125rem 0;
  font-size: 9pt;
}

.ingredient-amount {
  font-weight: 600;
  color: var(--color-ink);
  min-width: 3rem;
  flex-shrink: 0;
}

.ingredient-name {
  color: var(--color-stone-700);
}

/* FDA Nutrition Label - Exact */
.nutrition-fda-exact {
  border: 1px solid #000;
  padding: 0.5rem;
  margin-bottom: 1rem;
  font-family: 'Helvetica', 'Arial', sans-serif;
  background: #fff;
}

.fda-header {
  margin-bottom: 0.25rem;
}

.fda-title {
  font-size: 24pt;
  font-weight: bold;
  color: #000;
  line-height: 1;
}

.fda-servings {
  font-size: 8pt;
  color: #000;
  margin-top: 0.125rem;
}

.fda-serving-size {
  font-size: 8pt;
  font-weight: bold;
  color: #000;
}

.fda-divider-thick {
  height: 8px;
  background: #000;
  margin: 0.25rem 0;
}

.fda-divider-medium {
  height: 4px;
  background: #000;
  margin: 0.25rem 0;
}

.fda-divider-thin {
  height: 1px;
  background: #000;
  margin: 0.125rem 0;
}

.fda-row-large {
  padding: 0.125rem 0;
}

.fda-label-small {
  font-size: 7pt;
  color: #000;
}

.fda-row-calories {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.125rem 0;
}

.fda-calories-label {
  font-size: 9pt;
  font-weight: bold;
  color: #000;
}

.fda-calories-value {
  font-size: 18pt;
  font-weight: bold;
  color: #000;
}

.fda-dv-header {
  font-size: 7pt;
  font-weight: bold;
  text-align: right;
  color: #000;
  padding: 0.125rem 0;
}

.fda-row {
  display: flex;
  justify-content: space-between;
  padding: 0.125rem 0;
  font-size: 8pt;
  color: #000;
}

.fda-indent {
  padding-left: 1rem;
}

.fda-nutrient {
  flex: 1;
}

.fda-dv {
  font-size: 8pt;
}

.fda-footer {
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 4px solid #000;
  color: #000;
}

/* Proofed-Branded Nutrition Label */
.nutrition-proofed {
  border: 2px solid var(--color-ink);
  border-radius: 0;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-family: 'Inter', sans-serif;
  background: var(--color-surface);
}

.proofed-header {
  margin-bottom: 0.5rem;
}

.proofed-title {
  font-size: 16pt;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.1;
}

.proofed-servings {
  font-size: 8pt;
  color: var(--color-stone-600);
  margin-top: 0.25rem;
}

.proofed-serving-size {
  font-size: 8pt;
  font-weight: 600;
  color: var(--color-ink);
}

.proofed-divider {
  height: 2px;
  background: var(--color-ink);
  margin: 0.5rem 0;
}

.proofed-divider-thin {
  height: 1px;
  background: var(--color-stone-300);
  margin: 0.25rem 0;
}

.proofed-row-calories {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.25rem 0;
}

.proofed-calories-label {
  font-size: 9pt;
  font-weight: 600;
  color: var(--color-ink);
}

.proofed-calories-value {
  font-size: 16pt;
  font-weight: 600;
  color: var(--color-accent);
}

.proofed-dv-header {
  font-size: 7pt;
  font-weight: 600;
  text-align: right;
  color: var(--color-stone-600);
  padding: 0.25rem 0;
}

.proofed-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 8pt;
  color: var(--color-ink);
}

.proofed-indent {
  padding-left: 1rem;
}

.proofed-nutrient {
  flex: 1;
  color: var(--color-ink);
}

.proofed-dv {
  font-size: 8pt;
  color: var(--color-stone-700);
}

.proofed-footer {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 2px solid var(--color-ink);
}

/* Hybrid Nutrition Label */
.nutrition-hybrid {
  border: 1px solid #000;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-family: 'Inter', sans-serif;
  background: #fff;
}

.hybrid-header {
  margin-bottom: 0.5rem;
}

.hybrid-title {
  font-size: 20pt;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.1;
}

.hybrid-servings {
  font-size: 8pt;
  color: var(--color-stone-700);
  margin-top: 0.25rem;
}

.hybrid-serving-size {
  font-size: 8pt;
  font-weight: 600;
  color: var(--color-ink);
}

.hybrid-divider-thick {
  height: 6px;
  background: #000;
  margin: 0.375rem 0;
}

.hybrid-divider-medium {
  height: 3px;
  background: #000;
  margin: 0.375rem 0;
}

.hybrid-divider-thin {
  height: 1px;
  background: #000;
  margin: 0.25rem 0;
}

.hybrid-row-calories {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.25rem 0;
}

.hybrid-calories-label {
  font-size: 9pt;
  font-weight: 600;
  color: var(--color-ink);
}

.hybrid-calories-value {
  font-size: 18pt;
  font-weight: 600;
  color: var(--color-accent);
}

.hybrid-dv-header {
  font-size: 7pt;
  font-weight: 600;
  text-align: right;
  color: var(--color-stone-700);
  padding: 0.25rem 0;
}

.hybrid-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 8pt;
  color: var(--color-ink);
}

.hybrid-indent {
  padding-left: 1rem;
}

.hybrid-nutrient {
  flex: 1;
}

.hybrid-dv {
  font-size: 8pt;
}

.hybrid-footer {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 3px solid #000;
}

/* Allergen Section */
.allergen-section {
  padding: 0.5rem 0;
  border-top: 2px solid var(--color-stone-200);
  border-bottom: 2px solid var(--color-stone-200);
  margin-bottom: 1rem;
  font-size: 9pt;
}

/* Cost Section */
.cost-section {
  padding: 0.5rem 0;
  border-bottom: 2px solid var(--color-stone-200);
  margin-bottom: 1rem;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 9pt;
}

/* QR Code Section */
.qr-section {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.qr-image {
  width: 120px;
  height: 120px;
}

/* Print-specific styles */
@media print {
  @page {
    size: letter portrait;
    margin: 0.75in 0.5in;
  }

  .demo-header {
    display: none;
  }

  .demo-grid {
    grid-template-columns: 1fr;
    page-break-inside: avoid;
  }

  .printout-card {
    page-break-inside: avoid;
    page-break-after: always;
  }

  .printout-card:last-child {
    page-break-after: auto;
  }

  .variant-label {
    background: transparent;
    border-bottom: 1px solid #000;
  }

  .printout-content {
    max-height: none;
    overflow: visible;
    font-size: 10pt;
  }

  /* Hide scrollbars */
  ::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 1200px) {
  .demo-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
