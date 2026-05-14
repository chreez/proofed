<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import { useRecipe } from '@/composables/useRecipe'
import {
  loadPlan,
  savePlan,
  addEntry as addEntryFn,
  removeEntry as removeEntryFn,
  updateEntry as updateEntryFn,
  inferDefaultUnit,
  parseBaseYield,
} from '@/composables/useProductionPlan'
import { findHeroPhoto, latestCookLogEntryWithHero } from '@/composables/useCookLog'
import type { ProductionPlan } from '@/types/production'
import type { Recipe } from '@/types/recipe'
import ProductionLibraryRow from '@/components/ProductionLibraryRow.vue'
import ProductionCartEntry from '@/components/ProductionCartEntry.vue'
import HelpTooltip from '@/components/HelpTooltip.vue'

useSeoMeta({
  title: 'Production · proofed.',
  description: 'Plan what to bake this week. Shared production list — every lens reads from here.',
  ogTitle: 'Production · proofed.',
  ogDescription: 'Plan what to bake this week.',
  twitterCard: 'summary',
})

// ────────────────────────────────────────────────
// Category map (hardcoded — mirrors RecipeIndex categoryMap for consistency).
// Pragmatic for a personal notebook; future task can normalize to a shared
// helper or move into recipe meta.
// ────────────────────────────────────────────────
const categoryMap: Record<string, string> = {
  'atk-cinnamon-buns-ultimate': 'baking',
  'birote-salado': 'baking',
  'tartine-baguette': 'baking',
  'candida-focaccia': 'grain-free',
  'grain-free-bread': 'grain-free',
  'gochujang-garlic-buns': 'baking',
  'carrot-cake': 'baking',
  'simple-sourdough': 'baking',
  'simple-sourdough-wheat': 'baking',
  'sourdough-cheddar-bay-biscuits': 'baking',
  'jalapeno-cheddar-sourdough': 'baking',
  'lime-chantilly': 'baking',
  'sourdough-cheddar-cheese': 'baking',
  'sourdough-chocolate-chip-cookies': 'baking',
  'sourdough-cinnamon-buns': 'baking',
  'tartine-lemon-cream-tart': 'baking',
  'tartine-rugelach': 'baking',
  'sourdough-discard-cheese-crackers': 'baking',
  'ny-pizza-sauce': 'pizza & dough',
  'ny-style-pizza': 'pizza & dough',
  'potato-buns': 'baking',
  'sourdough-pizza-dough': 'pizza & dough',
  'ba-bolognese': 'mains',
  'coco-curry': 'mains',
  'ichiran-ramen': 'mains',
  'tomita-tsukemen': 'mains',
  'thai-tea-boba': 'drinks',
}

/**
 * Best-effort category from recipe id when no map hit. Looks for keywords in
 * the id (sourdough/pizza/cookie/etc.); falls back to "other".
 */
function inferCategoryFromId(id: string): string {
  const lc = id.toLowerCase()
  if (lc.includes('pizza')) return 'pizza & dough'
  if (lc.includes('cookie') || lc.includes('cake') || lc.includes('tart') || lc.includes('rugelach') || lc.includes('cinnamon')) return 'sweet'
  if (lc.includes('ramen') || lc.includes('tsukemen') || lc.includes('curry') || lc.includes('bolognese')) return 'mains'
  if (lc.includes('boba') || lc.includes('drink')) return 'drinks'
  if (lc.includes('sourdough') || lc.includes('bread') || lc.includes('focaccia') || lc.includes('baguette') || lc.includes('bun') || lc.includes('biscuit') || lc.includes('cracker')) return 'baking'
  return 'other'
}

function categoryFor(id: string): string {
  return categoryMap[id] ?? inferCategoryFromId(id)
}

interface RecipeFacts {
  yields: string
  unit: string
  heroThumb: string | null
  bakeCount: number
  lastBakeDate: string | null
}

const { recipeList, loadManifest } = useRecipe()
const plan = ref<ProductionPlan>(loadPlan())
const manifestLoaded = ref(false)
const recipesLoaded = ref(false)
const cartCollapsed = ref(false)

// Per-recipe metadata fetched in parallel on mount.
const recipeFacts = ref<Record<string, RecipeFacts>>({})

// Library toolbar state.
const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
type SortKey = 'most_baked' | 'alphabetical' | 'recently_used' | 'category'
const sortKey = ref<SortKey>('most_baked')

