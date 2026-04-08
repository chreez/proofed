<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { Link2, Check, ArrowRight } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { CookLogEntry, CookLogPhoto, Recipe } from '@/types/recipe'
import { sortedCookLog } from '@/composables/useCookLog'
import {
  sessionCount,
  itemsCreated,
  servingsCreated,
  caloriesCreated,
} from '@/composables/useCookLogStats'
import { copyToClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  cookLog: CookLogEntry[]
  sectionId: string
  recipeId?: string
  recipe?: Recipe
}>()

// --- Header stats row (PF-41 decision A2) ---
// Only renders when the parent supplies a `recipe` prop with stats + at least
// one completed bake. Existing callers that only pass `cookLog` (e.g. specs)
// render the plain header with no stats row.
const stats = computed(() => props.recipe?.config?.stats)
const completedCount = computed(() => sessionCount(props.cookLog))
const showStatsRow = computed(() => !!stats.value && completedCount.value > 0)

const statsItems = computed(() => itemsCreated(props.cookLog, props.recipe))
const statsServings = computed(() => servingsCreated(props.cookLog, props.recipe))
const statsCalories = computed(() => caloriesCreated(props.cookLog, props.recipe))

function formatCalories(cal: number | null): string {
  if (cal == null) return '—'
  if (cal >= 1000) return `${(cal / 1000).toFixed(1)}k`
  return Math.round(cal).toString()
}

const router = useRouter()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

// Summary expand state: tracks which summaries show full text
const expandedSummaries = ref<Record<number, boolean>>({})

function isSummaryExpanded(index: number): boolean {
  return !!expandedSummaries.value[index]
}

function toggleSummary(event: MouseEvent, index: number): void {
  event.stopPropagation()
  expandedSummaries.value[index] = !expandedSummaries.value[index]
}

async function copyPermalink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}

function heroPhoto(photos: CookLogPhoto[]): CookLogPhoto {
  return photos[photos.length - 1]
}

function formatDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dateStr} — ${weekday}`
}

function formatDate(entry: { date: string }): string {
  return formatDateStr(entry.date)
}

function statusLabel(entry: { status?: string; start_date?: string }): string {
  if (entry.start_date) {
    const [, m, d] = entry.start_date.split('-').map(Number)
    const date = new Date(2026, m - 1, d)
    return `In Progress (since ${date.toLocaleDateString('en-US', { month: 'short' })} ${d})`
  }
  return 'In Progress'
}

function navigateToBake(event: MouseEvent, date: string): void {
  event.stopPropagation()
  if (props.recipeId) {
    router.push(`/recipe/${props.recipeId}/bake/${date}`)
  }
}

function entryId(date: string): string {
  return `bake-${date}`
}
</script>

<template>
  <section>
    <div class="flex items-center gap-1 mb-4 pb-2 border-b-2 border-stone-200">
      <h3 class="card-title">Cook Log</h3>
      <IconButton
        ref="linkBtn"
        tooltip="Copy link"
        size="sm"
        tooltip-align="center"
        class="text-stone-300"
        @click="copyPermalink"
      >
        <Link2 />
        <template #feedback>
          <Check />
        </template>
      </IconButton>
    </div>

    <!-- PF-41 decision A2: stacked mini-tiles row (sessions · items · [servings] · calories) -->
    <div v-if="showStatsRow && stats" class="cook-log-stats">
      <div class="cook-log-stats-tile">
        <span class="cook-log-stats-value">{{ completedCount }}</span>
        <span class="cook-log-stats-label">sessions</span>
      </div>
      <div class="cook-log-stats-tile">
        <span class="cook-log-stats-value">{{ statsItems }}</span>
        <span class="cook-log-stats-label">{{ stats.unit }}</span>
      </div>
      <div v-if="stats.servingsPerItem > 1" class="cook-log-stats-tile">
        <span class="cook-log-stats-value">~{{ statsServings }}</span>
        <span class="cook-log-stats-label">{{ stats.servingUnit }}</span>
      </div>
      <div class="cook-log-stats-tile">
        <span class="cook-log-stats-value">{{ formatCalories(statsCalories) }}</span>
        <span class="cook-log-stats-label">calories</span>
      </div>
    </div>

    <div
      v-for="(entry, index) in sortedCookLog(cookLog)"
      :key="index"
      :id="entryId(entry.date)"
      class="mb-4 scroll-mt-16"
    >
      <div class="border-2 border-stone-200 p-3 flex gap-3">
        <!-- Optional hero thumbnail -->
        <img
          v-if="entry.photos?.length"
          :src="heroPhoto(entry.photos).thumb"
          :alt="heroPhoto(entry.photos).alt"
          loading="lazy"
          decoding="async"
          class="w-20 h-20 object-cover flex-shrink-0 border-2 border-stone-200"
        />
        <!-- Text content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <span class="font-semibold text-sm text-stone-700">{{ formatDate(entry) }}</span>
            <span class="text-xs bg-stone-200 px-2 py-0.5">{{ entry.version }}</span>
            <span v-if="entry.status === 'in_progress'" class="text-xs font-mono px-2 py-0.5 bg-warning-tint text-warning border border-warning">
              {{ statusLabel(entry) }}
            </span>
          </div>
          <p
            v-if="entry.summary"
            class="text-sm text-stone-500 mt-1.5 cursor-pointer"
            :class="{ 'line-clamp-2': !isSummaryExpanded(index) }"
            @click="toggleSummary($event, index)"
          >{{ entry.summary }}</p>
          <div class="flex items-center gap-3 text-xs text-stone-400 mt-2">
            <span>{{ entry.notes.length }} notes</span>
            <span v-if="entry.photos?.length">{{ entry.photos.length }} photos</span>
            <span v-if="entry.next_time?.length">{{ entry.next_time.length }} next-time</span>
            <span v-if="entry.cost" class="font-mono">${{ entry.cost.total.toFixed(2) }} total · ${{ entry.cost.perServing.toFixed(2) }}/serving</span>
            <span
              v-if="recipeId"
              class="ml-auto flex items-center gap-1 text-stone-400 hover:text-accent transition-colors cursor-pointer"
              @click="navigateToBake($event, entry.date)"
            >
              View bake <ArrowRight class="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* PF-41 A2 header stats row — mirrors the StatsPage ds3-hero tile styling
   at a smaller recipe-level scale. */
.cook-log-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
  border: 1px solid var(--color-stone-200);
  background: var(--color-surface);
  margin-bottom: 1rem;
}

.cook-log-stats-tile {
  padding: 0.625rem 0.5rem;
  text-align: center;
  border-right: 1px solid var(--color-stone-200);
}

.cook-log-stats-tile:last-child {
  border-right: none;
}

.cook-log-stats-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1;
  color: var(--color-ink);
}

.cook-log-stats-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
  margin-top: 0.375rem;
}
</style>
