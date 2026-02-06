<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  stages: { id: string; title: string }[]
  hasCookLog: boolean
  hasChangeLog: boolean
  currentStageId: string | null
  completedStageIds: string[]
  stageRefs?: Record<string, HTMLElement>
}>()

const emit = defineEmits<{
  navigate: [target: string]
}>()

// Mobile bottom sheet state
const isSheetOpen = ref(false)

// Track current section via Intersection Observer
const observedCurrentId = ref<string | null>(null)
let observer: IntersectionObserver | null = null

// Use observed ID if available, otherwise fall back to prop
const activeId = computed(() => observedCurrentId.value ?? props.currentStageId)

function isCompleted(stageId: string): boolean {
  return props.completedStageIds.includes(stageId)
}

function handleNavigate(target: string): void {
  emit('navigate', target)
  isSheetOpen.value = false
}

function openSheet(): void {
  isSheetOpen.value = true
}

function closeSheet(): void {
  isSheetOpen.value = false
}

// Intersection Observer setup
function setupObserver(): void {
  if (!props.stageRefs) return

  observer = new IntersectionObserver(
    (entries) => {
      // Find the entry that is most visible
      const visibleEntries = entries.filter(e => e.isIntersecting)
      if (visibleEntries.length > 0) {
        // Sort by intersection ratio and pick the most visible
        const mostVisible = visibleEntries.reduce((prev, curr) =>
          curr.intersectionRatio > prev.intersectionRatio ? curr : prev
        )
        const id = mostVisible.target.getAttribute('data-stage-id')
        if (id) {
          observedCurrentId.value = id
        }
      }
    },
    {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    }
  )

  // Observe all stage elements
  Object.entries(props.stageRefs).forEach(([id, el]) => {
    if (el) {
      el.setAttribute('data-stage-id', id)
      observer?.observe(el)
    }
  })
}