// Keyboard focus index (into the *visible* filtered+sorted list).
const focusedIndex = ref(-1)

async function fetchAllRecipeFacts(): Promise<void> {
  if (!recipeList.value.length) return
  const facts: Record<string, RecipeFacts> = {}
  await Promise.all(
    recipeList.value.map(async (entry) => {
      try {
        const res = await fetch(`/recipes/${entry.file}`)
        if (!res.ok) {
          facts[entry.id] = { yields: '', unit: 'unit', heroThumb: null, bakeCount: 0, lastBakeDate: null }
          return
        }
        const data = (await res.json()) as Recipe
        const yields = data.meta?.yields ?? ''
        const unit = inferDefaultUnit(data)
        const cookLog = Array.isArray(data.cook_log) ? data.cook_log : []
        const bakeCount = cookLog.length
        // Most-recent date (string sort is fine for ISO YYYY-MM-DD).
        let lastBakeDate: string | null = null
        for (const e of cookLog) {
          if (typeof e?.date === 'string' && (!lastBakeDate || e.date > lastBakeDate)) {
            lastBakeDate = e.date
          }
        }
        let heroThumb: string | null = null
        const latest = latestCookLogEntryWithHero(cookLog)
        if (latest?.photos?.length) {
          const hero = findHeroPhoto(latest.photos)
          heroThumb = hero?.thumb ?? null
        }
        facts[entry.id] = { yields, unit, heroThumb, bakeCount, lastBakeDate }
      } catch {
        facts[entry.id] = { yields: '', unit: 'unit', heroThumb: null, bakeCount: 0, lastBakeDate: null }
      }
    })
  )
  recipeFacts.value = facts
  recipesLoaded.value = true
}

onMounted(async () => {
  if (!recipeList.value.length) {
    await loadManifest()
  }
  manifestLoaded.value = true
  await fetchAllRecipeFacts()
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})

watch(recipeList, async (list) => {
  if (list.length && !recipesLoaded.value) {
    await fetchAllRecipeFacts()
  }
})

const entryCount = computed(() => plan.value.entries.length)
const queuedRecipeIds = computed(() => new Set(plan.value.entries.map(e => e.recipeId)))

function recipeNameFor(recipeId: string): string {
  return recipeList.value.find(r => r.id === recipeId)?.name ?? recipeId
}

function yieldsFor(recipeId: string): string {
  return recipeFacts.value[recipeId]?.yields ?? ''
}

function heroThumbFor(recipeId: string): string | null {
  return recipeFacts.value[recipeId]?.heroThumb ?? null
}

function unitFor(recipeId: string): string {
  return recipeFacts.value[recipeId]?.unit ?? 'unit'
}

function bakeCountFor(recipeId: string): number {
  return recipeFacts.value[recipeId]?.bakeCount ?? 0
}

function lastBakeDateFor(recipeId: string): string | null {
  return recipeFacts.value[recipeId]?.lastBakeDate ?? null
}

// ────────────────────────────────────────────────
// Filter + sort
// ────────────────────────────────────────────────
const filteredSortedRecipes = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const base = recipeList.value.filter(r => {
    if (!q) return true
    return r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
  })

  const withFacts = base.map(r => ({
    id: r.id,
    name: r.name,
    file: r.file,
    bakeCount: bakeCountFor(r.id),
    lastBakeDate: lastBakeDateFor(r.id),
    category: categoryFor(r.id),
  }))

  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })

  switch (sortKey.value) {
    case 'alphabetical':
      return withFacts.sort(byName)
    case 'recently_used':
      return withFacts.sort((a, b) => {
        if (a.lastBakeDate && b.lastBakeDate) return b.lastBakeDate.localeCompare(a.lastBakeDate)
        if (a.lastBakeDate) return -1
        if (b.lastBakeDate) return 1
        return byName(a, b)
      })
    case 'category':
      return withFacts.sort((a, b) => {
        const c = a.category.localeCompare(b.category)
        return c !== 0 ? c : byName(a, b)
      })
    case 'most_baked':
    default:
      return withFacts.sort((a, b) => {
        if (b.bakeCount !== a.bakeCount) return b.bakeCount - a.bakeCount
        return byName(a, b)
      })
  }
})

// Keep the focused row within the visible list. If the filter shrinks past
// the current focus, snap back to the first row (or unfocus when empty).
watch(filteredSortedRecipes, (list) => {
  if (!list.length) {
    focusedIndex.value = -1
    return
  }
  if (focusedIndex.value >= list.length) focusedIndex.value = 0
})

