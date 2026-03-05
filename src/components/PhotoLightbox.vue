<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { CookLogPhoto } from '@/types/recipe'

const props = defineProps<{
  photos: CookLogPhoto[]
  initialIndex: number
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const currentIndex = ref(props.initialIndex)

// Gesture state exposed to template via inline styles
type GestureState = 'idle' | 'swiping' | 'dismissing'
const gestureState = ref<GestureState>('idle')

// Horizontal swipe
const dragX = ref(0)

// Vertical dismiss
const dragY = ref(0)
const dismissScale = ref(1)
const backdropOpacity = ref(0.92)

// Snap-back / commit animation
const isAnimating = ref(false)

// ---------------------------------------------------------------------------
// Computed styles
// ---------------------------------------------------------------------------

const contentStyle = computed(() => {
  if (gestureState.value === 'swiping') {
    return {
      transform: `translateX(${dragX.value}px)`,
      transition: 'none',
    }
  }
  if (gestureState.value === 'dismissing') {
    return {
      transform: `translateY(${dragY.value}px) scale(${dismissScale.value})`,
      transition: 'none',
    }
  }
  if (isAnimating.value) {
    return {
      transform: 'translateX(0px) translateY(0px) scale(1)',
      transition: 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }
  }
  return {
    transform: 'none',
    transition: 'none',
  }
})

const overlayStyle = computed(() => {
  if (gestureState.value === 'dismissing') {
    return {
      background: `rgba(0, 0, 0, ${backdropOpacity.value})`,
      transition: 'none',
    }
  }
  if (isAnimating.value) {
    return {
      background: 'rgba(0, 0, 0, 0.92)',
      transition: 'background 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }
  }
  return {}
})

// Peek images (adjacent slides for horizontal swipe)
const prevPhoto = computed(() =>
  currentIndex.value > 0 ? props.photos[currentIndex.value - 1] : null,
)
const nextPhoto = computed(() =>
  currentIndex.value < props.photos.length - 1
    ? props.photos[currentIndex.value + 1]
    : null,
)

const prevPeekStyle = computed(() => {
  if (gestureState.value !== 'swiping') return { display: 'none' }
  // Position the previous image to the left of the current one
  const offset = dragX.value - window.innerWidth
  return {
    display: 'block',
    transform: `translateX(${offset}px)`,
    transition: 'none',
  }
})

const nextPeekStyle = computed(() => {
  if (gestureState.value !== 'swiping') return { display: 'none' }
  // Position the next image to the right of the current one
  const offset = dragX.value + window.innerWidth
  return {
    display: 'block',
    transform: `translateX(${offset}px)`,
    transition: 'none',
  }
})

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

function prev(): void {
  if (currentIndex.value > 0) currentIndex.value--
}

function next(): void {
  if (currentIndex.value < props.photos.length - 1) currentIndex.value++
}

// ---------------------------------------------------------------------------
// Backdrop click (close on click outside image)
// ---------------------------------------------------------------------------

function handleBackdropClick(e: MouseEvent): void {
  // Only close if gesture system is idle (not finishing an animation)
  if (gestureState.value !== 'idle' || isAnimating.value) return
  if ((e.target as HTMLElement).dataset.backdrop !== undefined) {
    emit('close')
  }
}

// ---------------------------------------------------------------------------
// Pointer-based gesture system
// ---------------------------------------------------------------------------

const AXIS_LOCK_THRESHOLD = 10 // px to classify direction
const SWIPE_DISPLACEMENT_THRESHOLD = 80 // px to commit horizontal navigate
const SWIPE_VELOCITY_THRESHOLD = 0.4 // px/ms for fast flick
const SWIPE_FLICK_MIN_DISPLACEMENT = 30 // min px even for fast flick
const DISMISS_DISPLACEMENT_THRESHOLD = 150 // px to commit dismiss
const DISMISS_VELOCITY_THRESHOLD = 0.5 // px/ms for fast dismiss flick

let pointerId: number | null = null
let startX = 0
let startY = 0
let prevMoveX = 0
let prevMoveY = 0
let prevMoveTime = 0
let axisLocked: 'none' | 'horizontal' | 'vertical' = 'none'

function onPointerDown(e: PointerEvent): void {
  // Only track primary pointer (single finger / left mouse)
  if (pointerId !== null) return
  if (e.button !== 0) return

  // Don't capture if clicking buttons
  const target = e.target as HTMLElement
  if (target.closest('button')) return

  pointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  prevMoveX = e.clientX
  prevMoveY = e.clientY
  prevMoveTime = e.timeStamp
  axisLocked = 'none'

  // Capture pointer to get events even outside the element
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent): void {
  if (e.pointerId !== pointerId) return

  const dx = e.clientX - startX
  const dy = e.clientY - startY

  // Update velocity tracking (keep previous frame for release velocity)
  prevMoveX = e.clientX
  prevMoveY = e.clientY
  prevMoveTime = e.timeStamp

  // Axis classification: lock after first 10px of movement
  if (axisLocked === 'none') {
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (absDx >= AXIS_LOCK_THRESHOLD || absDy >= AXIS_LOCK_THRESHOLD) {
      if (absDx > absDy) {
        axisLocked = 'horizontal'
        gestureState.value = 'swiping'
      } else {
        axisLocked = 'vertical'
        gestureState.value = 'dismissing'
      }
    }
    return
  }

  if (axisLocked === 'horizontal') {
    // Horizontal swipe: apply rubber-band at edges
    let adjustedDx = dx
    const atStart = currentIndex.value === 0 && dx > 0
    const atEnd = currentIndex.value === props.photos.length - 1 && dx < 0
    if (atStart || atEnd) {
      // Rubber-band: diminishing returns past edge
      adjustedDx = dx * 0.3
    }
    dragX.value = adjustedDx
  }

  if (axisLocked === 'vertical') {
    // Only allow downward dismiss (clamp upward movement)
    const adjustedDy = Math.max(0, dy)
    dragY.value = adjustedDy

    // Scale: 1.0 at 0px, 0.85 at 300px
    const progress = Math.min(adjustedDy / 300, 1)
    dismissScale.value = 1 - progress * 0.15

    // Backdrop opacity: 0.92 at 0px, 0 at 400px
    const opacityProgress = Math.min(adjustedDy / 400, 1)
    backdropOpacity.value = 0.92 * (1 - opacityProgress)
  }
}

function onPointerUp(e: PointerEvent): void {
  if (e.pointerId !== pointerId) return

  const dx = e.clientX - startX
  const dy = e.clientY - startY
  // Velocity from last move event gives instantaneous release speed
  const dt = e.timeStamp - prevMoveTime
  const velocityX = dt > 0 ? Math.abs(e.clientX - prevMoveX) / dt : 0
  const velocityY = dt > 0 ? Math.abs(e.clientY - prevMoveY) / dt : 0

  pointerId = null

  if (axisLocked === 'horizontal') {
    handleSwipeEnd(dx, velocityX)
  } else if (axisLocked === 'vertical') {
    handleDismissEnd(dy, velocityY)
  } else {
    // No axis locked — was a tap, let click handler deal with it
    resetGesture()
  }
}

function onPointerCancel(e: PointerEvent): void {
  if (e.pointerId !== pointerId) return
  pointerId = null
  snapBack()
}

function handleSwipeEnd(dx: number, velocity: number): void {
  const absDx = Math.abs(dx)
  const atStart = currentIndex.value === 0 && dx > 0
  const atEnd = currentIndex.value === props.photos.length - 1 && dx < 0

  // Determine if we should commit the navigation
  const displacementCommit = absDx > SWIPE_DISPLACEMENT_THRESHOLD
  const velocityCommit =
    velocity > SWIPE_VELOCITY_THRESHOLD && absDx > SWIPE_FLICK_MIN_DISPLACEMENT
  const shouldCommit = (displacementCommit || velocityCommit) && !atStart && !atEnd

  if (shouldCommit) {
    // Animate the slide out, then change index
    const direction = dx > 0 ? 1 : -1
    const target = direction > 0 ? -1 : 1 // navigate direction is opposite of drag

    animateSlideCommit(direction, () => {
      if (target > 0) next()
      else prev()
    })
  } else {
    snapBack()
  }
}

function handleDismissEnd(dy: number, velocity: number): void {
  const shouldDismiss =
    dy > DISMISS_DISPLACEMENT_THRESHOLD ||
    (velocity > DISMISS_VELOCITY_THRESHOLD && dy > 30)

  if (shouldDismiss) {
    animateDismissOut()
  } else {
    snapBack()
  }
}

function animateSlideCommit(direction: number, onComplete: () => void): void {
  // direction: +1 means finger dragged right (navigate to prev)
  // Animate current image off-screen in the drag direction
  const target = direction * window.innerWidth

  isAnimating.value = true
  gestureState.value = 'idle'

  // Use a temporary override: animate to the target position
  const el = document.querySelector('.lightbox-content') as HTMLElement | null
  if (el) {
    el.style.transition = 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    el.style.transform = `translateX(${target}px)`

    const onEnd = (): void => {
      el.removeEventListener('transitionend', onEnd)
      el.style.transition = 'none'
      el.style.transform = 'none'
      onComplete()
      dragX.value = 0
      isAnimating.value = false
    }
    el.addEventListener('transitionend', onEnd)
  } else {
    onComplete()
    resetGesture()
  }
}

function animateDismissOut(): void {
  // Animate image off the bottom of the screen
  const el = document.querySelector('.lightbox-content') as HTMLElement | null
  const overlay = document.querySelector('.lightbox-overlay') as HTMLElement | null

  if (el && overlay) {
    el.style.transition = 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    el.style.transform = `translateY(${window.innerHeight}px) scale(0.8)`
    overlay.style.transition = 'background 250ms ease-out'
    overlay.style.background = 'rgba(0, 0, 0, 0)'

    const onEnd = (): void => {
      el.removeEventListener('transitionend', onEnd)
      resetGesture()
      emit('close')
    }
    el.addEventListener('transitionend', onEnd)
  } else {
    resetGesture()
    emit('close')
  }
}

function snapBack(): void {
  isAnimating.value = true
  gestureState.value = 'idle'
  dragX.value = 0
  dragY.value = 0
  dismissScale.value = 1
  backdropOpacity.value = 0.92

  // Let the animation transition play, then clear
  setTimeout(() => {
    isAnimating.value = false
  }, 320)
}

function resetGesture(): void {
  gestureState.value = 'idle'
  dragX.value = 0
  dragY.value = 0
  dismissScale.value = 1
  backdropOpacity.value = 0.92
  isAnimating.value = false
  axisLocked = 'none'
  pointerId = null
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      currentIndex.value = props.initialIndex
      resetGesture()
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeydown)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="open"
        class="lightbox-overlay"
        :style="overlayStyle"
        data-backdrop
        @click="handleBackdropClick"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
      >
        <!-- Close button -->
        <button
          class="lightbox-close"
          aria-label="Close lightbox"
          @click="emit('close')"
        >
          <X :size="24" />
        </button>

        <!-- Nav: prev -->
        <button
          v-if="photos.length > 1 && currentIndex > 0"
          class="lightbox-nav lightbox-nav-prev"
          aria-label="Previous photo"
          @click="prev"
        >
          <ChevronLeft :size="32" />
        </button>

        <!-- Peek: previous image -->
        <div
          v-if="prevPhoto && gestureState === 'swiping'"
          class="lightbox-peek"
          :style="prevPeekStyle"
        >
          <img
            :src="prevPhoto.src"
            :alt="prevPhoto.alt"
            class="lightbox-img"
            draggable="false"
          />
        </div>

        <!-- Main image + caption -->
        <div class="lightbox-content" :style="contentStyle">
          <img
            :src="photos[currentIndex].src"
            :alt="photos[currentIndex].alt"
            class="lightbox-img"
            draggable="false"
          />
          <div class="lightbox-caption">
            <span>{{ photos[currentIndex].alt }}</span>
            <span v-if="photos.length > 1" class="lightbox-counter">
              {{ currentIndex + 1 }} / {{ photos.length }}
            </span>
          </div>
        </div>

        <!-- Peek: next image -->
        <div
          v-if="nextPhoto && gestureState === 'swiping'"
          class="lightbox-peek"
          :style="nextPeekStyle"
        >
          <img
            :src="nextPhoto.src"
            :alt="nextPhoto.alt"
            class="lightbox-img"
            draggable="false"
          />
        </div>

        <!-- Nav: next -->
        <button
          v-if="photos.length > 1 && currentIndex < photos.length - 1"
          class="lightbox-nav lightbox-nav-next"
          aria-label="Next photo"
          @click="next"
        >
          <ChevronRight :size="32" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  overscroll-behavior: contain;
  -webkit-user-select: none;
  user-select: none;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: rgba(255, 255, 255, 0.7);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 2;
  transition: color 150ms;
}

.lightbox-close:hover {
  color: white;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  background: none;
  border: none;
  cursor: pointer;
  padding: 1rem;
  z-index: 2;
  transition: color 150ms;
}

.lightbox-nav:hover {
  color: white;
}

.lightbox-nav-prev {
  left: 0.5rem;
}

.lightbox-nav-next {
  right: 0.5rem;
}

.lightbox-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90vw;
  max-height: 90vh;
  will-change: transform;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
}

.lightbox-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.75rem 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.lightbox-counter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Peek images (adjacent slides during horizontal swipe) */
.lightbox-peek {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
  pointer-events: none;
}

/* Transition */
.lightbox-enter-active {
  transition: opacity 200ms ease-out;
}
.lightbox-leave-active {
  transition: opacity 150ms ease-in;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

/* Mobile: hide arrow buttons, rely on swipe */
@media (max-width: 768px) {
  .lightbox-nav {
    display: none;
  }
}
</style>
