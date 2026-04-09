<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  checkedCount?: number
  completedStageCount?: number
  scratchpadNoteCount?: number
  title?: string
  description?: string
  confirmLabel?: string
}>(), {
  checkedCount: 0,
  completedStageCount: 0,
  scratchpadNoteCount: 0,
  title: 'Reset Bake?',
  description: 'This will clear all your progress and notes for this bake. This action cannot be undone.',
  confirmLabel: 'Reset'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const isOpen = ref(false)

const hasLoss = computed(() =>
  props.checkedCount > 0 || props.completedStageCount > 0 || props.scratchpadNoteCount > 0
)

function open(): void {
  isOpen.value = true
  document.body.style.overflow = 'hidden'
}

function close(): void {
  isOpen.value = false
  document.body.style.overflow = ''
  emit('cancel')
}

function confirm(): void {
  isOpen.value = false
  document.body.style.overflow = ''
  emit('confirm')
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (isOpen.value) {
    document.body.style.overflow = ''
  }
})

defineExpose({ open, close, isOpen })
</script>

<template>
  <Teleport to="body">
    <Transition name="reset-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        data-testid="reset-confirm-overlay"
        @click.self="close"
      >
        <div
          class="bg-surface border-2 border-stone-200 w-full max-w-[360px]"
          data-testid="reset-confirm-dialog"
        >
          <!-- Header -->
          <div class="p-6 border-b-2 border-stone-200">
            <h3 class="font-mono text-base text-ink font-semibold">{{ title }}</h3>
          </div>

          <!-- Body -->
          <div class="p-6">
            <p class="text-sm text-stone-600 leading-relaxed mb-6">
              {{ description }}
            </p>

          <!-- Loss list -->
          <div
            v-if="hasLoss"
            class="bg-stone-100 border-l-4 border-l-accent p-4 mb-6"
            data-testid="reset-loss-list"
          >
            <div class="font-mono text-xs font-semibold uppercase tracking-wider text-stone-600 mb-3">
              Will be lost:
            </div>
            <div v-if="checkedCount > 0" class="text-sm text-stone-600 mb-2" data-testid="reset-loss-checked">
              {{ checkedCount }} checked {{ checkedCount === 1 ? 'item' : 'items' }}
            </div>
            <div v-if="completedStageCount > 0" class="text-sm text-stone-600 mb-2" data-testid="reset-loss-stages">
              {{ completedStageCount }} completed {{ completedStageCount === 1 ? 'stage' : 'stages' }}
            </div>
            <div v-if="scratchpadNoteCount > 0" class="text-sm text-stone-600" data-testid="reset-loss-notes">
              {{ scratchpadNoteCount }} scratchpad {{ scratchpadNoteCount === 1 ? 'note' : 'notes' }}
            </div>
          </div>

          <!-- Nothing to lose -->
          <div
            v-else
            class="bg-stone-100 border-l-4 border-l-stone-300 p-4 mb-6"
            data-testid="reset-no-loss"
          >
            <div class="text-sm text-stone-500">No progress to reset.</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 border-t-2 border-stone-200">
          <button
            class="flex-1 py-3 px-4 bg-stone-200 text-ink font-mono text-sm font-medium uppercase tracking-wider border-2 border-stone-200 cursor-pointer transition-colors hover:bg-stone-300"
            data-testid="reset-cancel-btn"
            @click="close"
          >
            Cancel
          </button>
          <button
            class="flex-1 py-3 px-4 bg-accent text-surface font-mono text-sm font-medium uppercase tracking-wider border-2 border-accent cursor-pointer transition-colors hover:bg-accent/85"
            data-testid="reset-confirm-btn"
            @click="confirm"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<style scoped>
.reset-fade-enter-active {
  transition: opacity 200ms ease-out;
}
.reset-fade-leave-active {
  transition: opacity 150ms ease-in;
}
.reset-fade-enter-from,
.reset-fade-leave-to {
  opacity: 0;
}
</style>
