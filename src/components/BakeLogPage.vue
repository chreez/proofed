<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipe } from '@/composables/useRecipe'
import type { CookLogEntry } from '@/types/recipe'

const router = useRouter()
const { recipeList } = useRecipe()

interface BakeEntry {
  recipeId: string
  recipeName: string
  date: string
  version: string
  summary: string | null
  status?: 'in_progress' | 'complete'
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
          allEntries.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            date: entry.date,
            version: entry.version,
            summary: entry.summary ?? null,
            status: entry.status,
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

function navigateToBake(entry: BakeEntry): void {
  router.push(`/recipe/${entry.recipeId}/bake/${entry.date}`)
}

const hasEntries = computed(() => entries.value.length > 0)
</script>

<template>
  <div class="bake-log">
    <div v-if="!loaded" class="bake-log-loading">Loading bake log...</div>

    <div v-else-if="!hasEntries" class="bake-log-empty">No bakes recorded yet.</div>

    <ul v-else class="bake-log-list">
      <li
        v-for="entry in entries"
        :key="`${entry.recipeId}-${entry.date}`"
        class="bake-log-item"
        @click="navigateToBake(entry)"
      >
        <span class="bake-log-dot" :class="{ 'bake-log-dot--active': entry.status === 'in_progress' }" />

        <div class="bake-log-content">
          <div class="bake-log-row-top">
            <span class="bake-log-date">{{ formatDate(entry.date) }}</span>
            <span class="bake-log-name">{{ entry.recipeName }}</span>
            <span class="bake-log-version">{{ entry.version }}</span>
            <span v-if="entry.status === 'in_progress'" class="bake-log-status">In Progress</span>
          </div>
          <p v-if="entry.summary" class="bake-log-summary">{{ entry.summary }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.bake-log {
  font-family: var(--font-body);
  color: var(--color-ink);
  max-width: 36rem;
  margin: 0 auto;
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
  gap: 0.75rem;
}

.bake-log-date {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 3rem;
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

/* Mobile: stack layout */
@media (max-width: 480px) {
  .bake-log-row-top {
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
  }

  .bake-log-date {
    min-width: auto;
  }

  .bake-log-name {
    flex-basis: 100%;
    order: -1;
    white-space: normal;
  }

  .bake-log-summary {
    -webkit-line-clamp: 1;
  }
}
</style>
