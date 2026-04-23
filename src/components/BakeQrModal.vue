<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { X, Share2, Copy, Check } from 'lucide-vue-next'
import { copyToClipboard } from '@/composables/useClipboard'
import { renderBrandedQr, generateQrLabelDataUrl } from '@/composables/useQrLabel'

const props = defineProps<{
  recipeName: string
  recipeId: string
  bakeDate: string
}>()

const emit = defineEmits<{
  close: []
}>()

// Modal state
const isOpen = ref(false)
const copied = ref(false)
const qrContainer = ref<HTMLDivElement | null>(null)
const qrImageSrc = ref<string | null>(null)

const shareUrl = computed(() => {
  return `https://proofeddot.netlify.app/recipe/${props.recipeId}/bake/${props.bakeDate}?shared=true`
})

const hasNativeShare = computed(() => typeof navigator !== 'undefined' && !!navigator.share)

function open(): void {
  isOpen.value = true
  copied.value = false
  qrImageSrc.value = null
  document.body.style.overflow = 'hidden'
  nextTick(() => renderQrLabel())
}

function close(): void {
  isOpen.value = false
  document.body.style.overflow = ''
  emit('close')
}

async function renderQrLabel(): Promise<void> {
  if (!qrContainer.value || !shareUrl.value) return

  const qrCanvas = await renderBrandedQr(qrContainer.value, {
    url: shareUrl.value,
    size: 256
  })
  if (!qrCanvas) return

  const dataUrl = generateQrLabelDataUrl(qrCanvas, {
    url: shareUrl.value,
    size: 256,
    labelText: 'reheat'
  })
  if (dataUrl) {
    qrImageSrc.value = dataUrl
  }
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
  if (!shareUrl.value) return
  try {
    await navigator.share({
      title: `${props.recipeName} — ${formatDate(props.bakeDate)}`,
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
  <Transition name="bake-qr-fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      data-testid="bake-qr-modal-overlay"
      @click.self="close"
    >
      <div class="bg-surface border-2 border-stone-200 w-full max-w-sm max-h-[80vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b-2 border-stone-200">
          <h3 class="font-mono text-sm text-ink font-semibold">
            Share Bake
          </h3>
          <button
            class="icon-btn-inline"
            title="Close"
            data-testid="bake-qr-close-btn"
            @click="close"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Share content -->
        <div class="p-4">
          <p class="text-muted mb-1">{{ recipeName }}</p>
          <p class="font-mono text-xs text-ink mb-4">{{ formatDate(bakeDate) }}</p>

          <!-- Hidden canvas for QR generation -->
          <div ref="qrContainer" class="hidden" />

          <!-- Branded QR label image -->
          <div v-if="qrImageSrc" class="flex justify-center mb-4">
            <img
              :src="qrImageSrc"
              :alt="`Reheat instructions QR code for ${recipeName}`"
              class="w-full"
              style="-webkit-touch-callout: default;"
              data-testid="bake-qr-label"
            />
          </div>

          <!-- Link preview -->
          <div class="bg-stone-100 border-2 border-stone-200 p-3 mb-4">
            <p class="font-mono text-xs text-stone-500 break-all" data-testid="bake-qr-url">{{ shareUrl }}</p>
          </div>

          <!-- Actions -->
          <div class="space-y-2">
            <button
              class="w-full flex items-center justify-center gap-2 py-3 border-2 border-stone-200 hover:bg-stone-50 transition-colors font-mono text-sm text-ink"
              data-testid="bake-qr-copy-btn"
              @click="copyLink"
            >
              <Check v-if="copied" :size="16" class="text-green-600" />
              <Copy v-else :size="16" />
              {{ copied ? 'Copied!' : 'Copy Link' }}
            </button>

            <button
              v-if="hasNativeShare"
              class="w-full flex items-center justify-center gap-2 py-3 bg-ink text-surface font-mono text-sm transition-colors hover:bg-stone-700"
              data-testid="bake-qr-share-btn"
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
.bake-qr-fade-enter-active {
  transition: opacity 200ms ease-out;
}
.bake-qr-fade-leave-active {
  transition: opacity 150ms ease-in;
}
.bake-qr-fade-enter-from,
.bake-qr-fade-leave-to {
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
</style>
