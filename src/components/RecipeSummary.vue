<script setup lang="ts">
import type { Recipe, RecipeSummary } from '@/types/recipe'

const props = defineProps<{
  summary?: RecipeSummary
  recipe: Recipe
}>()

function generateAutoSummary(): string {
  const { meta } = props.recipe
  const parts: string[] = []

  // Recipe name
  parts.push(meta.name)

  // Source attribution
  if (meta.source) {
    const sourceType = meta.source.type ?? 'adapted'
    const author = meta.source.author
    const sourceName = meta.source.name
    if (author && author !== sourceName) {
      parts.push(`${sourceType} from ${author} / ${sourceName}`)
    } else {
      parts.push(`${sourceType} from ${sourceName}`)
    }
  }

  let line = parts.join(' \u2014 ')

  // Yields and time
  const details: string[] = []
  if (meta.yields) details.push(`Makes ${meta.yields}`)
  if (meta.total_time) details.push(`in ${meta.total_time}`)
  if (details.length) {
    line += '. ' + details.join(' ')
  }

  // Description
  if (meta.description) {
    line += '. ' + meta.description
  }

  return line
}

const displayText = props.summary?.text ?? generateAutoSummary()
const isDictated = props.summary?.mode === 'dictated'
</script>

<template>
  <div v-if="isDictated" class="voice-human">
    <div class="voice-human-label">// About this recipe</div>
    <p class="text-body text-sm leading-relaxed">{{ displayText }}</p>
  </div>
  <div v-else class="voice-agent">
    <div class="voice-agent-label mb-2">// Summary</div>
    <p class="text-body text-sm leading-relaxed">{{ displayText }}</p>
  </div>
</template>
