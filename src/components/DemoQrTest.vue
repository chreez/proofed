<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import QRCodeStyling from 'qr-code-styling'
import { renderSVG } from 'uqr'

const TEST_URL = 'https://proofeddot.netlify.app/recipe/atk-cinnamon-buns-ultimate?shared=true&bake=2026-02-10'

// Brand colors
const ACCENT = '#a65d45'
const INK = '#1a1816'

// --- Library 1: qrcode (node-qrcode) ---
const qrcodeCanvas = ref<HTMLCanvasElement | null>(null)
const qrcodeError = ref<string | null>(null)

// --- Library 2: qr-code-styling ---
const stylingContainer = ref<HTMLDivElement | null>(null)
const stylingError = ref<string | null>(null)

// --- Library 3: uqr ---
const uqrSvg = ref('')
const uqrError = ref<string | null>(null)

onMounted(async () => {
  // Library 1: qrcode — render to canvas
  if (qrcodeCanvas.value) {
    try {
      await QRCode.toCanvas(qrcodeCanvas.value, TEST_URL, {
        width: 256,
        margin: 2,
        color: {
          dark: INK,
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
    } catch (e) {
      qrcodeError.value = String(e)
    }
  }

  // Library 2: qr-code-styling — render to container
  if (stylingContainer.value) {
    try {
      const qrCodeStyling = new QRCodeStyling({
        width: 256,
        height: 256,
        type: 'canvas',
        data: TEST_URL,
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
      qrCodeStyling.append(stylingContainer.value)
    } catch (e) {
      stylingError.value = String(e)
    }
  }

  // Library 3: uqr — render SVG string
  try {
    uqrSvg.value = renderSVG(TEST_URL, {
      border: 2,
      blackColor: INK,
      whiteColor: '#ffffff',
      pixelSize: 8
    })
  } catch (e) {
    uqrError.value = String(e)
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-8">
    <h2 class="text-heading text-2xl font-mono mb-2">QR Code Library Evaluation</h2>
    <p class="text-body mb-1">Comparing three libraries for generating saveable QR codes.</p>
    <p class="text-muted mb-2">PF-128.1 spike — throwaway demo for library comparison.</p>

    <!-- Test URL display -->
    <div class="card mb-8">
      <p class="font-mono text-xs text-muted mb-1">Encoded URL</p>
      <p class="font-mono text-xs text-stone-700 break-all">{{ TEST_URL }}</p>
    </div>

    <!-- Side-by-side grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

      <!-- Library 1: qrcode -->
      <div class="card">
        <h3 class="text-heading font-mono text-sm mb-1">qrcode</h3>
        <p class="text-muted mb-1">npm: <code class="font-mono">qrcode</code></p>
        <p class="text-muted mb-3">~30KB min+gz &middot; Canvas/DataURL &middot; TS via @types</p>

        <div class="flex justify-center mb-3">
          <canvas
            ref="qrcodeCanvas"
            class="border-2 border-stone-200"
          />
        </div>
        <p v-if="qrcodeError" class="text-danger text-xs font-mono">{{ qrcodeError }}</p>
        <p class="text-muted text-xs">Long-press/right-click canvas to save image.</p>

        <div class="mt-3 border-t border-stone-200 pt-3">
          <p class="font-mono text-xs text-muted mb-1">Pros</p>
          <ul class="text-xs text-stone-700 space-y-0.5 pl-3">
            <li>+ Most popular (50M+ weekly downloads)</li>
            <li>+ Canvas output = natively saveable</li>
            <li>+ Simple API (toCanvas, toDataURL)</li>
            <li>+ Customizable colors</li>
          </ul>
          <p class="font-mono text-xs text-muted mb-1 mt-2">Cons</p>
          <ul class="text-xs text-stone-700 space-y-0.5 pl-3">
            <li>- No dot/corner styling</li>
            <li>- TS types via @types (not built-in)</li>
            <li>- Larger than uqr</li>
          </ul>
        </div>
      </div>

      <!-- Library 2: qr-code-styling -->
      <div class="card">
        <h3 class="text-heading font-mono text-sm mb-1">qr-code-styling</h3>
        <p class="text-muted mb-1">npm: <code class="font-mono">qr-code-styling</code></p>
        <p class="text-muted mb-3">~50KB min+gz &middot; Canvas/SVG &middot; Built-in TS</p>

        <div ref="stylingContainer" class="flex justify-center mb-3 [&>canvas]:border-2 [&>canvas]:border-stone-200" />
        <p v-if="stylingError" class="text-danger text-xs font-mono">{{ stylingError }}</p>
        <p class="text-muted text-xs">Long-press/right-click canvas to save image.</p>

        <div class="mt-3 border-t border-stone-200 pt-3">
          <p class="font-mono text-xs text-muted mb-1">Pros</p>
          <ul class="text-xs text-stone-700 space-y-0.5 pl-3">
            <li>+ Custom dot shapes (rounded, dots, classy)</li>
            <li>+ Corner styling with brand colors</li>
            <li>+ Logo embedding support</li>
            <li>+ Built-in TypeScript types</li>
          </ul>
          <p class="font-mono text-xs text-muted mb-1 mt-2">Cons</p>
          <ul class="text-xs text-stone-700 space-y-0.5 pl-3">
            <li>- Largest bundle of the three</li>
            <li>- Append-to-DOM API (less Vue-idiomatic)</li>
            <li>- Fewer weekly downloads (~300K)</li>
          </ul>
        </div>
      </div>

      <!-- Library 3: uqr -->
      <div class="card">
        <h3 class="text-heading font-mono text-sm mb-1">uqr</h3>
        <p class="text-muted mb-1">npm: <code class="font-mono">uqr</code></p>
        <p class="text-muted mb-3">~1.5KB min+gz &middot; SVG only &middot; Built-in TS</p>

        <div class="flex justify-center mb-3">
          <div
            class="border-2 border-stone-200 inline-block [&>svg]:block [&>svg]:w-64 [&>svg]:h-64"
            v-html="uqrSvg"
          />
        </div>
        <p v-if="uqrError" class="text-danger text-xs font-mono">{{ uqrError }}</p>
        <p class="text-muted text-xs">SVG — right-click to save. For mobile save: needs canvas conversion.</p>

        <div class="mt-3 border-t border-stone-200 pt-3">
          <p class="font-mono text-xs text-muted mb-1">Pros</p>
          <ul class="text-xs text-stone-700 space-y-0.5 pl-3">
            <li>+ Tiny bundle (1.5KB gzipped)</li>
            <li>+ Zero dependencies, tree-shakable</li>
            <li>+ Built-in TypeScript types</li>
            <li>+ SVG = crisp at any size</li>
            <li>+ UnJS maintained</li>
          </ul>
          <p class="font-mono text-xs text-muted mb-1 mt-2">Cons</p>
          <ul class="text-xs text-stone-700 space-y-0.5 pl-3">
            <li>- SVG only (no canvas output)</li>
            <li>- No dot/corner customization</li>
            <li>- Mobile long-press save not native for SVG</li>
            <li>- Basic square pixels only</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Recommendation -->
    <div class="card">
      <h3 class="text-heading font-mono text-sm mb-2">Recommendation</h3>
      <div class="text-body text-sm space-y-2">
        <p>
          <strong>For proofed.:</strong> <code class="font-mono text-accent">qrcode</code> is the best fit.
        </p>
        <ul class="space-y-1 pl-4">
          <li>Canvas output means long-press-to-save works natively on iPhone.</li>
          <li>30KB is acceptable for a small personal app (not as lean as uqr, but the canvas API is worth it).</li>
          <li>Simple API — <code class="font-mono text-xs">QRCode.toCanvas(el, url, opts)</code> — one call, done.</li>
          <li>Color customization covers the brand need (ink foreground, white background).</li>
        </ul>
        <p class="text-muted mt-3">
          <strong>If brand styling matters more:</strong> <code class="font-mono">qr-code-styling</code> lets you do rounded dots + accent corners, but the extra ~20KB and DOM-append API are harder to justify for a single QR code on a share page.
        </p>
        <p class="text-muted">
          <strong>If bundle size is paramount:</strong> <code class="font-mono">uqr</code> at 1.5KB is unbeatable, but SVG output is not directly long-press-saveable on mobile without extra canvas conversion code.
        </p>
      </div>
    </div>
  </div>
</template>
