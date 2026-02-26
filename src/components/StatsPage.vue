<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Recipe, RecipeManifest, CookLogEntry, RecipeStats } from '@/types/recipe'

// --- Internal types ---

interface BakeCost {
  total: number
  perServing: number
}

interface BakeEntry {
  date: string
  items: number
  cost?: BakeCost
}

interface StatsRecipe {
  id: string
  name: string
  defaultYield: number
  unit: string
  servingsPerItem: number
  servingUnit: string
  bakes: BakeEntry[]
}

interface ProductGroup {
  label: string
  icon: string
  recipes: StatsRecipe[]
}

interface LedgerRow {
  date: string
  recipe: string
  totalCost: number
  perServing: number
  servings: number
}

interface TimelineDot {
  date: string
  dayOffset: number
  percent: number
  recipes: string[]
  isAberration: boolean
}

// --- Data loading ---

const isLoading = ref(true)
const groups = ref<ProductGroup[]>([])
const allRecipeCount = ref(0)

const GROUP_ICONS: Record<string, string> = {
  'Sourdough Breads': '\u{1F35E}',
  'Pizza': '\u{1F355}',
  'Buns & Rolls': '\u{1F9C1}',
  'Cakes': '\u{1F382}',
  'Sauces & Condiments': '\u{1F345}',
  'Noodles & Soups': '\u{1F35C}',
  'Drinks': '\u{1F9CB}',
  'Aberrations': '\u{1F525}',
}

function buildBakeEntry(entry: CookLogEntry, stats: RecipeStats): BakeEntry {
  const items = entry.actual_yield
    ? entry.actual_yield.value
    : stats.defaultYield

  const bake: BakeEntry = {
    date: entry.date,
    items,
  }

  if (entry.cost) {
    bake.cost = {
      total: entry.cost.total,
      perServing: entry.cost.perServing,
    }
  }

  return bake
}