function teardownObserver(): void {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// Watch for stageRefs changes and re-setup observer
watch(() => props.stageRefs, (newRefs) => {
  teardownObserver()
  if (newRefs && Object.keys(newRefs).length > 0) {
    setupObserver()
  }
}, { deep: true })

onMounted(() => {
  if (props.stageRefs && Object.keys(props.stageRefs).length > 0) {
    setupObserver()
  }
})

onUnmounted(() => {
  teardownObserver()
})

// Handle bottom sheet drag to dismiss
const sheetRef = ref<HTMLElement | null>(null)
const dragStartY = ref(0)
const currentTranslateY = ref(0)
const isDragging = ref(false)

function handleDragStart(e: TouchEvent | MouseEvent): void {
  isDragging.value = true
  dragStartY.value = 'touches' in e ? e.touches[0].clientY : e.clientY
  currentTranslateY.value = 0
}

function handleDragMove(e: TouchEvent | MouseEvent): void {
  if (!isDragging.value) return
  const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const delta = currentY - dragStartY.value
  // Only allow dragging down
  if (delta > 0) {
    currentTranslateY.value = delta
    if (sheetRef.value) {
      sheetRef.value.style.transform = `translateY(${delta}px)`
    }
  }
}

function handleDragEnd(): void {
  if (!isDragging.value) return
  isDragging.value = false
  // If dragged more than 100px, close the sheet
  if (currentTranslateY.value > 100) {
    closeSheet()
  }
  // Reset transform
  if (sheetRef.value) {
    sheetRef.value.style.transform = ''
  }
  currentTranslateY.value = 0
}
</script>

<template>
  <!-- Desktop Sidebar -->
  <aside class="hidden md:block sticky top-4 h-fit w-[180px] flex-shrink-0">
    <nav class="border-2 border-stone-200 bg-white">
      <div class="px-3 py-2 border-b-2 border-stone-200">
        <span class="text-xs uppercase text-stone-400 font-medium">Contents</span>
      </div>
      <ul class="py-1">
        <li v-for="stage in stages" :key="stage.id">
          <button
            @click="handleNavigate(stage.id)"
            class="w-full text-left px-3 py-2 text-sm transition-colors duration-150"
            :class="{
              'bg-accent/10 text-accent font-medium border-l-2 border-accent': activeId === stage.id && !isCompleted(stage.id),
              'text-stone-400 line-through': isCompleted(stage.id),
              'text-ink hover:bg-stone-50': activeId !== stage.id && !isCompleted(stage.id)
            }"
          >
            {{ stage.title }}
          </button>
        </li>

        <!-- Divider before logs -->
        <li v-if="hasCookLog || hasChangeLog" class="my-1 mx-3 h-px bg-stone-200" />

        <li v-if="hasCookLog">
          <button
            @click="handleNavigate('cook-log')"
            class="w-full text-left px-3 py-2 text-sm transition-colors duration-150"
            :class="{
              'bg-accent/10 text-accent font-medium border-l-2 border-accent': activeId === 'cook-log',
              'text-ink hover:bg-stone-50': activeId !== 'cook-log'
            }"
          >
            Cook Log
          </button>
        </li>

        <li v-if="hasChangeLog">
          <button
            @click="handleNavigate('change-log')"
            class="w-full text-left px-3 py-2 text-sm transition-colors duration-150"
            :class="{
              'bg-accent/10 text-accent font-medium border-l-2 border-accent': activeId === 'change-log',
              'text-ink hover:bg-stone-50': activeId !== 'change-log'
            }"
          >
            Version History
          </button>
        </li>
      </ul>
    </nav>
  </aside>

  <!-- Mobile FAB -->
  <button
    @click="openSheet"
    class="md:hidden fixed bottom-6 right-6 w-12 h-12 bg-ink text-white flex items-center justify-center shadow-lg z-40 transition-transform active:scale-95"
    aria-label="Open table of contents"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <!-- Mobile Bottom Sheet Backdrop -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isSheetOpen"
        class="md:hidden fixed inset-0 bg-black/40 z-50"
        @click="closeSheet"
      />
    </Transition>

    <!-- Mobile Bottom Sheet -->
    <Transition name="slide-up">
      <div
        v-if="isSheetOpen"
        ref="sheetRef"
        class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-stone-200 z-50 max-h-[70vh] overflow-hidden"
        @touchstart="handleDragStart"
        @touchmove="handleDragMove"
        @touchend="handleDragEnd"
        @mousedown="handleDragStart"
        @mousemove="handleDragMove"
        @mouseup="handleDragEnd"
        @mouseleave="handleDragEnd"
      >
        <!-- Drag handle -->
        <div class="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div class="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        <!-- Header -->
        <div class="px-4 pb-2 border-b-2 border-stone-200">
          <span class="text-xs uppercase text-stone-400 font-medium">Contents</span>
        </div>

        <!-- Scrollable content -->
        <nav class="overflow-y-auto max-h-[calc(70vh-60px)]">
          <ul class="py-2">
            <li v-for="stage in stages" :key="stage.id">
              <button
                @click="handleNavigate(stage.id)"
                class="w-full text-left px-4 py-3 text-base transition-colors duration-150"
                :class="{
                  'bg-accent/10 text-accent font-medium border-l-2 border-accent': activeId === stage.id && !isCompleted(stage.id),
                  'text-stone-400 line-through': isCompleted(stage.id),
                  'text-ink active:bg-stone-100': activeId !== stage.id && !isCompleted(stage.id)
                }"
              >
                {{ stage.title }}
              </button>
            </li>

            <!-- Divider before logs -->
            <li v-if="hasCookLog || hasChangeLog" class="my-2 mx-4 h-px bg-stone-200" />

            <li v-if="hasCookLog">
              <button
                @click="handleNavigate('cook-log')"
                class="w-full text-left px-4 py-3 text-base transition-colors duration-150"
                :class="{
                  'bg-accent/10 text-accent font-medium border-l-2 border-accent': activeId === 'cook-log',
                  'text-ink active:bg-stone-100': activeId !== 'cook-log'
                }"
              >
                Cook Log
              </button>
            </li>

            <li v-if="hasChangeLog">
              <button
                @click="handleNavigate('change-log')"
                class="w-full text-left px-4 py-3 text-base transition-colors duration-150"
                :class="{
                  'bg-accent/10 text-accent font-medium border-l-2 border-accent': activeId === 'change-log',
                  'text-ink active:bg-stone-100': activeId !== 'change-log'
                }"
              >
                Version History
              </button>
            </li>
          </ul>
        </nav>

        <!-- Safe area padding for mobile -->
        <div class="h-6" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide up transition for bottom sheet */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
