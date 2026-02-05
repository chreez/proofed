<script setup lang="ts">
import { ref } from 'vue'
import type { Recipe } from '@/types/recipe'

const props = defineProps<{
  recipe: Recipe
}>()

const copied = ref(false)

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
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="card">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl text-heading mb-2">{{ recipe.meta.name }}</h2>
        <div class="flex flex-wrap gap-4 text-muted">
          <span v-if="recipe.meta.source">{{ recipe.meta.source }}</span>
          <span>{{ recipe.meta.yields }}</span>
          <span>{{ recipe.meta.total_time }}</span>
        </div>
      </div>
      <button
        @click="copyRecipe"
        class="btn-secondary text-sm shrink-0"
      >
        {{ copied ? 'Copied!' : 'Copy Recipe' }}
      </button>
    </div>
  </div>
</template>
