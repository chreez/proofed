<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipe } from '@/composables/useRecipe'
import { useProgress } from '@/composables/useProgress'
import { useTechniques } from '@/composables/useTechniques'
import type { RecipeState } from '@/types/recipe'
import RecipeMeta from '@/components/RecipeMeta.vue'
import StageCard from '@/components/StageCard.vue'
import RecipeIndex from '@/components/RecipeIndex.vue'
import VariantTabs from '@/components/VariantTabs.vue'
import CookLogSection from '@/components/CookLogSection.vue'
import VersionTimeline from '@/components/VersionTimeline.vue'
import TocPill from '@/components/TocPill.vue'

const route = useRoute()
const router = useRouter()

const { loadTechniques } = useTechniques()
const { currentRecipe, currentRecipeId, currentFamily, loading, loadManifest, loadRecipe } = useRecipe()

// Derive showIndex from route
const showIndex = computed(() => route.name === 'index' || !route.params.recipeId)

function goToIndex(): void {
  router.push('/')
}

function handleRecipeSelect(recipeId: string): void {
  router.push(`/recipe/${recipeId}`)
}

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

// Track if manifest is loaded
const manifestLoaded = ref(false)

// Load recipe when route changes (after manifest is ready)
watch(
  [() => route.params.recipeId, manifestLoaded],
  async ([recipeId, isLoaded]) => {
    if (recipeId && typeof recipeId === 'string' && isLoaded) {
      await loadRecipe(recipeId)
    }
  }
)

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
  manifestLoaded.value = true
})

function getStatesForStage(stateIds: string[]) {
  if (!currentRecipe.value) return []
  return stateIds
    .map(id => currentRecipe.value!.states.find(s => s.id === id))
    .filter((s): s is RecipeState => s !== undefined)
}

// Aggregate step notes from all cook_log entries
const aggregatedStepNotes = computed(() => {
  if (!currentRecipe.value?.cook_log) return {}
  const notes: Record<string, { note: string; date: string }> = {}
  // Process entries in reverse so latest note wins
  const entries = [...currentRecipe.value.cook_log].reverse()
  for (const entry of entries) {
    if (entry.step_notes) {
      for (const [stateId, note] of Object.entries(entry.step_notes)) {
        notes[stateId] = { note, date: entry.date }
      }
    }
  }
  return notes
})

// TOC: Stage data for navigation
const tocStages = computed(() => {
  if (!currentRecipe.value) return []
  return currentRecipe.value.stages.map(s => ({ id: s.id, title: s.title }))
})

// TOC: Track which stages are complete (all states checked)
const completedStageIds = computed(() => {
  if (!currentRecipe.value || !progress.value) return []
  return currentRecipe.value.stages
    .filter(stage => {
      const stateIds = stage.states
      return stateIds.length > 0 && stateIds.every(id => progress.value!.isStateChecked(id))
    })
    .map(s => s.id)
})

// TOC: Current stage (first non-collapsed)
const currentStageId = computed(() => {
  if (!currentRecipe.value || !progress.value) return null
  const uncollapsed = currentRecipe.value.stages.find(s => !progress.value!.isStageCollapsed(s.id))
  return uncollapsed?.id ?? currentRecipe.value.stages[0]?.id ?? null
})

// TOC: Navigate to section
function handleTocNavigate(target: string) {
  let elementId = ''
  if (target === 'cook-log') {
    elementId = 'cook-log-section'
  } else if (target === 'change-log') {
    elementId = 'version-history-section'
  } else {
    elementId = `stage-${target}`
  }

  nextTick(() => {
    const el = document.getElementById(elementId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
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
          class="font-mono font-medium tracking-tight text-ink transition-all duration-200 ease-out cursor-pointer"
          :class="isScrolled ? 'text-lg' : 'text-2xl'"
          @click="goToIndex"
        >proofed<span class="text-accent">.</span></h1>
        <!-- TOC Pill in header when scrolled -->
        <TocPill
          v-if="!showIndex && currentRecipe && progress && isScrolled"
          :stages="tocStages"
          :has-cook-log="!!currentRecipe.cook_log?.length"
          :has-change-log="!!currentRecipe.change_log?.length"
          :current-stage-id="currentStageId"
          :completed-stage-ids="completedStageIds"
          :in-header="true"
          @navigate="handleTocNavigate"
        />
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6">
      <div v-if="loading" class="text-center py-12 text-muted">
        Loading...
      </div>

      <template v-else-if="showIndex">
        <RecipeIndex @select="handleRecipeSelect" />
      </template>

      <template v-else-if="currentRecipe && progress">
        <RecipeMeta :recipe="currentRecipe" class="mb-6" />

        <VariantTabs
          v-if="currentFamily"
          :family-id="currentFamily.id"
          @select="handleRecipeSelect"
        />

        <!-- TOC Pill in content when not scrolled -->
        <TocPill
          v-if="!isScrolled"
          :stages="tocStages"
          :has-cook-log="!!currentRecipe.cook_log?.length"
          :has-change-log="!!currentRecipe.change_log?.length"
          :current-stage-id="currentStageId"
          :completed-stage-ids="completedStageIds"
          @navigate="handleTocNavigate"
        />

        <div class="space-y-4">
          <StageCard
            v-for="stage in currentRecipe.stages"
            :id="`stage-${stage.id}`"
            :key="stage.id"
            :stage="stage"
            :states="getStatesForStage(stage.states)"
            :config="currentRecipe.config"
            :progress="progress"
            :step-notes="aggregatedStepNotes"
          />
        </div>

        <CookLogSection
          v-if="currentRecipe.cook_log?.length"
          id="cook-log-section"
          :cook-log="currentRecipe.cook_log"
          class="mt-8"
        />

        <VersionTimeline
          v-if="currentRecipe.change_log?.length"
          id="version-history-section"
          :change-log="currentRecipe.change_log"
          :current-version="currentRecipe.version ?? 'v1.0.0'"
          class="mt-8"
        />
      </template>

      <div v-else class="text-center py-12 text-muted">
        No recipe loaded
      </div>
    </main>
  </div>
</template>
