<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ArrowLeft, X, Share2, Copy, Check } from 'lucide-vue-next'
import QRCodeStyling from 'qr-code-styling'
import type { CookLogEntry } from '@/types/recipe'
import { copyToClipboard } from '@/composables/useClipboard'

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
const step = ref<'pick' | 'share'>('pick')
const selectedBake = ref<CookLogEntry | null>(null)
const copied = ref(false)
const qrContainer = ref<HTMLDivElement | null>(null)
const qrImageSrc = ref<string | null>(null)

// Sort entries newest first
const sortedEntries = computed(() => {
  return [...props.cookLog].sort((a, b) => b.date.localeCompare(a.date))
})

const shareUrl = computed(() => {
  if (!selectedBake.value) return ''
  return `https://proofeddot.netlify.app/recipe/${props.recipeId}/bake/${selectedBake.value.date}?shared=true`
})

const hasNativeShare = computed(() => typeof navigator !== 'undefined' && !!navigator.share)

function open(): void {
  isOpen.value = true
  step.value = 'pick'
  selectedBake.value = null
  copied.value = false
  qrImageSrc.value = null
  document.body.style.overflow = 'hidden'
}

function close(): void {
  isOpen.value = false
  document.body.style.overflow = ''
  emit('close')
}

function selectBake(entry: CookLogEntry): void {
  selectedBake.value = entry
  step.value = 'share'
  copied.value = false
  qrImageSrc.value = null
  nextTick(() => renderQrLabel())
}

function goBackToPicker(): void {
  step.value = 'pick'
  selectedBake.value = null
  copied.value = false
}

function renderQrLabel(): void {
  if (!qrContainer.value || !shareUrl.value) return
  qrContainer.value.innerHTML = ''

  const qrCode = new QRCodeStyling({
    width: 256,
    height: 256,
    type: 'canvas',
    data: shareUrl.value,
    margin: 8,
    dotsOptions: { color: INK, type: 'rounded' },
    cornersSquareOptions: { color: ACCENT, type: 'extra-rounded' },
    cornersDotOptions: { color: ACCENT, type: 'dot' },
    backgroundOptions: { color: '#ffffff' },
    qrOptions: { errorCorrectionLevel: 'M' }
  })

  qrCode.append(qrContainer.value)

  setTimeout(() => {
    const qrCanvas = qrContainer.value?.querySelector('canvas')
    if (!qrCanvas) return

    const qrSize = 256
    const pad = 24
    const brandWidth = 240
    const labelWidth = pad + qrSize + pad + brandWidth + pad
    const labelHeight = qrSize + pad * 2

    const label = document.createElement('canvas')
    label.width = labelWidth
    label.height = labelHeight
    const ctx = label.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, labelWidth, labelHeight)
    ctx.drawImage(qrCanvas, pad, pad, qrSize, qrSize)

    const textX = pad + qrSize + pad
    ctx.font = 'bold 48px "JetBrains Mono", monospace'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = INK
    ctx.fillText('proofed', textX, labelHeight / 2)
    const w = ctx.measureText('proofed').width
    // Draw brand dot as explicit circle — canvas text rendering mangles the glyph
    const dotRadius = 5
    const dotX = textX + w + dotRadius + 4
    const dotY = labelHeight / 2 + 12
    ctx.beginPath()
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
    ctx.fillStyle = ACCENT
    ctx.fill()

    qrImageSrc.value = label.toDataURL('image/png')
  }, 300)
}

async function copyLink(): Promise<void> {
  if (!shareUrl.value) return
  try {
    await copyToClipboard(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Copy failed — ignore
  }
}

async function shareLink(): Promise<void> {
  if (!shareUrl.value || !selectedBake.value) return
  try {
    await navigator.share({
      title: `${props.recipeName} — ${formatDate(selectedBake.value.date)}`,
      url: shareUrl.value
    })
  } catch {
    // User cancelled share sheet — not an error
  }
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
              v-if="step === 'share'"
              class="icon-btn-inline"
              title="Back"
              data-testid="share-back-btn"
              @click="goBackToPicker"
            >
              <ArrowLeft :size="16" />
            </button>
            <h3 class="font-mono text-sm text-ink font-semibold">
              {{ step === 'pick' ? 'Share a Bake' : 'Share Link' }}
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

        <!-- Step 2: Share Actions -->
        <div v-if="step === 'share'" class="p-4">
          <p class="text-muted mb-1">{{ recipeName }}</p>
          <p class="font-mono text-xs text-ink mb-4">{{ selectedBake ? formatDate(selectedBake.date) : '' }}</p>

          <!-- Hidden canvas for QR generation -->
          <div ref="qrContainer" class="hidden" />

          <!-- Branded QR label image -->
          <div v-if="qrImageSrc" class="flex justify-center mb-4">
            <img
              :src="qrImageSrc"
              :alt="`QR label for ${recipeName}`"
              class="w-full"
              style="-webkit-touch-callout: default;"
              data-testid="share-qr-label"
            />
          </div>

          <!-- Link preview -->
          <div class="bg-stone-100 border-2 border-stone-200 p-3 mb-4">
            <p class="font-mono text-xs text-stone-500 break-all" data-testid="share-url">{{ shareUrl }}</p>
          </div>

          <!-- Actions -->
          <div class="space-y-2">
            <button
              class="w-full flex items-center justify-center gap-2 py-3 border-2 border-stone-200 hover:bg-stone-50 transition-colors font-mono text-sm text-ink"
              data-testid="share-copy-btn"
              @click="copyLink"
            >
              <Check v-if="copied" :size="16" class="text-green-600" />
              <Copy v-else :size="16" />
              {{ copied ? 'Copied!' : 'Copy Link' }}
            </button>

            <button
              v-if="hasNativeShare"
              class="w-full flex items-center justify-center gap-2 py-3 bg-ink text-surface font-mono text-sm transition-colors hover:bg-stone-700"
              data-testid="share-native-btn"
              @click="shareLink"
            >
              <Share2 :size="16" />
              Share
            </button>
          </div>
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
