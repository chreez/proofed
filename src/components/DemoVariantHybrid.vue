<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'

// --- Types ---

interface IndexRecipe {
  id: string
  name: string
  file: string
}

interface IndexFamily {
  id: string
  name: string
  variants: { id: string; recipeId: string; label: string }[]
}

interface IndexData {
  families: IndexFamily[]
  recipes: IndexRecipe[]
}

interface RecipeItem {
  id: string
  name: string
  baked: boolean
  variantCount: number
  familyId: string | null
  heroImage: string | null
  routeId: string
  category: string
}

// --- Category map (hardcoded for demo) ---
const categoryMap: Record<string, string> = {
  'atk-cinnamon-buns': 'baking',
  'tartine-baguette': 'baking',
  'carrot-cake': 'baking',
  'ny-style-pizza': 'pizza & dough',
  'coco-curry': 'mains',
  'ichiran-ramen': 'mains',
  'tomita-tsukemen': 'mains',
  'thai-tea-boba': 'drinks',
  // DUMMY — extra items for scroll testing, remove after demo
  'dummy-sourdough': 'baking',
  'dummy-focaccia': 'baking',
  'dummy-croissant': 'baking',
  'dummy-brioche': 'baking',
  'dummy-detroit-pizza': 'pizza & dough',
  'dummy-neapolitan': 'pizza & dough',
  'dummy-pad-thai': 'mains',
  'dummy-katsu-curry': 'mains',
  'dummy-pho': 'mains',
  'dummy-dan-dan': 'mains',
  'dummy-matcha-latte': 'drinks',
  'dummy-horchata': 'drinks',
}

// --- Summaries (demo only) ---
const summaryMap: Record<string, string> = {
  'atk-cinnamon-buns': 'Quick skillet cinnamon buns with cream cheese glaze. Baking powder + yeast hybrid for a 90-minute start-to-finish.',
  'ny-style-pizza': 'Classic NY-style dough — 62% hydration, 30-min autolyse, stand mixer knead. Thin center, puffy foldable crust.',
  'coco-curry': 'Smooth, pourable Japanese curry modeled after CoCo Ichibanya. Chunk-free sara-sara style, mandatory overnight rest.',
  'tartine-baguette': 'Chad Robertson\'s baguette method from Tartine Bread. High hydration, long autolyse, steam-baked crust.',
  'carrot-cake': 'Oil-based carrot cake with spices bloomed in warm oil. Brown butter cream cheese frosting, one-bowl method.',
  'thai-tea-boba': 'From-scratch Thai iced tea with chewy boba. ChaTraMue tea brewed strong, layered ombre milk pour.',
  'ichiran-ramen': 'Ichiran-style tonkotsu — 12-hour pork bone broth, tare, and thin straight noodles. Solo booth energy.',
  'tomita-tsukemen': 'Gyokai-tonkotsu dipping broth — fish powder + pork bone. Thick chewy noodles served cold, broth served hot.',
  // DUMMY — remove after demo
  'dummy-sourdough': 'Country sourdough with 80% hydration, cold retard overnight. Open crumb, blistered crust, scored ear.',
  'dummy-focaccia': 'Olive oil-rich focaccia with 3-day cold ferment. Dimpled, airy, crisp bottom. Flaky salt finish.',
  'dummy-croissant': '3-day laminated croissant. 27 layers, European-style butter, honeycomb crumb when sliced.',
  'dummy-brioche': 'Rich egg-and-butter brioche. Tangzhong method for extra softness. Golden pull-apart rolls.',
  'dummy-detroit-pizza': 'Blue steel pan, brick cheese edges, sauce on top. Crispy lace crust, thick and airy interior.',
  'dummy-neapolitan': '60-second cook at 900 degrees. Tipo 00 flour, San Marzano, fresh mozz. Leopard-spotted cornicione.',
  'dummy-pad-thai': 'Wok-charred rice noodles, tamarind-palm sugar sauce. Pressed tofu, bean sprouts, crushed peanuts.',
  'dummy-katsu-curry': 'Japanese curry with panko-crusted pork cutlet. S&B Golden Curry base, slow-cooked onions, rice.',
  'dummy-pho': 'Beef pho with charred onion and ginger broth. 8-hour simmer, star anise, cinnamon, fish sauce.',
  'dummy-dan-dan': 'Sichuan dan dan noodles. Chili oil, ground pork, preserved mustard greens, Sichuan peppercorn tingle.',
  'dummy-matcha-latte': 'Ceremonial-grade matcha whisked to a froth. Oat milk steamed, light sweetener, iced or hot.',
  'dummy-horchata': 'Mexican rice milk with cinnamon and vanilla. Soaked overnight, blended, strained, served ice cold.',
}

