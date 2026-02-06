<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRecipe } from '@/composables/useRecipe'
import { useProgress } from '@/composables/useProgress'
import { useTechniques } from '@/composables/useTechniques'
import type { RecipeState } from '@/types/recipe'
import RecipeMeta from '@/components/RecipeMeta.vue'
import StageCard from '@/components/StageCard.vue'

const { loadTechniques } = useTechniques()

const { currentRecipe, currentRecipeId, loading, recipeList, loadManifest, loadRecipe, restoreLastRecipe } = useRecipe()

const isScrolled = ref(false)

function handleScroll() {
  isScrolled.value = window.scrollY > 60
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const progress = computed(() => {
  if (!currentRecipeId.value) return null
  return useProgress(currentRecipeId.value)
})

// Load progress when recipe ID changes
watch(currentRecipeId, (newId) => {
  if (newId && progress.value) {
    progress.value.load()
  }
})

// Register stages for auto-advance when recipe loads
watch(currentRecipe, (recipe) => {
  if (!recipe || !progress.value) return

  // Load progress state for this recipe
  progress.value.load()

  // Set stage order
  progress.value.setStageOrder(recipe.stages.map(s => s.id))

  // Register each stage with its item and state IDs
  recipe.stages.forEach(stage => {
    const itemIds: string[] = []

    if (stage.gather) {
      stage.gather.vessels?.forEach(v => itemIds.push(`vessel-${v}`))
      stage.gather.equipment?.forEach(e => itemIds.push(`equip-${e}`))
      stage.gather.ingredients?.forEach(i => itemIds.push(`ing-${i.id}`))
    }

    progress.value!.registerStage(stage.id, itemIds, stage.states)
  })
}, { immediate: true })

onMounted(async () => {
  await loadTechniques()
  await loadManifest()
  await restoreLastRecipe()
})

function getStatesForStage(stateIds: string[]) {
  if (!currentRecipe.value) return []
  return stateIds
    .map(id => currentRecipe.value!.states.find(s => s.id === id))
    .filter((s): s is RecipeState => s !== undefined)
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 font-sans">
    <header
      class="bg-stone-200 border-b-2 border-ink px-6 sticky top-0 z-10 transition-all duration-200 ease-out"
      :class="isScrolled ? 'py-2' : 'py-4'"
    >
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <h1
          class="font-mono font-medium tracking-tight text-ink transition-all duration-200 ease-out"
          :class="isScrolled ? 'text-lg' : 'text-2xl'"
        >proofed<span class="text-accent">.</span></h1>
        <div
          class="transition-all duration-200 ease-out overflow-hidden"
          :class="isScrolled ? 'opacity-0 max-w-0' : 'opacity-100 max-w-xs'"
        >
          <select
            v-if="recipeList.length > 1"
            :value="currentRecipeId"
            @change="loadRecipe(($event.target as HTMLSelectElement).value)"
            class="text-sm bg-white border-2 border-ink px-2 py-1 text-ink font-sans whitespace-nowrap"
          >
            <option v-for="r in recipeList" :key="r.id" :value="r.id">
              {{ r.name }}
            </option>
          </select>
          <span v-else-if="currentRecipe" class="text-muted whitespace-nowrap">{{ currentRecipe.meta.yields }}</span>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6">
      <div v-if="loading" class="text-center py-12 text-muted">
        Loading recipe...
      </div>

      <template v-else-if="currentRecipe && progress">
        <RecipeMeta :recipe="currentRecipe" class="mb-6" />

        <div class="space-y-4">
          <StageCard
            v-for="stage in currentRecipe.stages"
            :key="stage.id"
            :stage="stage"
            :states="getStatesForStage(stage.states)"
            :config="currentRecipe.config"
            :progress="progress"
          />
        </div>
      </template>

      <div v-else class="text-center py-12 text-muted">
        No recipe loaded
      </div>
    </main>
  </div>
</template>
