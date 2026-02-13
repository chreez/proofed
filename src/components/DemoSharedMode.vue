<script setup lang="ts">
import { ref } from 'vue'
import { marked } from 'marked'
import { Bot } from 'lucide-vue-next'

// --- Hardcoded bake data (from 2026-02-10 ATK cinnamon buns entry) ---
const bakeData = {
  date: '2026-02-10',
  version: 'v1.2.0',
  recipeName: 'ATK Ultimate Cinnamon Buns',
  summary: 'I did an overnight cold proof with the v1.2.0 reduced-sugar recipe, subbing ~40g water for milk I was short on, and added nutmeg and espresso to the icing. The sweetness level was much better than v1.0, but the rolls may have slightly overproofed — uneven sizing with smaller ones overtaken by neighbors — and I couldn\'t detect the nutmeg or espresso in the glaze.',
  notes: [
    '**Second bake** — overnight cold proof, short on milk (~40g replaced with water)',
    'Dough was tacky not sticky — hard to form into a ball, left unshaped in fridge overnight',
    'Day 2: waited longer for dough to come to room temp, much easier to shape. Overnight proof removes variance of underworking.',
    'Rolls hard to keep sealed after cutting — tried thread (not great), need dental floss next time',
    'Added **nutmeg + espresso** (2 pinches each, ground) to icing. Frosting tasted good but couldn\'t discern either spice.',
    'Possible overproof — rolls stuck together, smaller ones overtaken by bigger neighbors',
    'Bouncy/lighter poke test. Possibly slightly undercooked (no internal temp taken).',
    'Sweetness much better than v1.0 — tolerable level. Overall a success.',
    'Made a fresh latte to go with it — coffee pairs well, the bitterness offsets the sweetness.',
    'Herbert went wild when I opened the cling wrap on the proofed dough — never heard him whine like that before.',
    'Prediction: this batch will reheat well — planning to try in the air fryer tomorrow.'
  ],
  nextTime: [
    { text: 'Check internal temp for doneness' },
    { text: 'Try dental floss for cleaner roll cuts' },
    { text: 'Try air fryer directly after cooling phase — still warm, might add a nice crust' },
    { text: 'Get milk in advance — avoid water sub' },
    { text: 'Figure out consistent roll sizing' },
    { text: 'More cream cheese in glaze — love that cream cheese taste' }
  ],
  photos: [
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/fullsizerender-vsco-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/fullsizerender-vsco-400w.webp', alt: 'Herbert really thinks he\'s getting a roll' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6757-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6757-400w.webp', alt: 'Pulled out of the fridge' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6761-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6761-400w.webp', alt: 'Me patting the rectangle' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6768-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6768-400w.webp', alt: 'Administering the butter filling' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6771-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6771-400w.webp', alt: 'Pressing down on cinnamon mix' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6779-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6779-400w.webp', alt: 'Cutting the roll' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6783-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6783-400w.webp', alt: 'You can see the final roll here is somewhat smaller (on the edges)' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6797-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6797-400w.webp', alt: 'Cinnamon roll isolated on plate' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6798-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6798-400w.webp', alt: 'Side of roll' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6801-vsco-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6801-vsco-400w.webp', alt: 'Cinnamon roll with coffee' },
    { src: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6794-vsco-800w.webp', thumb: '/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6794-vsco-400w.webp', alt: 'Fresh out of the oven (before icing)' }
  ]
}

// Hero = last photo in array
const heroPhoto = bakeData.photos[bakeData.photos.length - 1]
const supportingPhotos = bakeData.photos.slice(0, -1)

// Popover state
const popoverVisible = ref(true)

function dismissPopover(): void {
  popoverVisible.value = false
  document.body.style.overflow = ''
}

// Lock scroll when popover is visible
if (popoverVisible.value) {
  document.body.style.overflow = 'hidden'
}

// Render notes as markdown bullet list
function renderNotes(): string {
  const md = bakeData.notes.map(n => `- ${n}`).join('\n')
  return marked.parse(md) as string
}

// Render next_time as markdown
function renderNextTime(): string {
  const md = bakeData.nextTime.map(n => `- ${n.text}`).join('\n')
  return marked.parse(md) as string
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dateStr} — ${weekday}`
}

// Reheat data placeholder
const reheatInstructions = [
  { method: 'Air Fryer', detail: '300°F, 5 min. Loosely wrap in foil — cover top if dried out.', source: 'user' as 'user' | 'agent' },
  { method: 'Microwave', detail: 'Damp paper towel, 20-30 sec.', source: 'user' as 'user' | 'agent' },
  { method: 'Storage', detail: 'Room temp, covered. Best within 2 days.', source: 'agent' as 'user' | 'agent' }
]
</script>

<template>
  <div>
    <!-- ====== BAKE DETAIL CONTENT (behind popover) ====== -->
    <div class="max-w-2xl mx-auto py-6">
      <!-- Header -->
      <div class="mb-4">
        <h2 class="text-heading text-2xl font-mono mb-1">{{ bakeData.recipeName }}</h2>
        <div class="flex items-center gap-3">
          <span class="text-muted font-mono">{{ formatDate(bakeData.date) }}</span>
          <span class="text-xs bg-stone-200 px-2 py-0.5">{{ bakeData.version }}</span>
        </div>
      </div>

      <!-- Summary -->
      <p class="text-body mb-6">{{ bakeData.summary }}</p>

      <!-- Hero photo -->
      <div class="mb-4">
        <img
          :src="heroPhoto.src"
          :alt="heroPhoto.alt"
          :title="heroPhoto.alt"
          loading="lazy"
          decoding="async"
          class="w-full border-2 border-stone-200"
        />
      </div>

      <!-- Supporting photos: horizontal scroll -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
        <img
          v-for="(photo, i) in supportingPhotos"
          :key="i"
          :src="photo.thumb"
          :alt="photo.alt"
          :title="photo.alt"
          loading="lazy"
          decoding="async"
          class="h-20 w-auto border-2 border-stone-200 flex-shrink-0"
        />
      </div>

      <!-- Notes -->
      <div class="mb-6">
        <h4 class="text-heading font-mono text-sm mb-2">Notes</h4>
        <div class="bake-prose" v-html="renderNotes()" />
      </div>

      <!-- Next Time -->
      <div class="mb-6">
        <h4 class="text-heading font-mono text-sm mb-2 text-accent">Next Time</h4>
        <div class="bake-prose" v-html="renderNextTime()" />
      </div>
    </div>

    <!-- ====== WELCOME POPOVER OVERLAY ====== -->
    <Transition name="popover-fade">
      <div
        v-if="popoverVisible"
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        @click.self="dismissPopover"
      >
        <div class="popover-card bg-surface border-2 border-stone-200 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <!-- Greeting -->
          <div class="p-5 pb-0">
            <h2 class="font-mono text-lg text-ink mb-1">
              Hey, I'm Chris<span class="text-accent">.</span>
            </h2>
            <p class="text-body text-sm whitespace-nowrap overflow-hidden">
              I baked these for you. Here's how to reheat them.
            </p>
          </div>

          <!-- Hero photo (cropped preview) -->
          <div class="px-5 pt-3">
            <div class="w-full h-32 overflow-hidden border-2 border-stone-200">
              <img
                :src="heroPhoto.src"
                :alt="heroPhoto.alt"
                loading="eager"
                decoding="async"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <p class="text-muted text-xs mt-1 font-mono">{{ bakeData.recipeName }} — {{ bakeData.date }}</p>
          </div>

          <!-- Reheat instructions -->
          <div class="mx-5 mt-4 border-2 border-stone-200 bg-stone-50">
            <div class="px-4 py-3 border-b-2 border-stone-200">
              <h3 class="font-mono text-sm text-ink font-semibold">Reheat — {{ bakeData.recipeName }}</h3>
            </div>
            <div class="px-4 py-3 space-y-3">
              <div
                v-for="(item, i) in reheatInstructions"
                :key="i"
                class="text-sm"
              >
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-xs text-accent font-medium">{{ item.method }}</span>
                </div>
                <p class="text-stone-600 mt-0.5">{{ item.detail }}</p>
                <p v-if="item.source === 'agent'" class="text-stone-400 text-xs mt-0.5 flex items-center gap-1">
                  <Bot class="w-3 h-3 flex-shrink-0" />
                  <span>{{ item.method }} tip is ai generated, not from Chris</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Dismiss button -->
          <div class="p-5">
            <button
              class="btn-primary w-full font-mono text-sm"
              @click="dismissPopover"
            >
              View Full Bake Details
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Popover fade transition */
.popover-fade-enter-active {
  transition: opacity 200ms ease-out;
}
.popover-fade-leave-active {
  transition: opacity 150ms ease-in;
}
.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
}

/* Bake detail prose (matches BakeDetailView) */
.bake-prose {
  font-size: 0.875rem;
  color: var(--color-stone-600);
  line-height: 1.6;
}

.bake-prose :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
}

.bake-prose :deep(li) {
  margin-bottom: 0.375rem;
}

.bake-prose :deep(strong) {
  color: var(--color-stone-700);
  font-weight: 600;
}

.bake-prose :deep(em) {
  color: var(--color-stone-500);
}
</style>