// --- Hero image map ---
const heroImages: Record<string, string> = {
  'atk-cinnamon-buns': '/images/atk-cinnamon-buns-ultimate/2026-02-05/img-6733-400w.webp',
  'ny-style-pizza': '/images/ny-style-pizza/bake-2026-02-08/09-slice-fold-400w.webp',
}

// --- State ---
const router = useRouter()
const items = ref<RecipeItem[]>([])
const loading = ref(true)

// --- Data fetching ---
async function fetchIndex(): Promise<IndexData> {
  const res = await fetch('/recipes/index.json')
  return res.json()
}

async function fetchHasCookLog(file: string): Promise<boolean> {
  try {
    const res = await fetch(`/recipes/${file}`)
    const data = await res.json()
    return Array.isArray(data.cook_log) && data.cook_log.length > 0
  } catch {
    return false
  }
}

onMounted(async () => {
  try {
    const index = await fetchIndex()

    const familyRecipeIds = new Set<string>()
    for (const family of index.families) {
      for (const variant of family.variants) {
        familyRecipeIds.add(variant.recipeId)
      }
    }

    const bakedMap = new Map<string, boolean>()
    await Promise.all(
      index.recipes.map(async (r) => {
        const hasBakes = await fetchHasCookLog(r.file)
        bakedMap.set(r.id, hasBakes)
      })
    )

    const result: RecipeItem[] = []

    for (const family of index.families) {
      const anyBaked = family.variants.some(v => bakedMap.get(v.recipeId))
      result.push({
        id: family.id,
        name: family.name,
        baked: anyBaked,
        variantCount: family.variants.length,
        familyId: family.id,
        heroImage: heroImages[family.id] ?? null,
        routeId: family.variants[0]?.recipeId ?? family.id,
        category: categoryMap[family.id] ?? 'other',
      })
    }

    for (const recipe of index.recipes) {
      if (familyRecipeIds.has(recipe.id)) continue
      result.push({
        id: recipe.id,
        name: recipe.name,
        baked: bakedMap.get(recipe.id) ?? false,
        variantCount: 0,
        familyId: null,
        heroImage: heroImages[recipe.id] ?? null,
        routeId: recipe.id,
        category: categoryMap[recipe.id] ?? 'other',
      })
    }

    // DUMMY — extra items for scroll testing, remove after demo
    const dummyItems: RecipeItem[] = [
      { id: 'dummy-sourdough', name: 'Country Sourdough', baked: true, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-sourdough', category: 'baking' },
      { id: 'dummy-focaccia', name: 'Olive Oil Focaccia', baked: true, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-focaccia', category: 'baking' },
      { id: 'dummy-croissant', name: 'Laminated Croissant', baked: false, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-croissant', category: 'baking' },
      { id: 'dummy-brioche', name: 'Tangzhong Brioche', baked: false, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-brioche', category: 'baking' },
      { id: 'dummy-detroit-pizza', name: 'Detroit-Style Pizza', baked: true, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-detroit-pizza', category: 'pizza & dough' },
      { id: 'dummy-neapolitan', name: 'Neapolitan Pizza', baked: false, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-neapolitan', category: 'pizza & dough' },
      { id: 'dummy-pad-thai', name: 'Pad Thai', baked: true, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-pad-thai', category: 'mains' },
      { id: 'dummy-katsu-curry', name: 'Katsu Curry', baked: false, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-katsu-curry', category: 'mains' },
      { id: 'dummy-pho', name: 'Beef Pho', baked: false, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-pho', category: 'mains' },
      { id: 'dummy-dan-dan', name: 'Dan Dan Noodles', baked: true, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-dan-dan', category: 'mains' },
      { id: 'dummy-matcha-latte', name: 'Matcha Latte', baked: true, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-matcha-latte', category: 'drinks' },
      { id: 'dummy-horchata', name: 'Horchata', baked: false, variantCount: 0, familyId: null, heroImage: null, routeId: 'dummy-horchata', category: 'drinks' },
    ]
    result.push(...dummyItems)

    items.value = result
  } finally {
    loading.value = false
  }
})

// --- Grouped + sorted: baked first, then alphabetical, by category ---
interface CategoryGroup {
  label: string
  items: RecipeItem[]
}

const CATEGORY_ORDER = ['baking', 'pizza & dough', 'mains', 'drinks', 'other']

const groupedItems = computed<CategoryGroup[]>(() => {
  const sorted = [...items.value].sort((a, b) => {
    if (a.baked !== b.baked) return a.baked ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const groups = new Map<string, RecipeItem[]>()
  for (const item of sorted) {
    const cat = item.category
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(item)
  }

  return CATEGORY_ORDER
    .filter((cat) => groups.has(cat))
    .map((cat) => ({ label: cat, items: groups.get(cat)! }))
})

function navigate(item: RecipeItem): void {
  if (!item.routeId) return
  router.push({ name: 'recipe', params: { recipeId: item.routeId } })
}

// --- Mobile: track centered item via scroll position ---
const centeredId = ref<string | null>(null)
const listRef = ref<HTMLElement | null>(null)

function updateCenteredItem(): void {
  if (!listRef.value) return
  const els = listRef.value.querySelectorAll('.timeline-item')
  const vcenter = window.innerHeight / 2
  let closestEl: Element | null = null
  let closestDist = Infinity
  for (const el of els) {
    const rect = el.getBoundingClientRect()
    const mid = rect.top + rect.height / 2
    const dist = Math.abs(mid - vcenter)
    if (dist < closestDist) {
      closestDist = dist
      closestEl = el
    }
  }
  centeredId.value = closestEl?.getAttribute('data-id') ?? null
}

onMounted(() => {
  window.addEventListener('scroll', updateCenteredItem, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateCenteredItem)
})

// --- motion-v animation variants ---

// Individual item: slide up + fade in
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

// Category label: fade in
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
  <div class="hybrid-timeline">
    <div v-if="loading" class="timeline-loading">Loading recipes...</div>

    <ul v-else ref="listRef" class="timeline-list">
      <template v-for="group in groupedItems" :key="group.label">
        <!-- Each category group is a motion container with stagger -->
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
          :data-id="item.id"
          class="timeline-item"
          :class="{ 'is-centered': centeredId === item.id }"
          initial="hidden"
          :whileInView="'visible'"
          :inViewOptions="{ once: true, amount: 0.15 }"
          :variants="itemVariants"
          :transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: idx * 0.05 }"
          @click="navigate(item)"
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
                <p v-if="summaryMap[item.id]" class="timeline-summary">{{ summaryMap[item.id] }}</p>
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
/* --- Design tokens --- */
.hybrid-timeline {
  --color-stone-50: #faf9f7;
  --color-stone-100: #f5f3ef;
  --color-stone-200: #e8e4dc;
  --color-stone-300: #d4cdc1;
  --color-stone-400: #b8ad9c;
  --color-stone-500: #9c8e78;
  --color-ink: #1a1816;
  --color-accent: #a65d45;
  --color-accent-tint: rgba(166, 93, 69, 0.1);
  --color-surface: #ffffff;
  --font-mono: 'JetBrains Mono', monospace;
  --font-body: 'Inter', sans-serif;
}

/* --- Container --- */
.hybrid-timeline {
  font-family: var(--font-body);
  color: var(--color-ink);
  background: var(--color-stone-50);
  min-width: 20rem;
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

.timeline-item:hover .timeline-dot,
.timeline-item.is-centered .timeline-dot {
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