async function loadData(): Promise<void> {
  try {
    const manifestRes = await fetch('/recipes/index.json')
    const manifest: RecipeManifest = await manifestRes.json()

    const recipePromises = manifest.recipes.map(async (entry) => {
      const res = await fetch(`/recipes/${entry.file}`)
      const recipe: Recipe = await res.json()
      return { id: entry.id, name: entry.name, recipe }
    })

    const recipes = await Promise.all(recipePromises)

    const groupMap = new Map<string, StatsRecipe[]>()
    const aberrationRecipes: StatsRecipe[] = []
    let recipeWithBakes = 0

    for (const { id, name, recipe } of recipes) {
      const stats = recipe.config.stats
      if (!stats) continue

      const cookLog = recipe.cook_log ?? []
      const completedEntries = cookLog.filter(e => e.status !== 'in_progress')
      if (completedEntries.length === 0) continue

      recipeWithBakes++

      // Split entries into normal and aberration
      const normalEntries = completedEntries.filter(e => !e.aberration)
      const aberrationEntries = completedEntries.filter(e => e.aberration)

      // Build normal bakes
      if (normalEntries.length > 0) {
        const statsRecipe: StatsRecipe = {
          id,
          name,
          defaultYield: stats.defaultYield,
          unit: stats.unit,
          servingsPerItem: stats.servingsPerItem,
          servingUnit: stats.servingUnit,
          bakes: normalEntries.map(e => buildBakeEntry(e, stats)),
        }

        const existing = groupMap.get(stats.group)
        if (existing) {
          existing.push(statsRecipe)
        } else {
          groupMap.set(stats.group, [statsRecipe])
        }
      }

      // Build aberration entries
      for (const entry of aberrationEntries) {
        const aberrationName = entry.aberration_note ?? `${name} (aberration)`
        const aberrationRecipe: StatsRecipe = {
          id: `${id}-aberration-${entry.date}`,
          name: aberrationName,
          defaultYield: 1,
          unit: 'pan',
          servingsPerItem: entry.cost?.servings ?? 1,
          servingUnit: 'pieces',
          bakes: [buildBakeEntry(entry, { ...stats, defaultYield: 1 })],
        }
        aberrationRecipes.push(aberrationRecipe)
      }
    }

    // Build ordered groups
    const groupOrder = [
      'Sourdough Breads',
      'Pizza',
      'Buns & Rolls',
      'Cakes',
      'Sauces & Condiments',
      'Noodles & Soups',
      'Drinks',
    ]

    const result: ProductGroup[] = []
    for (const label of groupOrder) {
      const recipes = groupMap.get(label)
      if (recipes && recipes.length > 0) {
        result.push({
          label,
          icon: GROUP_ICONS[label] ?? '\u{1F4E6}',
          recipes,
        })
      }
    }

    // Add any groups not in the predefined order
    for (const [label, recipes] of groupMap) {
      if (!groupOrder.includes(label) && recipes.length > 0) {
        result.push({
          label,
          icon: GROUP_ICONS[label] ?? '\u{1F4E6}',
          recipes,
        })
      }
    }

    // Add aberrations group if any
    if (aberrationRecipes.length > 0) {
      result.push({
        label: 'Aberrations',
        icon: GROUP_ICONS['Aberrations'],
        recipes: aberrationRecipes,
      })
    }

    groups.value = result
    allRecipeCount.value = recipeWithBakes
  } catch (err) {
    console.error('Failed to load stats data:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

// --- Computed totals ---

function totalBakes(group: ProductGroup): number {
  return group.recipes.reduce((sum, r) => sum + r.bakes.length, 0)
}

function totalItems(group: ProductGroup): number {
  return group.recipes.reduce((sum, r) => sum + r.bakes.reduce((s, b) => s + b.items, 0), 0)
}

function totalServings(group: ProductGroup): number {
  return group.recipes.reduce((sum, r) => {
    const items = r.bakes.reduce((s, b) => s + b.items, 0)
    return sum + items * r.servingsPerItem
  }, 0)
}

function recipeItems(recipe: StatsRecipe): number {
  return recipe.bakes.reduce((s, b) => s + b.items, 0)
}

function recipeServings(recipe: StatsRecipe): number {
  return recipeItems(recipe) * recipe.servingsPerItem
}

const allBakes = computed(() => groups.value.reduce((s, g) => s + totalBakes(g), 0))
const allItems = computed(() => groups.value.reduce((s, g) => s + totalItems(g), 0))
const allServings = computed(() => groups.value.reduce((s, g) => s + totalServings(g), 0))

// Max values for proportional bars
const maxRecipeSessions = computed(() => {
  let max = 0
  for (const g of groups.value) {
    for (const r of g.recipes) {
      const count = r.bakes.length
      if (count > max) max = count
    }
  }
  return max
})

const maxRecipeItems = computed(() => {
  let max = 0
  for (const g of groups.value) {
    for (const r of g.recipes) {
      const count = recipeItems(r)
      if (count > max) max = count
    }
  }
  return max
})

const maxRecipeServings = computed(() => {
  let max = 0
  for (const g of groups.value) {
    for (const r of g.recipes) {
      const count = recipeServings(r)
      if (count > max) max = count
    }
  }
  return max
})

// --- Expand/collapse state ---

const expanded = ref<Set<string>>(new Set())

// Initialize expanded state once data loads
const expandedInitialized = ref(false)

function initializeExpanded(): void {
  if (expandedInitialized.value) return
  expandedInitialized.value = true
  expanded.value = new Set(groups.value.filter(g => g.label !== 'Aberrations').map(g => g.label))
}

function toggle(label: string): void {
  const next = new Set(expanded.value)
  if (next.has(label)) next.delete(label)
  else next.add(label)
  expanded.value = next
}

// --- Pantry Ledger ---

const ledgerOpen = ref(false)

const ledgerRows = computed<LedgerRow[]>(() => {
  const rows: LedgerRow[] = []
  for (const g of groups.value) {
    for (const r of g.recipes) {
      for (const b of r.bakes) {
        if (b.cost) {
          const servings = b.items * r.servingsPerItem
          rows.push({
            date: b.date,
            recipe: r.name,
            totalCost: b.cost.total,
            perServing: b.cost.perServing,
            servings,
          })
        }
      }
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return rows
})

const ledgerTotalCost = computed(() => ledgerRows.value.reduce((s, r) => s + r.totalCost, 0))
const ledgerTotalServings = computed(() => ledgerRows.value.reduce((s, r) => s + r.servings, 0))
const ledgerAvgPerServing = computed(() => {
  if (ledgerTotalServings.value === 0) return 0
  return ledgerTotalCost.value / ledgerTotalServings.value
})
const ledgerMaxPerServing = computed(() => {
  let max = 0
  for (const r of ledgerRows.value) {
    if (r.perServing > max) max = r.perServing
  }
  return max
})

// --- Baking timeline ---

const timelineStart = computed(() => {
  let earliest = ''
  for (const g of groups.value) {
    for (const r of g.recipes) {
      for (const b of r.bakes) {
        if (!earliest || b.date < earliest) earliest = b.date
      }
    }
  }
  return earliest ? new Date(earliest) : new Date()
})

const timelineEnd = computed(() => {
  let latest = ''
  for (const g of groups.value) {
    for (const r of g.recipes) {
      for (const b of r.bakes) {
        if (!latest || b.date > latest) latest = b.date
      }
    }
  }
  return latest ? new Date(latest) : new Date()
})

const timelineSpanDays = computed(() => {
  const span = Math.round((timelineEnd.value.getTime() - timelineStart.value.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(span, 1)
})

const timelineDots = computed<TimelineDot[]>(() => {
  const dateMap = new Map<string, { recipes: Set<string>; isAberration: boolean }>()
  for (const g of groups.value) {
    for (const r of g.recipes) {
      for (const b of r.bakes) {
        const existing = dateMap.get(b.date)
        if (existing) {
          existing.recipes.add(r.name)
          if (g.label === 'Aberrations') existing.isAberration = true
        } else {
          dateMap.set(b.date, {
            recipes: new Set([r.name]),
            isAberration: g.label === 'Aberrations',
          })
        }
      }
    }
  }
  const dots: TimelineDot[] = []
  for (const [date, info] of dateMap) {
    const d = new Date(date)
    const dayOffset = Math.round((d.getTime() - timelineStart.value.getTime()) / (1000 * 60 * 60 * 24))
    const percent = (dayOffset / timelineSpanDays.value) * 100
    dots.push({
      date,
      dayOffset,
      percent,
      recipes: Array.from(info.recipes),
      isAberration: info.isAberration,
    })
  }
  dots.sort((a, b) => a.dayOffset - b.dayOffset)
  return dots
})

// Generate evenly-spaced timeline labels
const timelineLabels = computed(() => {
  if (groups.value.length === 0) return []
  const start = timelineStart.value.getTime()
  const end = timelineEnd.value.getTime()
  const labels: string[] = []
  const count = 5
  for (let i = 0; i < count; i++) {
    const t = start + (end - start) * (i / (count - 1))
    labels.push(shortDate(new Date(t).toISOString().slice(0, 10)))
  }
  return labels
})

// Format date for display: "Feb 5"
function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Format date for ledger: "02/24"
function ledgerDate(dateStr: string): string {
  const parts = dateStr.split('-')
  return `${parts[1]}/${parts[2]}`
}

// Group proportion data (for small multiples)
const groupProportions = computed(() => {
  const total = allItems.value
  return groups.value.filter(g => g.label !== 'Aberrations').map(g => ({
    label: g.label,
    icon: g.icon,
    items: totalItems(g),
    percent: total > 0 ? (totalItems(g) / total) * 100 : 0,
  }))
})

// Watch for data load to initialize expanded state
import { watchEffect } from 'vue'
watchEffect(() => {
  if (groups.value.length > 0) {
    initializeExpanded()
  }
})
</script>

<template>
  <div v-if="isLoading" class="ds3 ds3-loading">
    <div class="ds3-loading-text">Loading stats...</div>
  </div>
  <div v-else-if="groups.length === 0" class="ds3 ds3-empty">
    <div class="ds3-empty-text">No bake data yet. Complete your first bake to see stats.</div>
  </div>
  <div v-else class="ds3">
    <!-- Hero metric tiles -->
    <div class="ds3-hero">
      <div class="ds3-tile ds3-tile--accent">
        <span class="ds3-tile-value">{{ allBakes }}</span>
        <span class="ds3-tile-label">Bake Sessions</span>
      </div>
      <div class="ds3-tile">
        <span class="ds3-tile-value">{{ allItems }}</span>
        <span class="ds3-tile-label">Items Made</span>
      </div>
      <div class="ds3-tile">
        <span class="ds3-tile-value">{{ allRecipeCount }}</span>
        <span class="ds3-tile-label">Recipes</span>
      </div>
      <div class="ds3-tile">
        <span class="ds3-tile-value">{{ allServings }}</span>
        <span class="ds3-tile-label">Total Servings</span>
      </div>
    </div>

    <!-- Baking cadence timeline -->
    <div class="ds3-timeline">
      <div class="ds3-timeline-header">
        <span class="ds3-section-label">Baking Cadence</span>
        <span class="ds3-timeline-range">{{ shortDate(timelineStart.toISOString().slice(0, 10)) }} &ndash; {{ shortDate(timelineEnd.toISOString().slice(0, 10)) }}</span>
      </div>
      <div class="ds3-timeline-track">
        <div class="ds3-timeline-line" />
        <div
          v-for="dot in timelineDots"
          :key="dot.date"
          class="ds3-timeline-dot"
          :class="{ 'ds3-timeline-dot--aberration': dot.isAberration }"
          :style="{ left: dot.percent + '%' }"
          :title="shortDate(dot.date) + ': ' + dot.recipes.join(', ')"
        >
          <span
            v-if="dot.recipes.length > 1"
            class="ds3-timeline-count"
          >{{ dot.recipes.length }}</span>
        </div>
      </div>
      <div class="ds3-timeline-labels">
        <span v-for="label in timelineLabels" :key="label" class="ds3-timeline-date">{{ label }}</span>
      </div>
    </div>

    <!-- Production mix -- proportion bars -->
    <div class="ds3-mix">
      <span class="ds3-section-label">Production Mix</span>
      <div class="ds3-mix-bars">
        <div
          v-for="gp in groupProportions"
          :key="gp.label"
          class="ds3-mix-row"
        >
          <span class="ds3-mix-icon">{{ gp.icon }}</span>
          <span class="ds3-mix-name">{{ gp.label }}</span>
          <span class="ds3-mix-track">
            <span
              class="ds3-mix-fill"
              :style="{ width: gp.percent + '%' }"
            />
          </span>
          <span class="ds3-mix-pct">{{ Math.round(gp.percent) }}%</span>
        </div>
      </div>
    </div>

    <!-- Group detail sections -->
    <div class="ds3-groups">
      <div
        v-for="group in groups"
        :key="group.label"
        class="ds3-group"
        :class="{ 'ds3-group--aberration': group.label === 'Aberrations' }"
      >
        <div class="ds3-group-header" @click="toggle(group.label)">
          <span class="ds3-group-icon">{{ group.icon }}</span>
          <span class="ds3-group-title">{{ group.label }}</span>
          <span class="ds3-group-badge">
            {{ totalItems(group) }}
            {{ group.recipes[0]?.unit ?? 'items' }}
          </span>
          <span
            v-if="totalServings(group) !== totalItems(group)"
            class="ds3-group-badge ds3-group-badge--muted"
          >
            {{ totalServings(group) }}
            {{ group.recipes[0]?.servingUnit ?? 'servings' }}
          </span>
          <span class="ds3-group-sessions">
            {{ totalBakes(group) }} session{{ totalBakes(group) !== 1 ? 's' : '' }}
          </span>
          <span class="ds3-chevron">{{ expanded.has(group.label) ? '\u2212' : '+' }}</span>
        </div>

        <div v-if="expanded.has(group.label)" class="ds3-group-body">
          <div
            v-for="recipe in group.recipes"
            :key="recipe.id"
            class="ds3-recipe"
          >
            <div class="ds3-recipe-name">{{ recipe.name }}</div>
            <div class="ds3-recipe-bars">
              <div class="ds3-bar-row">
                <span class="ds3-bar-label">Sessions</span>
                <span class="ds3-bar-track">
                  <span
                    class="ds3-bar-fill"
                    :style="{ width: (recipe.bakes.length / maxRecipeSessions) * 100 + '%' }"
                  />
                </span>
                <span class="ds3-bar-value">{{ recipe.bakes.length }}</span>
              </div>
              <div class="ds3-bar-row">
                <span class="ds3-bar-label">{{ recipe.unit.charAt(0).toUpperCase() + recipe.unit.slice(1) }}</span>
                <span class="ds3-bar-track">
                  <span
                    class="ds3-bar-fill"
                    :style="{ width: (recipeItems(recipe) / maxRecipeItems) * 100 + '%' }"
                  />
                </span>
                <span class="ds3-bar-value">{{ recipeItems(recipe) }}</span>
              </div>
              <div v-if="recipe.servingsPerItem > 1" class="ds3-bar-row">
                <span class="ds3-bar-label">{{ recipe.servingUnit.charAt(0).toUpperCase() + recipe.servingUnit.slice(1) }}</span>
                <span class="ds3-bar-track">
                  <span
                    class="ds3-bar-fill ds3-bar-fill--subtle"
                    :style="{ width: (recipeServings(recipe) / maxRecipeServings) * 100 + '%' }"
                  />
                </span>
                <span class="ds3-bar-value">~{{ recipeServings(recipe) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pantry Ledger -->
    <div v-if="ledgerRows.length > 0" class="ds3-ledger">
      <div class="ds3-ledger-toggle" @click="ledgerOpen = !ledgerOpen">
        <span class="ds3-section-label">Pantry Ledger</span>
        <span class="ds3-ledger-summary">{{ ledgerRows.length }} costed bakes &middot; ${{ ledgerTotalCost.toFixed(2) }} total</span>
        <span class="ds3-chevron">{{ ledgerOpen ? '\u2212' : '+' }}</span>
      </div>

      <div v-if="ledgerOpen" class="ds3-ledger-body">
        <table class="ds3-ledger-table">
          <thead>
            <tr>
              <th class="ds3-th">Date</th>
              <th class="ds3-th">Recipe</th>
              <th class="ds3-th ds3-th--right">Cost</th>
              <th class="ds3-th ds3-th--right">$/Serving</th>
              <th class="ds3-th ds3-th--bar">$/Serving</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in ledgerRows" :key="row.date + row.recipe" class="ds3-tr">
              <td class="ds3-td ds3-td--mono">{{ ledgerDate(row.date) }}</td>
              <td class="ds3-td">{{ row.recipe }}</td>
              <td class="ds3-td ds3-td--mono ds3-td--right">${{ row.totalCost.toFixed(2) }}</td>
              <td class="ds3-td ds3-td--mono ds3-td--right">${{ row.perServing.toFixed(2) }}</td>
              <td class="ds3-td ds3-td--bar">
                <span class="ds3-cost-track">
                  <span
                    class="ds3-cost-fill"
                    :style="{ width: (row.perServing / ledgerMaxPerServing) * 100 + '%' }"
                  />
                </span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="ds3-tfoot-row">
              <td class="ds3-td ds3-td--mono" colspan="2">
                {{ ledgerRows.length }} bakes &middot; {{ ledgerTotalServings }} servings
              </td>
              <td class="ds3-td ds3-td--mono ds3-td--right ds3-td--bold">${{ ledgerTotalCost.toFixed(2) }}</td>
              <td class="ds3-td ds3-td--mono ds3-td--right ds3-td--bold">${{ ledgerAvgPerServing.toFixed(2) }}</td>
              <td class="ds3-td ds3-td--bar">
                <span class="ds3-cost-track">
                  <span
                    class="ds3-cost-fill ds3-cost-fill--avg"
                    :style="{ width: (ledgerAvgPerServing / ledgerMaxPerServing) * 100 + '%' }"
                  />
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ================================================
   StatsPage — "Data Story"
   Tufte-inspired, Stripe dashboard meets baking notebook
   Identical visual design to DemoStats.vue
   ================================================ */

.ds3 {
  font-family: var(--font-sans);
  color: var(--color-ink);
  max-width: 52rem;
  margin: 0 auto;
}

.ds3-loading {
  padding: 3rem 1rem;
  text-align: center;
}

.ds3-loading-text {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--color-stone-500);
}

.ds3-empty {
  padding: 3rem 1rem;
  text-align: center;
}

.ds3-empty-text {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--color-stone-400);
}

/* --- Hero metric tiles --- */

.ds3-hero {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 2px solid var(--color-stone-200);
  background: var(--color-surface);
}

.ds3-tile {
  padding: 1.5rem 1rem;
  text-align: center;
  border-right: 1px solid var(--color-stone-200);
}

.ds3-tile:last-child {
  border-right: none;
}

.ds3-tile--accent {
  background: var(--color-accent);
  border-right-color: var(--color-accent);
}

.ds3-tile--accent .ds3-tile-value {
  color: var(--color-stone-50);
}

.ds3-tile--accent .ds3-tile-label {
  color: rgba(255, 255, 255, 0.7);
}

.ds3-tile-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 2rem;
  font-weight: 600;
  line-height: 1;
  color: var(--color-ink);
}

.ds3-tile-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
  margin-top: 0.5rem;
}

/* --- Section label (reused) --- */

.ds3-section-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
}

/* --- Baking cadence timeline --- */

.ds3-timeline {
  margin-top: 2rem;
  padding: 0 0.25rem;
}

.ds3-timeline-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.ds3-timeline-range {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
}

.ds3-timeline-track {
  position: relative;
  height: 2rem;
  margin: 0 0.5rem;
}

.ds3-timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-stone-300);
  transform: translateY(-50%);
}

.ds3-timeline-dot {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  background: var(--color-accent);
  border: 2px solid var(--color-surface);
  transform: translate(-50%, -50%);
  cursor: default;
}

.ds3-timeline-dot--aberration {
  background: var(--color-stone-400);
  border-color: var(--color-surface);
}

.ds3-timeline-count {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  color: var(--color-accent);
}

.ds3-timeline-labels {
  display: flex;
  justify-content: space-between;
  margin: 0.375rem 0.5rem 0;
}

.ds3-timeline-date {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  color: var(--color-stone-400);
}

/* --- Production mix proportions --- */

.ds3-mix {
  margin-top: 2rem;
  padding: 0 0.25rem;
}

.ds3-mix-bars {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ds3-mix-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.ds3-mix-icon {
  width: 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.ds3-mix-name {
  width: 8rem;
  font-size: 0.8125rem;
  color: var(--color-stone-700);
  flex-shrink: 0;
}

.ds3-mix-track {
  flex: 1;
  height: 8px;
  background: var(--color-stone-100);
  position: relative;
  overflow: hidden;
}

.ds3-mix-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--color-accent);
  transition: width 400ms ease;
}

.ds3-mix-pct {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-ink);
  width: 2.5rem;
  text-align: right;
  flex-shrink: 0;
}

/* --- Group sections --- */

.ds3-groups {
  margin-top: 2rem;
  border: 2px solid var(--color-stone-200);
  background: var(--color-surface);
}

.ds3-group {
  border-bottom: 1px solid var(--color-stone-200);
}

.ds3-group:last-child {
  border-bottom: none;
}

.ds3-group--aberration .ds3-group-header {
  background: var(--color-stone-50);
}

.ds3-group--aberration .ds3-group-title {
  font-style: italic;
}

.ds3-group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background 120ms ease;
}

