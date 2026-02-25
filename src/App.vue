<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipe } from '@/composables/useRecipe'
import { useProgress } from '@/composables/useProgress'
import { useScratchpad } from '@/composables/useScratchpad'
import { useTechniques } from '@/composables/useTechniques'
import { useRecipeMeta } from '@/composables/useRecipeMeta'
import { latestCookLogEntryWithPhotos } from '@/composables/useCookLog'
import { targetToHash, hashToTarget, targetToElementId, SECTION_TARGETS } from '@/composables/useTocHash'
import { copyToClipboard } from '@/composables/useClipboard'
import { QrCode } from 'lucide-vue-next'
import type { RecipeState, CookLogPhoto } from '@/types/recipe'
import RecipeMeta from '@/components/RecipeMeta.vue'
import ShareModal from '@/components/ShareModal.vue'
import IconButton from '@/components/IconButton.vue'
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
import DemoQrTest from '@/components/DemoQrTest.vue'
import DemoSharedMode from '@/components/DemoSharedMode.vue'
import DemoQrPrintTest from '@/components/DemoQrPrintTest.vue'
import DemoScratchpad from '@/components/DemoScratchpad.vue'
import DemoCostPicker from '@/components/DemoCostPicker.vue'
import DemoCostRender from '@/components/DemoCostRender.vue'
import DemoBakeLogPhotos from '@/components/DemoBakeLogPhotos.vue'
import DemoStats from '@/components/DemoStats.vue'
import BakeDetailView from '@/components/BakeDetailView.vue'
import BakeReviewPage from '@/components/BakeReviewPage.vue'
import BakeLogPage from '@/components/BakeLogPage.vue'
import GeneralNotesFab from '@/components/GeneralNotesFab.vue'

const route = useRoute()
const router = useRouter()

const { loadTechniques } = useTechniques()
const { currentRecipe, currentRecipeId, loading, loadManifest, loadRecipe } = useRecipe()

useRecipeMeta(
  () => currentRecipe.value,
  () => currentRecipeId.value,
  () => typeof route.params.date === 'string' ? route.params.date : undefined
)

// Derive page state from route
const showIndex = computed(() => route.name === 'index')
const showAbout = computed(() => route.name === 'about')
const showPhotoReview = computed(() => route.name === 'photo-review')
const showBakeDetail = computed(() => route.name === 'bake-detail')
const showBakeReview = computed(() => route.name === 'bake-review')
const showBakeLog = computed(() => route.name === 'bake-log')
const showStats = computed(() => route.name === 'stats-demo')
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

const scratchpad = shallowRef<ReturnType<typeof useScratchpad> | null>(null)

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

// Load progress and scratchpad when recipe ID changes
watch(currentRecipeId, (newId) => {
  if (newId && progress.value) {
    progress.value.load()
  }
  if (newId) {
    const sp = useScratchpad(newId)
    sp.load()
    scratchpad.value = sp
  } else {
    scratchpad.value = null
  }
})

