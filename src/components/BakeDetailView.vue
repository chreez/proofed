<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { ArrowLeft, Bot } from 'lucide-vue-next'
import { useRecipe } from '@/composables/useRecipe'
import PhotoLightbox from '@/components/PhotoLightbox.vue'
import BakeStatsBlock from '@/components/BakeStatsBlock.vue'
import type { CookLogEntry, CookLogPhoto, ReheatMethod, CookLogCostItem, CostSourceType, KeyNote } from '@/types/recipe'

const route = useRoute()
const router = useRouter()
const { currentRecipe, loading } = useRecipe()

const bakeDate = computed(() => {
  const d = route.params.date
  return typeof d === 'string' ? d : ''
})

const entry = computed<CookLogEntry | null>(() => {
  if (!currentRecipe.value?.cook_log || !bakeDate.value) return null
  return currentRecipe.value.cook_log.find(e => e.date === bakeDate.value) ?? null
})

const notFound = computed(() => {
  return !loading.value && currentRecipe.value && !entry.value
})

// Hero photo = last in array
const heroPhoto = computed<CookLogPhoto | null>(() => {
  if (!entry.value?.photos?.length) return null
  return entry.value.photos[entry.value.photos.length - 1]
})

// Supporting photos = all except last
const supportingPhotos = computed<CookLogPhoto[]>(() => {
  if (!entry.value?.photos || entry.value.photos.length <= 1) return []
  return entry.value.photos.slice(0, -1)
})

// Lightbox state
const lightboxOpen = ref(false)
const lightboxPhotos = ref<CookLogPhoto[]>([])
const lightboxIndex = ref(0)

function openLightboxFromHero(): void {
  if (!entry.value?.photos?.length) return
  const hero = entry.value.photos[entry.value.photos.length - 1]
  const rest = entry.value.photos.slice(0, -1)
  lightboxPhotos.value = [hero, ...rest]
  lightboxIndex.value = 0
  lightboxOpen.value = true
}

function openLightboxFromThumb(index: number): void {
  if (!entry.value?.photos?.length) return
  // Supporting photos are photos[0..n-2], lightbox reorders hero first
  const hero = entry.value.photos[entry.value.photos.length - 1]
  const rest = entry.value.photos.slice(0, -1)
  lightboxPhotos.value = [hero, ...rest]
  // Thumb index maps to rest[index], which is lightboxPhotos[index + 1]
  lightboxIndex.value = index + 1
  lightboxOpen.value = true
}

function closeLightbox(): void {
  lightboxOpen.value = false
}

// Render curated key_notes (falling back to raw notes) as markdown bullet list.
// Semantics (per CookLogEntry type):
// - key_notes present (any length, including []) → render key_notes
// - key_notes absent → fall back to the raw notes[]
function keyNotesList(e: CookLogEntry): KeyNote[] {
  if (e.key_notes) return e.key_notes
  // Fallback: wrap plain notes strings as KeyNote objects
  return (e.notes ?? []).map(n => ({ text: n }))
}

function hasKeyNotes(e: CookLogEntry): boolean {
  return keyNotesList(e).length > 0
}

function renderNotes(e: CookLogEntry): string {
  const notes = keyNotesList(e)

  // If no start_date or start_date equals date, render flat bullet list
  if (!e.start_date || e.start_date === e.date) {
    const md = notes.map(n => `- ${n.text}`).join('\n')
    return marked.parse(md) as string
  }

  // Multi-day bake: group notes by calendar date using timestamps
  const notesByDay: Record<string, string[]> = {}
  const notesWithoutTimestamp: string[] = []

  notes.forEach(note => {
    if (note.timestamp) {
      // Extract date from ISO timestamp (YYYY-MM-DD)
      const dateStr = note.timestamp.split('T')[0]
      if (!notesByDay[dateStr]) {
        notesByDay[dateStr] = []
      }
      notesByDay[dateStr].push(note.text)
    } else {
      notesWithoutTimestamp.push(note.text)
    }
  })

  // Build markdown with day headers
  const parts: string[] = []

  // Add timestamped notes grouped by day
  const sortedDates = Object.keys(notesByDay).sort()
  sortedDates.forEach(dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const dayHeader = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    parts.push(`#### ${dayHeader}`)
    parts.push('')
    notesByDay[dateStr].forEach(text => {
      parts.push(`- ${text}`)
    })
    parts.push('')
  })

  // Add notes without timestamps at the end
  if (notesWithoutTimestamp.length > 0) {
    notesWithoutTimestamp.forEach(text => {
      parts.push(`- ${text}`)
    })
  }

  return marked.parse(parts.join('\n')) as string
}

