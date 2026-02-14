<script setup lang="ts">
import { ref, onMounted, type ComponentPublicInstance } from 'vue'

// Brand constants
const ACCENT = '#a65d45'
const INK = '#1a1816'
const STONE_50 = '#faf9f6'

const SIZES = [16, 32, 180] as const
type Size = (typeof SIZES)[number]

interface Candidate {
  key: string
  name: string
  description: string
  render: (ctx: CanvasRenderingContext2D, size: Size, bg: string) => void
}

// Canvas refs: keyed by `${candidateKey}-${size}-${bgLabel}`
const canvasRefs = ref<Record<string, HTMLCanvasElement | null>>({})

function setCanvasRef(key: string): (el: Element | ComponentPublicInstance | null) => void {
  return (el: Element | ComponentPublicInstance | null) => {
    canvasRefs.value[key] = el as HTMLCanvasElement | null
  }
}

function refKey(candidateKey: string, size: number, bg: string): string {
  return `${candidateKey}-${size}-${bg}`
}

// --- Candidate renderers ---

function renderAccentDot(ctx: CanvasRenderingContext2D, size: Size, bg: string): void {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)
  ctx.beginPath()
  const radius = size * 0.35
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2)
  ctx.fillStyle = ACCENT
  ctx.fill()
}

function renderPMonogram(ctx: CanvasRenderingContext2D, size: Size, bg: string): void {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  // Letter "p"
  const fontSize = Math.round(size * 0.7)
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = INK

  // Measure to position nicely
  const metrics = ctx.measureText('p')
  const textWidth = metrics.width
  // Position p so "p." is centered together
  const dotSize = size * 0.12
  const totalWidth = textWidth + dotSize + size * 0.02
  const startX = (size - totalWidth) / 2
  const baselineY = size * 0.72

  ctx.fillText('p', startX, baselineY)

  // Accent dot after the p
  ctx.beginPath()
  const dotX = startX + textWidth + size * 0.02 + dotSize / 2
  const dotY = baselineY
  ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2)
  ctx.fillStyle = ACCENT
  ctx.fill()
}

function renderFullLogotype(ctx: CanvasRenderingContext2D, size: Size, bg: string): void {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  const text = 'proofed'
  // Scale font to fit width
  const fontSize = Math.max(Math.round(size * 0.22), 3)
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillStyle = INK
  ctx.fillText(text, size / 2, size / 2)

  // Accent dot
  const textMetrics = ctx.measureText(text)
  const dotRadius = Math.max(fontSize * 0.12, 1)
  const dotX = size / 2 + textMetrics.width / 2 + dotRadius + 1
  const dotY = size / 2 + fontSize * 0.25
  ctx.beginPath()
  ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
  ctx.fillStyle = ACCENT
  ctx.fill()
}

function renderDotWithRise(ctx: CanvasRenderingContext2D, size: Size, bg: string): void {
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  // Accent dot — positioned in lower-center
  const dotRadius = size * 0.25
  const dotCenterX = size / 2
  const dotCenterY = size * 0.6
  ctx.beginPath()
  ctx.arc(dotCenterX, dotCenterY, dotRadius, 0, Math.PI * 2)
  ctx.fillStyle = ACCENT
  ctx.fill()

  // Rising arc above the dot
  ctx.beginPath()
  const arcStartX = dotCenterX - dotRadius * 1.2
  const arcEndX = dotCenterX + dotRadius * 1.2
  const arcY = dotCenterY - dotRadius * 1.3
  const arcPeakY = arcY - size * 0.15

  ctx.moveTo(arcStartX, arcY)
  ctx.quadraticCurveTo(dotCenterX, arcPeakY, arcEndX, arcY)
  ctx.strokeStyle = ACCENT
  ctx.lineWidth = Math.max(size * 0.06, 1)
  ctx.lineCap = 'round'
  ctx.stroke()
}

