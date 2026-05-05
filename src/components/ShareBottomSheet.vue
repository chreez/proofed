<script setup lang="ts">
/**
 * ShareBottomSheet — PF-234 Instagram story export
 *
 * Bottom sheet with two steps:
 *   Step 1 (rate): 2-col grid (failure / meh / mid / success) + full-width skip.
 *                  Skipped if `initialOutcome` is non-null (resolved upstream
 *                  from cook_log entry → scratchpad).
 *   Step 2 (preview): 3-line caption preview + full-width Copy button.
 *
 * Pure presentational — caption is built upstream and passed in via prop.
 * Outcome pick is transient (used only to rebuild caption); caller is
 * responsible for any persistence logic (out of scope for PF-234).
 */
import { ref, computed, watch } from 'vue'
import { Copy, Check, X } from 'lucide-vue-next'
import { copyToClipboard } from '@/composables/useClipboard'
import { buildCaption, type BakeAggregates } from '@/composables/useBakeAggregates'
import type { CookLogEntry } from '@/types/recipe'

type Outcome = NonNullable<CookLogEntry['outcome']>

const props = defineProps<{
  open: boolean
  /** Lifetime aggregates (non-null when sheet is open) */
  aggregates: BakeAggregates | null
  /** Total non-aberration completed bakes for current recipe */
  recipeBakeCount: number
  /** Display name for current recipe */
  recipeName: string
  /**
   * Outcome pre-resolved from entry.outcome → scratchpad.outcome.
   * - non-null: skip rate step entirely, jump straight to preview
   * - null: show rate step
   */
  initialOutcome: Outcome | null
  /** Total cost of THIS bake — null to omit cost line */
  thisCost: number | null
  /** Per-item cost (cost.perServing field, rendered as $X/item) */
  thisCostPerItem: number | null
}>()

const emit = defineEmits<{
  close: []
}>()

const RATE_OPTIONS: Array<{ value: Outcome; label: string; emoji: string }> = [
  { value: 'failure', label: 'failure', emoji: '\u{1F4A5}' },
  { value: 'meh', label: 'meh', emoji: '\u{1F44E}' },
  { value: 'mid', label: 'mid', emoji: '\u{1F610}' },
  { value: 'success', label: 'success', emoji: '✅' },
]

type Step = 'rate' | 'preview'

// Local state — reset whenever sheet opens.
const step = ref<Step>('rate')
const pickedOutcome = ref<Outcome | null>(null)
const copied = ref(false)
let copyResetTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Resolve initial state on open
      pickedOutcome.value = props.initialOutcome
      step.value = props.initialOutcome != null ? 'preview' : 'rate'
      copied.value = false
      if (copyResetTimer) {
        clearTimeout(copyResetTimer)
        copyResetTimer = null
      }
    }
  },
  { immediate: true },
)

function chooseOutcome(o: Outcome): void {
  pickedOutcome.value = o
  step.value = 'preview'
}

function skipRate(): void {
  pickedOutcome.value = null
  step.value = 'preview'
}

function backToRate(): void {
  step.value = 'rate'
}

function close(): void {
  emit('close')
}

const caption = computed<string>(() => {
  if (!props.aggregates) return ''
  return buildCaption({
    aggregates: props.aggregates,
    recipeBakeCount: props.recipeBakeCount,
    recipeName: props.recipeName,
    outcome: pickedOutcome.value,
    thisCost: props.thisCost,
    thisCostPerItem: props.thisCostPerItem,
  })
})

