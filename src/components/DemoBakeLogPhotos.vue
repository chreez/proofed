<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRecipe } from '@/composables/useRecipe'
import type { CookLogEntry, CookLogPhoto } from '@/types/recipe'

const { recipeList } = useRecipe()

interface BakePhotoEntry {
  recipeId: string
  recipeName: string
  date: string
  version: string
  summary: string | null
  status?: 'in_progress' | 'complete'
  heroPhoto: CookLogPhoto | null
}

const loaded = ref(false)
const entries = ref<BakePhotoEntry[]>([])

async function fetchCookLogs(): Promise<void> {
  const allEntries: BakePhotoEntry[] = []

  await Promise.all(
    recipeList.value.map(async (recipe) => {
      try {
        const res = await fetch(`/recipes/${recipe.file}`)
        const data = await res.json()
        const cookLog: CookLogEntry[] = Array.isArray(data.cook_log) ? data.cook_log : []

        for (const entry of cookLog) {
          const photos = entry.photos ?? []
          allEntries.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            date: entry.date,
            version: entry.version,
            summary: entry.summary ?? null,
            status: entry.status,
            heroPhoto: photos.length ? photos[photos.length - 1] : null,
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
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' })
  return `${monthShort} ${day}`
}
</script>

<template>
  <div class="demo-page">
    <div class="demo-header">
      <h2 class="font-mono text-lg text-ink font-medium mb-1">Bake Log Photo Treatment</h2>
      <p class="text-sm text-stone-400 font-mono">DRAFT-24.1 — compare thumb vs hero</p>
    </div>

    <div v-if="!loaded" class="font-mono text-sm text-stone-400 text-center py-8">Loading bake data...</div>

    <div v-else class="demo-columns">
      <!-- ============ OPTION A: Compact Thumb ============ -->
      <div class="demo-col">
        <div class="demo-col-label">Option A: Compact Thumb</div>
        <ul class="timeline">
          <li
            v-for="entry in entries"
            :key="`a-${entry.recipeId}-${entry.date}`"
            class="timeline-item"
          >
            <span class="timeline-dot" :class="{ 'timeline-dot--active': entry.status === 'in_progress' }" />

            <div class="timeline-content">
              <div class="option-a-layout">
                <!-- Small thumb -->
                <img
                  v-if="entry.heroPhoto"
                  :src="entry.heroPhoto.thumb"
                  :alt="entry.heroPhoto.alt"
                  loading="lazy"
                  decoding="async"
                  class="option-a-thumb"
                />
                <div class="option-a-text">
                  <div class="timeline-row-top">
                    <span class="timeline-date">{{ formatDate(entry.date) }}</span>
                    <span class="timeline-name">{{ entry.recipeName }}</span>
                    <span class="timeline-version">{{ entry.version }}</span>
                    <span v-if="entry.status === 'in_progress'" class="timeline-status">In Progress</span>
                  </div>
                  <p v-if="entry.summary" class="timeline-summary">{{ entry.summary }}</p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- ============ OPTION B: Larger Hero ============ -->
      <div class="demo-col">
        <div class="demo-col-label">Option B: Hero Image</div>
        <ul class="timeline">
          <li
            v-for="entry in entries"
            :key="`b-${entry.recipeId}-${entry.date}`"
            class="timeline-item"
          >
            <span class="timeline-dot" :class="{ 'timeline-dot--active': entry.status === 'in_progress' }" />

            <div class="timeline-content">
              <!-- Hero image above text -->
              <img
                v-if="entry.heroPhoto"
                :src="entry.heroPhoto.thumb"
                :alt="entry.heroPhoto.alt"
                loading="lazy"
                decoding="async"
                class="option-b-hero"
              />
              <div class="timeline-row-top">
                <span class="timeline-date">{{ formatDate(entry.date) }}</span>
                <span class="timeline-name">{{ entry.recipeName }}</span>
                <span class="timeline-version">{{ entry.version }}</span>
                <span v-if="entry.status === 'in_progress'" class="timeline-status">In Progress</span>
              </div>
              <p v-if="entry.summary" class="timeline-summary">{{ entry.summary }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 72rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.demo-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-stone-200);
}

/* --- Two-column layout --- */
.demo-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .demo-columns {
    grid-template-columns: 1fr;
  }
}

.demo-col {
  min-width: 0;
}

.demo-col-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-accent);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-stone-200);
}

/* --- Timeline spine (matches BakeLogPage) --- */
.timeline {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0 0;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-stone-300);
}

.timeline-item {
  position: relative;
  padding-left: 2rem;
}

.timeline-item:hover .timeline-name {
  color: var(--color-accent);
}

.timeline-item:hover .timeline-dot {
  background: var(--color-accent);
}

/* --- Dot (matches BakeLogPage) --- */
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

.timeline-dot--active {
  background: var(--color-warning);
  border-color: var(--color-warning);
  animation: pulse 2s ease-in-out infinite;
}

.timeline-item:hover .timeline-dot--active {
  background: var(--color-warning);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* --- Content area --- */
.timeline-content {
  border-bottom: 1px solid var(--color-stone-300);
  padding: 0.625rem 0;
}

.timeline-item:last-child .timeline-content {
  border-bottom: none;
}

.timeline-row-top {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.timeline-date {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 2.5rem;
}

.timeline-name {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 150ms ease;
}

.timeline-version {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  white-space: nowrap;
  flex-shrink: 0;
}

.timeline-status {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  padding: 1px 6px;
  background: var(--color-warning-tint);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
  white-space: nowrap;
  flex-shrink: 0;
}

.timeline-summary {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-stone-500);
  margin: 0.25rem 0 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ============ OPTION A: Compact Thumb ============ */
.option-a-layout {
  display: flex;
  gap: 0.75rem;
}

.option-a-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--color-stone-200);
}

.option-a-text {
  flex: 1;
  min-width: 0;
}

/* ============ OPTION B: Larger Hero ============ */
.option-b-hero {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border: 2px solid var(--color-stone-200);
  margin-bottom: 0.5rem;
}

/* Mobile: smaller option A thumb */
@media (max-width: 480px) {
  .option-a-thumb {
    width: 64px;
    height: 64px;
  }

  .option-b-hero {
    height: 120px;
  }

  .timeline-row-top {
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
  }

  .timeline-name {
    flex-basis: 100%;
    order: -1;
    white-space: normal;
  }
}
</style>
