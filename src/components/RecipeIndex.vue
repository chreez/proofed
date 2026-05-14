<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRecipe } from '@/composables/useRecipe'
import { latestCookLogEntryWithHero, findHeroPhoto } from '@/composables/useCookLog'
import { motion } from 'motion-v'
import TagSearch from '@/components/TagSearch.vue'
import { recipeTokens, recipeMatchesText, filterByTags } from '@/composables/useSearchTokens'

const emit = defineEmits<{
  select: [recipeId: string]
}>()

const { recipeList } = useRecipe()

// --- Types ---

interface RecipeMeta {
  baked: boolean
  bakeCount: number
  description: string | null
  heroThumb: string | null
  sourceType: 'original' | 'adapted' | null
  sourceAuthor: string | null
  outdated: boolean
}

interface TimelineItem {
  id: string
  name: string
  baked: boolean
  inProgress: boolean
  bakeCount: number
  heroImage: string | null
  description: string | null
  routeId: string
  category: string
  sourceType: 'original' | 'adapted' | null
  sourceAuthor: string | null
  outdated: boolean
}

interface CategoryGroup {
  label: string
  items: TimelineItem[]
}

// --- Enrichment data fetched from recipe JSONs ---

const metaCache = ref<Map<string, RecipeMeta>>(new Map())
const loaded = ref(false)
const showUnbaked = ref(false)

// --- In-progress detection via localStorage scratchpad keys ---

function hasActiveScratchpad(recipeId: string): boolean {
  try {
    const raw = localStorage.getItem(`scratchpad-${recipeId}`)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const hasEntries = parsed.entries && Object.keys(parsed.entries).length > 0
    const hasNotes = parsed.generalNotes && parsed.generalNotes.length > 0
    return hasEntries || hasNotes
  } catch {
    return false
  }
}

// --- Category map (hardcoded — only ~10 recipes, pragmatic for a personal notebook) ---

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

// --- Description fallbacks for recipes without meta.description ---

const summaryMap: Record<string, string> = {
  'atk-cinnamon-buns-ultimate': 'Enriched dough, two rises, double cream cheese glaze. Stand mixer method adapted with 25% less sugar. Via America\'s Test Kitchen / Reddit.',
}

// --- Fetch recipe meta for enrichment ---

async function fetchRecipeMeta(file: string): Promise<RecipeMeta> {
  try {
    const res = await fetch(`/recipes/${file}`)
    const data = await res.json()
    const cookLog = Array.isArray(data.cook_log) ? data.cook_log : []
    const hasCookLog = cookLog.length > 0
    let heroThumb: string | null = null
    if (hasCookLog) {
      const entryWithHero = latestCookLogEntryWithHero(cookLog)
      if (entryWithHero?.photos?.length) {
        const hero = findHeroPhoto(entryWithHero.photos)
        heroThumb = hero?.thumb ?? null
      }
    }
    const sourceType = data.meta?.source?.type ?? null
    const sourceAuthor = data.meta?.source?.author ?? null
    return {
      baked: hasCookLog,
      bakeCount: cookLog.length,
      description: data.meta?.description ?? null,
      heroThumb,
      sourceType: sourceType === 'original' || sourceType === 'adapted' ? sourceType : null,
      sourceAuthor,
      outdated: Boolean(data.meta?.outdated),
    }
  } catch {
    return { baked: false, bakeCount: 0, description: null, heroThumb: null, sourceType: null, sourceAuthor: null, outdated: false }
  }
}

// Load all recipe meta when recipeList becomes available
watch(recipeList, async (list) => {
  if (!list.length) return
  const cache = new Map<string, RecipeMeta>()
  await Promise.all(
    list.map(async (r) => {
      const meta = await fetchRecipeMeta(r.file)
      cache.set(r.id, meta)
    })
  )
  metaCache.value = cache
  loaded.value = true
}, { immediate: true })

// --- Build timeline items ---

