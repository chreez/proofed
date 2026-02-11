<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipe } from '@/composables/useRecipe'
import { useProgress } from '@/composables/useProgress'
import { useTechniques } from '@/composables/useTechniques'
import { useRecipeMeta } from '@/composables/useRecipeMeta'
import type { RecipeState, CookLogPhoto } from '@/types/recipe'
import RecipeMeta from '@/components/RecipeMeta.vue'
import StageCard from '@/components/StageCard.vue'
import RecipeIndex from '@/components/RecipeIndex.vue'
import CookLogSection from '@/components/CookLogSection.vue'
import VersionTimeline from '@/components/VersionTimeline.vue'
import TocSidebar from '@/components/TocSidebar.vue'
import NutritionSection from '@/components/NutritionSection.vue'
import SourceSection from '@/components/SourceSection.vue'
import ResearchSection from '@/components/ResearchSection.vue'
import RecipeSummary from '@/components/RecipeSummary.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import AboutPage from '@/components/AboutPage.vue'
import PhotoLightbox from '@/components/PhotoLightbox.vue'
import PhotoReview from '@/components/PhotoReview.vue'

const route = useRoute()
const router = useRouter()

const { loadTechniques } = useTechniques()
const { currentRecipe, currentRecipeId, loading, loadManifest, loadRecipe } = useRecipe()

useRecipeMeta(
  () => currentRecipe.value,
  () => currentRecipeId.value
)

// Derive page state from route
const showIndex = computed(() => route.name === 'index')
const showAbout = computed(() => route.name === 'about')
const showPhotoReview = computed(() => route.name === 'photo-review')

function goToIndex(): void {
  router.push('/')
}

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
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

// Hero banner: latest bake photo
const latestHeroPhoto = computed(() => {
  const entry = currentRecipe.value?.cook_log?.[0]
  if (!entry?.photos?.length) return null
  return {
    photo: entry.photos[entry.photos.length - 1],
    date: entry.date
  }
})

// Hero lightbox state
const heroLightboxOpen = ref(false)
const heroLightboxPhotos = ref<CookLogPhoto[]>([])