const candidates: Candidate[] = [
  {
    key: 'A',
    name: 'Accent dot only',
    description: 'A filled circle in accent color. Simple, bold, recognizable.',
    render: renderAccentDot
  },
  {
    key: 'B',
    name: 'p. monogram',
    description: 'Letter "p" in ink + accent dot. The brand initial.',
    render: renderPMonogram
  },
  {
    key: 'C',
    name: 'Full proofed. logotype',
    description: 'Full word in ink + accent dot. Tiny at 16px — shown for comparison.',
    render: renderFullLogotype
  },
  {
    key: 'D',
    name: 'Dot with rise line',
    description: 'Accent dot with upward arc suggesting bread rising. Minimalist but thematic.',
    render: renderDotWithRise
  }
]

const backgrounds = [
  { key: 'white', label: 'White bg', color: '#ffffff' },
  { key: 'dark', label: 'Dark bg', color: INK }
]

onMounted(() => {
  for (const candidate of candidates) {
    for (const size of SIZES) {
      for (const bg of backgrounds) {
        const key = refKey(candidate.key, size, bg.key)
        const canvas = canvasRefs.value[key]
        if (!canvas) continue
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        candidate.render(ctx, size, bg.color)
      }
    }
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-8">
    <h2 class="text-heading text-2xl font-mono mb-2">Favicon Design Candidates</h2>
    <p class="text-body mb-1">Comparing 4 favicon candidates at actual render sizes.</p>
    <p class="text-muted mb-6">PF-135.1 spike — throwaway demo for HITL review.</p>

    <!-- Size legend -->
    <div class="card mb-6">
      <p class="font-mono text-xs text-muted">
        Sizes: <strong>16px</strong> (browser tab) &middot; <strong>32px</strong> (taskbar/bookmark) &middot; <strong>180px</strong> (Apple touch icon)
      </p>
    </div>

    <!-- Candidate rows -->
    <div class="space-y-6">
      <div v-for="candidate in candidates" :key="candidate.key" class="card">
        <!-- Candidate header -->
        <div class="mb-4">
          <h3 class="text-heading font-mono text-lg mb-1">
            {{ candidate.key }}) {{ candidate.name }}
          </h3>
          <p class="text-muted">{{ candidate.description }}</p>
        </div>

        <!-- Background sections -->
        <div v-for="bg in backgrounds" :key="bg.key" class="mb-4 last:mb-0">
          <p class="font-mono text-xs text-muted mb-2">{{ bg.label }}</p>
          <div
            class="flex items-end gap-6 p-4 rounded-none border-2"
            :class="bg.key === 'dark' ? 'border-stone-600' : 'border-stone-200'"
            :style="{ backgroundColor: bg.key === 'dark' ? INK : STONE_50 }"
          >
            <div v-for="size in SIZES" :key="size" class="flex flex-col items-center gap-2">
              <canvas
                :ref="setCanvasRef(refKey(candidate.key, size, bg.key))"
                :width="size"
                :height="size"
                class="block"
                :style="{ width: `${size}px`, height: `${size}px` }"
              />
              <span
                class="font-mono text-[10px]"
                :class="bg.key === 'dark' ? 'text-stone-400' : 'text-stone-500'"
              >{{ size }}px</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div class="card mt-6">
      <h3 class="text-heading font-mono text-sm mb-2">Notes</h3>
      <ul class="text-body text-sm space-y-1 pl-4 list-disc">
        <li>Candidate C (full logotype) is illegible at 16px and 32px — included for confirmation.</li>
        <li>Candidate B (p. monogram) relies on JetBrains Mono being loaded in the canvas context.</li>
        <li>All candidates use brand accent (#a65d45) and ink (#1a1816) colors.</li>
        <li>Final favicon will be exported as .ico (16+32), .png (32), and apple-touch-icon (180).</li>
      </ul>
    </div>
  </div>
</template>
