<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { copyToClipboard } from '@/composables/useClipboard'
import { marked } from 'marked'
import { ArrowLeft } from 'lucide-vue-next'
import type {
  Recipe,
  CookLogEntry,
  HebProduct,
  HebIngredientResult,
  HebResultsFile,
  CostRate,
  CostRatesFile,
  CostSelection,
  CostSourceType,
  CostLineItem,
  BakeCostSummary
} from '@/types/recipe'

interface ManifestPhoto {
  name: string
  thumb: string
  src: string
  summary: string
}

interface Manifest {
  recipeId: string
  date: string
  processedAt: string
  photos: ManifestPhoto[]
}

interface PhotoUsage {
  hero: boolean
  step: boolean
  process: boolean
  exclude: boolean
}

interface PhotoState {
  name: string
  src: string
  thumb: string
  summary: string
  notes: string
  usage: PhotoUsage
}

type SectionId = 'photos' | 'cost' | 'notes' | 'summary'

const route = useRoute()
const router = useRouter()

const recipeId = ref('')
const date = ref('')
const loading = ref(true)
const error = ref('')
const recipeName = ref('')
const photoStates = reactive<PhotoState[]>([])
const allCopied = ref(false)
const activeSection = ref<SectionId>('photos')

// Cook log state (replaces scratchpad)
const recipeData = ref<Recipe | null>(null)
const notesSubTab = ref<'curated' | 'raw'>('curated')
const notesFeedback = ref('')

const sections: { id: SectionId; label: string }[] = [
  { id: 'photos', label: 'Photos' },
  { id: 'cost', label: 'Cost' },
  { id: 'notes', label: 'Notes' },
  { id: 'summary', label: 'Summary' }
]

