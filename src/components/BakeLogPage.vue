<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipe } from '@/composables/useRecipe'
import TagSearch from '@/components/TagSearch.vue'
import { bakeTokens, bakeMatchesText, filterByTags } from '@/composables/useSearchTokens'
import type { CookLogEntry } from '@/types/recipe'

const router = useRouter()
const { recipeList } = useRecipe()

interface BakeWeatherSnapshot {
  condition: string
  temp_high_f: number
  temp_low_f: number
  humidity_avg_percent: number
}

interface BakeEntry {
  recipeId: string
  recipeName: string
  date: string
  start_date?: string
  version: string
  summary: string | null
  status?: 'in_progress' | 'complete'
  heroThumb: string | null
  heroAlt: string | null
  weather: BakeWeatherSnapshot | null
}

const loaded = ref(false)
const entries = ref<BakeEntry[]>([])

async function fetchCookLogs(): Promise<void> {
  const allEntries: BakeEntry[] = []

  await Promise.all(
    recipeList.value.map(async (recipe) => {
      try {
        const res = await fetch(`/recipes/${recipe.file}`)
        const data = await res.json()
        const cookLog: CookLogEntry[] = Array.isArray(data.cook_log) ? data.cook_log : []

        for (const entry of cookLog) {
          const photos = entry.photos ?? []
          const hero = photos.length ? photos[photos.length - 1] : null
          allEntries.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            date: entry.date,
            start_date: entry.start_date,
            version: entry.version,
            summary: entry.summary ?? null,
            status: entry.status,
            heroThumb: hero?.thumb ?? null,
            heroAlt: hero?.alt ?? null,
            weather: entry.weather ? {
              condition: entry.weather.condition,
              temp_high_f: entry.weather.temp_high_f,
              temp_low_f: entry.weather.temp_low_f,
              humidity_avg_percent: entry.weather.humidity_avg_percent,
            } : null,
          })
        }
      } catch {
        // Skip recipes that fail to load
      }
    })
  )

  // Sort newest-first
  allEntries.sort((a, b) => b.date.localeCompare(a.date))
  entries.value = allEntries
  loaded.value = true
}

watch(recipeList, (list) => {
  if (list.length) {
    fetchCookLogs()
  }
}, { immediate: true })

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number)
  const date = new Date(2026, month - 1, day)
  const monthName = date.toLocaleDateString('en-US', { month: 'short' })
  return `${monthName} ${day}`
}

function statusLabel(entry: BakeEntry): string {
  if (entry.start_date) {
    const [, m, d] = entry.start_date.split('-').map(Number)
    const date = new Date(2026, m - 1, d)
    return `In Progress (since ${date.toLocaleDateString('en-US', { month: 'short' })} ${d})`
  }
  return 'In Progress'
}

function navigateToBake(entry: BakeEntry): void {
  router.push(`/recipe/${entry.recipeId}/bake/${entry.date}`)
}

const filterTags = ref<string[]>([])
const searchSlotReady = ref(false)
onMounted(() => {
  searchSlotReady.value = !!document.getElementById('header-search-slot')
})

const filteredEntries = computed<BakeEntry[]>(() =>
  filterByTags(entries.value, bakeTokens, filterTags.value)
)

const hasEntries = computed(() => entries.value.length > 0)
const hasResults = computed(() => filteredEntries.value.length > 0)

function weatherIcon(condition: string): string {
  switch (condition) {
    case 'Clear sky': return '☀️'
    case 'Overcast': return '☁️'
    case 'Rain': return '🌧️'
    case 'Drizzle': return '🌦️'
    default: return '🌤️'
  }
}
</script>

