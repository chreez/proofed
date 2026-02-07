<script setup lang="ts">
import { marked } from 'marked'
import type { CookLogEntry } from '@/types/recipe'

defineProps<{
  cookLog: CookLogEntry[]
}>()

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
    md += entry.next_time.map(n => `- ${n}`).join('\n')
  }

  return marked.parse(md) as string
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

</script>

<template>
  <section>
    <h3 class="card-title mb-4 pb-2 border-b-2 border-stone-200">
      Cook Log
    </h3>

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
</style>
