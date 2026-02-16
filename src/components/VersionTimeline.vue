<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { Link2, Check } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { ChangeLogEntry } from '@/types/recipe'
import { copyToClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  changeLog: ChangeLogEntry[]
  currentVersion: string
  sectionId: string
}>()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

async function copyPermalink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}
</script>

<template>
  <section>
    <div class="flex items-center gap-1 mb-4 pb-2 border-b-2 border-stone-200">
      <h3 class="card-title">Version History</h3>
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

    <div class="relative pl-6">
      <!-- Vertical connecting line -->
      <div class="absolute left-[9px] top-0 bottom-0 w-0.5 bg-stone-200" />

      <!-- Timeline entries -->
      <div
        v-for="entry in changeLog"
        :key="entry.version"
        class="relative pb-4 last:pb-0"
      >
        <!-- Dot indicator -->
        <div
          class="absolute -left-6 w-5 h-5 flex items-center justify-center top-0"
        >
          <div
            class="w-2 h-2 rounded-full"
            :class="entry.version === currentVersion ? 'bg-success' : 'bg-accent'"
          />
        </div>

        <!-- Version + date -->
        <div class="flex items-baseline leading-5">
          <span class="font-semibold text-sm">{{ entry.version }}</span>
          <span class="text-xs text-muted ml-2">{{ entry.date }}</span>
        </div>

        <!-- Summary -->
        <p class="text-sm text-stone-600 mt-1">{{ entry.summary }}</p>
      </div>
    </div>
  </section>
</template>