<template>
  <div class="bake-log">
    <div v-if="!loaded" class="bake-log-loading">Loading bake log...</div>

    <div v-else-if="!hasEntries" class="bake-log-empty">No bakes recorded yet.</div>

    <template v-else>
      <Teleport to="#header-search-slot" :disabled="!searchSlotReady">
        <TagSearch
          v-model="filterTags"
          :items="entries"
          :tokens-fn="bakeTokens"
          :match-text-fn="bakeMatchesText"
          placeholder="Search bakes..."
          compact
          @navigate="navigateToBake"
        >
          <template #preview="{ item }">
            <div class="dd-preview">
              <div v-if="item.heroThumb" class="dd-preview-thumb">
                <img :src="item.heroThumb" :alt="item.heroAlt ?? ''" loading="lazy" />
              </div>
              <div v-else class="dd-preview-thumb dd-preview-thumb--empty" aria-hidden="true">·</div>
              <div class="dd-preview-meta">
                <div class="dd-preview-name">{{ item.recipeName }}</div>
                <div class="dd-preview-sub">
                  {{ formatDate(item.date) }} · {{ item.version }}
                  <template v-if="item.weather"> · {{ item.weather.condition }}</template>
                </div>
              </div>
            </div>
          </template>
        </TagSearch>
      </Teleport>

      <div v-if="!hasResults" class="bake-log-empty">
        No bakes match the current filter.
      </div>

    <ul v-if="hasResults" class="bake-log-list">
      <li
        v-for="entry in filteredEntries"
        :key="`${entry.recipeId}-${entry.date}`"
        class="bake-log-item"
        @click="navigateToBake(entry)"
      >
        <span class="bake-log-dot" :class="{ 'bake-log-dot--active': entry.status === 'in_progress' }" />

        <div class="bake-log-content">
          <!-- Row 1: date + name + version inline -->
          <div class="bake-log-row-top">
            <span class="bake-log-date">{{ formatDate(entry.date) }}</span>
            <span class="bake-log-separator">&middot;</span>
            <span class="bake-log-name">{{ entry.recipeName }}</span>
            <span class="bake-log-separator">&middot;</span>
            <span class="bake-log-version">{{ entry.version }}</span>
            <span v-if="entry.status === 'in_progress'" class="bake-log-status">{{ statusLabel(entry) }}</span>
          </div>
          <!-- Row 2: thumb + text column (weather + summary) -->
          <div v-if="entry.heroThumb || entry.summary || entry.weather" class="bake-log-row-bottom">
            <img
              v-if="entry.heroThumb"
              :src="entry.heroThumb"
              :alt="entry.heroAlt ?? ''"
              loading="lazy"
              decoding="async"
              class="bake-log-thumb"
            />
            <div class="bake-log-text">
              <div v-if="entry.weather" class="bake-log-wx-row" data-testid="weather-badge">
                <span class="bake-log-wx-icon">{{ weatherIcon(entry.weather.condition) }}</span>
                <span class="bake-log-wx-temp">{{ entry.weather.temp_high_f }}°/{{ entry.weather.temp_low_f }}°</span>
                <span class="bake-log-separator">&middot;</span>
                <span class="bake-log-wx-rh">{{ entry.weather.humidity_avg_percent }}%rh</span>
              </div>
              <p v-if="entry.summary" class="bake-log-summary">{{ entry.summary }}</p>
            </div>
          </div>
        </div>
      </li>
    </ul>
    </template>
  </div>
</template>

<style scoped>
.bake-log {
  font-family: var(--font-body);
  color: var(--color-ink);
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
  background: var(--color-stone-50);
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

.bake-log-loading,
.bake-log-empty {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-stone-400);
  padding: 2rem 0;
  text-align: center;
}

/* --- Timeline spine + list --- */
.bake-log-list {
  list-style: none;
  margin: 0;
  padding: 1rem 0 0;
  position: relative;
}

.bake-log-list::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-stone-300);
}

/* --- Individual entry --- */
.bake-log-item {
  position: relative;
  padding-left: 2rem;
  cursor: pointer;
}

.bake-log-item:hover .bake-log-name {
  color: var(--color-accent);
}

.bake-log-item:hover .bake-log-summary {
  color: var(--color-ink);
}

.bake-log-item:hover .bake-log-dot {
  background: var(--color-accent);
}

/* --- Dot --- */
.bake-log-dot {
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

/* --- Content area --- */
.bake-log-content {
  border-bottom: 1px solid var(--color-stone-300);
  padding: 0.625rem 0;
}

.bake-log-item:last-child .bake-log-content {
  border-bottom: none;
}

.bake-log-row-top {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.bake-log-separator {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-300);
  flex-shrink: 0;
}

.bake-log-row-bottom {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.375rem;
}

.bake-log-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--color-stone-200);
}

.bake-log-date {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  white-space: nowrap;
  flex-shrink: 0;
}

.bake-log-name {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-ink);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 150ms ease;
}

.bake-log-version {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  white-space: nowrap;
  flex-shrink: 0;
}

.bake-log-status {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  padding: 1px 6px;
  background: var(--color-warning-tint);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
  white-space: nowrap;
  flex-shrink: 0;
}

/* --- Active (in-progress) dot --- */
.bake-log-dot--active {
  background: var(--color-warning);
  border-color: var(--color-warning);
  animation: pulse 2s ease-in-out infinite;
}

.bake-log-item:hover .bake-log-dot--active {
  background: var(--color-warning);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.bake-log-summary {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-stone-500);
  margin: 0.25rem 0 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 150ms ease;
}

/* --- Weather (PF-210) --- */
.bake-log-wx-icon {
  font-size: 0.75rem;
  line-height: 1;
}

.bake-log-wx-temp {
  color: var(--color-stone-600);
  font-weight: 500;
}

.bake-log-wx-rh {
  color: var(--color-stone-400);
}

.bake-log-text {
  flex: 1;
  min-width: 0;
}

.bake-log-wx-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-stone-500);
}


/* Mobile: stack layout */
@media (max-width: 480px) {
  .bake-log-thumb {
    width: 64px;
    height: 64px;
  }

  .bake-log-row-top {
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
  }

  .bake-log-name {
    flex-basis: 100%;
    order: -1;
    white-space: normal;
  }

  .bake-log-separator {
    display: none;
  }

  .bake-log-summary {
    -webkit-line-clamp: 1;
  }
}
</style>
