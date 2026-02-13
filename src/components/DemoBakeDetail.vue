<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// --- Hardcoded bake data ---
const bakeData = {
  date: '2026-02-10',
  version: 'v1.2.0',
  recipeName: 'ATK Cinnamon Buns Ultimate',
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
    'Check internal temp for doneness',
    'Try dental floss for cleaner roll cuts',
    'Try air fryer directly after cooling phase — still warm, might add a nice crust',
    'Get milk in advance — avoid water sub',
    'Figure out consistent roll sizing',
    'More cream cheese in glaze — love that cream cheese taste'
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

// Hero = last photo
const heroPhoto = bakeData.photos[bakeData.photos.length - 1]
const supportingPhotos = bakeData.photos.slice(0, -1)

// Bold markdown → <strong>
function renderBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

// --- Pattern states ---
const modalOpen = ref(false)
const panelOpen = ref(false)
const modalShared = ref(false)
const routeShared = ref(false)
const panelShared = ref(false)

// Is this the route-view sub-page?
const isRouteView = computed(() => route.name === 'bake-detail-route-view')

function openModal() {
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
}
function closeModal() {
  modalOpen.value = false
  document.body.style.overflow = ''
}

function openRouteView() {
  router.push('/demo/bake-detail/route-view')
}
function closeRouteView() {
  router.push('/demo/bake-detail')
}

function openPanel() {
  panelOpen.value = true
  document.body.style.overflow = 'hidden'
}
function closePanel() {
  panelOpen.value = false
  document.body.style.overflow = ''
}
</script>

<template>
  <div>
    <!-- Landing page: show when NOT on route-view -->
    <div v-if="!isRouteView" class="max-w-3xl mx-auto py-8">
      <h2 class="text-heading text-2xl font-mono mb-2">Bake Detail View Patterns</h2>
      <p class="text-body mb-1">Comparing three approaches for showing a single bake entry from a cook log.</p>
      <p class="text-muted mb-8">DRAFT-6.1 spike — throwaway demo for visual comparison.</p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <!-- Pattern A -->
        <div class="card">
          <h3 class="text-heading font-mono text-sm mb-1">Pattern A</h3>
          <p class="text-muted mb-3">Full-screen modal overlay. Content scrolls inside. Immersive feel.</p>
          <button class="btn-primary w-full" @click="openModal">Open Modal</button>
        </div>

        <!-- Pattern B -->
        <div class="card">
          <h3 class="text-heading font-mono text-sm mb-1">Pattern B</h3>
          <p class="text-muted mb-3">Separate route. Normal page with back navigation. Standard feel.</p>
          <button class="btn-primary w-full" @click="openRouteView">Open Route</button>
        </div>

        <!-- Pattern C -->
        <div class="card">
          <h3 class="text-heading font-mono text-sm mb-1">Pattern C</h3>
          <p class="text-muted mb-3">Slide-in panel. Desktop: right side 60%. Mobile: bottom sheet. Peek feel.</p>
          <button class="btn-primary w-full" @click="openPanel">Open Panel</button>
        </div>
      </div>

      <!-- Quick visual reference of the bake data -->
      <div class="card">
        <h3 class="text-heading font-mono text-sm mb-2">Data Preview</h3>
        <p class="text-body text-sm">{{ bakeData.recipeName }} &mdash; {{ bakeData.date }} ({{ bakeData.version }})</p>
        <p class="text-muted mt-1">{{ bakeData.notes.length }} notes, {{ bakeData.nextTime.length }} next-time items, {{ bakeData.photos.length }} photos</p>
      </div>
    </div>

    <!-- ==================== PATTERN A: Full-Screen Modal ==================== -->
    <Transition name="modal-fade">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto"
        @click.self="closeModal"
      >
        <div class="bg-surface w-full max-w-2xl my-8 mx-4 border-2 border-stone-200 rounded-none relative">
          <!-- Close button -->
          <button
            class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-stone-500 hover:text-ink transition-colors z-10"
            @click="closeModal"
          >
            <span class="text-xl font-mono">&times;</span>
          </button>

          <!-- Shared mode toggle -->
          <div class="p-4 border-b-2 border-stone-200 flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="modalShared" class="accent-accent w-4 h-4" />
              <span class="font-mono text-xs text-muted">Shared mode (PF-128)</span>
            </label>
            <span class="font-mono text-[10px] text-stone-400 border border-stone-300 px-1.5 py-0.5">Pattern A: Modal</span>
          </div>

          <!-- Content: Shared mode -->
          <div v-if="modalShared" class="p-6">
            <div class="voice-human mb-6">
              <p class="text-body">Hey, I'm Chris. I baked these for you.</p>
            </div>

            <p class="text-muted font-mono mb-4">{{ bakeData.date }} &middot; {{ bakeData.version }}</p>
            <p class="text-body mb-6">{{ bakeData.summary }}</p>

            <div class="card mb-6">
              <p class="font-mono text-xs text-muted mb-1">Reheat</p>
              <p class="text-body">350°F for 8-10 min (or microwave 20s). Best within 2 days.</p>
            </div>

            <h4 class="text-heading font-mono text-sm mb-3">Photos from the batch you received</h4>

            <!-- Hero -->
            <div class="mb-4">
              <img :src="heroPhoto.src" :alt="heroPhoto.alt" class="w-full border-2 border-stone-200 rounded-none" />
            </div>

            <!-- Gallery -->
            <div class="flex gap-2 overflow-x-auto pb-2">
              <img
                v-for="(photo, i) in supportingPhotos"
                :key="i"
                :src="photo.thumb"
                :alt="photo.alt"
                class="w-20 h-20 object-cover border-2 border-stone-200 rounded-none flex-shrink-0"
              />
            </div>

            <a href="#" class="block mt-6 text-accent font-mono text-sm hover:underline">View full recipe &rarr;</a>
          </div>

          <!-- Content: Normal mode -->
          <div v-else class="p-6">
            <h3 class="text-heading text-lg font-mono mb-1">{{ bakeData.recipeName }}</h3>
            <p class="text-muted font-mono mb-4">{{ bakeData.date }} &middot; {{ bakeData.version }}</p>

            <p class="text-body mb-6">{{ bakeData.summary }}</p>

            <!-- Hero -->
            <div class="mb-4">
              <img :src="heroPhoto.src" :alt="heroPhoto.alt" class="w-full border-2 border-stone-200 rounded-none" />
            </div>

            <!-- Gallery -->
            <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
              <img
                v-for="(photo, i) in supportingPhotos"
                :key="i"
                :src="photo.thumb"
                :alt="photo.alt"
                class="w-20 h-20 object-cover border-2 border-stone-200 rounded-none flex-shrink-0"
              />
            </div>

            <!-- Notes -->
            <div class="mb-6">
              <h4 class="text-heading font-mono text-sm mb-2">Notes</h4>
              <ul class="space-y-1">
                <li v-for="(note, i) in bakeData.notes" :key="i" class="text-body text-sm pl-4 relative">
                  <span class="absolute left-0 text-stone-400">&bull;</span>
                  <span v-html="renderBold(note)"></span>
                </li>
              </ul>
            </div>

            <!-- Next time -->
            <div>
              <h4 class="text-heading font-mono text-sm mb-2">Next Time</h4>
              <ul class="space-y-1">
                <li v-for="(item, i) in bakeData.nextTime" :key="i" class="text-body text-sm pl-4 relative">
                  <span class="absolute left-0 text-accent">&rarr;</span>
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ==================== PATTERN B: Route View ==================== -->
    <div v-if="isRouteView" class="max-w-2xl mx-auto py-6">
      <!-- Back button -->
      <button class="btn-secondary mb-6 flex items-center gap-2" @click="closeRouteView">
        <span class="font-mono">&larr;</span>
        Back to demo
      </button>

      <!-- Shared mode toggle -->
      <div class="card mb-6 flex items-center gap-3">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="routeShared" class="accent-accent w-4 h-4" />
          <span class="font-mono text-xs text-muted">Shared mode (PF-128)</span>
        </label>
        <span class="font-mono text-[10px] text-stone-400 border border-stone-300 px-1.5 py-0.5">Pattern B: Route</span>
      </div>

      <!-- Content: Shared mode -->
      <div v-if="routeShared">
        <div class="voice-human mb-6">
          <p class="text-body">Hey, I'm Chris. I baked these for you.</p>
        </div>

        <p class="text-muted font-mono mb-4">{{ bakeData.date }} &middot; {{ bakeData.version }}</p>
        <p class="text-body mb-6">{{ bakeData.summary }}</p>

        <div class="card mb-6">
          <p class="font-mono text-xs text-muted mb-1">Reheat</p>
          <p class="text-body">350°F for 8-10 min (or microwave 20s). Best within 2 days.</p>
        </div>

        <h4 class="text-heading font-mono text-sm mb-3">Photos from the batch you received</h4>

        <div class="mb-4">
          <img :src="heroPhoto.src" :alt="heroPhoto.alt" class="w-full border-2 border-stone-200 rounded-none" />
        </div>

        <div class="flex gap-2 overflow-x-auto pb-2">
          <img
            v-for="(photo, i) in supportingPhotos"
            :key="i"
            :src="photo.thumb"
            :alt="photo.alt"
            class="w-20 h-20 object-cover border-2 border-stone-200 rounded-none flex-shrink-0"
          />
        </div>

        <a href="#" class="block mt-6 text-accent font-mono text-sm hover:underline">View full recipe &rarr;</a>
      </div>

      <!-- Content: Normal mode -->
      <div v-else>
        <h3 class="text-heading text-2xl font-mono mb-1">{{ bakeData.recipeName }}</h3>
        <p class="text-muted font-mono mb-4">{{ bakeData.date }} &middot; {{ bakeData.version }}</p>

        <p class="text-body mb-6">{{ bakeData.summary }}</p>

        <div class="mb-4">
          <img :src="heroPhoto.src" :alt="heroPhoto.alt" class="w-full border-2 border-stone-200 rounded-none" />
        </div>

        <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
          <img
            v-for="(photo, i) in supportingPhotos"
            :key="i"
            :src="photo.thumb"
            :alt="photo.alt"
            class="w-20 h-20 object-cover border-2 border-stone-200 rounded-none flex-shrink-0"
          />
        </div>

        <div class="mb-6">
          <h4 class="text-heading font-mono text-sm mb-2">Notes</h4>
          <ul class="space-y-1">
            <li v-for="(note, i) in bakeData.notes" :key="i" class="text-body text-sm pl-4 relative">
              <span class="absolute left-0 text-stone-400">&bull;</span>
              <span v-html="renderBold(note)"></span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="text-heading font-mono text-sm mb-2">Next Time</h4>
          <ul class="space-y-1">
            <li v-for="(item, i) in bakeData.nextTime" :key="i" class="text-body text-sm pl-4 relative">
              <span class="absolute left-0 text-accent">&rarr;</span>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ==================== PATTERN C: Slide-in Panel ==================== -->
    <Transition name="panel-backdrop">
      <div
        v-if="panelOpen"
        class="fixed inset-0 z-50 bg-black/40"
        @click="closePanel"
      />
    </Transition>

    <Transition name="panel-slide">
      <div
        v-if="panelOpen"
        class="panel-container fixed z-50 bg-surface border-2 border-stone-200 rounded-none overflow-y-auto"
      >
        <!-- Close button -->
        <button
          class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-stone-500 hover:text-ink transition-colors z-10"
          @click="closePanel"
        >
          <span class="text-xl font-mono">&times;</span>
        </button>

        <!-- Shared mode toggle -->
        <div class="p-4 border-b-2 border-stone-200 flex items-center gap-3 sticky top-0 bg-surface z-5">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="panelShared" class="accent-accent w-4 h-4" />
            <span class="font-mono text-xs text-muted">Shared mode (PF-128)</span>
          </label>
          <span class="font-mono text-[10px] text-stone-400 border border-stone-300 px-1.5 py-0.5">Pattern C: Panel</span>
        </div>

        <!-- Content: Shared mode -->
        <div v-if="panelShared" class="p-6">
          <div class="voice-human mb-6">
            <p class="text-body">Hey, I'm Chris. I baked these for you.</p>
          </div>

          <p class="text-muted font-mono mb-4">{{ bakeData.date }} &middot; {{ bakeData.version }}</p>
          <p class="text-body mb-6">{{ bakeData.summary }}</p>

          <div class="card mb-6">
            <p class="font-mono text-xs text-muted mb-1">Reheat</p>
            <p class="text-body">350°F for 8-10 min (or microwave 20s). Best within 2 days.</p>
          </div>

          <h4 class="text-heading font-mono text-sm mb-3">Photos from the batch you received</h4>

          <div class="mb-4">
            <img :src="heroPhoto.src" :alt="heroPhoto.alt" class="w-full border-2 border-stone-200 rounded-none" />
          </div>

          <div class="flex gap-2 overflow-x-auto pb-2">
            <img
              v-for="(photo, i) in supportingPhotos"
              :key="i"
              :src="photo.thumb"
              :alt="photo.alt"
              class="w-20 h-20 object-cover border-2 border-stone-200 rounded-none flex-shrink-0"
            />
          </div>

          <a href="#" class="block mt-6 text-accent font-mono text-sm hover:underline">View full recipe &rarr;</a>
        </div>

        <!-- Content: Normal mode -->
        <div v-else class="p-6">
          <h3 class="text-heading text-lg font-mono mb-1">{{ bakeData.recipeName }}</h3>
          <p class="text-muted font-mono mb-4">{{ bakeData.date }} &middot; {{ bakeData.version }}</p>

          <p class="text-body mb-6">{{ bakeData.summary }}</p>

          <div class="mb-4">
            <img :src="heroPhoto.src" :alt="heroPhoto.alt" class="w-full border-2 border-stone-200 rounded-none" />
          </div>

          <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
            <img
              v-for="(photo, i) in supportingPhotos"
              :key="i"
              :src="photo.thumb"
              :alt="photo.alt"
              class="w-20 h-20 object-cover border-2 border-stone-200 rounded-none flex-shrink-0"
            />
          </div>

          <div class="mb-6">
            <h4 class="text-heading font-mono text-sm mb-2">Notes</h4>
            <ul class="space-y-1">
              <li v-for="(note, i) in bakeData.notes" :key="i" class="text-body text-sm pl-4 relative">
                <span class="absolute left-0 text-stone-400">&bull;</span>
                <span v-html="renderBold(note)"></span>
              </li>
            </ul>
          </div>

          <div>
            <h4 class="text-heading font-mono text-sm mb-2">Next Time</h4>
            <ul class="space-y-1">
              <li v-for="(item, i) in bakeData.nextTime" :key="i" class="text-body text-sm pl-4 relative">
                <span class="absolute left-0 text-accent">&rarr;</span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* === Modal fade transition === */
.modal-fade-enter-active {
  transition: opacity 200ms ease-out;
}
.modal-fade-leave-active {
  transition: opacity 150ms ease-in;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* === Panel backdrop transition === */
.panel-backdrop-enter-active {
  transition: opacity 200ms ease-out;
}
.panel-backdrop-leave-active {
  transition: opacity 150ms ease-in;
}
.panel-backdrop-enter-from,
.panel-backdrop-leave-to {
  opacity: 0;
}

/* === Panel container: desktop = right side, mobile = bottom sheet === */
.panel-container {
  /* Desktop: right-side panel */
  top: 0;
  right: 0;
  bottom: 0;
  width: 60%;
  max-width: 700px;
  border-left-width: 2px;
}

@media (max-width: 768px) {
  .panel-container {
    /* Mobile: bottom sheet */
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-width: none;
    height: 85vh;
    border-left-width: 0;
    border-top-width: 2px;
  }
}

/* === Panel slide transition === */
.panel-slide-enter-active {
  transition: transform 250ms ease-out;
}
.panel-slide-leave-active {
  transition: transform 200ms ease-in;
}

/* Desktop: slide from right */
.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 768px) {
  /* Mobile: slide from bottom */
  .panel-slide-enter-from,
  .panel-slide-leave-to {
    transform: translateY(100%);
  }
}
</style>
