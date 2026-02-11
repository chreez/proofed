<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRecipe } from '@/composables/useRecipe'
import { motion } from 'motion-v'

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
}

interface TimelineItem {
  id: string
  name: string
  baked: boolean
  bakeCount: number
  heroImage: string | null
  description: string | null
  routeId: string
  category: string
  sourceType: 'original' | 'adapted' | null
  sourceAuthor: string | null
}

interface CategoryGroup {
  label: string
  items: TimelineItem[]
}

// --- Enrichment data fetched from recipe JSONs ---

const metaCache = ref<Map<string, RecipeMeta>>(new Map())
const loaded = ref(false)

// --- Category map (hardcoded — only ~10 recipes, pragmatic for a personal notebook) ---

const categoryMap: Record<string, string> = {
  'atk-cinnamon-buns-ultimate': 'baking',
  'tartine-baguette': 'baking',
  'carrot-cake': 'baking',
  'simple-sourdough': 'baking',
  'ny-style-pizza': 'pizza & dough',
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
      const latestEntry = data.cook_log[0]
      if (latestEntry.photos?.length) {
        const lastPhoto = latestEntry.photos[latestEntry.photos.length - 1]
        heroThumb = lastPhoto.thumb ?? null
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
    }
  } catch {
    return { baked: false, bakeCount: 0, description: null, heroThumb: null, sourceType: null, sourceAuthor: null }
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
      bakeCount: meta?.bakeCount ?? 0,
      heroImage: meta?.heroThumb ?? null,
      description: meta?.description ?? summaryMap[recipe.id] ?? null,
      routeId: recipe.id,
      category: categoryMap[recipe.id] ?? 'other',
      sourceType: meta?.sourceType ?? null,
      sourceAuthor: meta?.sourceAuthor ?? null,
    }
  })
})

// --- Category grouping: baked-first, then alphabetical ---

const CATEGORY_ORDER = ['baking', 'pizza & dough', 'mains', 'drinks', 'other']

const groupedItems = computed<CategoryGroup[]>(() => {
  const sorted = [...items.value].sort((a, b) => {
    if (a.baked !== b.baked) return a.baked ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const groups = new Map<string, TimelineItem[]>()
  for (const item of sorted) {
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category)!.push(item)
  }

  return CATEGORY_ORDER
    .filter(cat => groups.has(cat))
    .map(cat => ({ label: cat, items: groups.get(cat)! }))
})

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

    <ul v-else class="timeline-list">
      <template v-for="group in groupedItems" :key="group.label">
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
    </ul>
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
