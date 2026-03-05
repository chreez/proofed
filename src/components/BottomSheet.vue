<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()

// Drag-to-dismiss logic
const sheetRef = ref<HTMLElement | null>(null)
const dragStartY = ref(0)
const currentTranslateY = ref(0)
const isDragging = ref(false)

function close(): void {
  emit('close')
}

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
    close()
  }
  // Reset transform
  if (sheetRef.value) {
    sheetRef.value.style.transform = ''
  }
  currentTranslateY.value = 0
}

// Reset drag state when sheet closes
watch(() => props.open, (val) => {
  if (!val) {
    isDragging.value = false
    currentTranslateY.value = 0
    if (sheetRef.value) {
      sheetRef.value.style.transform = ''
    }
  }
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/40 z-50"
        @click="close"
      />
    </Transition>

    <!-- Sheet -->
    <Transition name="slide-up">
      <div
        v-if="open"
        ref="sheetRef"
        class="fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-stone-200 z-50 max-h-[70dvh] overflow-hidden flex flex-col"
        @touchstart="handleDragStart"
        @touchmove="handleDragMove"
        @touchend="handleDragEnd"
        @mousedown="handleDragStart"
        @mousemove="handleDragMove"
        @mouseup="handleDragEnd"
        @mouseleave="handleDragEnd"
        @click.stop
      >
        <!-- Drag handle -->
        <div class="flex justify-center py-3 cursor-grab active:cursor-grabbing flex-shrink-0">
          <div class="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        <!-- Header (optional title) -->
        <div v-if="title" class="px-4 pb-2 border-b-2 border-stone-200 flex-shrink-0">
          <span class="text-xs uppercase text-stone-400 font-medium">{{ title }}</span>
        </div>

        <!-- Scrollable content -->
        <div class="overflow-y-auto flex-1 overscroll-contain">
          <slot />
        </div>

        <!-- Safe area padding for mobile -->
        <div class="h-6 flex-shrink-0" />
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
