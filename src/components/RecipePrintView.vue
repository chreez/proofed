<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useRecipe } from '@/composables/useRecipe'
import { validatePrintSections } from '@/composables/usePrintValidation'
import { deriveAllergens } from '@/composables/useAllergens'
import { getMostRecentCost, getMostRecentCostDate, getMostRecentCostWithItems, getMostRecentCostWithItemsDate } from '@/composables/useCost'
import type { CookLogCostItem } from '@/types/recipe'
import NutritionLabel from '@/components/NutritionLabel.vue'
import * as QRCode from 'qrcode'

const route = useRoute()
const router = useRouter()
const { currentRecipe } = useRecipe()

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(`/recipe/${route.params.recipeId}`)
  }
}

// Validation
const validation = computed(() => validatePrintSections(currentRecipe.value))
const failedChecks = computed(() => validation.value.checks.filter((c) => !c.pass))

const qrCodeDataUrl = ref<string>('')

// Generate QR code on mount
onMounted(async () => {
  const recipeId = route.params.recipeId
  if (typeof recipeId === 'string') {
    const url = `https://proofeddot.netlify.app/recipe/${recipeId}`
    qrCodeDataUrl.value = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 200,
      color: {
        dark: '#1a1816',
        light: '#ffffff'
      }
    })
  }
})

// Computed recipe metadata
const recipeName = computed(() => currentRecipe.value?.meta.name ?? '')
const recipeVersion = computed(() => currentRecipe.value?.version ?? '')
const recipeYields = computed(() => currentRecipe.value?.meta.yields ?? '')

// Source attribution
const sourceAttribution = computed(() => {
  const source = currentRecipe.value?.meta.source
  if (!source) return ''
  if (source.type === 'adapted') return `Adapted from ${source.name}`
  if (source.type === 'inspired') return `Inspired by ${source.name}`
  return `Source: ${source.name}`
})

// Ingredients grouped by stage
interface IngredientGroup {
  stageName: string
  items: Array<{ name: string; amount: string }>
}

const ingredientsByStage = computed<IngredientGroup[]>(() => {
  if (!currentRecipe.value) return []
  return currentRecipe.value.stages
    .filter(stage => stage.gather?.ingredients && stage.gather.ingredients.length > 0)
    .map(stage => ({
      stageName: stage.title,
      items: (stage.gather?.ingredients ?? []).map(ing => ({
        name: ing.name,
        amount: ing.unit === 'whole' ? `${ing.total}x` : `${ing.total} ${ing.unit}`
      }))
    }))
})

// Parse time string to hours
function parseHours(s: string): number | null {
  const hrsMatch = s.match(/([\d.]+)\s*(?:hrs?|hours?)/i)
  if (hrsMatch) return parseFloat(hrsMatch[1])
  const minMatch = s.match(/([\d.]+)\s*min/i)
  if (minMatch) return parseFloat(minMatch[1]) / 60
  const numMatch = s.match(/([\d.]+)/)
  if (numMatch) return parseFloat(numMatch[1])
  return null
}

// Format hours back to human-readable
function formatHours(hrs: number): string {
  if (hrs < 1) return `${Math.round(hrs * 60)} min`
  const whole = Math.floor(hrs)
  const frac = hrs - whole
  // Convert fractional hours to minutes if remainder is significant
  if (frac > 0.08) {
    const mins = Math.round(frac * 60)
    return mins > 0 ? `${whole} hrs ${mins} min` : `${whole} hrs`
  }
  return `${whole} hrs`
}

