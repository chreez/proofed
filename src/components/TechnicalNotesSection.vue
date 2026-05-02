<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { Link2, Check } from 'lucide-vue-next'
import { Marked } from 'marked'
import IconButton from '@/components/IconButton.vue'
import type { TechnicalNote } from '@/types/recipe'
import { copyToClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  notes: TechnicalNote[]
  sectionId: string
}>()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')
const isExpanded = ref(false)

async function copyPermalink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}

function toggle(): void {
  isExpanded.value = !isExpanded.value
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    substitution: 'substitution',
    hydration: 'hydration',
    technique: 'technique',
    equipment: 'equipment',
    general: 'general'
  }
  return labels[category] ?? category
}

const techMarked = new Marked({ gfm: false })

function renderText(text: string): string {
  return techMarked.parse(text) as string
}
</script>

<template>
  <div class="card">
    <div
      @click="toggle"
      class="w-full flex items-center justify-between scroll-mt-16 cursor-pointer select-text"
      role="button"
    >
      <div class="flex items-center gap-1">
        <h3 class="card-title">Technical Notes</h3>
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
      <div class="flex items-center gap-3">
        <span class="text-muted text-sm">{{ notes.length }} {{ notes.length === 1 ? 'note' : 'notes' }}</span>
        <span
          class="text-stone-400 transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
        >▼</span>
      </div>
    </div>

    <!-- Expanded content -->
    <div v-if="isExpanded" class="mt-4 space-y-4">
      <div
        v-for="(note, idx) in notes"
        :key="idx"
        class="pl-3 border-l-3 border-stone-200 py-1"
      >
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-semibold text-stone-700">{{ note.title }}</span>
          <span
            v-if="note.category"
            class="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-stone-200 text-stone-500"
          >{{ categoryLabel(note.category) }}</span>
        </div>
        <div class="tech-note-prose text-sm text-stone-600 leading-relaxed" v-html="renderText(note.text)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tech-note-prose :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
}

.tech-note-prose :deep(li) {
  margin-bottom: 0.375rem;
}

.tech-note-prose :deep(strong) {
  color: var(--color-stone-700);
  font-weight: 600;
}

.tech-note-prose :deep(p) {
  margin: 0 0 0.5rem;
}

.tech-note-prose :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