const items = computed<TimelineItem[]>(() => {
  if (!loaded.value) return []

  return recipeList.value.map(recipe => {
    const meta = metaCache.value.get(recipe.id)
    return {
      id: recipe.id,
      name: recipe.name,
      baked: meta?.baked ?? false,
      inProgress: hasActiveScratchpad(recipe.id),
      bakeCount: meta?.bakeCount ?? 0,
      heroImage: meta?.heroThumb ?? null,
      description: meta?.description ?? summaryMap[recipe.id] ?? null,
      routeId: recipe.id,
      category: categoryMap[recipe.id] ?? 'other',
      sourceType: meta?.sourceType ?? null,
      sourceAuthor: meta?.sourceAuthor ?? null,
      outdated: meta?.outdated ?? false,
    }
  })
})

// --- Tag search ---

const filterTags = ref<string[]>([])
const searchSlotReady = ref(false)
onMounted(() => {
  searchSlotReady.value = !!document.getElementById('header-search-slot')
})

const filteredItems = computed<TimelineItem[]>(() =>
  filterByTags(items.value, recipeTokens, filterTags.value)
)

function navigateToRecipe(item: TimelineItem): void {
  emit('select', item.routeId)
}

// --- Category grouping: baked-first, then alphabetical ---

const CATEGORY_ORDER = ['baking', 'grain-free', 'pizza & dough', 'mains', 'drinks', 'other']

// In-progress items (have active scratchpad data)
const inProgressItems = computed<TimelineItem[]>(() =>
  filteredItems.value
    .filter(item => item.inProgress)
    .sort((a, b) => a.name.localeCompare(b.name))
)

// Baked items grouped by category (excluding in-progress + outdated)
const bakedGroupedItems = computed<CategoryGroup[]>(() => {
  const inProgressIds = new Set(inProgressItems.value.map(i => i.id))
  const bakedItems = filteredItems.value
    .filter(item => item.baked && !item.outdated && !inProgressIds.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const groups = new Map<string, TimelineItem[]>()
  for (const item of bakedItems) {
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category)!.push(item)
  }

  return CATEGORY_ORDER
    .filter(cat => groups.has(cat))
    .map(cat => ({ label: cat, items: groups.get(cat)! }))
})

// Outdated baked items: dedicated group rendered at bottom of baked section
const outdatedItems = computed<TimelineItem[]>(() => {
  const inProgressIds = new Set(inProgressItems.value.map(i => i.id))
  return filteredItems.value
    .filter(item => item.baked && item.outdated && !inProgressIds.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name))
})

// Unbaked items grouped by category (hidden by default; excludes outdated)
const unbakedGroupedItems = computed<CategoryGroup[]>(() => {
  const inProgressIds = new Set(inProgressItems.value.map(i => i.id))
  const unbaked = filteredItems.value
    .filter(item => !item.baked && !item.outdated && !inProgressIds.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const groups = new Map<string, TimelineItem[]>()
  for (const item of unbaked) {
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category)!.push(item)
  }

  return CATEGORY_ORDER
    .filter(cat => groups.has(cat))
    .map(cat => ({ label: cat, items: groups.get(cat)! }))
})

const unbakedCount = computed<number>(() =>
  unbakedGroupedItems.value.reduce((sum, g) => sum + g.items.length, 0)
)

const isFilterActive = computed<boolean>(() => filterTags.value.length > 0)
const showUnbakedEffective = computed<boolean>(() => showUnbaked.value || isFilterActive.value)

function toggleUnbaked(): void {
  showUnbaked.value = !showUnbaked.value
}

function selectRecipe(item: TimelineItem): void {
  emit('select', item.routeId)
}

// --- motion-v animation variants ---

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

const labelVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const,
    },
  },
}
</script>