function goBack(): void {
  const id = recipeId.value
  if (id) {
    router.push(`/recipe/${id}`)
  } else {
    router.back()
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dateStr} \u2014 ${weekday}`
}

// --- Photo section logic (migrated from PhotoReview) ---

function setHero(index: number): void {
  for (let i = 0; i < photoStates.length; i++) {
    photoStates[i].usage.hero = i === index
  }
  photoStates[index].usage.exclude = false
}

function toggleStep(index: number): void {
  photoStates[index].usage.step = !photoStates[index].usage.step
  if (photoStates[index].usage.step) {
    photoStates[index].usage.exclude = false
  }
}

function toggleProcess(index: number): void {
  photoStates[index].usage.process = !photoStates[index].usage.process
  if (photoStates[index].usage.process) {
    photoStates[index].usage.exclude = false
  }
}

function toggleExclude(index: number): void {
  photoStates[index].usage.exclude = !photoStates[index].usage.exclude
  if (photoStates[index].usage.exclude) {
    photoStates[index].usage.hero = false
    photoStates[index].usage.step = false
    photoStates[index].usage.process = false
  }
}

function photoStorageKey(): string {
  return `photo-review:${recipeId.value}:${date.value}`
}

function savePhotoState(): void {
  const data = photoStates.map(p => ({
    name: p.name,
    summary: p.summary,
    notes: p.notes,
    usage: { ...p.usage }
  }))
  localStorage.setItem(photoStorageKey(), JSON.stringify(data))
}

function buildCombinedPayload(): object {
  const payload: Record<string, unknown> = {
    recipeId: recipeId.value,
    date: date.value
  }
  if (photoStates.length > 0) {
    payload.photos = photoStates.map(p => ({
      name: p.name,
      src: p.src,
      thumb: p.thumb,
      summary: p.summary,
      notes: p.notes,
      usage: { ...p.usage }
    }))
  }
  if (hasAnyCostSelections.value) {
    payload.cost = {
      costs: costSummaryPayload.value.costs,
      total: costSummaryPayload.value.total,
      perServing: costSummaryPayload.value.perServing,
      servings: costSummaryPayload.value.servings
    }
  }
  if (notesFeedback.value.trim()) {
    payload.notesFeedback = notesFeedback.value.trim()
  }
  return payload
}

const canCopy = computed<boolean>(() => {
  return photoStates.length > 0 || hasAnyCostSelections.value
})

async function handleCopyAll(): Promise<void> {
  const payload = buildCombinedPayload()
  const json = JSON.stringify(payload, null, 2)
  await copyToClipboard(json)
  allCopied.value = true
  setTimeout(() => {
    allCopied.value = false
  }, 2000)
}

// Auto-save photos to localStorage on state change
watch(photoStates, () => {
  if (photoStates.length > 0) savePhotoState()
}, { deep: true })

// --- Notes section helpers (cook_log-based) ---

const cookLogEntry = computed<CookLogEntry | null>(() => {
  if (!recipeData.value?.cook_log || !date.value) return null
  return recipeData.value.cook_log.find(e => e.date === date.value) ?? null
})

const hasNotes = computed<boolean>(() => {
  const entry = cookLogEntry.value
  if (!entry) return false
  return !!(
    entry.summary ||
    (entry.key_notes && entry.key_notes.length > 0) ||
    (entry.notes && entry.notes.length > 0) ||
    entry.raw_notes ||
    (entry.next_time && entry.next_time.length > 0)
  )
})

// key_notes with fallback to notes[] — matches BakeDetailView pattern
function keyNotesList(entry: CookLogEntry): string[] {
  return entry.key_notes ?? entry.notes ?? []
}

function renderKeyNotes(entry: CookLogEntry): string {
  const lines = keyNotesList(entry)
  if (lines.length === 0) return ''
  const md = lines.map(n => `- ${n}`).join('\n')
  return marked.parse(md) as string
}

function renderNextTime(entry: CookLogEntry): string {
  if (!entry.next_time?.length) return ''
  const md = entry.next_time.map(n => {
    const sourceSuffix = n.source ? ` *(${n.source})*` : ''
    return `- ${n.text}${sourceSuffix}`
  }).join('\n')
  return marked.parse(md) as string
}

// Raw notes content — use raw_notes string if available, else join notes[]
function rawNotesContent(entry: CookLogEntry): string {
  if (entry.raw_notes) return entry.raw_notes
  if (entry.notes?.length) return entry.notes.join('\n')
  return ''
}

// --- Cost section state ---

const hebResults = ref<HebResultsFile | null>(null)
const hebLoading = ref(false)
const hebError = ref('')
const costRates = ref<CostRatesFile | null>(null)
const costSelections = reactive<Record<string, CostSelection>>({})
const recipeServings = ref(1)
const recipeYields = ref('')

function costStorageKey(): string {
  return `cost-selections:${recipeId.value}:${date.value}`
}

function pantryStorageKey(): string {
  return `pantry-rates:${recipeId.value}`
}

function saveCostSelections(): void {
  localStorage.setItem(costStorageKey(), JSON.stringify(costSelections))
}

function loadCostSelections(): void {
  const saved = localStorage.getItem(costStorageKey())
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Record<string, CostSelection>
      Object.assign(costSelections, parsed)
    } catch { /* ignore corrupt data */ }
  }
}

function savePantryRates(): void {
  const rates: Record<string, { rate: number; source: string; updatedAt: string }> = {}
  for (const [id, sel] of Object.entries(costSelections)) {
    if (sel.sourceType === 'pantry' && sel.pantryPurchaseLbs && sel.pantryPurchasePrice) {
      const grams = sel.pantryPurchaseLbs * 453.592
      const rate = sel.pantryPurchasePrice / grams
      rates[id] = {
        rate,
        source: sel.pantrySource ?? '',
        updatedAt: new Date().toISOString().split('T')[0]
      }
    }
  }
  if (Object.keys(rates).length > 0) {
    localStorage.setItem(pantryStorageKey(), JSON.stringify(rates))
  }
}

function loadPantryRates(): Record<string, { rate: number; source: string; updatedAt: string }> {
  const saved = localStorage.getItem(pantryStorageKey())
  if (saved) {
    try {
      return JSON.parse(saved) as Record<string, { rate: number; source: string; updatedAt: string }>
    } catch { /* ignore corrupt data */ }
  }
  return {}
}

function getSelection(ingredientId: string): CostSelection {
  if (!costSelections[ingredientId]) {
    costSelections[ingredientId] = {
      ingredientId,
      sourceType: 'heb',
      productIndex: 0
    }
  }
  return costSelections[ingredientId]
}

function selectProduct(ingredientId: string, productIndex: number): void {
  const sel = getSelection(ingredientId)
  sel.sourceType = 'heb'
  sel.productIndex = productIndex
}

function setSourceType(ingredientId: string, sourceType: CostSourceType): void {
  const sel = getSelection(ingredientId)
  sel.sourceType = sourceType
  if (sourceType === 'heb') {
    sel.productIndex = sel.productIndex ?? 0
  }
}

function getCostRate(ingredientId: string): CostRate | null {
  return costRates.value?.rates[ingredientId] ?? null
}

function isNegligibleCost(ingredientId: string): boolean {
  const rate = getCostRate(ingredientId)
  return rate !== null && rate.ratePerGram === 0
}

function parsePackageCount(size: string): number | null {
  const match = size.match(/(\d+)\s*ct\b/i)
  return match ? parseInt(match[1], 10) : null
}

function calculateCost(ingredient: HebIngredientResult, selection: CostSelection): number {
  const isCountBased = ingredient.recipeUnit === 'whole'
  if (selection.sourceType === 'rate') {
    const rate = getCostRate(ingredient.ingredientId)
    if (!rate) return 0
    return rate.ratePerGram * ingredient.recipeAmount
  }
  if (selection.sourceType === 'heb') {
    const product = ingredient.products[selection.productIndex ?? 0]
    if (!product || product.sizeGrams <= 0) return 0
    const price = product.salePrice ?? product.price
    if (isCountBased) {
      const count = parsePackageCount(product.size)
      if (count && count > 0) return (ingredient.recipeAmount / count) * price
    }
    return (ingredient.recipeAmount / product.sizeGrams) * price
  }
  if (selection.sourceType === 'pantry') {
    const lbs = selection.pantryPurchaseLbs ?? 0
    const price = selection.pantryPurchasePrice ?? 0
    if (lbs <= 0 || price <= 0) return 0
    const grams = lbs * 453.592
    const rate = price / grams
    return rate * ingredient.recipeAmount
  }
  if (selection.sourceType === 'manual') {
    const price = selection.manualPrice ?? 0
    const sizeGrams = selection.manualSizeGrams ?? 0
    if (sizeGrams <= 0 || price <= 0) return 0
    return (ingredient.recipeAmount / sizeGrams) * price
  }
  return 0
}

function getSelectedProduct(ingredient: HebIngredientResult, selection: CostSelection): HebProduct | null {
  if (selection.sourceType !== 'heb') return null
  return ingredient.products[selection.productIndex ?? 0] ?? null
}

function sourceBadgeLabel(sourceType: CostSourceType): string {
  switch (sourceType) {
    case 'heb': return 'HEB'
    case 'rate': return 'RATE'
    case 'pantry': return 'PANTRY'
    case 'manual': return 'MANUAL'
  }
}

function sourceBadgeClass(sourceType: CostSourceType): string {
  switch (sourceType) {
    case 'heb': return 'bg-stone-200 text-stone-600'
    case 'rate': return 'bg-cream text-crust-dark'
    case 'pantry': return 'bg-cream text-crust-dark'
    case 'manual': return 'bg-accent-tint text-accent'
  }
}

function parseServings(yields: string): number {
  const match = yields.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

const costLineItems = computed<CostLineItem[]>(() => {
  if (!hebResults.value) return []
  return hebResults.value.ingredients.map(ingredient => {
    const selection = getSelection(ingredient.ingredientId)
    const cost = calculateCost(ingredient, selection)
    let sourceName = ''
    let packageSize = ''
    let packagePrice = 0

    if (selection.sourceType === 'rate') {
      const rate = getCostRate(ingredient.ingredientId)
      if (rate) {
        sourceName = rate.sourceProduct
        packageSize = isNegligibleCost(ingredient.ingredientId) ? 'negligible' : `$${rate.ratePerGram.toFixed(4)}/g`
        packagePrice = 0
      }
    } else if (selection.sourceType === 'heb') {
      const product = getSelectedProduct(ingredient, selection)
      if (product) {
        sourceName = `${product.brand} ${product.name}`
        packageSize = product.size
        packagePrice = product.salePrice ?? product.price
      }
    } else if (selection.sourceType === 'pantry') {
      sourceName = selection.pantrySource ?? 'Pantry rate'
      packageSize = `${selection.pantryPurchaseLbs ?? 0} lbs`
      packagePrice = selection.pantryPurchasePrice ?? 0
    } else if (selection.sourceType === 'manual') {
      sourceName = selection.manualProductName ?? 'Manual entry'
      packageSize = `${selection.manualSizeGrams ?? 0}g`
      packagePrice = selection.manualPrice ?? 0
    }

    return {
      ingredientId: ingredient.ingredientId,
      ingredientName: ingredient.name,
      sourceType: selection.sourceType,
      sourceName,
      recipeAmount: ingredient.recipeAmount,
      recipeUnit: ingredient.recipeUnit,
      packageSize,
      packagePrice,
      cost: parseFloat(cost.toFixed(2))
    }
  })
})

const totalCost = computed<number>(() => {
  return costLineItems.value.reduce((sum, item) => sum + item.cost, 0)
})

const perServingCost = computed<number>(() => {
  const servings = recipeServings.value || 1
  return totalCost.value / servings
})

const costSummaryPayload = computed<BakeCostSummary>(() => ({
  recipeId: recipeId.value,
  date: date.value,
  costs: costLineItems.value,
  total: parseFloat(totalCost.value.toFixed(2)),
  perServing: parseFloat(perServingCost.value.toFixed(2)),
  servings: recipeServings.value
}))

const hasAnyCostSelections = computed<boolean>(() => {
  return costLineItems.value.some(item => item.cost > 0 || item.sourceType === 'rate')
})

async function loadCostRates(): Promise<void> {
  try {
    const res = await fetch('/cost-rates.json')
    if (res.ok) {
      costRates.value = await res.json() as CostRatesFile
    }
  } catch { /* cost rates are optional */ }
}

async function loadHebResults(): Promise<void> {
  hebLoading.value = true
  hebError.value = ''
  try {
    // Load cost rates first so we can use them for smart defaults
    await loadCostRates()

    const res = await fetch(`/review-data/${recipeId.value}/${date.value}/heb-results.json`)
    if (!res.ok) {
      hebError.value = 'No HEB data available. Run /bake-log to populate product data.'
      return
    }
    hebResults.value = await res.json() as HebResultsFile
    // Initialize selections with smart defaults
    for (const ingredient of hebResults.value.ingredients) {
      if (!costSelections[ingredient.ingredientId]) {
        if (ingredient.products.length > 0) {
          // Has HEB products → default to store product picker
          costSelections[ingredient.ingredientId] = {
            ingredientId: ingredient.ingredientId,
            sourceType: 'heb',
            productIndex: 0
          }
        } else if (getCostRate(ingredient.ingredientId) !== null) {
          // No products but has a stored rate → auto-apply rate
          costSelections[ingredient.ingredientId] = {
            ingredientId: ingredient.ingredientId,
            sourceType: 'rate'
          }
        } else {
          // No products, no rate → manual entry
          costSelections[ingredient.ingredientId] = {
            ingredientId: ingredient.ingredientId,
            sourceType: 'manual'
          }
        }
      }
    }
    // Load saved selections on top of defaults
    loadCostSelections()
    // Apply saved pantry rates
    const pantryRates = loadPantryRates()
    for (const [id, rate] of Object.entries(pantryRates)) {
      if (costSelections[id] && costSelections[id].sourceType === 'pantry') {
        if (!costSelections[id].pantryPurchaseLbs || !costSelections[id].pantryPurchasePrice) {
          costSelections[id].pantrySource = rate.source
        }
      }
    }
  } catch {
    hebError.value = 'No HEB data available. Run /bake-log to populate product data.'
  } finally {
    hebLoading.value = false
  }
}

// Auto-save cost selections on change
watch(costSelections, () => {
  if (Object.keys(costSelections).length > 0) {
    saveCostSelections()
    savePantryRates()
  }
}, { deep: true })

// --- Mount: load manifest, recipe data, and HEB results ---

onMounted(async () => {
  recipeId.value = route.params.recipeId as string
  date.value = route.params.date as string

  // Load recipe data (name, servings, cook_log)
  try {
    const recipeRes = await fetch(`/recipes/${recipeId.value}.json`)
    if (recipeRes.ok) {
      const recipe = await recipeRes.json() as Recipe
      recipeData.value = recipe
      recipeName.value = recipe.meta?.name ?? recipeId.value
      recipeYields.value = recipe.meta?.yields ?? ''
      recipeServings.value = parseServings(recipeYields.value)
    }
  } catch {
    // recipe name will fall back to recipeId
  }

  // Load photo manifest
  try {
    const res = await fetch(`/images/${recipeId.value}/${date.value}/manifest.json`)
    if (!res.ok) {
      error.value = `Manifest not found (${res.status})`
      loading.value = false
      return
    }
    const manifest: Manifest = await res.json()

    // Restore saved photo state if it exists
    const saved = localStorage.getItem(photoStorageKey())
    const savedMap = new Map<string, { summary: string; notes: string; usage: PhotoUsage }>()
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{ name: string; summary: string; notes: string; usage: PhotoUsage }>
        for (const item of parsed) {
          savedMap.set(item.name, item)
        }
      } catch { /* ignore corrupt data */ }
    }

    for (const photo of manifest.photos) {
      const restored = savedMap.get(photo.name)
      photoStates.push({
        name: photo.name,
        src: photo.src,
        thumb: photo.thumb,
        summary: restored?.summary || photo.summary,
        notes: restored?.notes ?? '',
        usage: restored?.usage ?? { hero: false, step: false, process: false, exclude: false }
      })
    }
  } catch {
    error.value = 'Failed to load manifest'
  } finally {
    loading.value = false
  }

  // Load HEB results eagerly
  await loadHebResults()
})
</script>

<template>
  <div data-testid="bake-review-page">
    <!-- Header -->
    <div class="mb-6">
      <button
        class="back-link flex items-center gap-1 text-muted hover:text-ink transition-colors mb-3"
        @click="goBack"
      >
        <ArrowLeft :size="16" />
        <span class="text-sm">Back to recipe</span>
      </button>
      <h2 class="text-heading text-xl font-mono mb-1">Bake Review</h2>
      <p class="font-mono text-muted text-sm">
        {{ recipeName || recipeId }} / {{ formatDate(date) }}
      </p>
    </div>

    <!-- Section tabs -->
    <nav class="flex gap-0 border-b-2 border-stone-200 mb-6" data-testid="section-nav">
      <button
        v-for="section in sections"
        :key="section.id"
        class="px-4 py-2 text-sm font-mono transition-colors cursor-pointer"
        :class="activeSection === section.id
          ? 'text-ink border-b-2 border-ink -mb-[2px] font-semibold'
          : 'text-muted hover:text-ink'"
        @click="activeSection = section.id"
      >
        {{ section.label }}
      </button>
    </nav>

    <!-- Photos section -->
    <section v-if="activeSection === 'photos'" data-testid="photos-section">
      <div v-if="loading" class="text-center py-12 text-muted">
        Loading manifest...
      </div>

      <div v-else-if="error" class="card text-center py-12">
        <p class="text-muted">{{ error }}</p>
      </div>

      <template v-else>
        <div class="space-y-4">
          <div
            v-for="(photo, index) in photoStates"
            :key="photo.name"
            class="card flex gap-4 transition-opacity"
            :class="photo.usage.exclude ? 'opacity-40' : ''"
          >
            <!-- Thumbnail -->
            <div class="flex-shrink-0 w-48 relative group">
              <img
                :src="`/images/${recipeId}/${date}/${photo.thumb}`"
                :alt="photo.summary"
                class="w-full border-2 border-stone-200 cursor-zoom-in"
              />
              <!-- Hover popover -->
              <div class="hidden group-hover:block absolute right-full top-0 mr-3 z-20 pointer-events-none">
                <img
                  :src="`/images/${recipeId}/${date}/${photo.src}`"
                  :alt="photo.summary"
                  class="w-96 border-2 border-stone-300 shadow-lg bg-surface"
                />
              </div>
              <p class="font-mono text-muted mt-2 text-xs truncate">{{ photo.name }}</p>
            </div>

            <!-- Controls -->
            <div class="flex-1 min-w-0">
              <label class="block mb-2">
                <span class="text-xs text-heading block mb-1">Summary</span>
                <textarea
                  v-model="photo.summary"
                  rows="2"
                  class="w-full border-2 border-stone-200 rounded-none bg-surface px-2 py-1.5 text-base md:text-sm text-body font-sans focus:outline-none focus:border-stone-400"
                />
              </label>

              <label class="block mb-3">
                <span class="text-xs text-heading block mb-1">Notes</span>
                <textarea
                  v-model="photo.notes"
                  rows="2"
                  placeholder="Additional notes..."
                  class="w-full border-2 border-stone-200 rounded-none bg-surface px-2 py-1.5 text-base md:text-sm text-body font-sans focus:outline-none focus:border-stone-400"
                />
              </label>

              <!-- Usage checkboxes -->
              <div class="flex flex-wrap gap-3">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="photo.usage.hero"
                    class="w-3.5 h-3.5"
                    style="accent-color: var(--color-accent);"
                    @change="setHero(index)"
                  >
                  <span class="text-xs text-body">Hero</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="photo.usage.step"
                    class="w-3.5 h-3.5"
                    style="accent-color: var(--color-accent);"
                    @change="toggleStep(index)"
                  >
                  <span class="text-xs text-body">Step</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="photo.usage.process"
                    class="w-3.5 h-3.5"
                    style="accent-color: var(--color-accent);"
                    @change="toggleProcess(index)"
                  >
                  <span class="text-xs text-body">Process</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="photo.usage.exclude"
                    class="w-3.5 h-3.5"
                    style="accent-color: var(--color-accent);"
                    @change="toggleExclude(index)"
                  >
                  <span class="text-xs text-stone-400">Exclude</span>
                </label>
              </div>
            </div>
          </div>
        </div>

      </template>
    </section>

    <!-- Cost section -->
    <section v-if="activeSection === 'cost'" data-testid="cost-section">
      <div v-if="hebLoading" class="text-center py-12 text-muted">
        Loading HEB data...
      </div>

      <div v-else-if="hebError" class="card text-center py-12" data-testid="cost-no-data">
        <p class="text-muted font-mono">{{ hebError }}</p>
      </div>

      <template v-else-if="hebResults">
        <div class="space-y-6">
          <div
            v-for="ingredient in hebResults.ingredients"
            :key="ingredient.ingredientId"
            class="card"
            data-testid="cost-ingredient-card"
          >
            <!-- Ingredient header -->
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="font-medium text-ink">{{ ingredient.name }}</span>
                <span class="text-muted ml-2">(recipe needs {{ ingredient.recipeAmount }}{{ ingredient.recipeUnit }})</span>
              </div>
            </div>

            <!-- Source type toggle -->
            <div class="flex gap-0 mb-4 flex-wrap">
              <button
                v-if="ingredient.products.length > 0"
                class="btn text-xs border-2 border-stone-200"
                :class="getSelection(ingredient.ingredientId).sourceType === 'heb'
                  ? 'bg-ink text-stone-100'
                  : 'bg-surface text-ink hover:bg-stone-100'"
                data-testid="source-toggle-heb"
                @click="setSourceType(ingredient.ingredientId, 'heb')"
              >
                Store Product
              </button>
              <button
                v-if="getCostRate(ingredient.ingredientId)"
                class="btn text-xs border-2 border-stone-200"
                :class="getSelection(ingredient.ingredientId).sourceType === 'rate'
                  ? 'bg-ink text-stone-100'
                  : 'bg-surface text-ink hover:bg-stone-100'"
                data-testid="source-toggle-rate"
                @click="setSourceType(ingredient.ingredientId, 'rate')"
              >
                Stored Rate
              </button>
              <button
                class="btn text-xs border-2 border-stone-200"
                :class="getSelection(ingredient.ingredientId).sourceType === 'pantry'
                  ? 'bg-ink text-stone-100'
                  : 'bg-surface text-ink hover:bg-stone-100'"
                data-testid="source-toggle-pantry"
                @click="setSourceType(ingredient.ingredientId, 'pantry')"
              >
                Custom Rate
              </button>
              <button
                class="btn text-xs border-2 border-stone-200"
                :class="getSelection(ingredient.ingredientId).sourceType === 'manual'
                  ? 'bg-ink text-stone-100'
                  : 'bg-surface text-ink hover:bg-stone-100'"
                data-testid="source-toggle-manual"
                @click="setSourceType(ingredient.ingredientId, 'manual')"
              >
                Other
              </button>
            </div>

            <!-- Stored rate display -->
            <template v-if="getSelection(ingredient.ingredientId).sourceType === 'rate'">
              <div class="bg-stone-50 border-2 border-stone-200 p-4" data-testid="stored-rate-display">
                <template v-if="isNegligibleCost(ingredient.ingredientId)">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-mono text-xs text-stone-500">{{ getCostRate(ingredient.ingredientId)?.sourceProduct }}</span>
                    </div>
                    <span class="font-mono text-sm text-stone-400 italic">negligible</span>
                  </div>
                </template>
                <template v-else>
                  <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span class="font-mono text-xs text-stone-500 block mb-1">Rate</span>
                      <span class="font-mono text-sm text-ink">${{ getCostRate(ingredient.ingredientId)?.ratePerGram.toFixed(4) }}/g</span>
                    </div>
                    <div>
                      <span class="font-mono text-xs text-stone-500 block mb-1">Recipe uses</span>
                      <span class="font-mono text-sm text-ink">{{ ingredient.recipeAmount }}{{ ingredient.recipeUnit }}</span>
                    </div>
                    <div>
                      <span class="font-mono text-xs text-stone-500 block mb-1">Cost</span>
                      <span class="font-mono text-sm text-accent font-medium" data-testid="rate-calculated-cost">${{ calculateCost(ingredient, getSelection(ingredient.ingredientId)).toFixed(2) }}</span>
                    </div>
                  </div>
                  <p class="font-mono text-xs text-stone-400 mt-3 pt-2 border-t border-stone-200">{{ getCostRate(ingredient.ingredientId)?.sourceProduct }}</p>
                </template>
              </div>
            </template>

            <!-- HEB product cards (Variant B) -->
            <template v-if="getSelection(ingredient.ingredientId).sourceType === 'heb'">
              <div class="space-y-3">
                <button
                  v-for="(product, pIndex) in ingredient.products"
                  :key="pIndex"
                  class="w-full text-left p-4 border-2 transition-colors"
                  :class="getSelection(ingredient.ingredientId).productIndex === pIndex
                    ? 'border-accent bg-accent-tint'
                    : 'border-stone-200 bg-surface hover:border-stone-300'"
                  data-testid="product-card"
                  @click="selectProduct(ingredient.ingredientId, pIndex)"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-ink">{{ product.brand }}</span>
                        <span v-if="product.salePrice" class="font-mono text-[10px] bg-accent text-stone-50 px-1.5 py-0.5">SALE</span>
                        <span v-if="!product.inStock" class="font-mono text-[10px] bg-stone-300 text-stone-600 px-1.5 py-0.5">OUT OF STOCK</span>
                      </div>
                      <p class="text-sm text-stone-600">{{ product.name }}</p>
                    </div>
                    <div
                      class="w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                      :class="getSelection(ingredient.ingredientId).productIndex === pIndex ? 'border-accent bg-accent' : 'border-stone-300'"
                    >
                      <span v-if="getSelection(ingredient.ingredientId).productIndex === pIndex" class="text-stone-50 text-xs">&#10003;</span>
                    </div>
                  </div>
                  <div class="flex items-baseline gap-3">
                    <span class="text-sm text-stone-500">{{ product.size }}</span>
                    <span class="text-stone-300">|</span>
                    <div class="flex items-center gap-1.5">
                      <span v-if="product.salePrice" class="text-xs text-stone-400 line-through">${{ product.price.toFixed(2) }}</span>
                      <span class="font-mono font-medium" :class="product.salePrice ? 'text-accent' : 'text-ink'">
                        ${{ (product.salePrice ?? product.price).toFixed(2) }}
                      </span>
                    </div>
                    <span class="text-stone-300">|</span>
                    <span class="text-xs text-stone-400 font-mono">{{ product.unitPrice }}</span>
                  </div>
                  <div v-if="getSelection(ingredient.ingredientId).productIndex === pIndex" class="mt-2 pt-2 border-t border-stone-200">
                    <span class="font-mono text-xs text-stone-500">{{ ingredient.recipeAmount }}{{ ingredient.recipeUnit }} used of {{ product.sizeGrams }}g package</span>
                    <span class="font-mono text-xs text-accent ml-2" data-testid="calculated-cost">
                      = ${{ calculateCost(ingredient, getSelection(ingredient.ingredientId)).toFixed(2) }}
                    </span>
                  </div>
                </button>
              </div>
            </template>

            <!-- Pantry rate mode -->
            <template v-if="getSelection(ingredient.ingredientId).sourceType === 'pantry'">
              <div class="space-y-3" data-testid="pantry-rate-form">
                <div class="flex gap-4 items-end">
                  <div class="flex-1">
                    <label class="font-mono text-xs text-stone-500 mb-1 block">Purchase size</label>
                    <div class="flex items-center gap-2">
                      <input
                        :value="getSelection(ingredient.ingredientId).pantryPurchaseLbs ?? ''"
                        type="text"
                        inputmode="decimal"
                        class="w-20 border-2 border-stone-200 p-2 text-base md:text-sm bg-surface font-mono text-right"
                        data-testid="pantry-lbs-input"
                        @input="getSelection(ingredient.ingredientId).pantryPurchaseLbs = parseFloat(($event.target as HTMLInputElement).value) || 0"
                      />
                      <span class="text-sm text-stone-500">lbs</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <label class="font-mono text-xs text-stone-500 mb-1 block">Price paid</label>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-stone-500">$</span>
                      <input
                        :value="getSelection(ingredient.ingredientId).pantryPurchasePrice ?? ''"
                        type="text"
                        inputmode="decimal"
                        class="w-20 border-2 border-stone-200 p-2 text-base md:text-sm bg-surface font-mono text-right"
                        data-testid="pantry-price-input"
                        @input="getSelection(ingredient.ingredientId).pantryPurchasePrice = parseFloat(($event.target as HTMLInputElement).value) || 0"
                      />
                    </div>
                  </div>
                </div>

                <!-- Calculated rate display -->
                <div
                  v-if="(getSelection(ingredient.ingredientId).pantryPurchaseLbs ?? 0) > 0 && (getSelection(ingredient.ingredientId).pantryPurchasePrice ?? 0) > 0"
                  class="bg-stone-50 border-2 border-stone-200 p-3"
                  data-testid="pantry-rate-display"
                >
                  <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span class="font-mono text-xs text-stone-500 block mb-1">Rate</span>
                      <span class="font-mono text-sm text-ink">${{ ((getSelection(ingredient.ingredientId).pantryPurchasePrice ?? 0) / ((getSelection(ingredient.ingredientId).pantryPurchaseLbs ?? 1) * 453.592)).toFixed(4) }}/g</span>
                    </div>
                    <div>
                      <span class="font-mono text-xs text-stone-500 block mb-1">Recipe uses</span>
                      <span class="font-mono text-sm text-ink">{{ ingredient.recipeAmount }}{{ ingredient.recipeUnit }}</span>
                    </div>
                    <div>
                      <span class="font-mono text-xs text-stone-500 block mb-1">Cost</span>
                      <span class="font-mono text-sm text-accent font-medium" data-testid="pantry-calculated-cost">${{ calculateCost(ingredient, getSelection(ingredient.ingredientId)).toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Manual entry mode -->
            <template v-if="getSelection(ingredient.ingredientId).sourceType === 'manual'">
              <div class="space-y-3" data-testid="manual-entry-form">
                <div class="flex gap-4 items-end">
                  <div class="flex-2">
                    <label class="font-mono text-xs text-stone-500 mb-1 block">Product name</label>
                    <input
                      :value="getSelection(ingredient.ingredientId).manualProductName ?? ''"
                      type="text"
                      placeholder="e.g. Store brand butter"
                      class="w-full border-2 border-stone-200 p-2 text-base md:text-sm bg-surface"
                      data-testid="manual-name-input"
                      @input="getSelection(ingredient.ingredientId).manualProductName = ($event.target as HTMLInputElement).value"
                    />
                  </div>
                </div>
                <div class="flex gap-4 items-end">
                  <div class="flex-1">
                    <label class="font-mono text-xs text-stone-500 mb-1 block">Price</label>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-stone-500">$</span>
                      <input
                        :value="getSelection(ingredient.ingredientId).manualPrice ?? ''"
                        type="text"
                        inputmode="decimal"
                        class="w-20 border-2 border-stone-200 p-2 text-base md:text-sm bg-surface font-mono text-right"
                        data-testid="manual-price-input"
                        @input="getSelection(ingredient.ingredientId).manualPrice = parseFloat(($event.target as HTMLInputElement).value) || 0"
                      />
                    </div>
                  </div>
                  <div class="flex-1">
                    <label class="font-mono text-xs text-stone-500 mb-1 block">Package size (grams)</label>
                    <div class="flex items-center gap-2">
                      <input
                        :value="getSelection(ingredient.ingredientId).manualSizeGrams ?? ''"
                        type="text"
                        inputmode="decimal"
                        class="w-20 border-2 border-stone-200 p-2 text-base md:text-sm bg-surface font-mono text-right"
                        data-testid="manual-size-input"
                        @input="getSelection(ingredient.ingredientId).manualSizeGrams = parseFloat(($event.target as HTMLInputElement).value) || 0"
                      />
                      <span class="text-sm text-stone-500">g</span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="(getSelection(ingredient.ingredientId).manualPrice ?? 0) > 0 && (getSelection(ingredient.ingredientId).manualSizeGrams ?? 0) > 0"
                  class="bg-stone-50 border-2 border-stone-200 p-3"
                  data-testid="manual-cost-display"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-xs text-stone-500">{{ ingredient.recipeAmount }}{{ ingredient.recipeUnit }} used of {{ getSelection(ingredient.ingredientId).manualSizeGrams }}g package</span>
                    <span class="font-mono text-sm text-accent font-medium">${{ calculateCost(ingredient, getSelection(ingredient.ingredientId)).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </section>

    <!-- Notes section -->
    <section v-if="activeSection === 'notes'" data-testid="notes-section">
      <!-- Empty state -->
      <div v-if="!hasNotes" class="card text-center py-12">
        <p class="text-muted font-mono">No notes recorded for this bake.</p>
      </div>

      <template v-else-if="cookLogEntry">
        <!-- Sub-tab navigation -->
        <nav class="flex gap-0 border-b-2 border-stone-200 mb-6" data-testid="notes-sub-tabs">
          <button
            class="px-4 py-2 text-sm font-mono transition-colors cursor-pointer"
            :class="notesSubTab === 'curated'
              ? 'text-ink border-b-2 border-ink -mb-[2px] font-semibold'
              : 'text-muted hover:text-ink'"
            data-testid="notes-tab-curated"
            @click="notesSubTab = 'curated'"
          >
            Curated
          </button>
          <button
            class="px-4 py-2 text-sm font-mono transition-colors cursor-pointer"
            :class="notesSubTab === 'raw'
              ? 'text-ink border-b-2 border-ink -mb-[2px] font-semibold'
              : 'text-muted hover:text-ink'"
            data-testid="notes-tab-raw"
            @click="notesSubTab = 'raw'"
          >
            Raw Input
          </button>
        </nav>

        <!-- Curated sub-tab -->
        <div v-if="notesSubTab === 'curated'" data-testid="notes-curated">
          <!-- Summary -->
          <p v-if="cookLogEntry.summary" class="text-body mb-4">{{ cookLogEntry.summary }}</p>

          <!-- Key notes (fallback to notes[]) -->
          <div v-if="keyNotesList(cookLogEntry).length > 0" class="mb-4" data-testid="notes-curated-keynotes">
            <h4 class="text-heading font-mono text-sm mb-2">Notes</h4>
            <div class="bake-prose" v-html="renderKeyNotes(cookLogEntry)" />
          </div>

          <!-- Next time -->
          <div v-if="cookLogEntry.next_time?.length" class="mb-4" data-testid="notes-curated-nexttime">
            <h4 class="text-heading font-mono text-sm mb-2 text-accent">Next Time</h4>
            <div class="bake-prose" v-html="renderNextTime(cookLogEntry)" />
          </div>

          <!-- Feedback textarea -->
          <div class="mt-6 border-t-2 border-stone-200 pt-4" data-testid="notes-feedback-section">
            <label class="block">
              <span class="text-xs text-heading font-mono block mb-1">Feedback</span>
              <textarea
                v-model="notesFeedback"
                rows="4"
                placeholder="Note corrections or feedback on the curated notes..."
                class="w-full border-2 border-stone-200 rounded-none bg-surface px-2 py-1.5 text-base md:text-sm text-body font-sans focus:outline-none focus:border-stone-400"
                data-testid="notes-feedback-textarea"
              />
            </label>
          </div>
        </div>

        <!-- Raw Input sub-tab -->
        <div v-if="notesSubTab === 'raw'" data-testid="notes-raw">
          <pre
            v-if="rawNotesContent(cookLogEntry)"
            class="font-mono text-xs whitespace-pre-wrap bg-stone-50 border-2 border-stone-200 p-3 text-stone-600 leading-relaxed"
            data-testid="notes-raw-pre"
          >{{ rawNotesContent(cookLogEntry) }}</pre>
          <div v-else class="card text-center py-12">
            <p class="text-muted font-mono">No notes recorded for this bake.</p>
          </div>
        </div>
      </template>
    </section>

    <!-- Summary section -->
    <section v-if="activeSection === 'summary'" data-testid="summary-section">
      <div v-if="!hebResults || !hasAnyCostSelections" class="card text-center py-12">
        <p class="text-muted font-mono">No cost data yet. Select products in the Cost tab first.</p>
      </div>

      <template v-else>
        <div class="bg-surface border-2 border-stone-200">
          <!-- Header -->
          <div class="flex items-center justify-between p-3 border-b-2 border-stone-200 bg-stone-50">
            <span class="font-mono text-xs text-stone-600" data-testid="summary-header">{{ recipeName || recipeId }} -- Cost Breakdown</span>
            <span class="font-mono text-xs text-stone-400">{{ recipeServings }} servings</span>
          </div>

          <!-- Ingredient rows -->
          <div class="divide-y divide-stone-100" data-testid="summary-cost-rows">
            <div
              v-for="line in costLineItems"
              :key="line.ingredientId"
              class="flex items-center gap-3 px-4 py-3"
              data-testid="summary-cost-row"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-ink">{{ line.ingredientName }}</span>
                  <span
                    class="font-mono text-[10px] px-1.5 py-0.5"
                    :class="sourceBadgeClass(line.sourceType)"
                    data-testid="source-badge"
                  >
                    {{ sourceBadgeLabel(line.sourceType) }}
                  </span>
                </div>
                <p class="text-xs text-stone-400">{{ line.sourceName }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="flex items-baseline gap-2">
                  <span class="text-xs text-stone-400 font-mono">{{ line.recipeAmount }}{{ line.recipeUnit }}</span>
                  <span class="text-sm font-mono font-medium text-ink">${{ line.cost.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total row -->
          <div class="border-t-2 border-stone-200 bg-stone-50 px-4 py-3">
            <div class="flex items-center justify-between">
              <span class="font-mono text-xs text-stone-500">Total bake cost</span>
              <span class="text-lg font-mono font-medium text-ink" data-testid="summary-total">${{ totalCost.toFixed(2) }}</span>
            </div>
            <div class="flex items-center justify-between mt-1">
              <span class="font-mono text-xs text-stone-400">Per serving ({{ recipeYields || `${recipeServings} servings` }})</span>
              <span class="font-mono text-sm text-accent font-medium" data-testid="summary-per-serving">${{ perServingCost.toFixed(2) }}</span>
            </div>
          </div>
        </div>

      </template>
    </section>

    <!-- Copy all button (outside tab sections) -->
    <button
      class="btn-primary w-full mt-6"
      :class="{ 'opacity-40 cursor-not-allowed': !canCopy }"
      :disabled="!canCopy"
      data-testid="copy-all-btn"
      @click="handleCopyAll"
    >
      {{ allCopied ? 'Copied!' : 'Copy review data' }}
    </button>
  </div>
</template>

<style scoped>
.bake-prose {
  font-size: 0.875rem;
  color: var(--color-stone-600);
  line-height: 1.6;
}

.bake-prose :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
}

.bake-prose :deep(li) {
  margin-bottom: 0.375rem;
}

.bake-prose :deep(strong) {
  color: var(--color-stone-700);
  font-weight: 600;
}

.bake-prose :deep(em) {
  color: var(--color-stone-500);
}
</style>