// ────────────────────────────────────────────────
// Mutations
// ────────────────────────────────────────────────
function handleAddLibrary(recipeId: string): void {
  const unit = unitFor(recipeId)
  const next = addEntryFn(plan.value, {
    recipeId,
    unit,
    addedBy: 'user',
  })
  plan.value = savePlan(next)
}

function baseYieldFor(recipeId: string): number {
  return parseBaseYield(recipeFacts.value[recipeId]?.yields)
}

function handleRowFocus(recipeId: string): void {
  const idx = filteredSortedRecipes.value.findIndex(r => r.id === recipeId)
  if (idx >= 0) focusedIndex.value = idx
}

function handleRemove(entryId: string): void {
  const ok = typeof window !== 'undefined' && window.confirm
    ? window.confirm('Remove this bake from production?')
    : true
  if (!ok) return
  plan.value = savePlan(removeEntryFn(plan.value, entryId))
}

function handleUpdate(
  entryId: string,
  patch: { batches?: number; yieldOverride?: number | null; unit?: string }
): void {
  plan.value = savePlan(updateEntryFn(plan.value, entryId, patch))
}

function toggleCartCollapsed(): void {
  cartCollapsed.value = !cartCollapsed.value
}

// ────────────────────────────────────────────────
// Keyboard nav
// ────────────────────────────────────────────────
function isEditableTarget(t: EventTarget | null): boolean {
  if (!t || !(t instanceof HTMLElement)) return false
  const tag = t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (t.isContentEditable) return true
  return false
}

function onGlobalKeydown(ev: KeyboardEvent): void {
  // '/' focuses the search input (unless the user is already typing somewhere).
  if (ev.key === '/' && !isEditableTarget(ev.target)) {
    ev.preventDefault()
    nextTick(() => searchInput.value?.focus())
    return
  }

  // Escape from search blurs and returns focus to the list.
  if (ev.key === 'Escape' && ev.target === searchInput.value) {
    searchInput.value?.blur()
    if (filteredSortedRecipes.value.length && focusedIndex.value < 0) {
      focusedIndex.value = 0
    }
    return
  }

  // Don't hijack arrow/j/k/enter while the user is in an input.
  if (isEditableTarget(ev.target)) return

  const list = filteredSortedRecipes.value
  if (!list.length) return

  if (ev.key === 'ArrowDown' || ev.key === 'j') {
    ev.preventDefault()
    focusedIndex.value = focusedIndex.value < 0
      ? 0
      : Math.min(list.length - 1, focusedIndex.value + 1)
  } else if (ev.key === 'ArrowUp' || ev.key === 'k') {
    ev.preventDefault()
    focusedIndex.value = focusedIndex.value <= 0 ? 0 : focusedIndex.value - 1
  } else if (ev.key === 'Enter' && focusedIndex.value >= 0) {
    ev.preventDefault()
    const recipe = list[focusedIndex.value]
    if (recipe) handleAddLibrary(recipe.id)
  }
}

const lastUpdatedFormatted = computed(() => {
  try {
    const d = new Date(plan.value.updated)
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  } catch {
    return plan.value.updated
  }
})
</script>