// Raw notes disclosure (moved from BakeStatsBlock in Option C restructure).
// Collapsed by default — full prose notes[] are the source of truth and live
// at the bottom of the notes area, below the curated key_notes list.
const showRawNotes = ref(false)

function toggleRawNotes(): void {
  showRawNotes.value = !showRawNotes.value
}

function hasRawNotes(e: CookLogEntry): boolean {
  return (e.notes?.length ?? 0) > 0
}

// Render next_time as markdown
function renderNextTime(e: CookLogEntry): string {
  if (!e.next_time?.length) return ''
  const md = e.next_time.map(n => {
    const sourceSuffix = n.source ? ` *(${n.source})*` : ''
    return `- ${n.text}${sourceSuffix}`
  }).join('\n')
  return marked.parse(md) as string
}

function formatDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dateStr} — ${weekday}`
}

function formatDate(e: { date: string }): string {
  return formatDateStr(e.date)
}

function statusLabel(e: { start_date?: string }): string {
  if (e.start_date) {
    const [, m, d] = e.start_date.split('-').map(Number)
    const date = new Date(2026, m - 1, d)
    return `In Progress (since ${date.toLocaleDateString('en-US', { month: 'short' })} ${d})`
  }
  return 'In Progress'
}

function goBack(): void {
  const recipeId = route.params.recipeId
  if (typeof recipeId === 'string') {
    router.push(`/recipe/${recipeId}#cook-log-section`)
  } else {
    router.back()
  }
}

// --- Cost breakdown helpers ---
function sourceBadgeLabel(sourceType: CostSourceType): string {
  switch (sourceType) {
    case 'heb': return 'HEB'
    case 'rate': return 'RATE'
    case 'pantry': return 'PANTRY'
    case 'manual': return 'MANUAL'
  }
}

function sourceBadgeClass(sourceType: CostSourceType): string {
  switch (sourceType) {
    case 'heb': return 'bg-stone-200 text-stone-600'
    case 'rate': return 'bg-cream text-crust-dark'
    case 'pantry': return 'bg-cream text-crust-dark'
    case 'manual': return 'bg-accent-tint text-accent'
  }
}

function isNegligible(item: CookLogCostItem): boolean {
  return item.cost === 0 && item.sourceType === 'rate'
}

function formatCost(cost: number, negligible: boolean): string {
  if (negligible) return 'negligible'
  return `$${cost.toFixed(2)}`
}

// --- Shared mode popover ---
const isSharedMode = computed(() => route.query.shared === 'true')
const popoverVisible = ref(false)

const reheatMethods = computed<ReheatMethod[]>(() => {
  return currentRecipe.value?.reheat?.methods ?? []
})

const hasReheat = computed(() => reheatMethods.value.length > 0)
const expandedReheat = ref<Set<number>>(new Set())

