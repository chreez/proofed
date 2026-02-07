<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  stages: { id: string; title: string }[]
  hasNutrition?: boolean
  hasCookLog: boolean
  hasChangeLog: boolean
  currentStageId: string | null
  completedStageIds: string[]
}>()

const emit = defineEmits<{
  navigate: [target: string]
}>()

// Mobile bottom sheet state
const isSheetOpen = ref(false)

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
  <aside class="hidden md:block sticky top-20 h-fit w-[160px] flex-shrink-0">
    <nav class="border-l border-stone-300 pl-3">
      <div
        v-for="stage in stages"
        :key="stage.id"
        @click="handleNavigate(stage.id)"
        class="py-1.5 text-xs cursor-pointer transition-colors duration-150 leading-tight"
        :class="{
          'text-accent font-medium': currentStageId === stage.id && !isCompleted(stage.id),
          'text-stone-400 line-through': isCompleted(stage.id),
          'text-stone-500 hover:text-ink': currentStageId !== stage.id && !isCompleted(stage.id)
        }"
      >
        {{ stage.title }}
      </div>

      <div v-if="hasNutrition || hasCookLog || hasChangeLog" class="my-2 h-px bg-stone-200" />

      <div
        v-if="hasNutrition"
        @click="handleNavigate('nutrition')"
        class="py-1.5 text-xs cursor-pointer transition-colors duration-150 leading-tight"
        :class="{
          'text-accent font-medium': currentStageId === 'nutrition',
          'text-stone-500 hover:text-ink': currentStageId !== 'nutrition'
        }"
      >
        Nutrition
      </div>

      <div
        v-if="hasCookLog"
        @click="handleNavigate('cook-log')"
        class="py-1.5 text-xs cursor-pointer transition-colors duration-150 leading-tight"
        :class="{
          'text-accent font-medium': currentStageId === 'cook-log',
          'text-stone-500 hover:text-ink': currentStageId !== 'cook-log'
        }"
      >
        Cook Log
      </div>

      <div
        v-if="hasChangeLog"
        @click="handleNavigate('change-log')"
        class="py-1.5 text-xs cursor-pointer transition-colors duration-150 leading-tight"
        :class="{
          'text-accent font-medium': currentStageId === 'change-log',
          'text-stone-500 hover:text-ink': currentStageId !== 'change-log'
        }"
      >
        Version History
      </div>
    </nav>
  </aside>

  <!-- Mobile FAB -->
  <button
    @click="openSheet"
    class="md:hidden fixed bottom-4 right-4 w-10 h-10 bg-ink text-white flex items-center justify-center shadow-md z-40 transition-transform active:scale-95"
    aria-label="Open table of contents"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  'bg-accent/10 text-accent font-medium border-l-2 border-accent': currentStageId === stage.id && !isCompleted(stage.id),
                  'text-stone-400 line-through': isCompleted(stage.id),
                  'text-ink active:bg-stone-100': currentStageId !== stage.id && !isCompleted(stage.id)
                }"
              >
                {{ stage.title }}
              </button>
            </li>

            <!-- Divider before extras -->
            <li v-if="hasNutrition || hasCookLog || hasChangeLog" class="my-2 mx-4 h-px bg-stone-200" />

            <li v-if="hasNutrition">
              <button
                @click="handleNavigate('nutrition')"
                class="w-full text-left px-4 py-3 text-base transition-colors duration-150"
                :class="{
                  'bg-accent/10 text-accent font-medium border-l-2 border-accent': currentStageId === 'nutrition',
                  'text-ink active:bg-stone-100': currentStageId !== 'nutrition'
                }"
              >
                Nutrition
              </button>
            </li>

            <li v-if="hasCookLog">
              <button
                @click="handleNavigate('cook-log')"
                class="w-full text-left px-4 py-3 text-base transition-colors duration-150"
                :class="{
                  'bg-accent/10 text-accent font-medium border-l-2 border-accent': currentStageId === 'cook-log',
                  'text-ink active:bg-stone-100': currentStageId !== 'cook-log'
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
                  'bg-accent/10 text-accent font-medium border-l-2 border-accent': currentStageId === 'change-log',
                  'text-ink active:bg-stone-100': currentStageId !== 'change-log'
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
