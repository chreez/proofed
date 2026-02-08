<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { marked } from 'marked'
import { Link2, Check } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { CookLogEntry, CookLogPhoto } from '@/types/recipe'

const props = defineProps<{
  cookLog: CookLogEntry[]
  sectionId: string
}>()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

async function copyPermalink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await navigator.clipboard.writeText(url)
  linkBtn.value?.flashCopied('Copied!')
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
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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

    <div
      v-for="(entry, index) in cookLog"
      :key="index"
      class="py-4 pr-4 pl-3 border-l-3 border-warning mb-4"
    >
      <!-- Header: date + version badge -->
      <div class="flex items-center gap-3 mb-3">
        <span class="font-semibold text-stone-700">
          {{ formatDate(entry.date) }}
        </span>
        <span class="text-xs bg-stone-200 px-2 py-0.5 rounded-none">
          {{ entry.version }}
        </span>
      </div>

      <!-- Markdown content -->
      <div class="prose" v-html="renderNotes(entry)" />

      <!-- Photos: hero layout -->
      <div v-if="entry.photos?.length" class="mt-4">
        <figure class="gallery-figure mb-3">
          <a :href="heroPhoto(entry.photos).src" target="_blank" class="block">
            <img
              :src="heroPhoto(entry.photos).src"
              :alt="heroPhoto(entry.photos).alt"
              :title="heroPhoto(entry.photos).alt"
              loading="lazy"
              decoding="async"
              class="max-w-lg w-full h-auto border-2 border-stone-200"
            />
          </a>
        </figure>
        <div v-if="supportingPhotos(entry.photos).length" class="flex gap-2 overflow-x-auto">
          <figure
            v-for="(photo, i) in supportingPhotos(entry.photos)"
            :key="i"
            class="gallery-figure flex-shrink-0"
          >
            <a :href="photo.src" target="_blank" class="block">
              <img
                :src="photo.thumb"
                :alt="photo.alt"
                :title="photo.alt"
                loading="lazy"
                decoding="async"
                class="h-28 w-auto border-2 border-stone-200"
              />
            </a>
          </figure>
        </div>
      </div>

    </div>
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
</style>