<template>
  <div
    class="production-layout"
    :class="{ 'production-layout-collapsed': cartCollapsed }"
    data-testid="production-layout"
  >
    <main class="production-main">
      <header class="production-header">
        <div class="production-header-text">
          <h1 class="production-title">
            <span>production</span>
            <span class="production-title-tag">PF-256 slice 0</span>
          </h1>
          <p class="production-subtitle">
            Click <strong>+</strong> (or press <kbd>Enter</kbd>) on a recipe to add it to your queue.
            <span class="production-arrow">cart on the right →</span>
          </p>
        </div>
      </header>

      <div class="production-toolbar" data-testid="production-toolbar">
        <HelpTooltip
          class="production-search-tooltip"
          text="Search recipes — press / to focus"
          align="left"
        >
          <input
            ref="searchInput"
            v-model="searchQuery"
            class="production-search"
            type="text"
            placeholder="Search recipes…"
            aria-label="Search recipes"
            data-testid="library-search"
          />
        </HelpTooltip>
        <label class="production-sort-label">
          <span class="production-sort-text">sort</span>
          <HelpTooltip text="Sort library order" align="right">
            <select
              v-model="sortKey"
              class="production-sort"
              aria-label="Sort recipes"
              data-testid="library-sort"
            >
              <option value="most_baked">Most baked</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="recently_used">Recently used</option>
              <option value="category">Category</option>
            </select>
          </HelpTooltip>
        </label>
      </div>

      <div v-if="!manifestLoaded || !recipesLoaded" class="production-loading">
        Loading recipes…
      </div>

      <ul
        v-else-if="filteredSortedRecipes.length"
        class="production-library"
        data-testid="production-library"
      >
        <ProductionLibraryRow
          v-for="(r, i) in filteredSortedRecipes"
          :key="r.id"
          :recipe-id="r.id"
          :recipe-name="r.name"
          :yields="yieldsFor(r.id)"
          :hero-thumb="heroThumbFor(r.id)"
          :category="r.category"
          :bake-count="r.bakeCount"
          :in-queue="queuedRecipeIds.has(r.id)"
          :is-focused="focusedIndex === i"
          @add="handleAddLibrary"
          @focus="handleRowFocus"
        />
      </ul>

      <div v-else class="production-loading" data-testid="library-empty">
        <template v-if="searchQuery">No recipes match "{{ searchQuery }}".</template>
        <template v-else>No recipes in the manifest.</template>
      </div>
    </main>

    <aside
      class="production-cart"
      :class="{ 'production-cart-collapsed': cartCollapsed }"
      data-testid="production-cart"
    >
      <!-- Collapsed sliver: rotated label + count bubble -->
      <HelpTooltip
        v-if="cartCollapsed"
        class="production-cart-sliver-tooltip"
        text="Expand production queue"
        align="right"
      >
        <button
          type="button"
          class="production-cart-sliver"
          aria-label="Expand production queue"
          data-testid="cart-expand"
          @click="toggleCartCollapsed"
        >
          <span class="production-cart-sliver-text">production</span>
          <span class="production-cart-sliver-count">{{ entryCount }}</span>
        </button>
      </HelpTooltip>

      <template v-else>
        <div class="production-cart-head">
          <h2 class="production-cart-head-title">
            <span>Production · <span data-testid="cart-count">{{ entryCount }}</span> {{ entryCount === 1 ? 'bake' : 'bakes' }}</span>
            <HelpTooltip text="Collapse sidebar" align="right">
              <button
                type="button"
                class="production-cart-collapse"
                aria-label="Collapse production sidebar"
                data-testid="cart-collapse"
                @click="toggleCartCollapsed"
              >›</button>
            </HelpTooltip>
          </h2>
          <div class="production-cart-head-meta">last updated {{ lastUpdatedFormatted }}</div>
        </div>

        <div class="production-cart-body" data-testid="production-cart-body">
          <div
            v-if="entryCount === 0"
            class="production-cart-empty"
            data-testid="cart-empty"
          >
            Click <strong>+</strong> on a recipe<br>to add it to your queue
          </div>
          <ul v-else class="production-cart-list">
            <li
              v-for="entry in plan.entries"
              :key="entry.id"
              class="production-cart-list-item"
            >
              <ProductionCartEntry
                :entry="entry"
                :recipe-name="recipeNameFor(entry.recipeId)"
                :yields="yieldsFor(entry.recipeId)"
                :hero-thumb="heroThumbFor(entry.recipeId)"
                :base-yield="baseYieldFor(entry.recipeId)"
                @update="(patch) => handleUpdate(entry.id, patch)"
                @remove="() => handleRemove(entry.id)"
              />
            </li>
          </ul>
        </div>
      </template>
    </aside>
  </div>
</template>

<style scoped>
/* ────────────────────────────────────────────────
   Layout — main canvas + sticky right cart sidebar
   ──────────────────────────────────────────────── */
.production-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  height: calc(100dvh - 3rem);
  overflow: hidden;
  background: var(--color-stone-100);
}

.production-layout-collapsed {
  grid-template-columns: 1fr 56px;
}

.production-main {
  padding: 1.5rem;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
}

/* ────────────────────────────────────────────────
   Header
   ──────────────────────────────────────────────── */