<template>
  <div class="recipe-timeline">
    <div v-if="!loaded" class="timeline-loading">Loading recipes...</div>

    <template v-else>
      <Teleport to="#header-search-slot" :disabled="!searchSlotReady">
        <TagSearch
          v-model="filterTags"
          :items="items"
          :tokens-fn="recipeTokens"
          :match-text-fn="recipeMatchesText"
          :preview-sort-fn="(a: TimelineItem, b: TimelineItem) => b.bakeCount - a.bakeCount"
          placeholder="Search recipes..."
          compact
          @navigate="navigateToRecipe"
        >
          <template #preview="{ item }">
            <div class="dd-preview">
              <div v-if="item.heroImage" class="dd-preview-thumb">
                <img :src="item.heroImage" :alt="item.name" loading="lazy" />
              </div>
              <div v-else class="dd-preview-thumb dd-preview-thumb--empty" aria-hidden="true">·</div>
              <div class="dd-preview-meta">
                <div class="dd-preview-name">{{ item.name }}</div>
                <div class="dd-preview-sub">
                  {{ item.category }}
                  <template v-if="item.bakeCount > 0"> · {{ item.bakeCount }} bake{{ item.bakeCount !== 1 ? 's' : '' }}</template>
                  <template v-else> · unbaked</template>
                </div>
              </div>
            </div>
          </template>
        </TagSearch>
      </Teleport>

    <ul class="timeline-list">
      <!-- In-progress section -->
      <template v-if="inProgressItems.length > 0">
        <motion.li
          class="timeline-section-label-item"
          initial="hidden"
          :whileInView="'visible'"
          :inViewOptions="{ once: true, amount: 0.1 }"
          :variants="labelVariants"
        >
          <span class="timeline-section-label timeline-section-label--in-progress">in progress</span>
        </motion.li>

        <motion.li
          v-for="(item, idx) in inProgressItems"
          :key="item.id"
          class="timeline-item timeline-item--in-progress"
          initial="hidden"
          :whileInView="'visible'"
          :inViewOptions="{ once: true, amount: 0.15 }"
          :variants="itemVariants"
          :transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }"
          @click="selectRecipe(item)"
        >
          <span class="timeline-dot timeline-dot--in-progress" />

          <div class="timeline-content">
            <div class="timeline-row">
              <span class="timeline-name">{{ item.name }}</span>
              <span class="timeline-in-progress-badge">in progress</span>
            </div>

            <div v-if="item.heroImage || item.description" class="timeline-detail">
              <div v-if="item.heroImage" class="timeline-hero-wrap">
                <img
                  :src="item.heroImage"
                  :alt="item.name"
                  class="timeline-hero"
                  loading="lazy"
                />
              </div>
              <div class="timeline-meta">
                <p v-if="item.description" class="timeline-summary">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </motion.li>
      </template>

      <!-- Baked recipes by category -->
      <template v-for="group in bakedGroupedItems" :key="group.label">
        <motion.li
          class="timeline-section-label-item"
          initial="hidden"
          :whileInView="'visible'"
          :inViewOptions="{ once: true, amount: 0.1 }"
          :variants="labelVariants"
        >
          <span class="timeline-section-label">{{ group.label }}</span>
        </motion.li>

        <motion.li
          v-for="(item, idx) in group.items"
          :key="item.id"
          class="timeline-item"
          initial="hidden"
          :whileInView="'visible'"
          :inViewOptions="{ once: true, amount: 0.15 }"
          :variants="itemVariants"
          :transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }"
          @click="selectRecipe(item)"
        >
          <span class="timeline-dot" />

          <div class="timeline-content">
            <div class="timeline-row">
              <span class="timeline-name">{{ item.name }}</span>
              <span
                v-if="item.sourceType === 'original'"
                class="timeline-provenance-icon"
                :data-tooltip="`AI-synthesized: ${item.sourceAuthor}`"
                @click.stop
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-5-6-5M12 19h8" /></svg>
              </span>
              <span v-if="item.bakeCount > 0" class="timeline-bake-count">{{ item.bakeCount }} bake{{ item.bakeCount !== 1 ? 's' : '' }}</span>
            </div>

            <div class="timeline-detail">
              <div v-if="item.heroImage" class="timeline-hero-wrap">
                <img
                  :src="item.heroImage"
                  :alt="item.name"
                  class="timeline-hero"
                  loading="lazy"
                />
              </div>
              <div class="timeline-meta">
                <p v-if="item.description" class="timeline-summary">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </motion.li>
      </template>

      <!-- Outdated baked recipes (dedicated group at bottom) -->
      <template v-if="outdatedItems.length > 0">
        <motion.li
          class="timeline-section-label-item"
          initial="hidden"
          :whileInView="'visible'"
          :inViewOptions="{ once: true, amount: 0.1 }"
          :variants="labelVariants"
        >
          <span class="timeline-section-label">outdated</span>
        </motion.li>

        <motion.li
          v-for="(item, idx) in outdatedItems"
          :key="item.id"
          class="timeline-item timeline-item--outdated"
          initial="hidden"
          :whileInView="'visible'"
          :inViewOptions="{ once: true, amount: 0.15 }"
          :variants="itemVariants"
          :transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }"
          @click="selectRecipe(item)"
        >
          <span class="timeline-dot timeline-dot--outdated" />

          <div class="timeline-content">
            <div class="timeline-row">
              <span class="timeline-name">{{ item.name }}</span>
              <span v-if="item.bakeCount > 0" class="timeline-bake-count">{{ item.bakeCount }} bake{{ item.bakeCount !== 1 ? 's' : '' }}</span>
            </div>

            <div class="timeline-detail">
              <div v-if="item.heroImage" class="timeline-hero-wrap">
                <img
                  :src="item.heroImage"
                  :alt="item.name"
                  class="timeline-hero"
                  loading="lazy"
                />
              </div>
              <div class="timeline-meta">
                <p v-if="item.description" class="timeline-summary">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </motion.li>
      </template>

      <!-- Reveal toggle for unbaked recipes (hidden when filter active — unbaked auto-revealed) -->
      <li v-if="unbakedCount > 0 && !isFilterActive" class="timeline-reveal-item">
        <span class="timeline-reveal-link" @click="toggleUnbaked">
          {{ showUnbaked ? '- hide unbaked recipes' : `+ ${unbakedCount} more recipe${unbakedCount !== 1 ? 's' : ''}` }}
        </span>
      </li>

      <!-- Unbaked recipes (revealed when toggled or when filter is active) -->
      <template v-if="showUnbakedEffective">
        <template v-for="group in unbakedGroupedItems" :key="'unbaked-' + group.label">
          <motion.li
            class="timeline-section-label-item"
            initial="hidden"
            :whileInView="'visible'"
            :inViewOptions="{ once: true, amount: 0.1 }"
            :variants="labelVariants"
          >
            <span class="timeline-section-label">{{ group.label }}</span>
          </motion.li>

          <motion.li
            v-for="(item, idx) in group.items"
            :key="item.id"
            class="timeline-item timeline-item--unbaked"
            initial="hidden"
            :whileInView="'visible'"
            :inViewOptions="{ once: true, amount: 0.15 }"
            :variants="itemVariants"
            :transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }"
            @click="selectRecipe(item)"
          >
            <span class="timeline-dot timeline-dot--unbaked" />

            <div class="timeline-content">
              <div class="timeline-row">
                <span class="timeline-name">{{ item.name }}</span>
                <span
                  v-if="item.sourceType === 'original'"
                  class="timeline-provenance-icon"
                  :data-tooltip="`AI-synthesized: ${item.sourceAuthor}`"
                  @click.stop
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-5-6-5M12 19h8" /></svg>
                </span>
              </div>

              <div v-if="item.description" class="timeline-detail">
                <div class="timeline-meta">
                  <p class="timeline-summary">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </motion.li>
        </template>
      </template>
    </ul>
    </template>
  </div>
