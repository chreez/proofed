<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type { Recipe, RecipeManifest, CookLogEntry, RecipeStats } from '@/types/recipe'
import ContributionCalendar from '@/components/ContributionCalendar.vue'
import type { CalendarBakeDay } from '@/components/ContributionCalendar.vue'

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
  subgroup?: string
  bakes: BakeEntry[]
  /**
   * Calories per serving from recipe.nutrition.perServing.calories.
   * null when the recipe has no nutrition block — such recipes are silently
   * skipped in the dashboard calories aggregate (PF-41 AC #11).
   */
  caloriesPerServing: number | null
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

interface TimelineBakeInfo {
  recipeId: string
  recipeName: string
  heroThumb: string | null
  date: string
}

// --- Data loading ---

const router = useRouter()

const isLoading = ref(true)
const groups = ref<ProductGroup[]>([])
const allRecipeCount = ref(0)
const timelineBakeMap = ref(new Map<string, TimelineBakeInfo[]>())
const calendarScrollEl = ref<HTMLElement | null>(null)

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
    const bakeMap = new Map<string, TimelineBakeInfo[]>()
    let recipeWithBakes = 0

    for (const { id, name, recipe } of recipes) {
      const stats = recipe.config.stats
      if (!stats) continue

      const cookLog = recipe.cook_log ?? []
      const completedEntries = cookLog.filter(e => e.status !== 'in_progress')
      if (completedEntries.length === 0) continue

      recipeWithBakes++

      const caloriesPerServing = recipe.nutrition?.perServing?.calories ?? null

      // Split entries into normal and aberration
      const normalEntries = completedEntries.filter(e => !e.aberration)
      const aberrationEntries = completedEntries.filter(e => e.aberration)

      // Populate calendar bake map with NORMAL bakes only.
      // Aberration-only days are tracked separately via aberrationDatesSet
      // so the calendar can render them in the muted aberration color while
      // mixed days (normal + aberration on same date) still render as accent.
      for (const entry of normalEntries) {
        const photos = entry.photos ?? []
        const heroThumb = photos.length > 0 ? photos[photos.length - 1].thumb : null
        const info: TimelineBakeInfo = { recipeId: id, recipeName: name, heroThumb, date: entry.date }
        const existing = bakeMap.get(entry.date)
        if (existing) {
          existing.push(info)
        } else {
          bakeMap.set(entry.date, [info])
        }
      }

      // Build normal bakes
      if (normalEntries.length > 0) {
        const statsRecipe: StatsRecipe = {
          id,
          name,
          defaultYield: stats.defaultYield,
          unit: stats.unit,
          servingsPerItem: stats.servingsPerItem,
          servingUnit: stats.servingUnit,
          subgroup: stats.subgroup,
          bakes: normalEntries.map(e => buildBakeEntry(e, stats)),
          caloriesPerServing,
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
          // Aberrations inherit the parent recipe's nutrition — typically null
          // or not meaningful. Silently skipped in the dashboard aggregate.
          caloriesPerServing: null,
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
    timelineBakeMap.value = bakeMap
  } catch (err) {
    console.error('Failed to load stats data:', err)
  } finally {
    isLoading.value = false
    // Center the current month in the calendar viewport on mount.
    // Without this, the user lands on 12-month-old empty cells (default
    // scrollLeft = 0). The calendar SVG ends at the current week, so we
    // pull the rightmost month label position and target the middle of
    // the viewport. The scroll container has right padding (see CSS) so
    // centering is actually achievable on narrow viewports.
    //
    // NOTE: this runs in `finally` AFTER isLoading flips to false because
    // the calendar lives inside `v-else="isLoading"`. Until isLoading is
    // false, calendarScrollEl.value is null and the scroll target doesn't
    // exist in the DOM yet.
    await nextTick()
    if (calendarScrollEl.value) {
      const labels = calendarScrollEl.value.querySelectorAll<SVGTextElement>('.cal-month')
      const last = labels[labels.length - 1]
      if (last) {
        const labelX = parseFloat(last.getAttribute('x') ?? '0')
        const target = labelX - calendarScrollEl.value.clientWidth / 2
        // Browser auto-clamps to [0, scrollWidth - clientWidth].
        calendarScrollEl.value.scrollLeft = target
      } else {
        calendarScrollEl.value.scrollLeft = calendarScrollEl.value.scrollWidth
      }
    }
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

function groupUnit(group: ProductGroup): string {
  const units = new Set(group.recipes.map(r => r.unit))
  return units.size === 1 ? group.recipes[0].unit : 'items'
}

function groupServingUnit(group: ProductGroup): string {
  const units = new Set(group.recipes.map(r => r.servingUnit))
  return units.size === 1 ? group.recipes[0].servingUnit : 'servings'
}

interface SubgroupedRecipes {
  label: string
  recipes: StatsRecipe[]
}

function groupSubgroups(group: ProductGroup): SubgroupedRecipes[] | null {
  const hasSubgroups = group.recipes.some(r => r.subgroup)
  if (!hasSubgroups) return null

  const map = new Map<string, StatsRecipe[]>()
  const order: string[] = []
  for (const r of group.recipes) {
    const key = r.subgroup ?? 'Other'
    if (!map.has(key)) {
      map.set(key, [])
      order.push(key)
    }
    map.get(key)!.push(r)
  }
  return order.map(label => ({ label, recipes: map.get(label)! }))
}

const allBakes = computed(() => groups.value.reduce((s, g) => s + totalBakes(g), 0))
const allItems = computed(() => groups.value.reduce((s, g) => s + totalItems(g), 0))
const allServings = computed(() => groups.value.reduce((s, g) => s + totalServings(g), 0))

// PF-41 B3: aggregate calories created across all recipes with nutrition data.
// Recipes without a nutrition block (caloriesPerServing === null) are silently
// skipped per AC #11.
const allCalories = computed(() => {
  let total = 0
  for (const g of groups.value) {
    for (const r of g.recipes) {
      if (r.caloriesPerServing == null) continue
      const items = r.bakes.reduce((s, b) => s + b.items, 0)
      const servings = items * r.servingsPerItem
      total += servings * r.caloriesPerServing
    }
  }
  return total
})

function formatCaloriesK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return Math.round(n).toString()
}

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

// --- Baking cadence (contribution calendar) ---

// Set of ISO dates that have at least one aberration entry. The calendar
// uses this to render aberration-only days as stone-400. Days with both
// a normal bake and an aberration still render as accent (normal wins)
// because the cell-fill logic checks bakeMap first.
const aberrationDatesSet = computed<Set<string>>(() => {
  const set = new Set<string>()
  for (const g of groups.value) {
    if (g.label !== 'Aberrations') continue
    for (const r of g.recipes) {
      for (const b of r.bakes) {
        set.add(b.date)
      }
    }
  }
  return set
})

// Headline count: number of unique dates within the rolling 12-month window
// that have at least one bake (normal OR aberration). Mirrors GitHub's
// "1,323 contributions in the last year" headline.
const calendarBakeCount = computed(() => {
  const today = new Date()
  const startOfDayToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const windowStart = new Date(startOfDayToday)
  windowStart.setDate(windowStart.getDate() - 364)
  const windowStartIso = windowStart.toISOString().slice(0, 10)
  const todayIso = startOfDayToday.toISOString().slice(0, 10)

  const dates = new Set<string>()
  for (const date of timelineBakeMap.value.keys()) {
    if (date >= windowStartIso && date <= todayIso) dates.add(date)
  }
  for (const date of aberrationDatesSet.value) {
    if (date >= windowStartIso && date <= todayIso) dates.add(date)
  }
  return dates.size
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

// --- Timeline popover ---

const activeCalendarDate = ref<string | null>(null)
const popoverPosition = ref<{ left: number; top: number; bottom: number; alignRight: boolean; alignLeft: boolean; flipBelow: boolean } | null>(null)
let hidePopoverTimer: ReturnType<typeof setTimeout> | null = null

// Approximate popover height used for top-edge clipping detection.
// The popover renders 1-2 entries (each ~64px) plus padding; 200px is a
// safe upper bound for vertical-flip decision.
const POPOVER_FLIP_THRESHOLD = 200

const activePopoverBakes = computed<TimelineBakeInfo[]>(() => {
  if (!activeCalendarDate.value) return []
  return timelineBakeMap.value.get(activeCalendarDate.value) ?? []
})

function showPopover(date: string, event: MouseEvent | PointerEvent): void {
  if (hidePopoverTimer) {
    clearTimeout(hidePopoverTimer)
    hidePopoverTimer = null
  }
  const el = event.currentTarget as Element | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  const viewportWidth = window.innerWidth

  let alignRight = false
  let alignLeft = false
  if (rect.left < 120) {
    alignLeft = true
  } else if (viewportWidth - rect.right < 120) {
    alignRight = true
  }

  // If the cell is too close to the top of the viewport, flip the popover below the cell.
  const flipBelow = rect.top < POPOVER_FLIP_THRESHOLD

  popoverPosition.value = {
    left: rect.left + rect.width / 2,
    top: rect.top,
    bottom: rect.bottom,
    alignRight,
    alignLeft,
    flipBelow,
  }
  activeCalendarDate.value = date
}

function hidePopover(): void {
  hidePopoverTimer = setTimeout(() => {
    activeCalendarDate.value = null
    popoverPosition.value = null
  }, 150)
}

function cancelHidePopover(): void {
  if (hidePopoverTimer) {
    clearTimeout(hidePopoverTimer)
    hidePopoverTimer = null
  }
}

function togglePopover(date: string, event: MouseEvent | PointerEvent): void {
  event.stopPropagation()
  if (activeCalendarDate.value === date) {
    activeCalendarDate.value = null
    popoverPosition.value = null
  } else {
    showPopover(date, event)
  }
}

function onCalendarHover(day: CalendarBakeDay, ev: MouseEvent): void {
  showPopover(day.date, ev)
}

function onCalendarClick(day: CalendarBakeDay, ev: MouseEvent): void {
  togglePopover(day.date, ev)
}

function navigateToBake(bake: TimelineBakeInfo): void {
  activeCalendarDate.value = null
  popoverPosition.value = null
  router.push({ name: 'bake-detail', params: { recipeId: bake.recipeId, date: bake.date } })
}

const popoverStyle = computed(() => {
  if (!popoverPosition.value) return {}
  const p = popoverPosition.value
  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: '100',
  }
  if (p.flipBelow) {
    // Anchor below the cell
    style.top = `${p.bottom + 8}px`
    if (p.alignLeft) {
      style.left = `${p.left - 10}px`
    } else if (p.alignRight) {
      style.right = `${window.innerWidth - p.left - 10}px`
    } else {
      style.left = `${p.left}px`
      style.transform = 'translateX(-50%)'
    }
  } else {
    // Anchor above the cell (default)
    style.top = `${p.top - 8}px`
    style.transform = 'translateY(-100%)'
    if (p.alignLeft) {
      style.left = `${p.left - 10}px`
    } else if (p.alignRight) {
      style.right = `${window.innerWidth - p.left - 10}px`
    } else {
      style.left = `${p.left}px`
      style.transform = 'translate(-50%, -100%)'
    }
  }
  return style
})

function handleClickOutside(): void {
  if (activeCalendarDate.value) {
    activeCalendarDate.value = null
    popoverPosition.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (hidePopoverTimer) clearTimeout(hidePopoverTimer)
})

// Watch for data load to initialize expanded state
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
        <span class="ds3-tile-label">Recipes Baked</span>
      </div>
      <div class="ds3-tile">
        <span class="ds3-tile-value">{{ allServings }}</span>
        <span class="ds3-tile-label">Total Servings</span>
      </div>
    </div>

    <!-- PF-41 decision B3: wide accent tile for Calories Created, second row -->
    <div v-if="allCalories > 0" class="ds3-calories">
      <span class="ds3-calories-value">{{ formatCaloriesK(allCalories) }}</span>
      <span class="ds3-calories-label">Calories Created across all bakes</span>
    </div>

    <!-- Baking cadence (contribution calendar) -->
    <section id="baking-cadence" class="ds3-calendar-section">
      <div class="ds3-calendar-header">
        <span class="ds3-section-label">Baking Cadence</span>
        <span class="ds3-calendar-count">{{ calendarBakeCount }} bake sessions in the last 12 months</span>
      </div>
      <div class="ds3-calendar-scroll" ref="calendarScrollEl">
        <ContributionCalendar
          :bake-map="timelineBakeMap"
          :aberration-dates="aberrationDatesSet"
          @cell-hover="onCalendarHover"
          @cell-click="onCalendarClick"
        />
      </div>

      <!-- Calendar popover (Teleported to body, lifted from the old timeline) -->
      <Teleport to="body">
        <div
          v-if="activeCalendarDate && popoverPosition"
          class="ds3-timeline-popover"
          :style="popoverStyle"
          @mouseenter="cancelHidePopover"
          @mouseleave="hidePopover"
          @click.stop
        >
          <div
            v-for="bake in activePopoverBakes"
            :key="bake.recipeId + bake.date"
            class="ds3-timeline-popover-entry"
            @click="navigateToBake(bake)"
          >
            <img
              v-if="bake.heroThumb"
              :src="bake.heroThumb"
              :alt="bake.recipeName"
              class="ds3-timeline-popover-img"
            />
            <div class="ds3-timeline-popover-info">
              <span class="ds3-timeline-popover-name">{{ bake.recipeName }}</span>
              <span class="ds3-timeline-popover-date">{{ shortDate(bake.date) }}</span>
            </div>
          </div>
        </div>
      </Teleport>
    </section>

    <!-- Production mix -- proportion bars -->
    <div class="ds3-mix">
      <div class="ds3-mix-header">
        <span class="ds3-section-label">Production Mix</span>
        <span class="ds3-mix-total">{{ allItems }} items</span>
      </div>
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
            {{ groupUnit(group) }}
          </span>
          <span
            v-if="totalServings(group) !== totalItems(group)"
            class="ds3-group-badge ds3-group-badge--muted"
          >
            {{ totalServings(group) }}
            {{ groupServingUnit(group) }}
          </span>
          <span class="ds3-group-sessions">
            {{ totalBakes(group) }} session{{ totalBakes(group) !== 1 ? 's' : '' }}
          </span>
          <span class="ds3-chevron">{{ expanded.has(group.label) ? '\u2212' : '+' }}</span>
        </div>

        <div v-if="expanded.has(group.label)" class="ds3-group-body">
          <!-- Subgrouped layout -->
          <template v-if="groupSubgroups(group)">
            <div
              v-for="sub in groupSubgroups(group)!"
              :key="sub.label"
              class="ds3-subgroup"
            >
              <div class="ds3-subgroup-label">{{ sub.label }}</div>
              <div
                v-for="recipe in sub.recipes"
                :key="recipe.id"
                class="ds3-recipe"
              >
                <div class="ds3-recipe-name">{{ recipe.name }}</div>
                <div class="ds3-recipe-hybrid">
                  <span class="ds3-hybrid-counts">
                    <span class="ds3-hybrid-value">{{ recipe.bakes.length }}</span> session{{ recipe.bakes.length !== 1 ? 's' : '' }}
                    <span class="ds3-hybrid-sep">&middot;</span>
                    <span class="ds3-hybrid-value">{{ recipeItems(recipe) }}</span> {{ recipe.unit }}
                    <template v-if="recipe.servingsPerItem > 1">
                      <span class="ds3-hybrid-sep">&middot;</span>
                      <span class="ds3-hybrid-value">~{{ recipeServings(recipe) }}</span> {{ recipe.servingUnit }}
                    </template>
                  </span>
                </div>
              </div>
            </div>
          </template>
          <!-- Flat layout (no subgroups) -->
          <template v-else>
            <div
              v-for="recipe in group.recipes"
              :key="recipe.id"
              class="ds3-recipe"
            >
              <div class="ds3-recipe-name">{{ recipe.name }}</div>
              <div class="ds3-recipe-hybrid">
                <span class="ds3-hybrid-counts">
                  <span class="ds3-hybrid-value">{{ recipe.bakes.length }}</span> session{{ recipe.bakes.length !== 1 ? 's' : '' }}
                  <span class="ds3-hybrid-sep">&middot;</span>
                  <span class="ds3-hybrid-value">{{ recipeItems(recipe) }}</span> {{ recipe.unit }}
                  <template v-if="recipe.servingsPerItem > 1">
                    <span class="ds3-hybrid-sep">&middot;</span>
                    <span class="ds3-hybrid-value">~{{ recipeServings(recipe) }}</span> {{ recipe.servingUnit }}
                  </template>
                </span>
              </div>
            </div>
          </template>
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

/* --- PF-41 B3: Calories Created accent tile (second row) --- */

.ds3-calories {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border: 2px solid var(--color-stone-200);
  border-top: none;
  background: var(--color-stone-50);
}

.ds3-calories-value {
  font-family: var(--font-mono);
  font-size: 2.25rem;
  font-weight: 600;
  line-height: 1;
  color: var(--color-accent);
}

.ds3-calories-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
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

/* --- Baking cadence (contribution calendar) --- */

.ds3-calendar-section {
  margin-top: 2rem;
  padding: 0 0.25rem;
}

.ds3-calendar-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.ds3-calendar-count {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
}

/* The calendar SVG is wider than the ds3 container (52rem / 832px) at
   14px cells / 3px gap. Scope overflow scrolling to the calendar only
   so the rest of the page stays inside the shell. Scrollbar is hidden:
   the calendar opens scrolled to center the current month so users
   rarely need the scrollbar — they can swipe/scroll horizontally to
   look back at older months. The 22rem right padding gives the scroll
   logic room to actually center the rightmost month on narrow
   viewports (without padding, scroll clamps before reaching center). */
.ds3-calendar-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -0.25rem;
  padding: 0 22rem 0.25rem 0.25rem;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/old Edge */
}

.ds3-calendar-scroll::-webkit-scrollbar {
  display: none; /* Chrome / Safari / WebKit */
}

/* --- Production mix proportions --- */

.ds3-mix {
  margin-top: 2rem;
  padding: 0 0.25rem;
}

.ds3-mix-header {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
}

.ds3-mix-total {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
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

/* --- Subgroup headers --- */

.ds3-subgroup {
  margin-top: 0.75rem;
}

.ds3-subgroup:first-child {
  margin-top: 0;
}

.ds3-subgroup-label {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-stone-400);
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--color-stone-100);
  margin-bottom: 0.125rem;
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
  margin-bottom: 0.25rem;
}

.ds3-recipe-hybrid {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ds3-hybrid-counts {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-500);
}

.ds3-hybrid-value {
  font-weight: 600;
  color: var(--color-ink);
}

.ds3-hybrid-sep {
  color: var(--color-stone-300);
  margin: 0 0.125rem;
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

  .ds3-th--bar,
  .ds3-td--bar {
    display: none;
  }
}

@media (max-width: 600px) {
  .ds3-calories {
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem;
  }
}

@media (max-width: 400px) {
  .ds3-tile {
    padding: 1rem 0.75rem;
  }

  .ds3-tile-value {
    font-size: 1.5rem;
  }

  .ds3-calories-value {
    font-size: 1.75rem;
  }

  .ds3-group-header {
    padding: 0.75rem;
  }

  .ds3-group-body {
    padding: 0 0.75rem 0.75rem;
  }
}
</style>

<style>
/* Unscoped: popover is teleported to body */
.ds3-timeline-popover {
  background: var(--color-surface);
  border: 2px solid var(--color-stone-200);
  border-radius: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  max-width: 280px;
  padding: 0.25rem 0;
  pointer-events: auto;
}

.ds3-timeline-popover-entry {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background 80ms ease;
}

.ds3-timeline-popover-entry:hover {
  background: var(--color-stone-50);
}

.ds3-timeline-popover-img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border: 1px solid var(--color-stone-200);
  flex-shrink: 0;
}

.ds3-timeline-popover-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.ds3-timeline-popover-name {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ds3-timeline-popover-date {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
}
</style>
