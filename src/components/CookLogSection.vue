<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { Link2, Check, ArrowRight } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { CookLogEntry, CookLogPhoto } from '@/types/recipe'
import { sortedCookLog } from '@/composables/useCookLog'
import { copyToClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  cookLog: CookLogEntry[]
  sectionId: string
  recipeId?: string
}>()

const router = useRouter()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

// Summary expand state: tracks which summaries show full text
const expandedSummaries = ref<Record<number, boolean>>({})

function isSummaryExpanded(index: number): boolean {
  return !!expandedSummaries.value[index]
}

function toggleSummary(event: MouseEvent, index: number): void {
  event.stopPropagation()
  expandedSummaries.value[index] = !expandedSummaries.value[index]
}

async function copyPermalink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}

function heroPhoto(photos: CookLogPhoto[]): CookLogPhoto {
  return photos[photos.length - 1]
}

function formatDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dateStr} — ${weekday}`
}

function formatDate(entry: { date: string }): string {
  return formatDateStr(entry.date)
}

function statusLabel(entry: { status?: string; start_date?: string }): string {
  if (entry.start_date) {
    const [, m, d] = entry.start_date.split('-').map(Number)
    const date = new Date(2026, m - 1, d)
    return `In Progress (since ${date.toLocaleDateString('en-US', { month: 'short' })} ${d})`
  }
  return 'In Progress'
}

function navigateToBake(event: MouseEvent, date: string): void {
  event.stopPropagation()
  if (props.recipeId) {
    router.push(`/recipe/${props.recipeId}/bake/${date}`)
  }
}

function entryId(date: string): string {
  return `bake-${date}`
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
      v-for="(entry, index) in sortedCookLog(cookLog)"
      :key="index"
      :id="entryId(entry.date)"
      class="mb-4 scroll-mt-16"
    >
      <div class="border-2 border-stone-200 p-3 flex gap-3">
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
            <span class="font-semibold text-sm text-stone-700">{{ formatDate(entry) }}</span>
            <span class="text-xs bg-stone-200 px-2 py-0.5">{{ entry.version }}</span>
            <span v-if="entry.status === 'in_progress'" class="text-xs font-mono px-2 py-0.5 bg-warning-tint text-warning border border-warning">
              {{ statusLabel(entry) }}
            </span>
          </div>
          <p
            v-if="entry.summary"
            class="text-sm text-stone-500 mt-1.5 cursor-pointer"
            :class="{ 'line-clamp-2': !isSummaryExpanded(index) }"
            @click="toggleSummary($event, index)"
          >{{ entry.summary }}</p>
          <div class="flex items-center gap-3 text-xs text-stone-400 mt-2">
            <span>{{ entry.notes.length }} notes</span>
            <span v-if="entry.photos?.length">{{ entry.photos.length }} photos</span>
            <span v-if="entry.next_time?.length">{{ entry.next_time.length }} next-time</span>
            <span v-if="entry.cost" class="font-mono">${{ entry.cost.total.toFixed(2) }} total · ${{ entry.cost.perServing.toFixed(2) }}/serving</span>
            <span
              v-if="recipeId"
              class="ml-auto flex items-center gap-1 text-stone-400 hover:text-accent transition-colors cursor-pointer"
              @click="navigateToBake($event, entry.date)"
            >
              View bake <ArrowRight class="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