function openHeroLightbox(): void {
  const entry = currentRecipe.value?.cook_log?.[0]
  if (!entry?.photos?.length) return
  const hero = entry.photos[entry.photos.length - 1]
  const rest = entry.photos.slice(0, -1)
  heroLightboxPhotos.value = [hero, ...rest]
  heroLightboxOpen.value = true
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

// Format version as v{major}.{minor} (drop patch) for scrolled header
function formatVersionShort(version: string): string {
  const match = version.match(/^v?(\d+)\.(\d+)/)
  if (!match) return version
  return `v${match[1]}.${match[2]}`
}

// Scroll to hash target on page load (supports permalink URLs)
watch(currentRecipe, (recipe) => {
  if (!recipe) return
  const hash = window.location.hash?.slice(1)
  if (!hash) return

  nextTick(() => {
    // If it's a stage, expand it if collapsed
    if (hash.startsWith('stage-') && progress.value) {
      const stageId = hash.replace('stage-', '')
      if (progress.value.isStageCollapsed(stageId)) {
        progress.value.toggleStageCollapse(stageId)
      }
    }

    nextTick(() => {
      const el = document.getElementById(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })
}, { once: true })

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

// TOC: Active section tracking — set on click, updated by scroll
const activeSection = ref<string | null>(null)
let tocObserver: IntersectionObserver | null = null

// Current stage ID: user selection > scroll-observed > first non-collapsed
const currentStageId = computed(() => {
  if (activeSection.value) return activeSection.value
  if (!currentRecipe.value || !progress.value) return null
  const uncollapsed = currentRecipe.value.stages.find(s => !progress.value!.isStageCollapsed(s.id))
  return uncollapsed?.id ?? currentRecipe.value.stages[0]?.id ?? null
})

// Set up IntersectionObserver to track visible sections
function setupTocObserver() {
  teardownTocObserver()

  tocObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id
          if (id === 'nutrition-section') {
            activeSection.value = 'nutrition'
          } else if (id === 'cook-log-section') {
            activeSection.value = 'cook-log'
          } else if (id === 'version-history-section') {
            activeSection.value = 'change-log'
          } else if (id === 'source-section') {
            activeSection.value = 'source'
          } else if (id === 'research-section') {
            activeSection.value = 'research'
          } else if (id.startsWith('stage-')) {
            activeSection.value = id.replace('stage-', '')
          }
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' }
  )

  // Observe stage elements
  nextTick(() => {
    currentRecipe.value?.stages.forEach(stage => {
      const el = document.getElementById(`stage-${stage.id}`)
      if (el) tocObserver?.observe(el)
    })
    const nutritionEl = document.getElementById('nutrition-section')
    if (nutritionEl) tocObserver?.observe(nutritionEl)
    const cookLog = document.getElementById('cook-log-section')
    if (cookLog) tocObserver?.observe(cookLog)
    const versionHistory = document.getElementById('version-history-section')
    if (versionHistory) tocObserver?.observe(versionHistory)
    const sourceSection = document.getElementById('source-section')
    if (sourceSection) tocObserver?.observe(sourceSection)
    const researchSection = document.getElementById('research-section')
    if (researchSection) tocObserver?.observe(researchSection)
  })
}

function teardownTocObserver() {
  if (tocObserver) {
    tocObserver.disconnect()
    tocObserver = null
  }
}

// Re-setup observer when recipe changes
watch(currentRecipe, (recipe) => {
  if (recipe) {
    activeSection.value = null
    setupTocObserver()
  } else {
    teardownTocObserver()
  }
})

onUnmounted(() => {
  teardownTocObserver()
})

// TOC: Navigate to section, auto-expanding collapsed stages
function handleTocNavigate(target: string) {
  // Immediately set active section on click
  activeSection.value = target

  let elementId = ''
  if (target === 'nutrition') {
    elementId = 'nutrition-section'
  } else if (target === 'cook-log') {
    elementId = 'cook-log-section'
  } else if (target === 'change-log') {
    elementId = 'version-history-section'
  } else if (target === 'source') {
    elementId = 'source-section'
  } else if (target === 'research') {
    elementId = 'research-section'
  } else {
    // Expand the stage if it's collapsed
    if (progress.value?.isStageCollapsed(target)) {
      progress.value.toggleStageCollapse(target)
    }
    elementId = `stage-header-${target}`
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
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <h1
          class="font-mono font-medium tracking-tight text-ink transition-all duration-200 ease-out cursor-pointer whitespace-nowrap"
          :class="isScrolled ? 'text-lg' : 'text-2xl'"
          @click="goToIndex"
        ><span class="brand-text">proofed</span><span class="brand-dot text-accent">.</span></h1>
        <Transition name="title-poof">
          <div
            v-if="isScrolled && currentRecipe && !showIndex && !showAbout"
            class="flex items-center gap-3 ml-4 min-w-0"
          >
            <span class="text-sm text-muted truncate cursor-pointer" @click="scrollToTop">{{ currentRecipe.meta.name }}</span>
            <span v-if="currentRecipe.version" class="text-sm text-muted font-mono flex-shrink-0 cursor-pointer" @click="scrollToTop">{{ formatVersionShort(currentRecipe.version) }}</span>
          </div>
        </Transition>
      </div>
    </header>

    <main :class="[showIndex ? 'pb-6' : 'py-6', !showIndex && currentRecipe ? 'max-w-4xl mx-auto px-4' : 'max-w-3xl mx-auto px-4']">
      <div v-if="loading" class="text-center py-12 text-muted">
        Loading...
      </div>

      <template v-else-if="showAbout">
        <AboutPage />
      </template>

      <template v-else-if="showPhotoReview">
        <PhotoReview />
      </template>

      <template v-else-if="showIndex">
        <RecipeIndex @select="handleRecipeSelect" />
      </template>

      <template v-else-if="currentRecipe && progress">
        <div class="md:flex md:gap-6">
          <div class="flex-1 min-w-0">
            <!-- Hero banner: latest bake photo -->
            <div
              v-if="latestHeroPhoto"
              data-testid="hero-banner"
              class="card !p-0 overflow-hidden mb-6 cursor-pointer"
              @click="openHeroLightbox"
            >
              <div class="relative w-full h-48 sm:h-64 overflow-hidden">
                <img
                  :src="latestHeroPhoto.photo.src"
                  :alt="latestHeroPhoto.photo.alt"
                  class="w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div class="absolute bottom-3 left-4 text-white">
                  <span class="font-mono text-xs opacity-80">latest bake</span>
                  <span class="font-mono text-xs opacity-60 ml-2">{{ latestHeroPhoto.date }}</span>
                </div>
              </div>
            </div>

            <RecipeMeta
              :recipe="currentRecipe"
              :has-progress="progress.hasProgress.value"
              class="mb-6"
              @reset="progress.resetProgress()"
            />

            <!-- RecipeSummary hidden until user provides dictated content -->
            <RecipeSummary
              v-if="currentRecipe.summary?.mode === 'dictated'"
              :summary="currentRecipe.summary"
              :recipe="currentRecipe"
              class="mb-6"
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
                :section-id="`stage-${stage.id}`"
              />
            </div>

            <NutritionSection
              id="nutrition-section"
              :nutrition="currentRecipe.nutrition"
              section-id="nutrition-section"
              class="mt-8 scroll-mt-16"
            />

            <CookLogSection
              v-if="currentRecipe.cook_log?.length"
              id="cook-log-section"
              :cook-log="currentRecipe.cook_log"
              section-id="cook-log-section"
              class="mt-8 scroll-mt-16"
            />

            <VersionTimeline
              v-if="currentRecipe.change_log?.length"
              id="version-history-section"
              :change-log="currentRecipe.change_log"
              :current-version="currentRecipe.version ?? 'v1.0.0'"
              section-id="version-history-section"
              class="mt-8 scroll-mt-16"
            />

            <SourceSection
              v-if="currentRecipe.meta.source"
              id="source-section"
              :source="currentRecipe.meta.source"
              section-id="source-section"
              class="mt-8 scroll-mt-16"
            />

            <ResearchSection
              v-if="currentRecipe.research"
              id="research-section"
              :research="currentRecipe.research"
              section-id="research-section"
              class="mt-8 scroll-mt-16"
            />
          </div>

          <TocSidebar
            :stages="tocStages"
            :has-nutrition="!!currentRecipe.nutrition"
            :has-cook-log="!!currentRecipe.cook_log?.length"
            :has-change-log="!!currentRecipe.change_log?.length"
            :has-source="!!currentRecipe.meta.source"
            :has-research="!!currentRecipe.research"
            :current-stage-id="currentStageId"
            :completed-stage-ids="completedStageIds"
            @navigate="handleTocNavigate"
          />
        </div>

        <PhotoLightbox
          :photos="heroLightboxPhotos"
          :initial-index="0"
          :open="heroLightboxOpen"
          @close="heroLightboxOpen = false"
        />
      </template>

      <div v-else class="text-center py-12 text-muted">
        No recipe loaded
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
/* "Poof" animation: light fade + scale-up on enter, instant on leave */
.title-poof-enter-active {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
.title-poof-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.title-poof-enter-to {
  opacity: 1;
  transform: scale(1);
}
/* No leave transition — title disappears instantly on scroll-up */
.title-poof-leave-active {
  transition: none;
}
.title-poof-leave-to {
  opacity: 0;
}

/* Brand entry animation: letter-spacing collapse + dot pop */
@keyframes brand-text-in {
  from {
    opacity: 0;
    letter-spacing: 0.15em;
  }
  to {
    opacity: 1;
    letter-spacing: 0;
  }
}

@keyframes brand-dot-in {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  70% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.brand-text {
  display: inline-block;
  animation: brand-text-in 350ms ease-out both;
}

.brand-dot {
  display: inline-block;
  animation: brand-dot-in 200ms ease-out 250ms both;
}

@media (prefers-reduced-motion: reduce) {
  .brand-text,
  .brand-dot {
    animation: none;
  }
}
</style>