// Register stages for auto-advance when recipe loads
watch(currentRecipe, (recipe) => {
  if (!recipe || !progress.value) return

  // Load progress state for this recipe
  progress.value.load()

  // Initialize scratchpad for this recipe
  if (currentRecipeId.value) {
    const sp = useScratchpad(currentRecipeId.value)
    sp.load()
    scratchpad.value = sp
  }

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

// Hero banner: latest bake photo (skips in-progress entries with no photos)
const latestHeroPhoto = computed(() => {
  const entry = latestCookLogEntryWithPhotos(currentRecipe.value?.cook_log)
  if (!entry?.photos?.length) return null
  return {
    photo: entry.photos[entry.photos.length - 1],
    date: entry.date
  }
})

// Share modal ref
const shareModalRef = ref<InstanceType<typeof ShareModal> | null>(null)

function openShareModal(): void {
  shareModalRef.value?.open()
}

// Scratchpad export handler
async function handleScratchpadExport(): Promise<void> {
  if (!scratchpad.value) return
  const json = scratchpad.value.exportJsonString()
  await copyToClipboard(json)
}

// Hero lightbox state
const heroLightboxOpen = ref(false)
const heroLightboxPhotos = ref<CookLogPhoto[]>([])

function openHeroLightbox(): void {
  const entry = latestCookLogEntryWithPhotos(currentRecipe.value?.cook_log)
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
  const target = hashToTarget(window.location.hash)
  if (!target) return
  activeSection.value = target
  scrollToTarget(target)
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
let isNavigating = false
let navTimeoutId: ReturnType<typeof setTimeout> | null = null

// Shared scroll logic for TOC clicks, back/forward, and initial hash
function scrollToTarget(target: string): void {
  isNavigating = true
  if (navTimeoutId) clearTimeout(navTimeoutId)

  // Expand collapsed stage if needed
  if (!(SECTION_TARGETS as readonly string[]).includes(target)) {
    if (progress.value?.isStageCollapsed(target)) {
      progress.value.toggleStageCollapse(target)
    }
  }

  const elementId = targetToElementId(target)
  nextTick(() => {
    const el = document.getElementById(elementId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    navTimeoutId = setTimeout(() => { isNavigating = false }, 800)
  })
}

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
      if (isNavigating) return
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
    // Preserve active section when URL hash targets a section (e.g., permalink load)
    if (!route.hash) {
      activeSection.value = null
    }
    setupTocObserver()
  } else {
    teardownTocObserver()
  }
})

onUnmounted(() => {
  teardownTocObserver()
})

// TOC: Navigate to section, update URL hash, auto-expand collapsed stages
function handleTocNavigate(target: string) {
  activeSection.value = target
  const hash = targetToHash(target)
  if (route.hash !== hash) {
    router.push({ hash }).catch(() => {})
  }
  scrollToTarget(target)
}

// Handle browser back/forward for hash navigation
watch(() => route.hash, (newHash) => {
  if (isNavigating) return
  if (!currentRecipe.value) return
  const target = hashToTarget(newHash)
  if (!target) return
  activeSection.value = target
  scrollToTarget(target)
})
</script>

<template>
  <div class="min-h-screen bg-stone-50 font-sans flex flex-col">
    <header
      class="bg-stone-200 px-6 sticky top-0 z-10 transition-all duration-200 ease-out"
      :class="[isScrolled ? 'py-2' : 'py-4', (showIndex || showBakeLog) ? '' : 'border-b-2 border-ink']"
    >
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex items-center min-w-0">
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
        <IconButton
          v-if="currentRecipe?.cook_log?.length && !showIndex && !showAbout && !showBakeDetail"
          tooltip="Share"
          tooltip-align="right"
          size="sm"
          data-testid="share-btn"
          @click="openShareModal"
        >
          <QrCode />
        </IconButton>
      </div>
    </header>

    <nav v-if="showIndex || showBakeLog || showStats" class="tab-bar">
      <div class="tab-bar-inner">
        <button
          class="tab-item"
          :class="{ 'tab-active': showIndex }"
          @click="router.push('/')"
        >Recipes</button>
        <button
          class="tab-item"
          :class="{ 'tab-active': showBakeLog }"
          @click="router.push('/bake-log')"
        >Bake Log</button>
        <button
          class="tab-item"
          :class="{ 'tab-active': showStats }"
          @click="router.push('/demo/stats')"
        >Dashboard</button>
      </div>
    </nav>

    <main :class="['flex-1', (showIndex || showBakeLog || showStats) ? 'pb-6' : 'py-6', !showIndex && !showBakeLog && !showStats && currentRecipe ? 'max-w-4xl mx-auto px-4' : 'max-w-3xl mx-auto px-4']">
      <div v-if="loading" class="text-center py-12 text-muted">
        Loading...
      </div>

      <template v-else-if="route.meta.demoPage">
        <DemoQrPrintTest v-if="route.name === 'qr-print-test-demo'" />
        <DemoQrTest v-else-if="route.name === 'qr-test-demo'" />
        <DemoScratchpad v-else-if="route.name === 'scratchpad-demo'" />
        <DemoCostPicker v-else-if="route.name === 'cost-picker-demo'" />
        <DemoCostRender v-else-if="route.name === 'cost-render-demo'" />
        <DemoBakeLogPhotos v-else-if="route.name === 'bake-log-photos-demo'" />
        <DemoSharedMode v-else />
      </template>

      <template v-else-if="showStats">
        <DemoStats />
      </template>

      <template v-else-if="showBakeDetail">
        <div class="page-settle">
          <BakeDetailView />
        </div>
      </template>

      <template v-else-if="showAbout">
        <div class="page-settle">
          <AboutPage />
        </div>
      </template>

      <template v-else-if="showPhotoReview">
        <PhotoReview />
      </template>

      <template v-else-if="showBakeReview">
        <BakeReviewPage />
      </template>

      <template v-else-if="showBakeLog || showIndex">
        <Transition name="tab-cross" mode="out-in">
          <BakeLogPage v-if="showBakeLog" key="bake-log" />
          <RecipeIndex v-else key="recipes" @select="handleRecipeSelect" />
        </Transition>
      </template>

      <template v-else-if="currentRecipe && progress">
        <div class="md:flex md:gap-6 page-settle-deep">
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
                :scratchpad="scratchpad ?? undefined"
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

        <GeneralNotesFab
          v-if="scratchpad"
          :general-note-count="scratchpad.generalNoteCount.value"
          :total-entry-count="scratchpad.totalEntryCount.value"
          :general-notes="scratchpad.generalNotes.value"
          :step-entries="scratchpad.allStepEntries.value"
          @add-general-note="(v: string) => scratchpad!.addGeneralNote(v)"
          @export-json="handleScratchpadExport"
          @clear-all="() => scratchpad!.clearAll()"
        />
      </template>

      <div v-else class="text-center py-12 text-muted">
        No recipe loaded
      </div>
    </main>

    <SiteFooter :sticky="showIndex || showBakeLog" />

    <ShareModal
      v-if="currentRecipe && currentRecipeId && currentRecipe.cook_log?.length"
      ref="shareModalRef"
      :recipe-name="currentRecipe.meta.name"
      :recipe-id="currentRecipeId"
      :cook-log="currentRecipe.cook_log"
    />
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

/* --- Tab bar navigation --- */
.tab-bar {
  background: var(--color-stone-200);
  border-bottom: 2px solid var(--color-ink);
  padding: 0 1.5rem;
}

.tab-bar-inner {
  max-width: 56rem;
  margin: 0 auto;
  display: flex;
  gap: 0;
}

.tab-item {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-stone-400);
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
  transition: color 150ms ease;
}

.tab-item:hover {
  color: var(--color-ink);
}

.tab-active {
  color: var(--color-ink);
}

.tab-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-accent);
}

/* --- Page transitions --- */

/* Tab crossfade: Recipes ↔ Bake Log */
.tab-cross-enter-active {
  transition: opacity 120ms ease-out;
}
.tab-cross-leave-active {
  transition: opacity 80ms ease-in;
}
.tab-cross-enter-from,
.tab-cross-leave-to {
  opacity: 0;
}

/* Content entrance: settles into place */
@keyframes page-settle {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-settle {
  animation: page-settle 200ms ease-out both;
}

/* Recipe detail: deeper entrance for depth feel */
@keyframes page-settle-deep {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-settle-deep {
  animation: page-settle-deep 250ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .page-settle,
  .page-settle-deep {
    animation: none;
  }
  .tab-cross-enter-active,
  .tab-cross-leave-active {
    transition: none;
  }
}
</style>
