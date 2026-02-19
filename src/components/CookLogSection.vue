<script setup lang="ts">
import { ref, useTemplateRef, onMounted, nextTick } from 'vue'
import { marked } from 'marked'
import { Link2, Check, ChevronDown } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import PhotoLightbox from '@/components/PhotoLightbox.vue'
import type { CookLogEntry, CookLogPhoto } from '@/types/recipe'
import { sortedCookLog } from '@/composables/useCookLog'
import { copyToClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  cookLog: CookLogEntry[]
  sectionId: string
}>()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

// Collapse state: all collapsed by default
const expandedEntries = ref<Record<number, boolean>>({})

function isExpanded(index: number): boolean {
  return !!expandedEntries.value[index]
}

function toggleEntry(index: number): void {
  expandedEntries.value[index] = !expandedEntries.value[index]
}

// Lightbox state
const lightboxOpen = ref(false)
const lightboxPhotos = ref<CookLogPhoto[]>([])
const lightboxIndex = ref(0)

function openLightbox(photos: CookLogPhoto[], index: number): void {
  lightboxPhotos.value = photos
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function openLightboxFromHero(photos: CookLogPhoto[]): void {
  // Reorder so hero (last in array) becomes first — forward navigation is intuitive
  const hero = photos[photos.length - 1]
  const rest = photos.slice(0, -1)
  lightboxPhotos.value = [hero, ...rest]
  lightboxIndex.value = 0
  lightboxOpen.value = true
}

function closeLightbox(): void {
  lightboxOpen.value = false
}

async function copyPermalink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}

const entryLinkBtns = ref<Record<number, InstanceType<typeof IconButton>>>({})

function setEntryLinkRef(index: number, el: unknown): void {
  if (el) entryLinkBtns.value[index] = el as InstanceType<typeof IconButton>
}

async function copyEntryPermalink(event: MouseEvent, date: string, index: number): Promise<void> {
  event.stopPropagation()
  const url = `${window.location.origin}${window.location.pathname}#bake-${date}`
  await copyToClipboard(url)
  entryLinkBtns.value[index]?.flashCopied('Copied!')
}

function heroPhoto(photos: CookLogPhoto[]): CookLogPhoto {
  return photos[photos.length - 1]
}

function supportingPhotos(photos: CookLogPhoto[]): CookLogPhoto[] {
  return photos.slice(0, -1)
}

