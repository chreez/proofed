<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ArrowLeft, X } from 'lucide-vue-next'
import QRCodeStyling from 'qr-code-styling'
import type { CookLogEntry } from '@/types/recipe'

const props = defineProps<{
  recipeName: string
  recipeId: string
  cookLog: CookLogEntry[]
}>()

const emit = defineEmits<{
  close: []
}>()

// Brand colors
const ACCENT = '#a65d45'
const INK = '#1a1816'

// Modal state
const isOpen = ref(false)
const step = ref<'pick' | 'qr'>('pick')
const selectedBake = ref<CookLogEntry | null>(null)
const qrContainer = ref<HTMLDivElement | null>(null)

// Sort entries newest first
const sortedEntries = computed(() => {
  return [...props.cookLog].sort((a, b) => b.date.localeCompare(a.date))
})

function open(): void {
  isOpen.value = true
  step.value = 'pick'
  selectedBake.value = null
  document.body.style.overflow = 'hidden'
}

function close(): void {
  isOpen.value = false
  document.body.style.overflow = ''
  emit('close')
}

function selectBake(entry: CookLogEntry): void {
  selectedBake.value = entry
  step.value = 'qr'
  nextTick(() => renderQrCode())
}

function goBackToPicker(): void {
  step.value = 'pick'
  selectedBake.value = null
}

function renderQrCode(): void {
  if (!qrContainer.value || !selectedBake.value) return

  // Clear previous QR
  qrContainer.value.innerHTML = ''

  const url = `https://proofeddot.netlify.app/recipe/${props.recipeId}/bake/${selectedBake.value.date}?shared=true`

  const qrCode = new QRCodeStyling({
    width: 256,
    height: 256,
    type: 'canvas',
    data: url,
    margin: 8,
    dotsOptions: {
      color: INK,
      type: 'rounded'
    },
    cornersSquareOptions: {
      color: ACCENT,
      type: 'extra-rounded'
    },
    cornersDotOptions: {
      color: ACCENT,
      type: 'dot'
    },
    backgroundOptions: {
      color: '#ffffff'
    },
    qrOptions: {
      errorCorrectionLevel: 'M'
    }
  })

  qrCode.append(qrContainer.value)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Close on Escape key
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
  <Transition name="share-fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      data-testid="share-modal-overlay"
      @click.self="close"
    >
      <div class="bg-surface border-2 border-stone-200 w-full max-w-sm max-h-[80vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b-2 border-stone-200">
          <div class="flex items-center gap-2">
            <button
              v-if="step === 'qr'"
              class="icon-btn-inline"
              title="Back"
              data-testid="share-back-btn"
              @click="goBackToPicker"
            >
              <ArrowLeft :size="16" />
            </button>
            <h3 class="font-mono text-sm text-ink font-semibold">
              {{ step === 'pick' ? 'Share a Bake' : 'QR Code' }}
            </h3>
          </div>
          <button
            class="icon-btn-inline"
            title="Close"
            data-testid="share-close-btn"
            @click="close"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Step 1: Bake Picker -->
        <div v-if="step === 'pick'" class="p-4">
          <p class="text-muted mb-3">Select a bake to share:</p>
          <div class="space-y-2">
            <button
              v-for="entry in sortedEntries"
              :key="entry.date"
              class="w-full text-left p-3 border-2 border-stone-200 hover:bg-stone-50 transition-colors"
              data-testid="bake-picker-entry"
              @click="selectBake(entry)"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="font-mono text-xs text-ink">{{ formatDate(entry.date) }}</span>
                <span class="text-xs bg-stone-200 px-1.5 py-0.5">{{ entry.version }}</span>
              </div>
              <p v-if="entry.summary" class="text-xs text-stone-600 line-clamp-2">{{ entry.summary }}</p>
              <p v-else class="text-xs text-stone-400 italic">No summary</p>
            </button>
          </div>
        </div>

        <!-- Step 2: QR Code Display -->
        <div v-if="step === 'qr'" class="p-4">
          <p class="text-muted mb-1">{{ recipeName }}</p>
          <p class="font-mono text-xs text-ink mb-4">{{ selectedBake ? formatDate(selectedBake.date) : '' }}</p>

          <!-- QR Code -->
          <div
            ref="qrContainer"
            class="flex justify-center mb-4 [&>canvas]:border-2 [&>canvas]:border-stone-200"
            data-testid="qr-code-container"
          />

          <p class="text-xs text-stone-400 text-center">
            Long-press (mobile) or right-click (desktop) to save image.
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.share-fade-enter-active {
  transition: opacity 200ms ease-out;
}
.share-fade-leave-active {
  transition: opacity 150ms ease-in;
}
.share-fade-enter-from,
.share-fade-leave-to {
  opacity: 0;
}

.icon-btn-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  transition: background-color 0.15s ease;
  padding: 0;
}
.icon-btn-inline:hover {
  background: var(--color-stone-200);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
