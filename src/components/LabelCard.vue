<script setup lang="ts">
import { computed, onMounted, nextTick, ref } from 'vue'
import type { Recipe, Ingredient } from '@/types/recipe'
import type { ProductionEntry } from '@/types/production'
import { deriveAllergens } from '@/composables/useAllergens'
import { allergenMap, type AllergenType } from '@/data/allergenMap'
import { renderBrandedQr, generateQrLabelDataUrl } from '@/composables/useQrLabel'

/**
 * LabelCard — Per-bake printable label (PF-256.3 Slice 2).
 *
 * Renders a 4×6 inch sticker layout with:
 *  - recipe name + version
 *  - batch + unit count
 *  - bake / pack date
 *  - allergens (bolded, FDA Big 9 order, "Contains: ..." line)
 *  - ingredient list (descending by weight, allergens bolded inline)
 *  - per-serving nutrition mini-panel (calories, fat, carbs, protein, sodium)
 *  - QR code linking to the recipe page
 *
 * Print CSS lives at the LabelsView level — this component is layout-only.
 */
const props = withDefaults(defineProps<{
  entry: ProductionEntry
  recipe: Recipe | null
  recipeName: string
  /** Optional override; defaults to today's locale date. */
  dateOverride?: string | null
}>(), {
  dateOverride: null,
})

// ────────────────────────────────────────────────
// Header + meta
// ────────────────────────────────────────────────

const recipeVersion = computed(() => props.recipe?.version ?? '')

const isOverride = computed(() => props.entry.yieldOverride !== null)

const baseYield = computed(() => {
  const yields = props.recipe?.meta?.yields ?? ''
  const match = yields.match(/\d+/)
  return match ? Math.max(1, parseInt(match[0], 10)) : 1
})

const effectiveYield = computed(() => {
  if (isOverride.value) return props.entry.yieldOverride as number
  return props.entry.batches * baseYield.value
})

const unitLabel = computed(() => {
  const unit = props.entry.unit || 'unit'
  return effectiveYield.value === 1 ? unit : `${unit}s`
})

const subHeader = computed(() => {
  const batchesText = `${props.entry.batches} batch${props.entry.batches === 1 ? '' : 'es'}`
  const yieldText = `${effectiveYield.value} ${unitLabel.value}`
  if (isOverride.value) return `${batchesText} · ${yieldText} (custom)`
  return `${batchesText} · ${yieldText}`
})

