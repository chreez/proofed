<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRecipe } from '@/composables/useRecipe'
import { motion } from 'motion-v'

const emit = defineEmits<{
  select: [recipeId: string]
}>()

const { families, recipeList } = useRecipe()

// --- Types ---

interface RecipeMeta {
  baked: boolean
  description: string | null
  heroThumb: string | null
}

interface TimelineItem {
  id: string
  name: string
  baked: boolean
  variantCount: number
  heroImage: string | null
  description: string | null
  routeId: string
  category: string
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
  'atk-cinnamon-buns': 'baking',
  'tartine-baguette': 'baking',
  'carrot-cake': 'baking',
  'ny-style-pizza': 'pizza & dough',
  'coco-curry': 'mains',
  'ichiran-ramen': 'mains',
  'tomita-tsukemen': 'mains',
  'thai-tea-boba': 'drinks',
}

// --- Description fallbacks for recipes without meta.description ---

const summaryMap: Record<string, string> = {
  'atk-cinnamon-buns': 'Quick skillet cinnamon buns with cream cheese glaze. Baking powder + yeast hybrid for a 90-minute start-to-finish.',
}

// --- Fetch recipe meta for enrichment ---

async function fetchRecipeMeta(file: string): Promise<RecipeMeta> {
  try {
    const res = await fetch(`/recipes/${file}`)
    const data = await res.json()
    const hasCookLog = Array.isArray(data.cook_log) && data.cook_log.length > 0
    let heroThumb: string | null = null
    if (hasCookLog) {
      const latestEntry = data.cook_log[data.cook_log.length - 1]
      if (latestEntry.photos?.length) {
        const lastPhoto = latestEntry.photos[latestEntry.photos.length - 1]
        heroThumb = lastPhoto.thumb ?? null
      }
    }
    return {
      baked: hasCookLog,
      description: data.meta?.description ?? null,
      heroThumb,
    }
  } catch {
    return { baked: false, description: null, heroThumb: null }
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

  const familyRecipeIds = new Set<string>()
  for (const family of families.value) {
    for (const variant of family.variants) {
      familyRecipeIds.add(variant.recipeId)
    }
  }

  const result: TimelineItem[] = []

  // Families: one item per family
  for (const family of families.value) {
    const anyBaked = family.variants.some(v => metaCache.value.get(v.recipeId)?.baked)
    // Pick hero + description from first variant that has one
    let heroImage: string | null = null
    let description: string | null = null
    for (const variant of family.variants) {
      const meta = metaCache.value.get(variant.recipeId)
      if (!heroImage && meta?.heroThumb) heroImage = meta.heroThumb
      if (!description && meta?.description) description = meta.description
    }
    result.push({
      id: family.id,
      name: family.name,
      baked: anyBaked,
      variantCount: family.variants.length,
      heroImage,
      description: description ?? summaryMap[family.id] ?? null,
      routeId: family.variants[0]?.recipeId ?? family.id,
      category: categoryMap[family.id] ?? 'other',
    })
  }

  // Standalone recipes (not in any family)
  for (const recipe of recipeList.value) {
    if (familyRecipeIds.has(recipe.id)) continue
    const meta = metaCache.value.get(recipe.id)
    result.push({
      id: recipe.id,
      name: recipe.name,
      baked: meta?.baked ?? false,
      variantCount: 0,
      heroImage: meta?.heroThumb ?? null,
      description: meta?.description ?? summaryMap[recipe.id] ?? null,
      routeId: recipe.id,
      category: categoryMap[recipe.id] ?? 'other',
    })
  }

  return result
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
                <div v-if="item.variantCount > 0" class="timeline-variants">
                  {{ item.variantCount }} variant{{ item.variantCount !== 1 ? 's' : '' }}
                </div>
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

.timeline-variants {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  margin-top: 0.375rem;
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