</template>

<style scoped>
/* --- Container --- */
.recipe-timeline {
  font-family: var(--font-body);
  color: var(--color-ink);
  background: var(--color-stone-50);
  max-width: 36rem;
  margin: 0 auto;
}

.dd-preview {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dd-preview-thumb {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-stone-300);
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dd-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dd-preview-thumb--empty {
  font-family: var(--font-mono);
  color: var(--color-stone-300);
  font-size: 1rem;
  background: var(--color-stone-100);
}

.dd-preview-meta {
  flex: 1;
  min-width: 0;
}

.dd-preview-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dd-preview-sub {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-stone-400);
}

/* --- Category section label --- */
.timeline-section-label-item {
  position: relative;
  padding-left: 2rem;
  padding-top: 1rem;
  padding-bottom: 0.25rem;
}

.timeline-section-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-400);
  border-bottom: 1px solid var(--color-stone-200);
  padding-bottom: 0.25rem;
  display: block;
}

/* --- List reset + timeline spine --- */
.timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}

.timeline-list::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-stone-300);
}

/* --- Individual item --- */
.timeline-item {
  position: relative;
  padding-left: 2rem;
  cursor: pointer;
}

.timeline-item:hover .timeline-name {
  color: var(--color-accent);
}

.timeline-item:hover .timeline-summary {
  color: var(--color-ink);
}

