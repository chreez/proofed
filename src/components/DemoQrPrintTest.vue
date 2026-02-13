<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QRCodeStyling from 'qr-code-styling'

const ACCENT = '#a65d45'
const INK = '#1a1816'
const TEST_URL = 'https://proofeddot.netlify.app/recipe/atk-cinnamon-buns-ultimate/bake/2026-02-10?shared=true'

interface Variant {
  id: string
  label: string
  description: string
  src: string | null
}

const variants = ref<Variant[]>([
  { id: 'raw-small', label: 'A: Raw QR (256px)', description: 'No branding, standard size. Baseline scan test.', src: null },
  { id: 'raw-large', label: 'B: Raw QR (512px)', description: 'No branding, 2x size. Tests if size helps scanning.', src: null },
  { id: 'branded', label: 'C: QR + proofed. (current)', description: 'Current branded label. Tests if branding interferes.', src: null },
  { id: 'quiet-zone', label: 'D: QR + extra quiet zone', description: 'Extra white padding around QR. Tests if quiet zone helps.', src: null },
  { id: 'high-contrast', label: 'E: Pure black/white QR', description: 'No accent colors, pure black dots. Tests if color causes issues.', src: null },
  { id: 'large-branded', label: 'F: Large branded (512px QR)', description: '2x branded label. Tests if bigger = better for label maker.', src: null },
  { id: 'plain-square', label: 'G: Plain square dots (no styling)', description: 'Standard square dots + square corners. Zero decorative styling. Isolates shape vs color.', src: null },
])

function generateQR(size: number, colors: { dots: string; corners: string }, plain = false): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'canvas',
      data: TEST_URL,
      margin: 8,
      dotsOptions: { color: colors.dots, type: plain ? 'square' : 'rounded' },
      cornersSquareOptions: { color: colors.corners, type: plain ? 'square' : 'extra-rounded' },
      cornersDotOptions: { color: colors.corners, type: plain ? 'square' : 'dot' },
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

function makeBrandedLabel(qrCanvas: HTMLCanvasElement, qrSize: number): string {
  const pad = 24
  const brandWidth = Math.max(200, qrSize * 0.8)
  const labelWidth = pad + qrSize + pad + brandWidth + pad
  const labelHeight = qrSize + pad * 2

  const label = document.createElement('canvas')
  label.width = labelWidth
  label.height = labelHeight
  const ctx = label.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, labelWidth, labelHeight)
  ctx.drawImage(qrCanvas, pad, pad, qrSize, qrSize)

  const textX = pad + qrSize + pad
  const fontSize = Math.round(qrSize * 0.19)
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
  ctx.textBaseline = 'middle'
  ctx.fillStyle = INK
  ctx.fillText('proofed', textX, labelHeight / 2)
  const w = ctx.measureText('proofed').width
  ctx.fillStyle = ACCENT
  ctx.fillText('.', textX + w, labelHeight / 2)

  return label.toDataURL('image/png')
}

function addQuietZone(qrCanvas: HTMLCanvasElement, extraPad: number): string {
  const w = qrCanvas.width + extraPad * 2
  const h = qrCanvas.height + extraPad * 2
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(qrCanvas, extraPad, extraPad)
  return canvas.toDataURL('image/png')
}

onMounted(async () => {
  // A: Raw small
  const rawSmall = await generateQR(256, { dots: INK, corners: ACCENT })
  variants.value[0].src = rawSmall.toDataURL('image/png')

  // B: Raw large
  const rawLarge = await generateQR(512, { dots: INK, corners: ACCENT })
  variants.value[1].src = rawLarge.toDataURL('image/png')

  // C: Branded (current style)
  const brandedQr = await generateQR(256, { dots: INK, corners: ACCENT })
  variants.value[2].src = makeBrandedLabel(brandedQr, 256)

  // D: Extra quiet zone
  const quietQr = await generateQR(256, { dots: INK, corners: ACCENT })
  variants.value[3].src = addQuietZone(quietQr, 48)

  // E: Pure black/white
  const bwQr = await generateQR(256, { dots: '#000000', corners: '#000000' })
  variants.value[4].src = bwQr.toDataURL('image/png')

  // F: Large branded
  const largeBrandedQr = await generateQR(512, { dots: INK, corners: ACCENT })
  variants.value[5].src = makeBrandedLabel(largeBrandedQr, 512)

  // G: Plain square dots — zero decorative styling, pure black
  const plainQr = await generateQR(256, { dots: '#000000', corners: '#000000' }, true)
  variants.value[6].src = plainQr.toDataURL('image/png')
})
</script>

<template>
  <div class="max-w-2xl mx-auto py-6 px-4">
    <h1 class="font-mono text-2xl text-ink mb-2">QR Print Test</h1>
    <p class="text-muted text-sm mb-6">Long-press each image to save. Print and scan to diagnose issues.</p>

    <div class="space-y-8">
      <div v-for="v in variants" :key="v.id" class="border-2 border-stone-200 p-4">
        <h3 class="font-mono text-sm text-ink font-semibold mb-1">{{ v.label }}</h3>
        <p class="text-xs text-stone-400 mb-3">{{ v.description }}</p>
        <div class="flex justify-center bg-white p-2">
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

    <p class="text-xs text-stone-400 mt-6">All variants encode: {{ TEST_URL }}</p>
  </div>
</template>
