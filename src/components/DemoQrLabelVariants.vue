<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QRCodeStyling from 'qr-code-styling'

const ACCENT = '#a65d45'
const INK = '#1a1816'
const STONE_500 = '#78716c'
const TEST_URL = 'https://proofeddot.netlify.app/recipe/atk-cinnamon-buns-ultimate/bake/2026-02-10?shared=true'

interface Variant {
  id: string
  label: string
  description: string
  src: string | null
}

const variants = ref<Variant[]>([
  { id: 'a', label: 'A: reheat instructions.', description: 'Two lines, lowercase, accent dot. Current direction.', src: null },
  { id: 'b', label: 'B: REHEAT INSTRUCTIONS', description: 'All caps, no dot. Industrial/functional.', src: null },
  { id: 'c', label: 'C: scan to reheat.', description: 'Action-oriented, lowercase, accent dot.', src: null },
  { id: 'd', label: 'D: reheat. (single word)', description: 'Minimal. One word + dot. Lets QR do the talking.', src: null },
  { id: 'e', label: 'E: how to reheat.', description: 'Question-style, lowercase, accent dot.', src: null },
  { id: 'f', label: 'F: warming instructions.', description: 'Softer word. "Warming" vs "reheat".', src: null },
  { id: 'g', label: 'G: reheat instructions. (small text)', description: 'Same as A but smaller font — fits tighter sticker.', src: null },
  { id: 'h', label: 'H: reheat instructions. (stacked center)', description: 'Vertical layout — text centered below QR. Different form factor.', src: null },
  { id: 'i', label: 'I: Reheat Instructions (title case)', description: 'Title case, no dot. More formal.', src: null },
  { id: 'j', label: 'J: reheat instructions. (muted subtitle)', description: 'Two-tone: "reheat" bold, "instructions" muted. Visual hierarchy.', src: null },
])

function generateQR(size: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'canvas',
      data: TEST_URL,
      margin: 8,
      dotsOptions: { color: INK, type: 'rounded' },
      cornersSquareOptions: { color: ACCENT, type: 'extra-rounded' },
      cornersDotOptions: { color: ACCENT, type: 'dot' },
      backgroundOptions: { color: '#ffffff' },
      qrOptions: { errorCorrectionLevel: 'M' }
    })
    qr.append(container)
    setTimeout(() => {
      const canvas = container.querySelector('canvas')
      if (canvas) resolve(canvas)
    }, 400)
  })
}

interface HorizontalOpts {
  line1: string
  line2?: string
  fontSize: number
  qrSize: number
  allCaps?: boolean
  titleCase?: boolean
  dot?: boolean
  dotColor?: string
  line2Muted?: boolean
}

function makeHorizontalLabel(qrCanvas: HTMLCanvasElement, opts: HorizontalOpts): string {
  const { line1, line2, fontSize, qrSize, dot = true, dotColor = ACCENT, line2Muted = false } = opts
  const pad = 20
  const gap = 16
  const dotRadius = Math.round(fontSize * 0.11)

  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
  const line1Width = ctx.measureText(line1).width
  const line2Width = line2 ? ctx.measureText(line2).width : 0
  const maxTextWidth = Math.max(line1Width, line2Width)
  const dotExtra = dot ? dotRadius * 2 + 8 : 0

  const rightColWidth = maxTextWidth + dotExtra + 4
  const labelWidth = pad + qrSize + gap + rightColWidth + pad
  const labelHeight = qrSize + pad * 2

  const label = document.createElement('canvas')
  label.width = labelWidth
  label.height = labelHeight
  const lctx = label.getContext('2d')!

  lctx.fillStyle = '#ffffff'
  lctx.fillRect(0, 0, labelWidth, labelHeight)
  lctx.drawImage(qrCanvas, pad, pad, qrSize, qrSize)

  const textX = pad + qrSize + gap
  const centerY = labelHeight / 2
  lctx.textBaseline = 'middle'
  lctx.textAlign = 'left'

  if (line2) {
    // Two lines
    lctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
    lctx.fillStyle = INK
    lctx.fillText(line1, textX, centerY - fontSize * 0.6)

    if (line2Muted) {
      lctx.font = `${fontSize}px "JetBrains Mono", monospace`
      lctx.fillStyle = STONE_500
    }
    lctx.fillText(line2, textX, centerY + fontSize * 0.6)

    // Dot after line2
    if (dot) {
      const w = line2Muted
        ? (() => { lctx.font = `${fontSize}px "JetBrains Mono", monospace`; return lctx.measureText(line2).width })()
        : lctx.measureText(line2).width
      const dotX = textX + w + dotRadius + 4
      const dotY = centerY + fontSize * 0.6 + fontSize * 0.2
      lctx.beginPath()
      lctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
      lctx.fillStyle = dotColor
      lctx.fill()
    }
  } else {
    // Single line
    lctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
    lctx.fillStyle = INK
    lctx.fillText(line1, textX, centerY)

    if (dot) {
      const w = lctx.measureText(line1).width
      const dotX = textX + w + dotRadius + 4
      const dotY = centerY + fontSize * 0.2
      lctx.beginPath()
      lctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
      lctx.fillStyle = dotColor
      lctx.fill()
    }
  }

  return label.toDataURL('image/png')
}

