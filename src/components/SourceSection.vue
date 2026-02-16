<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { Link2, Check } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { RecipeSource, SourcePhoto } from '@/types/recipe'
import { copyToClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  source: RecipeSource
  sectionId: string
}>()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

async function copyPermalink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}

function sourceLabel(type?: string): string {
  switch (type) {
    case 'adapted': return 'Adapted from'
    case 'inspired': return 'Inspired by'
    case 'original': return 'Original recipe by'
    default: return 'Source'
  }
}

function heroPhoto(photos: SourcePhoto[]): SourcePhoto {
  return photos[0]
}

function supportingPhotos(photos: SourcePhoto[]): SourcePhoto[] {
  return photos.slice(1)
}
</script>

<template>
  <section>
    <div class="flex items-center gap-1 mb-4 pb-2 border-b-2 border-stone-200">
      <h3 class="card-title">Source</h3>
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

    <!-- Attribution -->
    <div class="text-sm text-stone-600 mb-4">
      <span class="font-mono text-xs text-stone-400 uppercase mr-2">{{ sourceLabel(source.type) }}</span>
      <a
        v-if="source.url"
        :href="source.url"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent hover:underline font-semibold"
      >{{ source.name }}</a>
      <span v-else class="font-semibold text-stone-700">{{ source.name }}</span>
      <span v-if="source.author && source.author !== source.name" class="text-stone-500">
        by {{ source.author }}
      </span>
      <span v-if="source.accessed" class="text-stone-400 ml-1">
        (accessed {{ source.accessed }})
      </span>
    </div>

    <!-- Source photos: hero + supporting -->
    <div v-if="source.photos?.length" class="mt-4">
      <p v-if="source.photoCredit" class="text-xs text-stone-400 italic mb-2">{{ source.photoCredit }}</p>
      <figure class="gallery-figure mb-3">
        <a :href="heroPhoto(source.photos).src" target="_blank" class="block">
          <img
            :src="heroPhoto(source.photos).src"
            :alt="heroPhoto(source.photos).alt"
            :title="heroPhoto(source.photos).alt"
            loading="lazy"
            decoding="async"
            class="max-w-lg w-full h-auto border-2 border-stone-200"
          />
        </a>
      </figure>
      <div v-if="supportingPhotos(source.photos).length" class="flex gap-2 overflow-x-auto">
        <figure
          v-for="(photo, i) in supportingPhotos(source.photos)"
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
  </section>
</template>

<style scoped>
.gallery-figure {
  margin: 0;
}
</style>
