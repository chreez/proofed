<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { Link2, Check, ChevronDown } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { Research, RecipeSource, Confidence } from '@/types/recipe'
import { copyToClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  research: Research
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

function confidenceColor(level: Confidence): string {
  switch (level) {
    case 'high': return 'bg-success text-white'
    case 'medium': return 'bg-warning text-ink'
    case 'low': return 'bg-stone-300 text-stone-600'
  }
}

function sourcesByType(sources: RecipeSource[]): Record<string, RecipeSource[]> {
  const grouped: Record<string, RecipeSource[]> = {}
  for (const s of sources) {
    const t = s.type ?? 'other'
    if (!grouped[t]) grouped[t] = []
    grouped[t].push(s)
  }
  return grouped
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    'original': 'Recipe Blogs',
    'adapted': 'Adapted Sources',
    'inspired': 'Inspired By',
    'other': 'Other Sources'
  }
  return labels[type] ?? type
}
</script>

<template>
  <section>
    <div class="flex items-center gap-1 mb-4 pb-2 border-b-2 border-stone-200">
      <h3 class="card-title">Research</h3>
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

    <!-- Collapsed summary — always visible -->
    <button
      @click="toggle"
      class="voice-agent w-full flex items-center justify-between text-left transition-colors hover:bg-stone-100 cursor-pointer"
    >
      <div>
        <span class="text-sm text-stone-700">Researched from </span>
        <span class="font-mono font-semibold text-ink">{{ research.sourceCount }}</span>
        <span class="text-sm text-stone-700"> sources</span>
        <span class="voice-agent-tag ml-2">researched</span>
        <span class="text-xs text-stone-400 ml-2">{{ research.date }}</span>
      </div>
      <ChevronDown
        class="w-4 h-4 text-stone-400 transition-transform duration-200"
        :class="{ 'rotate-180': isExpanded }"
      />
    </button>

    <!-- Expanded content -->
    <div v-if="isExpanded" class="border-2 border-t-0 border-stone-200 px-4 py-4">

      <!-- Strategy -->
      <div class="mb-6">
        <h4 class="voice-agent-label mb-2">Strategy</h4>
        <p class="text-sm text-stone-600 leading-relaxed">{{ research.strategy }}</p>
      </div>

      <!-- Techniques -->
      <div v-if="research.techniques.length" class="mb-6">
        <h4 class="voice-agent-label mb-3">Technique Findings</h4>
        <div class="space-y-3">
          <div
            v-for="tech in research.techniques"
            :key="tech.name"
            class="pl-3 border-l-3 border-stone-200 py-1"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-semibold text-stone-700">{{ tech.name }}</span>
              <span
                v-if="tech.confidence"
                class="text-[10px] font-mono uppercase px-1.5 py-0.5"
                :class="confidenceColor(tech.confidence)"
              >{{ tech.confidence }}</span>
            </div>
            <p class="text-xs text-stone-600 leading-relaxed">{{ tech.rationale }}</p>
            <p class="text-xs text-stone-400 mt-0.5">{{ tech.sourcedFrom }}</p>
          </div>
        </div>
      </div>

      <!-- Sources grouped by type -->
      <div>
        <h4 class="voice-agent-label mb-3">Sources ({{ research.sources.length }})</h4>
        <div
          v-for="(sources, type) in sourcesByType(research.sources)"
          :key="type"
          class="mb-4"
        >
          <h5 class="text-xs font-semibold text-stone-500 uppercase mb-2">{{ typeLabel(type) }}</h5>
          <ul class="space-y-1">
            <li
              v-for="source in sources"
              :key="source.name"
              class="text-xs text-stone-600 flex items-baseline gap-1"
            >
              <span class="text-stone-300 flex-shrink-0">&bull;</span>
              <a
                v-if="source.url"
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-accent hover:underline"
              >{{ source.name }}</a>
              <span v-else>{{ source.name }}</span>
              <span v-if="source.author" class="text-stone-400">
                &mdash; {{ source.author }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
