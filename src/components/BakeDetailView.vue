<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { ArrowLeft } from 'lucide-vue-next'
import { useRecipe } from '@/composables/useRecipe'
import PhotoLightbox from '@/components/PhotoLightbox.vue'
import type { CookLogEntry, CookLogPhoto } from '@/types/recipe'

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

// Render notes as markdown bullet list
function renderNotes(e: CookLogEntry): string {
  let md = ''
  if (e.notes?.length) {
    md += e.notes.map(n => `- ${n}`).join('\n')
  }
  return marked.parse(md) as string
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

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dateStr} — ${weekday}`
}

function goBack(): void {
  const recipeId = route.params.recipeId
  if (typeof recipeId === 'string') {
    router.push(`/recipe/${recipeId}#cook-log-section`)
  } else {
    router.back()
  }
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
      <button class="btn-secondary flex items-center gap-2 mx-auto" @click="goBack">
        <ArrowLeft :size="16" />
        Back to recipe
      </button>
    </div>

    <!-- Bake detail -->
    <template v-else-if="entry && currentRecipe">
      <!-- Back button -->
      <button class="btn-secondary mb-6 flex items-center gap-2" @click="goBack">
        <ArrowLeft :size="16" />
        {{ currentRecipe.meta.name }}
      </button>

      <!-- Header -->
      <div class="mb-4">
        <h2 class="text-heading text-2xl font-mono mb-1">{{ currentRecipe.meta.name }}</h2>
        <div class="flex items-center gap-3">
          <span class="text-muted font-mono">{{ formatDate(entry.date) }}</span>
          <span class="text-xs bg-stone-200 px-2 py-0.5">{{ entry.version }}</span>
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

      <!-- Notes -->
      <div v-if="entry.notes?.length" class="mb-6">
        <h4 class="text-heading font-mono text-sm mb-2">Notes</h4>
        <div class="bake-prose" v-html="renderNotes(entry)" />
      </div>

      <!-- Next Time -->
      <div v-if="entry.next_time?.length" class="mb-6">
        <h4 class="text-heading font-mono text-sm mb-2 text-accent">Next Time</h4>
        <div class="bake-prose" v-html="renderNextTime(entry)" />
      </div>

      <!-- Bottom nav -->
      <div class="border-t-2 border-stone-200 pt-4 mt-8">
        <button class="btn-secondary flex items-center gap-2" @click="goBack">
          <ArrowLeft :size="16" />
          Back to recipe
        </button>
      </div>
    </template>

    <PhotoLightbox
      :photos="lightboxPhotos"
      :initial-index="lightboxIndex"
      :open="lightboxOpen"
      @close="closeLightbox"
    />
  </div>
</template>

<style scoped>
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

.bake-prose :deep(code) {
  background: var(--color-stone-100);
  padding: 1px 4px;
  border-radius: 0;
  font-size: 0.8125rem;
  font-family: 'JetBrains Mono', monospace;
}
</style>