.production-header {
  margin-bottom: 0.875rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.production-title {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.production-title-tag {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 500;
  border: 1px solid var(--color-stone-400);
  padding: 1px 6px;
  background: var(--color-stone-50);
  color: var(--color-stone-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.production-subtitle {
  margin: 0.25rem 0 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-stone-600);
}

.production-subtitle kbd {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  background: var(--color-stone-50);
  border: 1px solid var(--color-stone-400);
  padding: 0 4px;
  margin: 0 1px;
}

.production-arrow {
  margin-left: 0.5rem;
}

/* ────────────────────────────────────────────────
   Toolbar (search + sort)
   ──────────────────────────────────────────────── */
.production-toolbar {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.875rem;
}

.production-search-tooltip {
  flex: 1;
  min-width: 0;
  display: flex;
}

.production-search-tooltip :deep(.help-tooltip-trigger) {
  flex: 1;
  min-width: 0;
  display: flex;
}

.production-search {
  flex: 1;
  width: 100%;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  padding: 0.45rem 0.625rem;
  border: 2px solid var(--color-ink);
  border-radius: 0;
  background: white;
  color: var(--color-ink);
}

.production-search:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.production-sort-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-600);
}

.production-sort-text {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.production-sort {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0.35rem 0.5rem;
  border: 2px solid var(--color-ink);
  border-radius: 0;
  background: white;
  color: var(--color-ink);
  cursor: pointer;
}

.production-sort:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

/* ────────────────────────────────────────────────
   Library list (dense rows)
   ──────────────────────────────────────────────── */
.production-library {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.production-loading {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-stone-500);
  padding: 2rem;
  text-align: center;
}

/* ────────────────────────────────────────────────
   Cart sidebar (sticky right)
   ──────────────────────────────────────────────── */
.production-cart {
  height: 100%;
  background: var(--color-stone-50);
  border-left: 2px solid var(--color-ink);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.production-cart-head {
  padding: 0.875rem 1rem;
  border-bottom: 2px solid var(--color-ink);
  background: var(--color-stone-200);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex-shrink: 0;
}

.production-cart-head-title {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--color-ink);
}

.production-cart-collapse {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background: var(--color-stone-50);
  border: 2px solid var(--color-ink);
  border-radius: 0;
  padding: 1px 8px;
  cursor: pointer;
  color: var(--color-ink);
  line-height: 1;
}

.production-cart-collapse:hover,
.production-cart-collapse:focus-visible {
  background: var(--color-stone-300);
  outline: none;
}

.production-cart-head-meta {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-600);
}

.production-cart-body {
  padding: 0.625rem;
  overflow-y: auto;
  flex: 1;
}

.production-cart-empty {
  border: 2px dashed var(--color-stone-400);
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-stone-600);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  line-height: 1.6;
}

.production-cart-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.production-cart-list-item {
  margin: 0;
}

/* Collapsed sliver button */
.production-cart-collapsed {
  align-items: stretch;
}

.production-cart-sliver-tooltip {
  display: flex;
  height: 100%;
}

.production-cart-sliver-tooltip :deep(.help-tooltip-trigger) {
  display: flex;
  height: 100%;
  width: 100%;
}

.production-cart-sliver {
  background: var(--color-stone-50);
  border: none;
  border-left: 2px solid var(--color-ink);
  cursor: pointer;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  height: 100%;
  width: 56px;
  color: var(--color-stone-700);
  border-radius: 0;
}

.production-cart-sliver:hover,
.production-cart-sliver:focus-visible {
  background: var(--color-stone-100);
  outline: none;
}

.production-cart-sliver-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  user-select: none;
  color: var(--color-stone-700);
}

.production-cart-sliver-count {
  background: var(--color-accent);
  color: white;
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.75rem;
  padding: 2px 8px;
  border: 2px solid var(--color-accent);
  border-radius: 0;
  line-height: 1;
}

/* ────────────────────────────────────────────────
   Mobile: hide library, cart becomes the page
   ──────────────────────────────────────────────── */
@media (max-width: 640px) {
  .production-layout,
  .production-layout-collapsed {
    grid-template-columns: 1fr;
  }
  .production-main {
    padding: 0.875rem;
  }
  .production-toolbar,
  .production-library {
    display: none;
  }
  .production-header {
    margin-bottom: 0.5rem;
  }
  .production-arrow {
    display: none;
  }
  .production-cart {
    position: static;
    height: auto;
    border-left: none;
    border-top: 2px solid var(--color-ink);
  }
  .production-cart-collapsed {
    border-top: 2px solid var(--color-ink);
  }
  .production-cart-sliver {
    width: 100%;
    border-left: none;
    flex-direction: row;
    padding: 0.75rem 1rem;
  }
  .production-cart-sliver-text {
    writing-mode: horizontal-tb;
    transform: none;
  }
  .production-cart-body {
    padding: 0.875rem;
  }
}
</style>