function makeVerticalLabel(qrCanvas: HTMLCanvasElement, line1: string, line2: string, fontSize: number, qrSize: number): string {
  const pad = 20
  const textGap = 8
  const lineHeight = fontSize * 1.3

  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
  const dotRadius = Math.round(fontSize * 0.11)

  const labelWidth = qrSize + pad * 2
  const labelHeight = pad + qrSize + textGap + lineHeight * 2 + pad

  const label = document.createElement('canvas')
  label.width = labelWidth
  label.height = labelHeight
  const lctx = label.getContext('2d')!

  lctx.fillStyle = '#ffffff'
  lctx.fillRect(0, 0, labelWidth, labelHeight)
  lctx.drawImage(qrCanvas, pad, pad, qrSize, qrSize)

  lctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
  lctx.textAlign = 'center'
  lctx.textBaseline = 'middle'
  lctx.fillStyle = INK

  const textY1 = pad + qrSize + textGap + lineHeight * 0.5
  const textY2 = textY1 + lineHeight
  lctx.fillText(line1, labelWidth / 2, textY1)
  lctx.fillText(line2, labelWidth / 2, textY2)

  // Dot after line2
  const w2 = lctx.measureText(line2).width
  const dotX = labelWidth / 2 + w2 / 2 + dotRadius + 4
  const dotY = textY2 + fontSize * 0.2
  lctx.beginPath()
  lctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
  lctx.fillStyle = ACCENT
  lctx.fill()

  return label.toDataURL('image/png')
}

onMounted(async () => {
  const qr = await generateQR(256)

  // A: reheat instructions. (two lines, lowercase, accent dot)
  variants.value[0].src = makeHorizontalLabel(qr, { line1: 'reheat', line2: 'instructions', fontSize: 36, qrSize: 256 })

  // B: REHEAT INSTRUCTIONS (all caps, no dot)
  variants.value[1].src = makeHorizontalLabel(qr, { line1: 'REHEAT', line2: 'INSTRUCTIONS', fontSize: 32, qrSize: 256, dot: false })

  // C: scan to reheat.
  variants.value[2].src = makeHorizontalLabel(qr, { line1: 'scan to', line2: 'reheat', fontSize: 36, qrSize: 256 })

  // D: reheat. (single word)
  variants.value[3].src = makeHorizontalLabel(qr, { line1: 'reheat', fontSize: 48, qrSize: 256 })

  // E: how to reheat.
  variants.value[4].src = makeHorizontalLabel(qr, { line1: 'how to', line2: 'reheat', fontSize: 36, qrSize: 256 })

  // F: warming instructions.
  variants.value[5].src = makeHorizontalLabel(qr, { line1: 'warming', line2: 'instructions', fontSize: 34, qrSize: 256 })

  // G: reheat instructions. (small text — tighter sticker)
  variants.value[6].src = makeHorizontalLabel(qr, { line1: 'reheat', line2: 'instructions', fontSize: 28, qrSize: 256 })

  // H: reheat instructions. (stacked center — vertical)
  variants.value[7].src = makeVerticalLabel(qr, 'reheat', 'instructions', 28, 256)

  // I: Reheat Instructions (title case, no dot)
  variants.value[8].src = makeHorizontalLabel(qr, { line1: 'Reheat', line2: 'Instructions', fontSize: 36, qrSize: 256, dot: false })

  // J: reheat instructions. (muted subtitle)
  variants.value[9].src = makeHorizontalLabel(qr, { line1: 'reheat', line2: 'instructions', fontSize: 36, qrSize: 256, line2Muted: true })
})
</script>

<template>
  <div class="max-w-3xl mx-auto py-6 px-4">
    <h1 class="font-mono text-2xl text-ink mb-2">QR Label Variants</h1>
    <p class="text-muted text-sm mb-6">Pick a direction. Long-press to save any image for print testing.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="v in variants" :key="v.id" class="border-2 border-stone-200 p-4">
        <h3 class="font-mono text-sm text-ink font-semibold mb-1">{{ v.label }}</h3>
        <p class="text-xs text-stone-400 mb-3">{{ v.description }}</p>
        <div class="flex justify-center bg-white p-2 border border-stone-100">
          <img
            v-if="v.src"
            :src="v.src"
            :alt="v.label"
            class="max-w-full"
            style="-webkit-touch-callout: default;"
          />
          <p v-else class="text-muted text-sm py-8">Generating...</p>
        </div>
      </div>
    </div>

    <p class="text-xs text-stone-400 mt-6">All variants encode the same test URL. This page is a throwaway demo — not production.</p>
  </div>
</template>
