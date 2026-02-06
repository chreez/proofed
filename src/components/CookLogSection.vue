<script setup lang="ts">
import { marked } from 'marked'
import type { CookLogEntry } from '@/types/recipe'

defineProps<{
  cookLog: CookLogEntry[]
}>()

// Render markdown inline (no <p> wrapper for single items)
function renderMarkdown(text: string): string {
  return marked.parseInline(text) as string
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function stepNotesCount(entry: CookLogEntry): number {
  if (!entry.step_notes) return 0
  return Object.keys(entry.step_notes).length
}
</script>

<template>
  <section>
    <h3 class="font-semibold text-lg mb-4 pb-2 border-b border-stone-200">
      Cook Log
    </h3>

    <div
      v-for="(entry, index) in cookLog"
      :key="index"
      class="p-4 bg-amber-50/30 border-l-3 border-amber-400 mb-4"
    >
      <!-- Header: date + version badge -->
      <div class="flex items-center gap-3 mb-3">
        <span class="font-semibold text-stone-700">
          {{ formatDate(entry.date) }}
        </span>
        <span class="text-xs bg-stone-200 px-2 py-0.5 rounded">
          {{ entry.version }}
        </span>
      </div>

      <!-- Notes section -->
      <ul class="cook-log-list">
        <li
          v-for="(note, noteIndex) in entry.notes"
          :key="noteIndex"
          v-html="renderMarkdown(note)"
        />
      </ul>

      <!-- Next time section -->
      <div
        v-if="entry.next_time && entry.next_time.length"
        class="mt-3 pt-3 border-t border-dashed border-stone-300"
      >
        <div class="text-xs uppercase font-semibold text-accent mb-2">
          Next Time
        </div>
        <ul class="cook-log-list">
          <li
            v-for="(item, itemIndex) in entry.next_time"
            :key="itemIndex"
            v-html="renderMarkdown(item)"
          />
        </ul>
      </div>

      <!-- Footer: step notes count -->
      <div v-if="stepNotesCount(entry) > 0" class="mt-3">
        <a href="#" class="text-xs text-accent hover:underline">
          {{ stepNotesCount(entry) }} step note{{ stepNotesCount(entry) > 1 ? 's' : '' }}
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cook-log-list {
  font-size: 0.875rem;
  color: #57534e;
  list-style: disc;
  list-style-position: inside;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.cook-log-list :deep(strong) {
  color: #44403c;
  font-weight: 600;
}

.cook-log-list :deep(em) {
  color: #78716c;
}

.cook-log-list :deep(code) {
  background: #f5f5f4;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 0.8125rem;
  font-family: ui-monospace, monospace;
}
</style>
