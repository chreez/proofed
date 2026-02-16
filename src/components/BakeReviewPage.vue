<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScratchpad } from '@/composables/useScratchpad'
import { copyToClipboard } from '@/composables/useClipboard'
import { ArrowLeft } from 'lucide-vue-next'
import type { ScratchpadEntry } from '@/types/recipe'

interface ManifestPhoto {
  name: string
  thumb: string
  src: string
  summary: string
}

interface Manifest {
  recipeId: string
  date: string
  processedAt: string
  photos: ManifestPhoto[]
}

interface PhotoUsage {
  hero: boolean
  step: boolean
  process: boolean
  exclude: boolean
}

interface PhotoState {
  name: string
  src: string
  thumb: string
  summary: string
  notes: string
  usage: PhotoUsage
}

type SectionId = 'photos' | 'cost' | 'notes' | 'summary'

const route = useRoute()
const router = useRouter()

const recipeId = ref('')
const date = ref('')
const loading = ref(true)
const error = ref('')
const recipeName = ref('')
const photoStates = reactive<PhotoState[]>([])
const copied = ref(false)
const activeSection = ref<SectionId>('photos')

// Scratchpad state
const scratchpadData = ref<{
  entries: Record<string, ScratchpadEntry[]>
  generalNotes: ScratchpadEntry[]
} | null>(null)

const sections: { id: SectionId; label: string }[] = [
  { id: 'photos', label: 'Photos' },
  { id: 'cost', label: 'Cost' },
  { id: 'notes', label: 'Notes' },
  { id: 'summary', label: 'Summary' }
]