const dateLabel = computed(() => {
  if (props.dateOverride) return props.dateOverride
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

// ────────────────────────────────────────────────
// Allergens
// ────────────────────────────────────────────────

const allergens = computed<AllergenType[]>(() => {
  if (!props.recipe) return []
  return deriveAllergens(props.recipe)
})

const hasAllergens = computed(() => allergens.value.length > 0)

const allergenLine = computed(() => {
  if (!hasAllergens.value) return ''
  return allergens.value.map(a => a.toUpperCase()).join(', ')
})

/**
 * Set of allergen labels present in this recipe — used to bold matching
 * ingredients in the rendered ingredient list. Comparison is done by the
 * AllergenType label string.
 */
const allergenSet = computed(() => new Set(allergens.value))

// ────────────────────────────────────────────────
// Ingredients
// ────────────────────────────────────────────────

interface FlatIngredient {
  id: string
  name: string
  total: number
  unit: string
  allergens: AllergenType[]
}

/**
 * Flatten ingredients from all stages, descending by weight (grams). When
 * units differ (e.g. grams vs whole), grams-based items sort first; non-gram
 * items fall back to declaration order at the bottom.
 */
const ingredientsList = computed<FlatIngredient[]>(() => {
  const recipe = props.recipe
  if (!recipe) return []
  const flat: FlatIngredient[] = []
  for (const stage of recipe.stages) {
    const items = stage.gather?.ingredients
    if (!items?.length) continue
    for (const ing of items as Ingredient[]) {
      flat.push({
        id: ing.id,
        name: ing.name,
        total: typeof ing.total === 'number' ? ing.total : 0,
        unit: ing.unit ?? '',
        allergens: allergenMap[ing.id] ?? [],
      })
    }
  }
  // Stable sort: grams descending first, then everything else in declaration order.
  const grams = flat.filter(i => i.unit === 'g' || i.unit === 'grams')
  const other = flat.filter(i => !(i.unit === 'g' || i.unit === 'grams'))
  grams.sort((a, b) => b.total - a.total)
  return [...grams, ...other]
})

const hasIngredients = computed(() => ingredientsList.value.length > 0)

/**
 * Render the ingredient list as inline parts — name string + bold flag.
 * Allergen-bearing ingredients render with `<strong>` in the template.
 */
interface IngredientRenderPart {
  name: string
  bold: boolean
  separator: string
}

const ingredientParts = computed<IngredientRenderPart[]>(() => {
  return ingredientsList.value.map((ing, idx) => {
    const bold = ing.allergens.some(a => allergenSet.value.has(a))
    return {
      name: ing.name,
      bold,
      separator: idx === ingredientsList.value.length - 1 ? '' : ', ',
    }
  })
})

// ────────────────────────────────────────────────
// Nutrition (per-serving mini panel)
// ────────────────────────────────────────────────

const hasNutrition = computed(() => {
  const n = props.recipe?.nutrition
  return !!n && !!n.perServing && typeof n.perServing.calories === 'number'
})

const nutritionFacts = computed(() => {
  const n = props.recipe?.nutrition
  if (!n?.perServing) return null
  return {
    calories: Math.round(n.perServing.calories ?? 0),
    fat: roundOne(n.perServing.totalFat),
    carbs: roundOne(n.perServing.carbohydrates),
    protein: roundOne(n.perServing.protein),
    sodium: Math.round(n.perServing.sodium ?? 0),
    servings: n.servings,
  }
})

function roundOne(n: number | undefined): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return '—'
  if (n % 1 === 0) return String(n)
  return n.toFixed(1)
}

// ────────────────────────────────────────────────
// QR code
// ────────────────────────────────────────────────

const qrContainer = ref<HTMLDivElement | null>(null)
const qrDataUrl = ref<string>('')

const recipeHref = computed(() => `/recipe/${props.entry.recipeId}`)
const qrUrl = computed(() => `https://proofeddot.netlify.app/recipe/${props.entry.recipeId}`)

onMounted(async () => {
  await nextTick()
  if (!qrContainer.value) return
  const qrCanvas = await renderBrandedQr(qrContainer.value, {
    url: qrUrl.value,
    size: 160,
  })
  if (qrCanvas) {
    const dataUrl = generateQrLabelDataUrl(qrCanvas, { url: qrUrl.value, size: 160 })
    if (dataUrl) qrDataUrl.value = dataUrl
  }
})
</script>

<template>
  <article
    class="label-card"
    :data-recipe-id="entry.recipeId"
    :data-entry-id="entry.id"
    data-testid="label-card"
  >
    <header class="label-header">
      <h2 class="label-name">{{ recipeName }}</h2>
      <div class="label-sub">{{ subHeader }}</div>
      <div class="label-meta-row">
        <span class="label-date">{{ dateLabel }}</span>
        <span v-if="recipeVersion" class="label-version">{{ recipeVersion }}</span>
      </div>
    </header>

    <section class="label-body">
      <div
        v-if="hasAllergens"
        class="label-allergens"
        data-testid="label-allergens"
      >
        <span class="label-allergens-label">Contains:</span>
        <span class="label-allergens-value">{{ allergenLine }}</span>
      </div>

      <div
        v-if="hasIngredients"
        class="label-ingredients"
        data-testid="label-ingredients"
      >
        <span class="label-ingredients-title">Ingredients:</span>
        <span class="label-ingredients-list">
          <template v-for="(part, idx) in ingredientParts" :key="idx">
            <strong v-if="part.bold">{{ part.name }}</strong>
            <span v-else>{{ part.name }}</span>
            <span v-if="part.separator">{{ part.separator }}</span>
          </template>
        </span>
      </div>
      <div
        v-else
        class="label-ingredients label-ingredients-empty"
        data-testid="label-ingredients-empty"
      >
        Ingredient list pending
      </div>

      <div
        v-if="hasNutrition && nutritionFacts"
        class="label-nutrition"
        data-testid="label-nutrition"
      >
        <div class="label-nutrition-title">Nutrition Facts <span class="label-nutrition-sub">(per serving)</span></div>
        <dl class="label-nutrition-grid">
          <div class="label-nutrition-cell">
            <dt>Calories</dt>
            <dd>{{ nutritionFacts.calories }}</dd>
          </div>
          <div class="label-nutrition-cell">
            <dt>Fat</dt>
            <dd>{{ nutritionFacts.fat }}g</dd>
          </div>
          <div class="label-nutrition-cell">
            <dt>Carbs</dt>
            <dd>{{ nutritionFacts.carbs }}g</dd>
          </div>
          <div class="label-nutrition-cell">
            <dt>Protein</dt>
            <dd>{{ nutritionFacts.protein }}g</dd>
          </div>
          <div class="label-nutrition-cell">
            <dt>Sodium</dt>
            <dd>{{ nutritionFacts.sodium }}mg</dd>
          </div>
        </dl>
      </div>
      <div
        v-else
        class="label-nutrition label-nutrition-pending"
        data-testid="label-nutrition-pending"
      >
        Nutrition data pending
      </div>
    </section>

    <footer class="label-footer">
      <div class="label-brand">
        <span class="label-brand-name">proofed<span class="label-brand-dot">.</span></span>
      </div>
      <a :href="recipeHref" class="label-qr" data-testid="label-qr">
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt="Scan to open recipe"
          class="label-qr-img"
        />
        <span v-else class="label-qr-placeholder" aria-hidden="true" />
      </a>
    </footer>

    <!-- Hidden render target for qr-code-styling; never visible to user. -->
    <div ref="qrContainer" class="label-qr-target" aria-hidden="true" />
  </article>
</template>

<style scoped>
/* ────────────────────────────────────────────────
   Card frame — 4in × 6in proportions on screen
   (real 4×6 print sizing handled by parent print CSS)
   ──────────────────────────────────────────────── */
.label-card {
  background: white;
  color: var(--color-ink);
  border: 2px solid var(--color-ink);
  border-radius: 0;
  width: 4in;
  height: 6in;
  padding: 0.32in 0.3in;
  display: flex;
  flex-direction: column;
  gap: 0.18in;
  position: relative;
  overflow: hidden;
}

/* ────────────────────────────────────────────────
   Header
   ──────────────────────────────────────────────── */
.label-header {
  border-bottom: 2px solid var(--color-ink);
  padding-bottom: 0.12in;
  flex-shrink: 0;
}

.label-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14pt;
  font-weight: 700;
  line-height: 1.15;
  margin: 0 0 4px 0;
  color: var(--color-ink);
  letter-spacing: -0.01em;
}