.ds3-group-header:hover {
  background: var(--color-stone-50);
}

.ds3-group-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.ds3-group-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink);
  flex: 1;
  min-width: 0;
}

.ds3-group-badge {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-600);
  background: var(--color-stone-100);
  padding: 0.125rem 0.5rem;
  flex-shrink: 0;
}

.ds3-group-badge--muted {
  color: var(--color-stone-400);
  background: transparent;
}

.ds3-group-sessions {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-stone-400);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.ds3-chevron {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--color-stone-400);
  width: 1.5rem;
  text-align: center;
  flex-shrink: 0;
  user-select: none;
}

.ds3-group-body {
  padding: 0 1rem 1rem;
}

/* --- Per-recipe detail --- */

.ds3-recipe {
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-stone-100);
}

.ds3-recipe:first-child {
  border-top: none;
  padding-top: 0;
}

.ds3-recipe-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-stone-700);
  margin-bottom: 0.5rem;
}

.ds3-recipe-bars {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
}

.ds3-bar-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ds3-bar-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-stone-500);
  width: 4.5rem;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ds3-bar-track {
  flex: 1;
  height: 6px;
  background: var(--color-stone-100);
  position: relative;
  overflow: hidden;
}

.ds3-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--color-accent);
  transition: width 300ms ease;
}