/* --- Dot --- */
.timeline-dot {
  position: absolute;
  left: 0;
  top: 1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--color-accent);
  background: transparent;
  transform: translateY(-50%);
  z-index: 1;
  transition: background-color 200ms ease;
}

.timeline-item:hover .timeline-dot {
  background: var(--color-accent);
}

/* --- Content --- */
.timeline-content {
  border-bottom: 1px solid var(--color-stone-300);
}

.timeline-item:last-child .timeline-content {
  border-bottom: none;
}

.timeline-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0;
  min-height: 2.5rem;
}

.timeline-name {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-ink);
  flex: 1;
  min-width: 0;
  transition: color 150ms ease;
}

/* --- Provenance indicator --- */
.timeline-provenance-icon {
  flex-shrink: 0;
  color: var(--color-stone-400);
  cursor: help;
  display: flex;
  align-items: center;
  position: relative;
}

.timeline-provenance-icon:hover {
  color: var(--color-accent);
}

.timeline-provenance-icon::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.5rem;
  background: var(--color-ink);
  color: var(--color-stone-50);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.3;
  padding: 0.375rem 0.5rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 100ms ease;
  z-index: 10;
}

.timeline-provenance-icon:hover::after {
  opacity: 1;
}

/* --- Bake count badge --- */
.timeline-bake-count {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  white-space: nowrap;
  flex-shrink: 0;
}

/* --- Detail layout --- */
.timeline-detail {
  display: flex;
  gap: 0.75rem;
  padding: 0.25rem 0 0.625rem;
}

/* --- Hero image (cropped/zoomed) --- */
.timeline-hero-wrap {
  flex-shrink: 0;
  width: 6rem;
  height: 6rem;
  overflow: hidden;
  border: 2px solid var(--color-stone-200);
}

.timeline-hero {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.5);
}

/* --- Meta text --- */
.timeline-meta {
  flex: 1;
  min-width: 0;
}

.timeline-summary {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-stone-500);
  margin: 0;
  transition: color 150ms ease;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* --- In-progress section label --- */
.timeline-section-label--in-progress {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent-tint);
}

/* --- In-progress dot: filled + pulsing --- */
.timeline-dot--in-progress {
  background: var(--color-accent);
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* --- In-progress badge --- */
.timeline-in-progress-badge {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

/* --- Unbaked items: dimmed, no hero, no bake count --- */
.timeline-item--unbaked {
  opacity: 0.45;
}

.timeline-item--unbaked .timeline-dot {
  border-color: var(--color-stone-300);
}

.timeline-item--unbaked:hover {
  opacity: 0.7;
}

.timeline-item--unbaked:hover .timeline-dot {
  background: var(--color-stone-300);
}

.timeline-dot--unbaked {
  border-color: var(--color-stone-300);
}

/* --- Outdated items: dimmed but more readable than unbaked --- */
.timeline-item--outdated {
  opacity: 0.6;
}

.timeline-item--outdated:hover {
  opacity: 1;
}

.timeline-item--outdated .timeline-dot {
  border-color: var(--color-stone-400);
}

.timeline-dot--outdated {
  border-color: var(--color-stone-400);
}

/* --- Reveal toggle link --- */
.timeline-reveal-item {
  position: relative;
  padding-left: 2rem;
}

.timeline-reveal-link {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-stone-400);
  cursor: pointer;
  padding: 0.75rem 0;
  text-align: center;
  transition: color 150ms ease;
  border-top: 1px dashed var(--color-stone-300);
}

.timeline-reveal-link:hover {
  color: var(--color-accent);
}

/* --- Loading --- */
.timeline-loading {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-stone-400);
  padding: 2rem 0;
  text-align: center;
}

/* --- Mobile adjustments --- */
@media (max-width: 480px) {
  .timeline-name {
    font-size: 0.875rem;
  }

  .timeline-hero-wrap {
    width: 5rem;
    height: 5rem;
  }
}
</style>