// Time breakdown: total, active, waiting
const timeBreakdown = computed(() => {
  const raw = currentRecipe.value?.meta.total_time ?? ''
  // Extract main time (before parentheses)
  const mainMatch = raw.match(/^([^(]+)/)
  const total = mainMatch ? mainMatch[1].trim() : raw

  // Extract active time from parentheses
  const activeMatch = raw.match(/\(([\d.]+\s*(?:hrs?|hours?|min(?:utes?)?)?)\s*active/i)
  const activeRaw = activeMatch ? activeMatch[1].trim() : ''
  const activeHrs = activeRaw ? parseHours(activeRaw) : null
  const totalHrs = parseHours(total)

  const waitingHrs = totalHrs !== null && activeHrs !== null ? totalHrs - activeHrs : null

  return {
    total,
    activeText: activeHrs !== null ? formatHours(activeHrs) : '',
    waitingText: waitingHrs !== null && waitingHrs > 0 ? formatHours(waitingHrs) : '',
  }
})

// Allergens (inline rendering for print)
const allergens = computed(() => {
  if (!currentRecipe.value) return []
  return deriveAllergens(currentRecipe.value)
})

const allergenText = computed(() => {
  if (allergens.value.length === 0) return ''
  return allergens.value.join(', ')
})

// Nutrition metadata
const nutritionSource = computed(() => currentRecipe.value?.nutrition?.dataSource ?? '')
const nutritionDate = computed(() => {
  const d = currentRecipe.value?.nutrition?.calculatedDate
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

// Cost snapshot date
const costDate = computed(() => {
  if (!currentRecipe.value) return null
  return getMostRecentCostDate(currentRecipe.value)
})

const costDateFormatted = computed(() => {
  if (!costDate.value) return ''
  const d = new Date(costDate.value)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

// Most recent cost for page 1 summary — use same entry as page 2 for consistency
const costSummary = computed(() => {
  if (!currentRecipe.value) return null
  // Prefer entry with items (matches page 2), fall back to any cost entry
  return getMostRecentCostWithItems(currentRecipe.value) ?? getMostRecentCost(currentRecipe.value)
})

// Most recent cost WITH items for page 2 table
const costBreakdown = computed(() => {
  if (!currentRecipe.value) return null
  return getMostRecentCostWithItems(currentRecipe.value)
})

// Cost items sorted by cost descending
const costItems = computed<CookLogCostItem[]>(() => {
  if (!costBreakdown.value?.items) return []
  return [...costBreakdown.value.items].sort((a, b) => b.cost - a.cost)
})

// Cost date — prefer the items entry date for the breakdown page
const costBreakdownDate = computed(() => {
  if (!currentRecipe.value) return null
  return getMostRecentCostWithItemsDate(currentRecipe.value)
})

const costBreakdownDateFormatted = computed(() => {
  if (!costBreakdownDate.value) return ''
  const d = new Date(costBreakdownDate.value)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

const recipeUrl = computed(() => {
  const id = route.params.recipeId
  return typeof id === 'string' ? `/recipe/${id}` : '/'
})

function handlePrint(): void {
  window.print()
}
</script>

<template>
  <!-- Screen-only navigation bar (hidden in print) -->
  <nav v-if="currentRecipe" class="print-nav">
    <div class="print-nav-inner">
      <button class="back-link" @click="goBack">
        <ArrowLeft :size="16" />
        <span class="font-mono text-sm">Back</span>
      </button>
      <span class="print-nav-brand">proofed<span class="brand-dot">.</span></span>
      <button v-if="validation.ready" class="print-btn" @click="handlePrint">Print</button>
    </div>
  </nav>

  <!-- Not yet generated gate -->
  <div v-if="currentRecipe && !validation.ready" class="print-not-ready">
    <h1 class="not-ready-title">Print View Not Yet Generated</h1>
    <p class="not-ready-subtitle">This recipe needs the following before a printout can be generated:</p>
    <ul class="not-ready-list">
      <li v-for="check in failedChecks" :key="check.id" class="not-ready-item">
        <span class="check-id">{{ check.id }}</span>
        <span class="check-label">{{ check.label }}</span>
        <span class="check-detail">{{ check.detail }}</span>
      </li>
    </ul>
  </div>

  <div v-else-if="currentRecipe" class="print-container">
    <!-- PAGE 1 -->
    <div class="print-view">

    <!-- Recipe Header -->
    <header class="print-header">
      <div class="header-left">
        <h1 class="recipe-name">{{ recipeName }}</h1>
        <div class="recipe-version">{{ recipeVersion }}</div>
      </div>
      <div class="header-right">
        <div class="recipe-yield">Yield: {{ recipeYields }}</div>
        <div class="recipe-time">Total Time: {{ timeBreakdown.total }}</div>
        <div v-if="timeBreakdown.activeText" class="time-badges">
          <span class="time-badge badge-active">{{ timeBreakdown.activeText }} active</span>
          <span v-if="timeBreakdown.waitingText" class="time-badge badge-waiting">{{ timeBreakdown.waitingText }} passive</span>
        </div>
      </div>
    </header>

    <!-- Source Attribution -->
    <div v-if="sourceAttribution" class="source-attribution">
      {{ sourceAttribution }}
    </div>

    <!-- Ingredients + Nutrition side by side -->
    <div class="main-content">
      <!-- Ingredients (left column) -->
      <section v-if="validation.sections.ingredients" class="ingredients-section">
        <h2 class="section-title">Ingredients</h2>
        <div class="ingredient-groups">
          <div
            v-for="group in ingredientsByStage"
            :key="group.stageName"
            class="ingredient-group"
          >
            <h3 v-if="ingredientsByStage.length > 1" class="group-label">{{ group.stageName }}</h3>
            <ul class="ingredient-list">
              <li
                v-for="item in group.items"
                :key="item.name"
                class="ingredient-item"
              >
                <span class="ingredient-amount">{{ item.amount }}</span>
                <span class="ingredient-name">{{ item.name }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
      <section v-else class="ingredients-section critical-missing">
        <h2 class="section-title">Ingredients</h2>
        <p class="missing-text">No ingredients defined in this recipe</p>
      </section>

      <!-- Nutrition (right column) -->
      <div v-if="validation.sections.nutrition" class="nutrition-column">
        <div class="nutrition-wrapper">
          <NutritionLabel :recipe="currentRecipe" />
        </div>
        <div v-if="nutritionSource || nutritionDate" class="estimation-note">
          Derived from {{ nutritionSource || 'nutritional databases' }}<span v-if="nutritionDate">, calculated {{ nutritionDate }}</span>
        </div>
      </div>
      <section v-else class="nutrition-placeholder">
        <h2 class="section-title">Nutrition Facts</h2>
        <p class="placeholder-text">Not yet calculated</p>
      </section>
    </div>

    <!-- Allergen Declaration -->
    <div v-if="allergenText" class="allergen-section">
      <div>
        <span class="allergen-label">Contains: </span>
        <span class="allergen-value">{{ allergenText }}</span>
      </div>
      <div class="estimation-note">Derived from ingredient classification</div>
    </div>
    <section v-else-if="!validation.sections.allergens" class="critical-missing">
      <h2 class="section-title">Allergen Declaration</h2>
      <p class="missing-text">Unable to determine allergens — ingredient lookup incomplete</p>
    </section>

    <!-- Cost (most recent bake, hidden when absent) -->
    <div v-if="costSummary" class="cost-section">
      <div class="cost-values">
        <span class="cost-total">${{ costSummary.total.toFixed(2) }} per bake</span>
        <span class="cost-divider">&middot;</span>
        <span class="cost-serving">${{ costSummary.perServing.toFixed(2) }} per {{ currentRecipe?.meta.yields ? 'unit' : 'serving' }}</span>
      </div>
      <div class="estimation-note">
        Estimated from H-E-B retail prices<span v-if="costDateFormatted">, snapshotted {{ costDateFormatted }}</span>
      </div>
    </div>

    <!-- Footer + QR unified section -->
    <footer class="print-footer">
      <div class="footer-text">
        <span class="brand">proofed<span class="brand-dot">.</span></span>
        <span class="footer-copy">&copy; 2026 Chris Palmer</span>
      </div>
      <router-link v-if="qrCodeDataUrl" :to="recipeUrl" class="footer-qr">
        <img :src="qrCodeDataUrl" alt="Recipe QR code" class="qr-image" />
        <p class="qr-caption">Scan for full recipe</p>
      </router-link>
    </footer>

    </div><!-- end page 1 .print-view -->

    <!-- PAGE 2: Cost Breakdown -->
    <div v-if="costBreakdown" class="page-break" />
    <div v-if="costBreakdown" class="print-view cost-page">
      <header class="print-header">
        <div class="header-left">
          <h1 class="recipe-name">{{ recipeName }}</h1>
          <div class="recipe-version">{{ recipeVersion }} — Cost Breakdown</div>
        </div>
        <div class="header-right">
          <div class="cost-summary-total">${{ costBreakdown.total.toFixed(2) }}</div>
          <div class="cost-summary-label">per bake</div>
        </div>
      </header>

      <!-- Cost summary bar -->
      <div class="cost-summary-bar">
        <div class="cost-stat">
          <span class="cost-stat-value">${{ costBreakdown.perServing.toFixed(2) }}</span>
          <span class="cost-stat-label">per {{ currentRecipe?.meta.yields ? 'unit' : 'serving' }}</span>
        </div>
        <div class="cost-stat-divider" />
        <div class="cost-stat">
          <span class="cost-stat-value">{{ currentRecipe?.meta.yields || `${costBreakdown.servings} servings` }}</span>
          <span class="cost-stat-label">yield</span>
        </div>
      </div>

      <!-- Ingredient cost table -->
      <table class="cost-table">
        <thead>
          <tr>
            <th class="col-ingredient">Ingredient</th>
            <th class="col-amount">Amount</th>
            <th class="col-cost">Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in costItems" :key="item.ingredientId">
            <td class="col-ingredient">
              <span class="ingredient-primary">{{ item.name }}</span>
              <span class="ingredient-source">{{ item.sourceName }}</span>
            </td>
            <td class="col-amount">{{ item.unit === 'whole' ? `${item.amount}x` : `${item.amount}${item.unit}` }}</td>
            <td class="col-cost">${{ item.cost.toFixed(2) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="cost-total-row">
            <td colspan="2" class="cost-total-label">Total</td>
            <td class="col-cost cost-total-value">${{ costBreakdown.total.toFixed(2) }}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Estimation disclaimer -->
      <div class="cost-disclaimer">
        <span class="disclaimer-accent">*</span>
        Cost is an estimation using H-E-B retail prices, calculated programmatically from product listings — not wholesale or bulk pricing.<span v-if="costBreakdownDateFormatted"> Prices snapshotted {{ costBreakdownDateFormatted }}.</span>
      </div>

      <!-- Page 2 footer -->
      <footer class="print-footer">
        <div class="footer-text">
          <span class="brand">proofed<span class="brand-dot">.</span></span>
          <span class="footer-copy">&copy; 2026 Chris Palmer</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Not Ready Gate */
.print-not-ready {
  max-width: 8.5in;
  margin: 2rem auto;
  padding: 2rem;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--color-ink);
}

.not-ready-title {
  font-size: 18pt;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.not-ready-subtitle {
  font-size: 10pt;
  color: var(--color-stone-600);
  margin: 0 0 1.5rem 0;
}

.not-ready-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.not-ready-item {
  display: grid;
  grid-template-columns: 3rem 1fr;
  grid-template-rows: auto auto;
  gap: 0 0.75rem;
  padding: 0.75rem;
  border: 2px solid var(--color-stone-300);
}

.check-id {
  grid-row: 1 / 3;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  font-weight: 600;
  color: var(--color-accent);
  align-self: center;
}

.check-label {
  font-size: 10pt;
  font-weight: 600;
}

.check-detail {
  font-size: 9pt;
  color: var(--color-stone-500);
}

/* Screen-only nav bar */
.print-nav {
  max-width: 8.5in;
  margin: 0 auto;
  border-bottom: 2px solid var(--color-stone-200);
  background: var(--color-surface);
  position: sticky;
  top: 0;
  z-index: 100;
}

.print-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.75rem;
}

.print-nav-brand {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14pt;
  font-weight: 600;
  color: var(--color-ink);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  padding: 0 12px 0 8px;
}

.back-link:hover {
  background: var(--color-stone-200);
}

.print-btn {
  padding: 0.375rem 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  font-weight: 600;
  color: var(--color-surface);
  background: var(--color-ink);
  border: 2px solid var(--color-ink);
  cursor: pointer;
}

.print-btn:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

/* Outer wrapper — no layout, just contains sibling pages */
.print-container {
  max-width: 8.5in;
  margin: 0 auto;
}

/* Base Layout — tight, print-dense */
.print-view {
  padding: 1rem 0.75rem;
  background: var(--color-surface);
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--color-ink);
  font-size: 10pt;
  line-height: 1.3;
  display: flex;
  flex-direction: column;
}

/* Header */
.print-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-ink);
}

.header-left {
  flex: 1;
}

.recipe-name {
  font-size: 16pt;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
  line-height: 1.2;
}

.recipe-version {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8pt;
  color: var(--color-stone-500);
  margin-top: 0.125rem;
}

.header-right {
  text-align: right;
  font-size: 9pt;
}

.recipe-yield {
  font-weight: 500;
  color: var(--color-ink);
}

.recipe-time {
  color: var(--color-stone-600);
  margin-top: 0.125rem;
}

.time-badges {
  display: flex;
  gap: 0.375rem;
  margin-top: 0.25rem;
  justify-content: flex-end;
}

.time-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7pt;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  letter-spacing: 0.01em;
}

.badge-active {
  background: var(--color-stone-200);
  color: var(--color-stone-700);
}

.badge-waiting {
  background: var(--color-cream, #f5f0e8);
  color: var(--color-stone-600);
}

/* Source Attribution */
.source-attribution {
  font-size: 9pt;
  color: var(--color-stone-600);
  font-style: italic;
  margin-bottom: 0.625rem;
}

/* Main content — side by side */
.main-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

/* Ingredients Section */
.ingredients-section {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: 12pt;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 0.375rem 0;
  border-bottom: 2px solid var(--color-stone-300);
  padding-bottom: 0.125rem;
}

.ingredient-groups {
  display: grid;
  gap: 0.25rem;
}

.ingredient-group {
  margin-bottom: 0.25rem;
}

.group-label {
  font-size: 9pt;
  font-weight: 600;
  color: var(--color-stone-600);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 0 0 0.125rem 0;
}

.ingredient-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredient-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.0625rem 0;
  font-size: 9pt;
}

.ingredient-amount {
  font-weight: 600;
  color: var(--color-ink);
  min-width: 4rem;
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
  text-align: right;
}

.ingredient-name {
  color: var(--color-stone-700);
}

/* Nutrition column (right side) */
.nutrition-column {
  flex-shrink: 0;
  width: 40%;
}

.nutrition-wrapper {
  width: 100%;
}

.nutrition-wrapper :deep(.nutrition-label) {
  max-width: 100%;
  font-size: 8pt;
}

.nutrition-wrapper :deep(.facts-panel) {
  padding: 0.5rem;
}

.nutrition-wrapper :deep(.label-title) {
  font-size: 18pt;
}

.nutrition-wrapper :deep(.calories-value) {
  font-size: 16pt;
}

.nutrition-wrapper :deep(.calories-label) {
  font-size: 8pt;
}

.nutrition-wrapper :deep(.dv-header) {
  font-size: 6pt;
  margin-bottom: 0.25rem;
}

.nutrition-wrapper :deep(.nutrient-line),
.nutrition-wrapper :deep(.nutrient-line-indent),
.nutrition-wrapper :deep(.nutrient-line-double-indent) {
  font-size: 7pt;
  padding: 0.0625rem 0;
}

.nutrition-wrapper :deep(.nutrient-dv) {
  font-size: 7pt;
  min-width: 2.5rem;
}

.nutrition-wrapper :deep(.micronutrient-line) {
  font-size: 7pt;
  padding: 0.0625rem 0;
}

.nutrition-wrapper :deep(.serving-info) {
  font-size: 7pt;
  margin-top: 0.25rem;
}

.nutrition-wrapper :deep(.servings-per-recipe) {
  font-size: 6pt;
}

.nutrition-wrapper :deep(.footer-note) {
  font-size: 5.5pt;
  margin-top: 0.25rem;
}

.nutrition-wrapper :deep(.totals-info) {
  display: none;
}

.nutrition-wrapper :deep(.divider-thick) {
  height: 6px;
  margin: 0.125rem 0;
}

.nutrition-wrapper :deep(.divider-medium) {
  height: 3px;
  margin: 0.125rem 0;
}

.nutrition-wrapper :deep(.divider-thin) {
  margin: 0.0625rem 0;
}

.nutrition-wrapper :deep(.calories-section) {
  margin: 0.25rem 0;
}

.nutrition-wrapper :deep(.micronutrients) {
  margin-top: 0.25rem;
}

/* Nutrition Placeholder */
.nutrition-placeholder {
  flex-shrink: 0;
  width: 40%;
  background: var(--color-stone-100);
  border: 2px solid var(--color-stone-200);
  padding: 0.5rem;
}

.placeholder-text {
  font-size: 9pt;
  color: var(--color-stone-500);
  font-style: italic;
  margin: 0;
}

/* Critical missing section */
.critical-missing {
  background: var(--color-stone-100);
  border: 2px solid var(--color-accent);
  padding: 0.5rem;
}

.missing-text {
  font-size: 9pt;
  color: var(--color-accent);
  font-weight: 600;
  margin: 0;
}

/* Allergen Declaration */
.allergen-section {
  padding: 0.5rem 0;
  border-top: 1px solid var(--color-stone-300);
  font-size: 9pt;
}

.allergen-label {
  font-weight: 600;
  color: var(--color-ink);
}

.allergen-value {
  color: var(--color-ink);
}

/* Cost section */
.cost-section {
  padding: 0.5rem 0;
  border-top: 1px solid var(--color-stone-300);
}

.cost-values {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
}

.cost-total {
  font-weight: 600;
  color: var(--color-ink);
}

.cost-divider {
  color: var(--color-stone-400);
}

.cost-serving {
  color: var(--color-stone-600);
}

/* Shared estimation note — used under nutrition, cost, allergens */
.estimation-note {
  font-size: 7pt;
  color: var(--color-stone-400);
  font-style: italic;
  margin-top: 0.25rem;
  line-height: 1.3;
}

/* Page break between pages */
.page-break {
  height: 0;
  page-break-after: always;
  break-after: page;
}

/* Cost Page (page 2) */
.cost-page {
  padding-top: 1rem;
}

.cost-summary-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  margin-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-accent);
}

.cost-stat {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.cost-stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12pt;
  font-weight: 600;
  color: var(--color-ink);
}

.cost-stat-label {
  font-size: 8pt;
  color: var(--color-stone-500);
}

.cost-stat-divider {
  width: 1px;
  height: 1rem;
  background: var(--color-stone-300);
}

.cost-summary-total {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18pt;
  font-weight: 700;
  color: var(--color-ink);
}

.cost-summary-label {
  font-size: 8pt;
  color: var(--color-stone-500);
  text-align: right;
}

/* Cost table */
.cost-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  margin-bottom: 0.75rem;
}

.cost-table thead {
  border-bottom: 2px solid var(--color-ink);
}

.cost-table th {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-stone-600);
  padding: 0.375rem 0.5rem;
  text-align: left;
}

.cost-table td {
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid var(--color-stone-200);
  color: var(--color-ink);
}

.col-amount {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8pt;
  white-space: nowrap;
}

.col-ingredient {
  line-height: 1.3;
}

.ingredient-primary {
  display: block;
  font-weight: 500;
}

.ingredient-source {
  display: block;
  font-size: 7pt;
  color: var(--color-stone-400);
  margin-top: 0.0625rem;
}

.col-cost {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

.cost-table th.col-cost {
  text-align: right;
}

.cost-total-row {
  border-top: 2px solid var(--color-ink);
}

.cost-total-row td {
  border-bottom: none;
  padding-top: 0.375rem;
}

.cost-total-label {
  font-weight: 600;
  text-align: right;
  padding-right: 0.375rem;
}

.cost-total-value {
  font-size: 11pt;
  font-weight: 700;
  color: var(--color-accent);
}

/* Disclaimer */
.cost-disclaimer {
  font-size: 7pt;
  color: var(--color-stone-500);
  font-style: italic;
  padding: 0.5rem 0;
  border-top: 1px solid var(--color-stone-200);
  line-height: 1.4;
}

.disclaimer-accent {
  color: var(--color-accent);
  font-weight: 700;
  font-style: normal;
}

/*
 * Footer + QR unified section
 *
 * The divider line flows from the left, then wraps around
 * the QR code on the right:
 *
 *                                    ┌─────────┐
 * ───────────────────────────────────┤  [QR]   │
 * proofed. • url • status            │  scan   │
 *                                    └─────────┘
 */
.print-footer {
  display: flex;
  align-items: stretch;
  margin-top: auto;
}

.footer-text {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8pt;
  color: var(--color-stone-500);
}

.footer-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0 0 0.75rem;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.footer-qr:hover {
  opacity: 0.7;
}

.qr-image {
  width: 90px;
  height: 90px;
}

.qr-caption {
  font-size: 6pt;
  color: var(--color-stone-500);
  margin-top: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}

.brand {
  font-weight: 600;
  color: var(--color-ink);
}

.brand-dot {
  color: var(--color-accent);
}

.footer-copy {
  color: var(--color-stone-400);
}

/* Print-specific styles */
@media print {
  @page {
    size: letter portrait;
    margin: 0.5in 0.375in;
  }

  .print-container {
    max-width: 100%;
  }

  .print-view {
    padding: 0;
    background: white;
    font-size: 10pt;
    line-height: 1.3;
    min-height: calc(11in - 1.5in);
  }

  .print-header {
    border-bottom: 2px solid black;
    page-break-after: avoid;
  }

  .source-attribution {
    page-break-after: avoid;
  }

  .ingredients-section {
    page-break-inside: avoid;
  }

  .nutrition-column {
    page-break-inside: avoid;
  }

  .section-title {
    border-bottom: 2px solid #333;
    page-break-after: avoid;
  }

  .ingredient-group {
    page-break-inside: avoid;
  }

  .group-label {
    page-break-after: avoid;
  }

  .nutrition-placeholder {
    background: white;
    border: 2px solid #333;
    page-break-inside: avoid;
  }

  .critical-missing {
    background: white;
    border: 2px solid black;
    page-break-inside: avoid;
  }

  .missing-text {
    color: black;
  }

  .allergen-section {
    border-color: #333;
    page-break-inside: avoid;
  }

  .footer-text {
    border-color: #333;
  }

  .print-footer {
    page-break-inside: avoid;
  }

  .nutrition-wrapper :deep(.nutrition-label) {
    border-color: black;
  }

  /* Hide all navigation and interactive elements */
  button,
  .fab,
  nav,
  .toc-sidebar {
    display: none !important;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  .cost-page {
    min-height: calc(11in - 1.5in);
  }

  .cost-table {
    page-break-inside: avoid;
  }

  .cost-summary-bar {
    border-color: #a65d45;
  }

  .cost-total-value {
    color: #a65d45;
  }

  .disclaimer-accent {
    color: #a65d45;
  }

  /* Prevent orphans and widows */
  p, li {
    orphans: 3;
    widows: 3;
  }
}
</style>
