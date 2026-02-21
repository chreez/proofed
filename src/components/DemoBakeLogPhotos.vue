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
      <h2 class="font-mono text-lg text-ink font-medium mb-1">Bake Log Layout Options</h2>
      <p class="text-sm text-stone-400 font-mono">DRAFT-24.1 — compare 3 layout treatments</p>
    </div>

    <div v-if="!loaded" class="font-mono text-sm text-stone-400 text-center py-8">Loading bake data...</div>

    <div v-else class="demo-columns">
      <!-- ============ LAYOUT A: Date Header Row ============ -->
      <div class="demo-col">
        <div class="demo-col-label">A: Date Header</div>
        <ul class="timeline">
          <li
            v-for="entry in entries"
            :key="`a-${entry.recipeId}-${entry.date}`"
            class="timeline-item"
          >
            <span class="timeline-dot" :class="{ 'timeline-dot--active': entry.status === 'in_progress' }" />

            <div class="timeline-content">
              <!-- Date on its own line as a subtle header -->
              <div class="layout-a-date-row">
                <span class="timeline-date">{{ formatDate(entry.date) }}</span>
                <span v-if="entry.status === 'in_progress'" class="timeline-status">In Progress</span>
              </div>
              <!-- Thumb + name/version/summary below -->
              <div class="layout-a-body">
                <img
                  v-if="entry.heroPhoto"
                  :src="entry.heroPhoto.thumb"
                  :alt="entry.heroPhoto.alt"
                  loading="lazy"
                  decoding="async"
                  class="layout-thumb"
                />
                <div class="layout-a-text">
                  <div class="layout-a-meta">
                    <span class="timeline-name">{{ entry.recipeName }}</span>
                    <span class="timeline-version">{{ entry.version }}</span>
                  </div>
                  <p v-if="entry.summary" class="timeline-summary">{{ entry.summary }}</p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- ============ LAYOUT C: Two-Row Stacked ============ -->
      <div class="demo-col">
        <div class="demo-col-label">C: Two-Row Stacked</div>
        <ul class="timeline">
          <li
            v-for="entry in entries"
            :key="`c-${entry.recipeId}-${entry.date}`"
            class="timeline-item"
          >
            <span class="timeline-dot" :class="{ 'timeline-dot--active': entry.status === 'in_progress' }" />

            <div class="timeline-content">
              <!-- Row 1: date + name + version inline -->
              <div class="layout-c-row-top">
                <span class="timeline-date">{{ formatDate(entry.date) }}</span>
                <span class="layout-c-separator">&middot;</span>
                <span class="timeline-name">{{ entry.recipeName }}</span>
                <span class="layout-c-separator">&middot;</span>
                <span class="timeline-version">{{ entry.version }}</span>
                <span v-if="entry.status === 'in_progress'" class="timeline-status">In Progress</span>
              </div>
              <!-- Row 2: thumb + summary -->
              <div v-if="entry.heroPhoto || entry.summary" class="layout-c-row-bottom">
                <img
                  v-if="entry.heroPhoto"
                  :src="entry.heroPhoto.thumb"
                  :alt="entry.heroPhoto.alt"
                  loading="lazy"
                  decoding="async"
                  class="layout-thumb"
                />
                <p v-if="entry.summary" class="timeline-summary">{{ entry.summary }}</p>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- ============ LAYOUT D: Date Left Column ============ -->
      <div class="demo-col">
        <div class="demo-col-label">D: Date Left Column</div>
        <ul class="layout-d-timeline">
          <li
            v-for="entry in entries"
            :key="`d-${entry.recipeId}-${entry.date}`"
            class="layout-d-item"
          >
            <!-- Left: date column -->
            <span class="layout-d-date">{{ formatDate(entry.date) }}</span>

            <!-- Center: spine + dot -->
            <span class="layout-d-spine-cell">
              <span class="layout-d-dot" :class="{ 'layout-d-dot--active': entry.status === 'in_progress' }" />
            </span>

            <!-- Right: content -->
            <div class="layout-d-content">
              <div class="layout-d-body">
                <img
                  v-if="entry.heroPhoto"
                  :src="entry.heroPhoto.thumb"
                  :alt="entry.heroPhoto.alt"
                  loading="lazy"
                  decoding="async"
                  class="layout-thumb"
                />
                <div class="layout-d-text">
                  <div class="layout-d-meta">
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
    </div>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.demo-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-stone-200);
}