function goBack(): void {
  const id = recipeId.value
  if (id) {
    router.push(`/recipe/${id}`)
  } else {
    router.back()
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dateStr} \u2014 ${weekday}`
}

// --- Photo section logic (migrated from PhotoReview) ---

function setHero(index: number): void {
  for (let i = 0; i < photoStates.length; i++) {
    photoStates[i].usage.hero = i === index
  }
  photoStates[index].usage.exclude = false
}

function toggleStep(index: number): void {
  photoStates[index].usage.step = !photoStates[index].usage.step
  if (photoStates[index].usage.step) {
    photoStates[index].usage.exclude = false
  }
}

function toggleProcess(index: number): void {
  photoStates[index].usage.process = !photoStates[index].usage.process
  if (photoStates[index].usage.process) {
    photoStates[index].usage.exclude = false
  }
}

function toggleExclude(index: number): void {
  photoStates[index].usage.exclude = !photoStates[index].usage.exclude
  if (photoStates[index].usage.exclude) {
    photoStates[index].usage.hero = false
    photoStates[index].usage.step = false
    photoStates[index].usage.process = false
  }
}

function photoStorageKey(): string {
  return `photo-review:${recipeId.value}:${date.value}`
}

function savePhotoState(): void {
  const data = photoStates.map(p => ({
    name: p.name,
    summary: p.summary,
    notes: p.notes,
    usage: { ...p.usage }
  }))
  localStorage.setItem(photoStorageKey(), JSON.stringify(data))
}

function buildPayload(): object {
  return {
    recipeId: recipeId.value,
    date: date.value,
    photos: photoStates.map(p => ({
      name: p.name,
      src: p.src,
      thumb: p.thumb,
      summary: p.summary,
      notes: p.notes,
      usage: { ...p.usage }
    }))
  }
}

async function handleSubmit(): Promise<void> {
  const payload = buildPayload()
  const json = JSON.stringify(payload, null, 2)
  await copyToClipboard(json)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// Auto-save photos to localStorage on state change
watch(photoStates, () => {
  if (photoStates.length > 0) savePhotoState()
}, { deep: true })

// --- Notes section helpers ---

const stepEntries = computed<[string, ScratchpadEntry[]][]>(() => {
  if (!scratchpadData.value) return []
  return Object.entries(scratchpadData.value.entries).filter(([, entries]) => entries.length > 0)
})

const generalNotes = computed<ScratchpadEntry[]>(() => {
  return scratchpadData.value?.generalNotes ?? []
})

const hasNotes = computed<boolean>(() => {
  return stepEntries.value.length > 0 || generalNotes.value.length > 0
})

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function ratingColor(rating: string): string {
  switch (rating) {
    case 'good': return 'bg-success text-white'
    case 'ok': return 'bg-warning text-ink'
    case 'bad': return 'bg-danger text-white'
    default: return 'bg-stone-300 text-ink'
  }
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'note': return 'bg-stone-200 text-stone-600'
    case 'rating': return 'bg-stone-200 text-stone-600'
    case 'reminder_response': return 'bg-accent-tint text-accent'
    default: return 'bg-stone-200 text-stone-600'
  }
}

function typeBadgeLabel(type: string): string {
  switch (type) {
    case 'note': return 'note'
    case 'rating': return 'rating'
    case 'reminder_response': return 'reminder'
    default: return type
  }
}

// --- Mount: load manifest, recipe name, and scratchpad ---

onMounted(async () => {
  recipeId.value = route.params.recipeId as string
  date.value = route.params.date as string

  // Load recipe name
  try {
    const recipeRes = await fetch(`/recipes/${recipeId.value}.json`)
    if (recipeRes.ok) {
      const recipe = await recipeRes.json()
      recipeName.value = recipe.meta?.name ?? recipeId.value
    }
  } catch {
    // recipe name will fall back to recipeId
  }

  // Load photo manifest
  try {
    const res = await fetch(`/images/${recipeId.value}/${date.value}/manifest.json`)
    if (!res.ok) {
      error.value = `Manifest not found (${res.status})`
      loading.value = false
      return
    }
    const manifest: Manifest = await res.json()

    // Restore saved photo state if it exists
    const saved = localStorage.getItem(photoStorageKey())
    const savedMap = new Map<string, { summary: string; notes: string; usage: PhotoUsage }>()
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{ name: string; summary: string; notes: string; usage: PhotoUsage }>
        for (const item of parsed) {
          savedMap.set(item.name, item)
        }
      } catch { /* ignore corrupt data */ }
    }

    for (const photo of manifest.photos) {
      const restored = savedMap.get(photo.name)
      photoStates.push({
        name: photo.name,
        src: photo.src,
        thumb: photo.thumb,
        summary: restored?.summary ?? photo.summary,
        notes: restored?.notes ?? '',
        usage: restored?.usage ?? { hero: false, step: false, process: false, exclude: false }
      })
    }
  } catch {
    error.value = 'Failed to load manifest'
  } finally {
    loading.value = false
  }

  // Load scratchpad
  const sp = useScratchpad(recipeId.value)
  sp.load()
  scratchpadData.value = {
    entries: sp.allStepEntries.value,
    generalNotes: sp.generalNotes.value
  }
})
</script>

<template>
  <div data-testid="bake-review-page">
    <!-- Header -->
    <div class="mb-6">
      <button
        class="back-link flex items-center gap-1 text-muted hover:text-ink transition-colors mb-3"
        @click="goBack"
      >
        <ArrowLeft :size="16" />
        <span class="text-sm">Back to recipe</span>
      </button>
      <h2 class="text-heading text-xl font-mono mb-1">Bake Review</h2>
      <p class="font-mono text-muted text-sm">
        {{ recipeName || recipeId }} / {{ formatDate(date) }}
      </p>
    </div>

    <!-- Section tabs -->
    <nav class="flex gap-0 border-b-2 border-stone-200 mb-6" data-testid="section-nav">
      <button
        v-for="section in sections"
        :key="section.id"
        class="px-4 py-2 text-sm font-mono transition-colors cursor-pointer"
        :class="activeSection === section.id
          ? 'text-ink border-b-2 border-ink -mb-[2px] font-semibold'
          : 'text-muted hover:text-ink'"
        @click="activeSection = section.id"
      >
        {{ section.label }}
      </button>
    </nav>

    <!-- Photos section -->
    <section v-if="activeSection === 'photos'" data-testid="photos-section">
      <div v-if="loading" class="text-center py-12 text-muted">
        Loading manifest...
      </div>

      <div v-else-if="error" class="card text-center py-12">
        <p class="text-muted">{{ error }}</p>
      </div>

      <template v-else>
        <div class="space-y-4">
          <div
            v-for="(photo, index) in photoStates"
            :key="photo.name"
            class="card flex gap-4 transition-opacity"
            :class="photo.usage.exclude ? 'opacity-40' : ''"
          >
            <!-- Thumbnail -->
            <div class="flex-shrink-0 w-48 relative group">
              <img
                :src="`/images/${recipeId}/${date}/${photo.thumb}`"
                :alt="photo.summary"
                class="w-full border-2 border-stone-200 cursor-zoom-in"
              />
              <!-- Hover popover -->
              <div class="hidden group-hover:block absolute right-full top-0 mr-3 z-20 pointer-events-none">
                <img
                  :src="`/images/${recipeId}/${date}/${photo.src}`"
                  :alt="photo.summary"
                  class="w-96 border-2 border-stone-300 shadow-lg bg-surface"
                />
              </div>
              <p class="font-mono text-muted mt-2 text-xs truncate">{{ photo.name }}</p>
            </div>

            <!-- Controls -->
            <div class="flex-1 min-w-0">
              <label class="block mb-2">
                <span class="text-xs text-heading block mb-1">Summary</span>
                <textarea
                  v-model="photo.summary"
                  rows="2"
                  class="w-full border-2 border-stone-200 rounded-none bg-surface px-2 py-1.5 text-sm text-body font-sans focus:outline-none focus:border-stone-400"
                />
              </label>

              <label class="block mb-3">
                <span class="text-xs text-heading block mb-1">Notes</span>
                <textarea
                  v-model="photo.notes"
                  rows="2"
                  placeholder="Additional notes..."
                  class="w-full border-2 border-stone-200 rounded-none bg-surface px-2 py-1.5 text-sm text-body font-sans focus:outline-none focus:border-stone-400"
                />
              </label>

              <!-- Usage checkboxes -->
              <div class="flex flex-wrap gap-3">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="photo.usage.hero"
                    class="w-3.5 h-3.5"
                    style="accent-color: var(--color-accent);"
                    @change="setHero(index)"
                  >
                  <span class="text-xs text-body">Hero</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="photo.usage.step"
                    class="w-3.5 h-3.5"
                    style="accent-color: var(--color-accent);"
                    @change="toggleStep(index)"
                  >
                  <span class="text-xs text-body">Step</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="photo.usage.process"
                    class="w-3.5 h-3.5"
                    style="accent-color: var(--color-accent);"
                    @change="toggleProcess(index)"
                  >
                  <span class="text-xs text-body">Process</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="photo.usage.exclude"
                    class="w-3.5 h-3.5"
                    style="accent-color: var(--color-accent);"
                    @change="toggleExclude(index)"
                  >
                  <span class="text-xs text-stone-400">Exclude</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <button
          class="btn-primary w-full mt-6"
          data-testid="copy-feedback-btn"
          @click="handleSubmit"
        >
          {{ copied ? 'Copied!' : 'Copy feedback to clipboard' }}
        </button>
      </template>
    </section>

    <!-- Cost section (placeholder) -->
    <section v-if="activeSection === 'cost'" data-testid="cost-section">
      <div class="card text-center py-12">
        <p class="text-muted font-mono">Cost capture coming soon</p>
      </div>
    </section>

    <!-- Notes section -->
    <section v-if="activeSection === 'notes'" data-testid="notes-section">
      <div v-if="!hasNotes" class="card text-center py-12">
        <p class="text-muted font-mono">No scratchpad notes for this bake</p>
      </div>

      <template v-else>
        <!-- General notes -->
        <div v-if="generalNotes.length > 0" class="mb-6">
          <h3 class="text-heading text-sm font-mono mb-3">General Notes</h3>
          <div class="space-y-2">
            <div
              v-for="(entry, i) in generalNotes"
              :key="`general-${i}`"
              class="card flex items-start gap-3"
            >
              <span class="font-mono text-xs text-muted flex-shrink-0 mt-0.5">{{ formatTimestamp(entry.timestamp) }}</span>
              <span
                class="text-xs px-1.5 py-0.5 rounded-none font-mono flex-shrink-0"
                :class="typeBadgeClass(entry.type)"
              >{{ typeBadgeLabel(entry.type) }}</span>
              <span class="text-sm text-body">{{ entry.value }}</span>
            </div>
          </div>
        </div>

        <!-- Step entries -->
        <div v-for="[stepId, entries] in stepEntries" :key="stepId" class="mb-6">
          <h3 class="text-heading text-sm font-mono mb-3">{{ stepId }}</h3>
          <div class="space-y-2">
            <div
              v-for="(entry, i) in entries"
              :key="`${stepId}-${i}`"
              class="card flex items-start gap-3"
            >
              <span class="font-mono text-xs text-muted flex-shrink-0 mt-0.5">{{ formatTimestamp(entry.timestamp) }}</span>
              <span
                class="text-xs px-1.5 py-0.5 rounded-none font-mono flex-shrink-0"
                :class="typeBadgeClass(entry.type)"
              >{{ typeBadgeLabel(entry.type) }}</span>
              <template v-if="entry.type === 'rating' && entry.rating">
                <span
                  class="text-xs px-2 py-0.5 rounded-none font-mono font-semibold"
                  :class="ratingColor(entry.rating)"
                  data-testid="rating-badge"
                >{{ entry.rating }}</span>
              </template>
              <span v-else class="text-sm text-body">{{ entry.value }}</span>
            </div>
          </div>
        </div>
      </template>
    </section>

    <!-- Summary section (placeholder) -->
    <section v-if="activeSection === 'summary'" data-testid="summary-section">
      <div class="card text-center py-12">
        <p class="text-muted font-mono">Session summary coming soon</p>
      </div>
    </section>
  </div>
</template>