// Initialize popover visibility when in shared mode
onMounted(() => {
  if (isSharedMode.value) {
    popoverVisible.value = true
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  if (popoverVisible.value) {
    document.body.style.overflow = ''
  }
})

function dismissPopover(): void {
  popoverVisible.value = false
  document.body.style.overflow = ''
  // Remove ?shared=true from URL without triggering navigation
  const query = { ...route.query }
  delete query.shared
  router.replace({ query })
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-6">
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12 text-muted">
      Loading...
    </div>

    <!-- Not found state -->
    <div v-else-if="notFound" class="text-center py-12">
      <p class="text-heading text-lg font-mono mb-2">Bake not found</p>
      <p class="text-muted mb-6">No cook log entry for {{ bakeDate }}</p>
      <button class="back-link" @click="goBack">
        <ArrowLeft :size="16" />
        <span class="font-mono text-sm">Back to recipe</span>
      </button>
    </div>

    <!-- Bake detail -->
    <template v-else-if="entry && currentRecipe">
      <!-- Back link -->
      <button class="back-link" @click="goBack">
        <ArrowLeft :size="16" />
        <span class="font-mono text-sm">Back to recipe</span>
      </button>

      <!-- Header -->
      <div class="mb-4">
        <h2 class="text-heading text-2xl font-mono mb-1">{{ currentRecipe.meta.name }}</h2>
        <div class="flex items-center gap-3">
          <span class="text-muted font-mono">{{ formatDate(entry) }}</span>
          <span class="text-xs bg-stone-200 px-2 py-0.5">{{ entry.version }}</span>
          <span v-if="entry.status === 'in_progress'" class="text-xs font-mono px-2 py-0.5 bg-warning-tint text-warning border border-warning">
            {{ statusLabel(entry) }}
          </span>
        </div>
      </div>

      <!-- Summary -->
      <p v-if="entry.summary" class="text-body mb-6">{{ entry.summary }}</p>

      <!-- Hero photo -->
      <div v-if="heroPhoto" class="mb-4">
        <img
          :src="heroPhoto.src"
          :alt="heroPhoto.alt"
          :title="heroPhoto.alt"
          loading="lazy"
          decoding="async"
          class="w-full border-2 border-stone-200 cursor-pointer"
          @click="openLightboxFromHero"
        />
      </div>

      <!-- Supporting photos: horizontal scroll -->
      <div v-if="supportingPhotos.length" class="flex gap-2 overflow-x-auto pb-2 mb-6">
        <img
          v-for="(photo, i) in supportingPhotos"
          :key="i"
          :src="photo.thumb"
          :alt="photo.alt"
          :title="photo.alt"
          loading="lazy"
          decoding="async"
          class="h-20 w-auto border-2 border-stone-200 cursor-pointer flex-shrink-0"
          @click="openLightboxFromThumb(i)"
        />
      </div>

      <!-- Structured bake stats (PF-177.5, Option C: between photos and notes) -->
      <BakeStatsBlock
        v-if="entry.bake_stats"
        :bake_stats="entry.bake_stats"
        :bake_defaults="currentRecipe.bake_defaults"
        data-testid="bake-detail-stats"
      />

      <!-- Notes — curated editorial subset (key_notes) with fallback to full notes[] -->
      <div v-if="hasKeyNotes(entry)" class="mb-6" data-testid="notes-section">
        <h4 class="text-heading font-mono text-sm mb-2">Notes</h4>
        <div class="bake-prose" v-html="renderNotes(entry)" />
      </div>
      <div v-else-if="entry.status === 'in_progress'" class="mb-6">
        <h4 class="text-heading font-mono text-sm mb-2">Notes</h4>
        <p class="text-muted text-sm italic">Notes will appear here as the bake progresses.</p>
      </div>

      <!-- Raw notes — full prose bake log, collapsed by default (Option C) -->
      <div v-if="hasRawNotes(entry)" class="mb-6" data-testid="raw-notes-section">
        <h4 class="text-heading font-mono text-sm mb-2">
          <button
            type="button"
            class="raw-notes-toggle"
            :aria-expanded="showRawNotes"
            data-testid="raw-notes-toggle"
            @click="toggleRawNotes"
          >
            <span class="raw-notes-caret">{{ showRawNotes ? '▾' : '▸' }}</span>
            Raw notes
          </button>
        </h4>
        <pre
          v-if="showRawNotes"
          class="raw-notes-pre font-mono text-xs whitespace-pre-wrap bg-stone-50 border-2 border-stone-200 p-3"
          data-testid="raw-notes-pre"
        >{{ entry.notes.join('\n') }}</pre>
      </div>

      <!-- Cost Breakdown -->
      <div v-if="entry.cost?.total != null" class="mb-6" data-testid="cost-breakdown">
        <div class="bg-surface border-2 border-stone-200">
          <!-- Header -->
          <div class="flex items-center justify-between p-3 border-b-2 border-stone-200 bg-stone-50">
            <h4 class="font-mono text-sm text-heading font-semibold">Cost Breakdown</h4>
            <span class="font-mono text-xs text-stone-400">{{ entry.cost.servings }} serving{{ entry.cost.servings !== 1 ? 's' : '' }}</span>
          </div>

          <!-- Ingredient rows -->
          <div class="divide-y divide-stone-100">
            <div
              v-for="item in entry.cost.items"
              :key="item.ingredientId"
              class="flex items-center gap-3 px-4 py-3"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-ink">{{ item.name }}</span>
                  <span
                    class="font-mono text-[10px] px-1.5 py-0.5"
                    :class="sourceBadgeClass(item.sourceType)"
                    data-testid="source-badge"
                  >
                    {{ sourceBadgeLabel(item.sourceType) }}
                  </span>
                </div>
                <p class="text-xs text-stone-400">{{ item.sourceName }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="flex items-baseline gap-2">
                  <span class="text-xs text-stone-400 font-mono">{{ item.amount }}{{ item.unit }}</span>
                  <span
                    class="text-sm font-mono font-medium"
                    :class="isNegligible(item) ? 'text-stone-400 italic' : 'text-ink'"
                  >
                    {{ formatCost(item.cost, isNegligible(item)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total row -->
          <div class="border-t-2 border-stone-200 bg-stone-50 px-4 py-3" data-testid="cost-footer">
            <div class="flex items-center justify-between">
              <span class="font-mono text-xs text-stone-500">Total bake cost</span>
              <span class="text-lg font-mono font-medium text-ink">${{ entry.cost.total.toFixed(2) }}</span>
            </div>
            <div class="flex items-center justify-between mt-1">
              <span class="font-mono text-xs text-stone-400">Per serving</span>
              <span class="font-mono text-sm text-accent font-medium">${{ entry.cost.perServing.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Next Time -->
      <div v-if="entry.next_time?.length" class="mb-6">
        <h4 class="text-heading font-mono text-sm mb-2 text-accent">Next Time</h4>
        <div class="bake-prose" v-html="renderNextTime(entry)" />
      </div>

      <!-- Bottom nav -->
      <div class="border-t-2 border-stone-200 pt-4 mt-8">
        <button class="back-link" @click="goBack">
          <ArrowLeft :size="16" />
          <span class="font-mono text-sm">Back to recipe</span>
        </button>
      </div>
    </template>

    <PhotoLightbox
      :photos="lightboxPhotos"
      :initial-index="lightboxIndex"
      :open="lightboxOpen"
      @close="closeLightbox"
    />

    <!-- Shared mode welcome popover — Teleport to body to escape page-settle transform context -->
    <Teleport to="body">
      <Transition name="popover-fade">
        <div
          v-if="popoverVisible && entry && currentRecipe"
          class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          data-testid="shared-popover-overlay"
          @click.self="dismissPopover"
        >
          <div class="popover-card bg-surface border-2 border-stone-200 w-full max-w-md max-h-[90vh] flex flex-col">
            <!-- Hero photo with overlay title -->
            <div v-if="heroPhoto" class="relative w-full h-40 overflow-hidden flex-shrink-0">
              <img
                :src="heroPhoto.src"
                :alt="heroPhoto.alt"
                loading="eager"
                decoding="async"
                class="w-full h-full object-cover object-center"
              />
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
                <p class="font-mono text-sm text-white font-medium">{{ currentRecipe.meta.name }}</p>
                <p class="font-mono text-xs text-white/70">{{ formatDate(entry) }}</p>
              </div>
            </div>

            <!-- Scrollable content -->
            <div class="flex-1 overflow-y-auto">
              <!-- Greeting -->
              <div class="p-5 pb-0">
                <h2 class="font-mono text-lg text-ink mb-1">
                  I made this<span class="text-accent">.</span>
                </h2>
                <p class="text-body text-sm text-stone-500">
                  Here's how to reheat it:
                </p>
              </div>

              <!-- Reheat instructions -->
              <div v-if="hasReheat" class="mx-5 mt-4 border-2 border-stone-200 bg-stone-50">
                <div class="divide-y divide-stone-200">
                  <div
                    v-for="(item, i) in reheatMethods"
                    :key="i"
                    class="px-4 py-3 cursor-pointer"
                    @click="expandedReheat.has(i) ? expandedReheat.delete(i) : expandedReheat.add(i)"
                  >
                    <span class="font-mono text-xs text-accent font-medium">{{ item.method }}</span>
                    <p
                      class="text-sm text-stone-600 mt-0.5"
                      :class="expandedReheat.has(i) ? '' : 'truncate'"
                    >
                      {{ item.detail }}
                    </p>
                    <a
                      v-if="item.reference && expandedReheat.has(i)"
                      :href="item.reference"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-accent text-xs font-mono mt-1 inline-block hover:underline"
                      @click.stop
                    >
                      source &rarr;
                    </a>
                    <p v-if="item.source === 'agent'" class="text-stone-400 text-xs mt-0.5 flex items-center gap-1">
                      <Bot class="w-3 h-3 flex-shrink-0" />
                      <span>ai generated</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sticky footer -->
            <div class="p-5 border-t-2 border-stone-200 flex-shrink-0">
              <button
                class="btn-primary w-full font-mono text-sm"
                data-testid="shared-popover-dismiss"
                @click="dismissPopover"
              >
                View Full Bake Details
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Popover fade transition */
.popover-fade-enter-active {
  transition: opacity 200ms ease-out;
}
.popover-fade-leave-active {
  transition: opacity 150ms ease-in;
}
.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
}

.bake-prose {
  font-size: 0.875rem;
  color: var(--color-stone-600);
  line-height: 1.6;
}

.bake-prose :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
}

.bake-prose :deep(li) {
  margin-bottom: 0.375rem;
}

.bake-prose :deep(strong) {
  color: var(--color-stone-700);
  font-weight: 600;
}

.bake-prose :deep(em) {
  color: var(--color-stone-500);
}

.bake-prose :deep(h4) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--color-stone-400);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.bake-prose :deep(h4:first-child) {
  margin-top: 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-radius: 0;
  padding: 0 12px 0 8px;
  margin-left: -8px;
}

.back-link:hover {
  background: var(--color-stone-200);
}

.back-link:active {
  background: var(--color-stone-300);
}

.bake-prose :deep(code) {
  background: var(--color-stone-100);
  padding: 1px 4px;
  border-radius: 0;
  font-size: 0.8125rem;
  font-family: 'JetBrains Mono', monospace;
}

/* Raw notes disclosure toggle (Option C) */
.raw-notes-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--color-stone-500);
  cursor: pointer;
  padding: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  font-weight: inherit;
}

.raw-notes-toggle:hover {
  color: var(--color-ink);
}

.raw-notes-caret {
  display: inline-block;
  width: 0.75rem;
  color: var(--color-stone-400);
}

.raw-notes-pre {
  color: var(--color-stone-600);
  line-height: 1.5;
  margin: 0;
  max-width: 100%;
  overflow-x: auto;
}
</style>