// Convert notes array to markdown and render
function renderNotes(entry: CookLogEntry): string {
  let md = ''

  // Session notes as bullet list
  if (entry.notes?.length) {
    md += entry.notes.map(n => `- ${n}`).join('\n')
  }

  // Next time section
  if (entry.next_time?.length) {
    md += '\n\n#### Next Time\n'
    md += entry.next_time.map(n => {
      const sourceSuffix = n.source ? ` *(${n.source})*` : ''
      return `- ${n.text}${sourceSuffix}`
    }).join('\n')
  }

  return marked.parse(md) as string
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dateStr} — ${weekday}`
}

function entryId(date: string): string {
  return `bake-${date}`
}

// Auto-expand entry matching URL hash on mount
onMounted(() => {
  const hash = window.location.hash?.slice(1)
  if (!hash?.startsWith('bake-')) return

  const targetDate = hash.replace('bake-', '')
  const index = props.cookLog.findIndex(e => e.date === targetDate)
  if (index >= 0) {
    expandedEntries.value[index] = true
    nextTick(() => {
      const el = document.getElementById(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }
})
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

    <div
      v-for="(entry, index) in sortedCookLog(cookLog)"
      :key="index"
      :id="entryId(entry.date)"
      class="mb-4 scroll-mt-16 cursor-pointer transition-all"
      @click="toggleEntry(index)"
    >
      <!-- ============ COLLAPSED: Unified card ============ -->
      <template v-if="!isExpanded(index)">
        <div class="border-2 border-stone-200 hover:border-stone-300 transition-colors p-3 flex gap-3">
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
              <span class="font-semibold text-sm text-stone-700">{{ formatDate(entry.date) }}</span>
              <span class="text-xs bg-stone-200 px-2 py-0.5">{{ entry.version }}</span>
              <span v-if="entry.status === 'in_progress'" class="text-xs font-mono px-2 py-0.5 bg-warning-tint text-warning border border-warning">
                In Progress
              </span>
            </div>
            <p v-if="entry.summary" class="text-sm text-stone-500 mt-1.5 line-clamp-2">{{ entry.summary }}</p>
            <div class="flex items-center gap-3 text-xs text-stone-400 mt-2">
              <span>{{ entry.notes.length }} notes</span>
              <span v-if="entry.photos?.length">{{ entry.photos.length }} photos</span>
              <span v-if="entry.next_time?.length">{{ entry.next_time.length }} next-time</span>
              <span v-if="entry.cost" class="font-mono">${{ entry.cost.total.toFixed(2) }} total · ${{ entry.cost.perServing.toFixed(2) }}/serving</span>
              <ChevronDown class="w-4 h-4 text-stone-400 ml-auto transition-transform duration-200" />
            </div>
          </div>
        </div>
      </template>

      <!-- ============ EXPANDED: Full bake entry ============ -->
      <template v-else>
        <div class="py-4 pr-4 pl-3 border-l-3 border-warning bg-warning-tint">
          <!-- Header: date + version badge + permalink -->
          <div class="flex items-center gap-3 mb-3">
            <span class="font-semibold text-stone-700">
              {{ formatDate(entry.date) }}
            </span>
            <span class="text-xs bg-stone-200 px-2 py-0.5 rounded-none">
              {{ entry.version }}
            </span>
            <span v-if="entry.status === 'in_progress'" class="text-xs font-mono px-2 py-0.5 bg-warning-tint text-warning border border-warning">
              In Progress
            </span>
            <IconButton
              :ref="(el: unknown) => setEntryLinkRef(index, el)"
              tooltip="Copy link"
              size="sm"
              tooltip-align="right"
              class="ml-auto text-stone-300"
              @click="copyEntryPermalink($event, entry.date, index)"
            >
              <Link2 />
              <template #feedback>
                <Check />
              </template>
            </IconButton>
            <ChevronDown class="w-4 h-4 text-stone-400 transition-transform duration-200 rotate-180" />
          </div>

          <!-- Markdown content -->
          <div class="prose" v-html="renderNotes(entry)" />

          <!-- Cost one-liner -->
          <div v-if="entry.cost" class="flex items-center gap-2 pt-3 border-t border-stone-200/60 mt-3">
            <span class="font-mono text-xs text-stone-400">${{ entry.cost.total.toFixed(2) }} total</span>
            <span class="text-stone-300">&middot;</span>
            <span class="font-mono text-xs text-stone-400">${{ entry.cost.perServing.toFixed(2) }}/serving</span>
          </div>

          <!-- Photos: hero layout -->
          <div v-if="entry.photos?.length" class="mt-4">
            <figure class="gallery-figure mb-3">
              <img
                :src="heroPhoto(entry.photos).src"
                :alt="heroPhoto(entry.photos).alt"
                :title="heroPhoto(entry.photos).alt"
                loading="lazy"
                decoding="async"
                class="max-w-lg w-full h-auto border-2 border-stone-200 cursor-pointer"
                @click.stop="openLightboxFromHero(entry.photos!)"
              />
            </figure>
            <div v-if="supportingPhotos(entry.photos).length" class="flex gap-2 overflow-x-auto">
              <figure
                v-for="(photo, i) in supportingPhotos(entry.photos)"
                :key="i"
                class="gallery-figure flex-shrink-0"
              >
                <img
                  :src="photo.thumb"
                  :alt="photo.alt"
                  :title="photo.alt"
                  loading="lazy"
                  decoding="async"
                  class="h-28 w-auto border-2 border-stone-200 cursor-pointer"
                  @click.stop="openLightbox(entry.photos!, i)"
                />
              </figure>
            </div>
          </div>
        </div>
      </template>
    </div>

    <PhotoLightbox
      :photos="lightboxPhotos"
      :initial-index="lightboxIndex"
      :open="lightboxOpen"
      @close="closeLightbox"
    />
  </section>
</template>

<style scoped>
.prose {
  font-size: 0.875rem;
  color: var(--color-stone-600); /* stone-600 */
  line-height: 1.6;
}

.prose :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
}

.prose :deep(li) {
  margin-bottom: 0.375rem;
}

.prose :deep(h4) {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-accent); /* accent */
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.prose :deep(strong) {
  color: var(--color-stone-700); /* stone-700 */
  font-weight: 600;
}

.prose :deep(em) {
  color: var(--color-stone-500); /* stone-500 */
}

.prose :deep(code) {
  background: var(--color-stone-100); /* stone-100 */
  padding: 1px 4px;
  border-radius: 0;
  font-size: 0.8125rem;
  font-family: 'JetBrains Mono', monospace;
}

.gallery-figure {
  margin: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