.label-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  color: var(--color-stone-700);
  font-weight: 500;
}

.label-meta-row {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8pt;
  color: var(--color-stone-500);
}

.label-version {
  font-weight: 500;
}

/* ────────────────────────────────────────────────
   Body
   ──────────────────────────────────────────────── */
.label-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.12in;
  min-height: 0;
  overflow: hidden;
}

.label-allergens {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 9pt;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-ink);
}

.label-allergens-label {
  margin-right: 4px;
}

.label-allergens-value {
  letter-spacing: 0.02em;
}

.label-ingredients {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 8pt;
  line-height: 1.35;
  color: var(--color-ink);
}

.label-ingredients-title {
  font-weight: 600;
  margin-right: 4px;
}

.label-ingredients-list strong {
  font-weight: 700;
}

.label-ingredients-empty {
  color: var(--color-stone-500);
  font-style: italic;
}

.label-nutrition {
  border-top: 1px solid var(--color-stone-300);
  padding-top: 0.1in;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 8pt;
  color: var(--color-ink);
}

.label-nutrition-title {
  font-weight: 700;
  font-size: 9pt;
  margin-bottom: 4px;
}

.label-nutrition-sub {
  font-weight: 400;
  color: var(--color-stone-500);
  font-size: 7pt;
}

.label-nutrition-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--color-stone-300);
  border-left: 1px solid var(--color-stone-300);
}

.label-nutrition-cell {
  padding: 3px 4px;
  border-right: 1px solid var(--color-stone-300);
  border-bottom: 1px solid var(--color-stone-300);
  text-align: center;
}

.label-nutrition-cell dt {
  font-family: 'JetBrains Mono', monospace;
  font-size: 6.5pt;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-stone-600);
  margin: 0;
}

.label-nutrition-cell dd {
  font-weight: 700;
  font-size: 9pt;
  color: var(--color-ink);
  margin: 2px 0 0 0;
}

.label-nutrition-pending {
  color: var(--color-stone-500);
  font-style: italic;
  font-size: 8pt;
  padding-top: 0.1in;
  border-top: 1px solid var(--color-stone-300);
}

/* ────────────────────────────────────────────────
   Footer (brand + QR)
   ──────────────────────────────────────────────── */
.label-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 0.08in;
  border-top: 2px solid var(--color-ink);
  flex-shrink: 0;
}

.label-brand-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10pt;
  font-weight: 700;
  color: var(--color-ink);
}

.label-brand-dot {
  color: var(--color-accent);
}

.label-qr {
  display: inline-flex;
  width: 0.5in;
  height: 0.5in;
  text-decoration: none;
}

.label-qr-img {
  width: 100%;
  height: 100%;
  display: block;
}

.label-qr-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-stone-200);
  display: block;
}

/* Offscreen render target for QR canvas */
.label-qr-target {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ────────────────────────────────────────────────
   Mobile readable view (≤640px) — relax fixed inch sizing
   ──────────────────────────────────────────────── */
@media (max-width: 640px) {
  .label-card {
    width: 100%;
    height: auto;
    min-height: 320px;
  }
}
</style>
