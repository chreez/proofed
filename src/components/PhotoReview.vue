<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

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

const route = useRoute()

const recipeId = ref('')
const date = ref('')
const loading = ref(true)
const error = ref('')
const photoStates = reactive<PhotoState[]>([])
const copied = ref(false)

function setHero(index: number): void {
  for (let i = 0; i < photoStates.length; i++) {
    photoStates[i].usage.hero = i === index
  }
  // Hero is mutually exclusive with exclude
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

function storageKey(): string {
  return `photo-review:${recipeId.value}:${date.value}`
}

function saveState(): void {
  const data = photoStates.map(p => ({
    name: p.name,
    summary: p.summary,
    notes: p.notes,
    usage: { ...p.usage }
  }))
  localStorage.setItem(storageKey(), JSON.stringify(data))
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
  console.log(json)
  await navigator.clipboard.writeText(json)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// Auto-save to localStorage on any state change
watch(photoStates, () => {
  if (photoStates.length > 0) saveState()
}, { deep: true })

onMounted(async () => {
  recipeId.value = route.params.recipeId as string
  date.value = route.params.date as string

  try {
    const res = await fetch(`/images/${recipeId.value}/${date.value}/manifest.json`)
    if (!res.ok) {
      error.value = `Manifest not found (${res.status})`
      loading.value = false
      return
    }
    const manifest: Manifest = await res.json()

    // Restore saved user state if it exists
    const saved = localStorage.getItem(storageKey())
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
  } catch (e) {
    error.value = 'Failed to load manifest'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-heading text-xl mb-1">Photo Review</h2>
      <p class="font-mono text-muted">
        {{ recipeId }} / {{ date }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-muted">
      Loading manifest...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card text-center py-12">
      <p class="text-muted">{{ error }}</p>
    </div>

    <!-- Photo cards -->
    <template v-else>
      <div class="space-y-4">
        <div
          v-for="(photo, index) in photoStates"
          :key="photo.name"
          class="card flex gap-4 transition-opacity"
          :class="photo.usage.exclude ? 'opacity-40' : ''"
        >
          <!-- Thumbnail — fixed width left column with hover preview -->
          <div class="flex-shrink-0 w-48 relative group">
            <img
              :src="`/images/${recipeId}/${date}/${photo.thumb}`"
              :alt="photo.summary"
              class="w-full border-2 border-stone-200 cursor-zoom-in"
            />
            <!-- Hover popover — large preview -->
            <div class="hidden group-hover:block absolute right-full top-0 mr-3 z-20 pointer-events-none">
              <img
                :src="`/images/${recipeId}/${date}/${photo.src}`"
                :alt="photo.summary"
                class="w-96 border-2 border-stone-300 shadow-lg bg-surface"
              />
            </div>
            <p class="font-mono text-muted mt-2 text-xs truncate">{{ photo.name }}</p>
          </div>

          <!-- Controls — right column -->
          <div class="flex-1 min-w-0">
            <!-- Summary -->
            <label class="block mb-2">
              <span class="text-xs text-heading block mb-1">Summary</span>
              <textarea
                v-model="photo.summary"
                rows="2"
                class="w-full border-2 border-stone-200 rounded-none bg-surface px-2 py-1.5 text-sm text-body font-sans focus:outline-none focus:border-stone-400"
              />
            </label>

            <!-- Notes -->
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

      <!-- Submit -->
      <button
        class="btn-primary w-full mt-6"
        @click="handleSubmit"
      >
        {{ copied ? 'Copied!' : 'Copy feedback to clipboard' }}
      </button>
    </template>
  </div>
</template>