.ds3-bar-fill--subtle {
  background: var(--color-stone-300);
}

.ds3-bar-value {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-ink);
  width: 2.5rem;
  text-align: right;
  flex-shrink: 0;
}


/* --- Pantry Ledger --- */

.ds3-ledger {
  margin-top: 2rem;
  border: 2px solid var(--color-stone-200);
  background: var(--color-stone-50);
}

.ds3-ledger-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background 120ms ease;
}

.ds3-ledger-toggle:hover {
  background: var(--color-stone-100);
}

.ds3-ledger-summary {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
}

.ds3-ledger-body {
  padding: 0 1rem 1rem;
  overflow-x: auto;
}

.ds3-ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.ds3-th {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-400);
  text-align: left;
  padding: 0.5rem 0.5rem 0.375rem;
  border-bottom: 1px solid var(--color-stone-300);
  white-space: nowrap;
}

.ds3-th--right {
  text-align: right;
}

.ds3-th--bar {
  width: 6rem;
}

.ds3-tr {
  transition: background 80ms ease;
}

.ds3-tr:hover {
  background: var(--color-stone-100);
}

.ds3-td {
  padding: 0.375rem 0.5rem;
  color: var(--color-stone-700);
  border-bottom: 1px solid var(--color-stone-100);
  white-space: nowrap;
}

