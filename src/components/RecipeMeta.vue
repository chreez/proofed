<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { ClipboardList, Check, RotateCcw } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { Recipe } from '@/types/recipe'

const props = defineProps<{
  recipe: Recipe
  hasProgress?: boolean
}>()

const emit = defineEmits<{
  reset: []
}>()

const copyBtn = useTemplateRef<InstanceType<typeof IconButton>>('copyBtn')
const resetBtn = useTemplateRef<InstanceType<typeof IconButton>>('resetBtn')

// Format version as v{major}.{minor} (drop patch)
function formatVersion(version: string): string {
  const match = version.match(/^v?(\d+)\.(\d+)/)
  if (!match) return version
  return `v${match[1]}.${match[2]}`
}

function formatRecipeForPaprika(): string {
  const { meta, stages, states } = props.recipe
  const lines: string[] = []

  // Recipe name
  lines.push(meta.name)
  lines.push('')

  // Collect all ingredients from all stages
  const allIngredients: string[] = []
  for (const stage of stages) {
    if (stage.gather?.ingredients) {
      for (const ing of stage.gather.ingredients) {
        allIngredients.push(`${ing.name} — ${ing.total}${ing.unit}`)
      }
    }
  }

  if (allIngredients.length) {
    lines.push('Ingredients:')
    for (const ing of allIngredients) {
      lines.push(`- ${ing}`)
    }
    lines.push('')
  }

  // Directions from all states
  lines.push('Directions:')
  let stepNum = 1
  for (const stage of stages) {
    for (const stateId of stage.states) {
      const state = states.find(s => s.id === stateId)
      if (state) {
        lines.push(`${stepNum}. ${state.direction}`)
        stepNum++
      }
    }
  }

  return lines.join('\n')
}

async function copyRecipe(): Promise<void> {
  const text = formatRecipeForPaprika()
  await navigator.clipboard.writeText(text)
  copyBtn.value?.flashCopied()
}

function handleReset(): void {
  resetBtn.value?.flashSpin()
  emit('reset')
}
</script>

<template>
  <div class="card">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl text-heading">{{ recipe.meta.name }}</h2>
        <div v-if="recipe.version" class="font-mono text-sm text-stone-400 mb-2">{{ formatVersion(recipe.version) }}</div>
        <div class="flex flex-wrap gap-4 text-muted">
          <span v-if="recipe.meta.source">{{ recipe.meta.source.name }}</span>
          <span>{{ recipe.meta.yields }}</span>
          <span>{{ recipe.meta.total_time }}</span>
        </div>
      </div>
      <div class="flex gap-1 shrink-0">
        <IconButton
          v-if="hasProgress"
          ref="resetBtn"
          tooltip="Reset Bake"
          @click="handleReset"
        >
          <RotateCcw />
        </IconButton>
        <IconButton
          ref="copyBtn"
          tooltip="Copy Recipe"
          @click="copyRecipe"
        >
          <ClipboardList />
          <template #feedback>
            <Check />
          </template>
        </IconButton>
      </div>
    </div>
  </div>
</template>