async function copy(): Promise<void> {
  await copyToClipboard(caption.value)
  copied.value = true
  if (copyResetTimer) clearTimeout(copyResetTimer)
  copyResetTimer = setTimeout(() => {
    copied.value = false
  }, 1800)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="share-fade">
      <div
        v-if="open"
        class="share-backdrop"
        data-testid="share-backdrop"
        @click.self="close"
      />
    </Transition>
    <Transition name="share-slide">
      <div
        v-if="open"
        class="share-sheet"
        role="dialog"
        aria-modal="true"
        data-testid="share-sheet"
        @click.stop
      >
        <div class="share-handle" />

        <div class="share-header">
          <span class="share-eyebrow">Instagram caption</span>
          <button
            class="share-close"
            type="button"
            aria-label="Close share sheet"
            data-testid="share-close"
            @click="close"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Step 1: rate -->
        <div v-if="step === 'rate'" class="share-step">
          <p class="share-prompt">Rate this bake?</p>
          <div class="share-rate-grid">
            <button
              v-for="opt in RATE_OPTIONS"
              :key="opt.value"
              type="button"
              class="share-rate-btn"
              :data-testid="`share-rate-${opt.value}`"
              @click="chooseOutcome(opt.value)"
            >
              <span class="share-rate-emoji">{{ opt.emoji }}</span>
              <span>{{ opt.label }}</span>
            </button>
          </div>
          <button
            type="button"
            class="share-skip-btn"
            data-testid="share-skip"
            @click="skipRate"
          >
            skip
          </button>
        </div>

        <!-- Step 2: preview / copy -->
        <div v-else class="share-step">
          <p class="share-eyebrow share-preview-eyebrow">
            Caption preview{{ pickedOutcome ? ` · rated ${pickedOutcome}` : ' · no rating' }}
          </p>
          <pre class="share-caption" data-testid="share-caption">{{ caption }}</pre>
          <button
            type="button"
            class="share-copy-btn"
            data-testid="share-copy"
            @click="copy"
          >
            <component :is="copied ? Check : Copy" :size="16" />
            <span>{{ copied ? 'Copied' : 'Copy caption' }}</span>
          </button>
          <button
            v-if="initialOutcome === null"
            type="button"
            class="share-back-btn"
            data-testid="share-back"
            @click="backToRate"
          >
            Back
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.share-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.45);
  z-index: 90;
}

.share-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--color-surface, #fafaf7);
  border-top: 2px solid var(--color-ink, #1a1816);
  padding: 0.5rem 1rem 1.5rem;
  max-width: 32rem;
  margin: 0 auto;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.16);
}

.share-handle {
  width: 36px;
  height: 4px;
  background: var(--color-stone-300, #d6d2c8);
  margin: 0.25rem auto 0.75rem;
  border-radius: 2px;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.875rem;
}

.share-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-stone-500, #8d8478);
}

.share-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-stone-500, #8d8478);
  padding: 0.25rem;
  cursor: pointer;
}
.share-close:hover {
  color: var(--color-ink, #1a1816);
}

.share-step {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.share-prompt {
  font-family: var(--font-mono);
  font-size: 1rem;
  color: var(--color-ink, #1a1816);
  margin: 0 0 0.25rem 0;
}

.share-rate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.share-rate-btn {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  border: 2px solid var(--color-stone-300, #d6d2c8);
  background: var(--color-surface, #fafaf7);
  color: var(--color-ink, #1a1816);
  cursor: pointer;
  border-radius: 0;
}
.share-rate-btn:hover {
  border-color: var(--color-ink, #1a1816);
  background: var(--color-stone-100, #efeae0);
}

.share-rate-emoji {
  font-size: 1.125rem;
  line-height: 1;
}

.share-skip-btn {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  padding: 0.875rem 0.75rem;
  border: 2px dashed var(--color-stone-300, #d6d2c8);
  background: transparent;
  color: var(--color-stone-500, #8d8478);
  cursor: pointer;
  border-radius: 0;
}
.share-skip-btn:hover {
  color: var(--color-ink, #1a1816);
  border-color: var(--color-stone-500, #8d8478);
}

.share-preview-eyebrow {
  margin-bottom: 0;
}

.share-caption {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-ink, #1a1816);
  background: var(--color-stone-100, #efeae0);
  border: 2px solid var(--color-stone-200, #e8e4dc);
  padding: 0.875rem 1rem;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: all;
}

.share-copy-btn {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  border: 2px solid var(--color-ink, #1a1816);
  background: var(--color-ink, #1a1816);
  color: var(--color-surface, #fafaf7);
  cursor: pointer;
  border-radius: 0;
}
.share-copy-btn:hover {
  background: var(--color-stone-700, #5b544b);
}

.share-back-btn {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  padding: 0.625rem 0.75rem;
  border: 2px solid var(--color-stone-300, #d6d2c8);
  background: transparent;
  color: var(--color-stone-500, #8d8478);
  cursor: pointer;
  border-radius: 0;
}
.share-back-btn:hover {
  color: var(--color-ink, #1a1816);
  border-color: var(--color-stone-500, #8d8478);
}

/* Transitions */
.share-fade-enter-active,
.share-fade-leave-active {
  transition: opacity 0.2s ease;
}
.share-fade-enter-from,
.share-fade-leave-to {
  opacity: 0;
}

.share-slide-enter-active,
.share-slide-leave-active {
  transition: transform 0.25s ease-out;
}
.share-slide-enter-from,
.share-slide-leave-to {
  transform: translateY(100%);
}
</style>