.ds3-td--mono {
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.ds3-td--right {
  text-align: right;
}

.ds3-td--bold {
  font-weight: 600;
  color: var(--color-ink);
}

.ds3-td--bar {
  width: 6rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.ds3-cost-track {
  display: block;
  width: 100%;
  height: 6px;
  background: var(--color-stone-200);
  position: relative;
  overflow: hidden;
}

.ds3-cost-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--color-accent);
  transition: width 300ms ease;
}

.ds3-cost-fill--avg {
  background: var(--color-stone-500);
}

.ds3-tfoot-row .ds3-td {
  border-bottom: none;
  border-top: 2px solid var(--color-stone-300);
  padding-top: 0.5rem;
}

/* --- Mobile responsive --- */

@media (max-width: 600px) {
  .ds3-hero {
    grid-template-columns: repeat(2, 1fr);
  }

  .ds3-tile {
    border-bottom: 1px solid var(--color-stone-200);
  }

  .ds3-tile--accent {
    border-bottom-color: var(--color-accent);
  }

  .ds3-tile:nth-child(2) {
    border-right: none;
  }

  .ds3-tile:nth-last-child(-n+2) {
    border-bottom: none;
  }

  .ds3-mix-name {
    width: 5.5rem;
    font-size: 0.75rem;
  }

  .ds3-group-badge--muted,
  .ds3-group-sessions {
    display: none;
  }

  .ds3-bar-label {
    width: 3.5rem;
    font-size: 0.5625rem;
  }

  .ds3-th--bar,
  .ds3-td--bar {
    display: none;
  }

  .ds3-timeline-count {
    display: none;
  }
}

@media (max-width: 400px) {
  .ds3-tile {
    padding: 1rem 0.75rem;
  }

  .ds3-tile-value {
    font-size: 1.5rem;
  }

  .ds3-group-header {
    padding: 0.75rem;
  }

  .ds3-group-body {
    padding: 0 0.75rem 0.75rem;
  }
}
</style>