/* --- Three-column layout --- */
.demo-columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
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

/* ============================================================
   SHARED: Timeline spine + dot (Layouts A & C)
   ============================================================ */
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

/* --- Content area (shared for A & C) --- */
.timeline-content {
  border-bottom: 1px solid var(--color-stone-300);
  padding: 0.625rem 0;
}

.timeline-item:last-child .timeline-content {
  border-bottom: none;
}

/* ============================================================
   SHARED: Text elements
   ============================================================ */
.timeline-date {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  white-space: nowrap;
  flex-shrink: 0;
}

.timeline-name {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink);
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

/* --- Shared thumb style --- */
.layout-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--color-stone-200);
}

/* ============================================================
   LAYOUT A: Date Header Row
   ============================================================ */
.layout-a-date-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.layout-a-body {
  display: flex;
  gap: 0.75rem;
}

.layout-a-text {
  flex: 1;
  min-width: 0;
}

.layout-a-meta {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

/* ============================================================
   LAYOUT C: Two-Row Stacked
   ============================================================ */
.layout-c-row-top {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.layout-c-separator {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-300);
  flex-shrink: 0;
}

.layout-c-row-bottom {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.375rem;
}

/* ============================================================
   LAYOUT D: Date Left Column (git-log style)
   ============================================================ */
.layout-d-timeline {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0 0;
  position: relative;
}

.layout-d-item {
  display: grid;
  grid-template-columns: 3.5rem 1rem 1fr;
  gap: 0;
  position: relative;
  min-height: 2rem;
}

.layout-d-item:hover .timeline-name {
  color: var(--color-accent);
}

.layout-d-item:hover .layout-d-dot {
  background: var(--color-accent);
}

/* Date column (left) */
.layout-d-date {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  white-space: nowrap;
  text-align: right;
  padding-top: 0.625rem;
  padding-right: 0.25rem;
}

/* Spine cell (center) */
.layout-d-spine-cell {
  position: relative;
  display: flex;
  justify-content: center;
}

/* Vertical spine line through center column */
.layout-d-spine-cell::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-stone-300);
}

/* Dot */
.layout-d-dot {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--color-accent);
  background: var(--color-surface, #fff);
  z-index: 1;
  margin-top: 0.75rem;
  flex-shrink: 0;
  transition: background-color 200ms ease;
}

.layout-d-dot--active {
  background: var(--color-warning);
  border-color: var(--color-warning);
  animation: pulse-d 2s ease-in-out infinite;
}

.layout-d-item:hover .layout-d-dot--active {
  background: var(--color-warning);
}

@keyframes pulse-d {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Content (right of spine) */
.layout-d-content {
  padding: 0.625rem 0 0.625rem 0.5rem;
  border-bottom: 1px solid var(--color-stone-300);
}

.layout-d-item:last-child .layout-d-content {
  border-bottom: none;
}

.layout-d-body {
  display: flex;
  gap: 0.75rem;
}

.layout-d-text {
  flex: 1;
  min-width: 0;
}

.layout-d-meta {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

/* ============================================================
   MOBILE ADJUSTMENTS
   ============================================================ */
@media (max-width: 480px) {
  .layout-thumb {
    width: 64px;
    height: 64px;
  }

  /* Layout A: wrap name above date/version on small screens */
  .layout-a-meta {
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
  }

  .layout-a-meta .timeline-name {
    flex-basis: 100%;
    white-space: normal;
  }

  /* Layout C: wrap metadata row */
  .layout-c-row-top {
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
  }

  .layout-c-row-top .timeline-name {
    flex-basis: 100%;
    order: -1;
    white-space: normal;
  }

  .layout-c-separator {
    display: none;
  }

  /* Layout D: narrower date column */
  .layout-d-item {
    grid-template-columns: 3rem 1rem 1fr;
  }

  .layout-d-date {
    font-size: 0.625rem;
  }

  .layout-d-meta {
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
  }

  .layout-d-meta .timeline-name {
    flex-basis: 100%;
    white-space: normal;
  }
}
</style>
