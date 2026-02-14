<script setup lang="ts">
import { ref, computed } from 'vue'
import { Notebook, StickyNote, Bell, X, ChevronDown, MessageSquare, AlertTriangle } from 'lucide-vue-next'

// -- Section 1: Note UI Placement --
type NotePlacement = 'fab' | 'inline' | 'hybrid'
const activePlacement = ref<NotePlacement>('fab')
const fabPanelOpen = ref(false)
const inlineOpenStep = ref<string | null>(null)
const hybridFabOpen = ref(false)

function toggleFabPanel(): void {
  fabPanelOpen.value = !fabPanelOpen.value
}

function toggleInlineStep(stepId: string): void {
  inlineOpenStep.value = inlineOpenStep.value === stepId ? null : stepId
}

function toggleHybridFab(): void {
  hybridFabOpen.value = !hybridFabOpen.value
}

// -- Section 2: Reminder UX --
type ReminderStyle = 'badge' | 'banner' | 'toast'
const activeReminder = ref<ReminderStyle>('badge')
const badgeDemoChecked = ref(false)
const bannerDemoChecked = ref(false)
const toastDemoChecked = ref(false)
const toastVisible = ref(false)
let toastTimeout: ReturnType<typeof setTimeout> | null = null

function triggerBadgeDemo(): void {
  badgeDemoChecked.value = !badgeDemoChecked.value
}

function triggerBannerDemo(): void {
  bannerDemoChecked.value = !bannerDemoChecked.value
}

function triggerToastDemo(): void {
  toastDemoChecked.value = !toastDemoChecked.value
  if (toastDemoChecked.value) {
    toastVisible.value = true
    if (toastTimeout) clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => {
      toastVisible.value = false
    }, 4000)
  }
}

// -- Section 3: Data Capture --
const captureOpen = ref(false)
const captureNoteText = ref('')
const captureYield = ref('')
const captureTemp = ref('')
const captureResult = ref<'good' | 'ok' | 'bad' | null>(null)

// -- Sample steps for demos --
const sampleSteps = [
  {
    id: 'mix-filling',
    title: 'Mix Filling',
    direction: 'Combine brown sugar, 1 tablespoon melted butter, granulated sugar, cinnamon, cloves, and salt in bowl.',
    exit_condition: 'Mixture is evenly combined, no dry sugar pockets',
    reminder: 'Check: is brown sugar packed or loose?'
  },
  {
    id: 'knead-dough',
    title: 'Knead Dough',
    direction: 'Transfer dough to lightly floured counter and knead to form smooth, round ball, about 2 minutes.',
    exit_condition: 'Dough is smooth, round, slightly tacky but not sticky',
    reminder: 'Measure yield: weigh total dough (target ~750g)'
  },
  {
    id: 'proof',
    title: 'Proof (30 min)',
    direction: 'Cover buns loosely with plastic wrap and let rise for 30 minutes.',
    exit_condition: 'Buns have expanded ~50%, edges touching',
    reminder: 'Check steel/oven temp before proof ends'
  }
]

// -- JSON output shapes --
const jsonShapeA = `{
  "scratchpad": {
    "bake_id": "2026-02-14",
    "recipe_id": "atk-cinnamon-buns-ultimate",
    "entries": [
      {
        "step_id": "knead-dough",
        "stage_id": "dough",
        "timestamp": "2026-02-14T10:23:00Z",
        "type": "reminder_response",
        "prompt": "Measure yield: weigh total dough",
        "value": "748g",
        "field": "yield_weight"
      },
      {
        "step_id": "proof",
        "stage_id": "assemble",
        "timestamp": "2026-02-14T10:55:00Z",
        "type": "note",
        "text": "Dough spread more than usual, may have over-hydrated",
        "tags": ["hydration", "dough"]
      }
    ]
  }
}`

const jsonShapeB = `{
  "scratchpad": {
    "bake_id": "2026-02-14",
    "recipe_id": "atk-cinnamon-buns-ultimate",
    "observations": {
      "knead-dough": {
        "yield_g": 748,
        "texture": "smooth",
        "notes": "Slightly wetter than last time"
      },
      "proof": {
        "start_temp_f": 72,
        "duration_min": 32,
        "result": "good",
        "notes": "Rose nicely, edges just touching"
      },
      "bake": {
        "oven_temp_f": 350,
        "steel_temp_f": 425,
        "actual_time_min": 27,
        "notes": "Rotated at 15 min"
      }
    },
    "general_notes": [
      "Next time try overnight cold ferment variant"
    ]
  }
}`

const jsonShapeC = `{
  "scratchpad": {
    "bake_id": "2026-02-14",
    "recipe_id": "atk-cinnamon-buns-ultimate",
    "reminders_log": [
      {
        "step_id": "knead-dough",
        "prompt": "Measure yield",
        "response": "748g",
        "dismissed": false
      },
      {
        "step_id": "proof",
        "prompt": "Check steel temp",
        "response": "425F",
        "dismissed": false
      }
    ],
    "notes": [
      {
        "step_id": "mix-filling",
        "text": "Brown sugar was dry, needed to break up clumps",
        "source": "user"
      },
      {
        "step_id": null,
        "text": "Overall good bake, glaze could be thicker",
        "source": "user"
      }
    ],
    "quick_ratings": {
      "overall": "good",
      "crumb": "good",
      "flavor": "great",
      "appearance": "ok"
    }
  }
}`

const activeJsonShape = ref<'A' | 'B' | 'C'>('A')
const currentJson = computed(() => {
  if (activeJsonShape.value === 'A') return jsonShapeA
  if (activeJsonShape.value === 'B') return jsonShapeB
  return jsonShapeC
})
const jsonShapeDescriptions: Record<string, string> = {
  A: 'Flat event log -- each interaction is an entry with type/prompt/value. Simple to append, easy to query.',
  B: 'Step-keyed observations -- data grouped by step ID with typed fields. Structured but rigid.',
  C: 'Hybrid: separate reminders_log + freeform notes + quick_ratings. Best of both for agentic parsing.'
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-8">
    <h2 class="text-heading text-2xl font-mono mb-2">Bake Scratchpad: UI Variants</h2>
    <p class="text-body mb-1">Evaluating placement, reminder UX, and data capture for the bake scratchpad system.</p>
    <p class="text-muted mb-8">PF-133.1 spike -- throwaway demo for HITL review.</p>

    <!-- ============================================ -->
    <!-- SECTION 1: Note UI Placement                 -->
    <!-- ============================================ -->
    <div class="mb-12">
      <h3 class="text-heading text-xl font-mono mb-4 border-b-2 border-stone-200 pb-2">
        1. Note UI Placement
      </h3>
      <p class="text-body text-sm mb-4">Where does the "add note" affordance live? Click each variant tab, then interact with the mock steps below.</p>

      <!-- Variant tabs -->
      <div class="flex gap-0 mb-6">
        <button
          v-for="v in (['fab', 'inline', 'hybrid'] as const)"
          :key="v"
          class="btn text-sm border-2 border-stone-200"
          :class="activePlacement === v ? 'bg-ink text-stone-100' : 'bg-surface text-ink hover:bg-stone-100'"
          @click="activePlacement = v; fabPanelOpen = false; inlineOpenStep = null; hybridFabOpen = false"
        >
          {{ v === 'fab' ? 'A) FAB Toolbar' : v === 'inline' ? 'B) Inline Per-Step' : 'C) Hybrid' }}
        </button>
      </div>

      <!-- Mock steps container (shared across variants) -->
      <div class="relative">
        <!-- Step list -->
        <div class="space-y-3">
          <div v-for="step in sampleSteps" :key="step.id" class="bg-surface p-4 border-2 border-stone-200">
            <div class="flex items-start gap-3">
              <!-- Checkbox -->
              <button class="mt-1 w-5 h-5 border-2 border-ink flex items-center justify-center flex-shrink-0">
              </button>

              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="font-medium text-stone-700">{{ step.title }}</h4>

                  <!-- Variant B: Inline note button per step -->
                  <button
                    v-if="activePlacement === 'inline' || activePlacement === 'hybrid'"
                    class="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-accent hover:bg-accent-tint transition-colors"
                    @click="toggleInlineStep(step.id)"
                    title="Add note for this step"
                  >
                    <StickyNote class="w-3.5 h-3.5" />
                  </button>
                </div>
                <p class="text-body text-sm mb-2">{{ step.direction }}</p>
                <p class="text-xs text-stone-400 italic">Done when: {{ step.exit_condition }}</p>

                <!-- Inline popover for Variant B & C -->
                <Transition name="slide-down">
                  <div
                    v-if="(activePlacement === 'inline' || activePlacement === 'hybrid') && inlineOpenStep === step.id"
                    class="mt-3 bg-stone-50 border-2 border-stone-200 p-3"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-mono text-xs text-stone-500">note: {{ step.id }}</span>
                      <button @click="inlineOpenStep = null" class="text-stone-400 hover:text-ink">
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <!-- Prompted question -->
                    <div v-if="step.reminder" class="bg-cream border-l-4 border-accent p-2 mb-2 text-sm text-stone-700">
                      <span class="font-mono text-xs text-crust-dark">prompt:</span> {{ step.reminder }}
                    </div>
                    <textarea
                      class="w-full border-2 border-stone-200 p-2 text-sm bg-surface resize-none"
                      rows="2"
                      placeholder="Type your observation..."
                    />
                    <div class="flex justify-end mt-2">
                      <button class="btn-primary text-xs py-1 px-3">Save</button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>

        <!-- Variant A: FAB button (bottom-right of container) -->
        <div v-if="activePlacement === 'fab'" class="sticky bottom-4 flex justify-end mt-4 z-20">
          <div class="relative">
            <button
              @click="toggleFabPanel"
              class="w-12 h-12 bg-ink text-stone-50 flex items-center justify-center shadow-md transition-transform active:scale-95"
              :class="{ 'bg-accent': fabPanelOpen }"
            >
              <Notebook v-if="!fabPanelOpen" class="w-5 h-5" />
              <X v-else class="w-5 h-5" />
            </button>

            <!-- FAB popover panel -->
            <Transition name="slide-down">
              <div
                v-if="fabPanelOpen"
                class="absolute bottom-14 right-0 w-72 bg-surface border-2 border-stone-200 shadow-lg p-4"
              >
                <h4 class="font-mono text-xs text-stone-500 mb-3">Bake Scratchpad</h4>

                <!-- Step selector -->
                <div class="mb-3">
                  <label class="text-xs text-stone-500 mb-1 block">Attach to step:</label>
                  <select class="w-full border-2 border-stone-200 p-2 text-sm bg-surface">
                    <option value="">General note</option>
                    <option v-for="step in sampleSteps" :key="step.id" :value="step.id">{{ step.title }}</option>
                  </select>
                </div>

                <textarea
                  class="w-full border-2 border-stone-200 p-2 text-sm bg-surface resize-none mb-2"
                  rows="3"
                  placeholder="What happened? What did you notice?"
                />

                <div class="flex justify-between items-center">
                  <span class="text-xs text-stone-400 font-mono">auto-saves</span>
                  <button class="btn-primary text-xs py-1 px-3">Save</button>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Variant C: Hybrid FAB (general notes only) -->
        <div v-if="activePlacement === 'hybrid'" class="sticky bottom-4 flex justify-end mt-4 z-20">
          <div class="relative">
            <button
              @click="toggleHybridFab"
              class="w-12 h-12 bg-ink text-stone-50 flex items-center justify-center shadow-md transition-transform active:scale-95"
              :class="{ 'bg-accent': hybridFabOpen }"
            >
              <MessageSquare v-if="!hybridFabOpen" class="w-5 h-5" />
              <X v-else class="w-5 h-5" />
            </button>

            <Transition name="slide-down">
              <div
                v-if="hybridFabOpen"
                class="absolute bottom-14 right-0 w-72 bg-surface border-2 border-stone-200 shadow-lg p-4"
              >
                <h4 class="font-mono text-xs text-stone-500 mb-3">General Note</h4>
                <p class="text-xs text-stone-400 mb-2">Use inline icons for step-specific notes. This FAB is for overall bake observations.</p>
                <textarea
                  class="w-full border-2 border-stone-200 p-2 text-sm bg-surface resize-none mb-2"
                  rows="3"
                  placeholder="Overall bake observation..."
                />
                <div class="flex justify-end">
                  <button class="btn-primary text-xs py-1 px-3">Save</button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Placement notes -->
      <div class="card mt-4">
        <h4 class="font-mono text-xs text-stone-500 mb-2">Placement trade-offs</h4>
        <div class="text-sm text-body space-y-2">
          <p><strong class="font-mono text-xs">A) FAB:</strong> Always accessible, single entry point. But requires step selector dropdown -- extra tap for step-specific notes.</p>
          <p><strong class="font-mono text-xs">B) Inline:</strong> Zero-friction per-step notes. But no affordance for general bake-level observations.</p>
          <p><strong class="font-mono text-xs">C) Hybrid:</strong> Best of both -- inline icons for step context, FAB for general notes. More UI surface area to maintain.</p>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SECTION 2: Reminder UX                       -->
    <!-- ============================================ -->
    <div class="mb-12">
      <h3 class="text-heading text-xl font-mono mb-4 border-b-2 border-stone-200 pb-2">
        2. Reminder UX
      </h3>
      <p class="text-body text-sm mb-4">How do pre-set reminders surface when a step is completed? Click the checkbox on each variant to trigger the reminder.</p>

      <!-- Variant tabs -->
      <div class="flex gap-0 mb-6">
        <button
          v-for="v in (['badge', 'banner', 'toast'] as const)"
          :key="v"
          class="btn text-sm border-2 border-stone-200"
          :class="activeReminder === v ? 'bg-ink text-stone-100' : 'bg-surface text-ink hover:bg-stone-100'"
          @click="activeReminder = v; badgeDemoChecked = false; bannerDemoChecked = false; toastDemoChecked = false; toastVisible = false"
        >
          {{ v === 'badge' ? 'A) Badge Icon' : v === 'banner' ? 'B) Stage Banner' : 'C) Toast' }}
        </button>
      </div>

      <!-- Variant A: Badge -->
      <div v-if="activeReminder === 'badge'" class="space-y-3">
        <div class="bg-surface p-4 border-2 border-stone-200" :class="{ 'opacity-50': badgeDemoChecked }">
          <div class="flex items-start gap-3">
            <button
              @click="triggerBadgeDemo"
              class="mt-1 w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors"
              :class="badgeDemoChecked ? 'bg-ink border-ink text-stone-50' : 'border-ink hover:bg-stone-100'"
            >
              <span v-if="badgeDemoChecked" class="text-xs">&#10003;</span>
            </button>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-stone-700" :class="{ 'line-through': badgeDemoChecked }">Knead Dough</h4>
                <!-- Badge: appears after check -->
                <Transition name="pop">
                  <button
                    v-if="badgeDemoChecked"
                    class="w-6 h-6 flex items-center justify-center bg-accent-tint text-accent transition-colors hover:bg-accent hover:text-stone-50"
                    title="Reminder: measure yield"
                  >
                    <Bell class="w-3.5 h-3.5" />
                  </button>
                </Transition>
              </div>
              <p class="text-body text-sm mb-2">Transfer dough to lightly floured counter and knead to form smooth, round ball.</p>
              <p class="text-xs text-stone-400 italic">Done when: Dough is smooth, round, slightly tacky</p>

              <!-- Expanded reminder on badge click -->
              <Transition name="slide-down">
                <div v-if="badgeDemoChecked" class="mt-3 bg-cream border-l-4 border-accent p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <Bell class="w-3.5 h-3.5 text-accent" />
                    <span class="font-mono text-xs text-crust-dark">reminder</span>
                  </div>
                  <p class="text-sm text-stone-700 mb-2">Measure yield: weigh total dough (target ~750g)</p>
                  <div class="flex gap-2">
                    <input
                      class="flex-1 border-2 border-stone-200 p-2 text-sm bg-surface"
                      placeholder="Enter weight (e.g. 748g)"
                    />
                    <button class="btn-primary text-xs py-1 px-3">Log</button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
        <div class="card">
          <p class="text-sm text-body"><strong class="font-mono text-xs">Badge:</strong> Small icon appears inline after step completion. Non-intrusive, discoverable. User can ignore or click to expand. Reminder persists until addressed.</p>
        </div>
      </div>

      <!-- Variant B: Banner -->
      <div v-if="activeReminder === 'banner'" class="space-y-3">
        <!-- Banner that appears above the stage -->
        <Transition name="slide-down">
          <div v-if="bannerDemoChecked" class="bg-cream border-2 border-accent p-3 flex items-center gap-3">
            <AlertTriangle class="w-4 h-4 text-accent flex-shrink-0" />
            <div class="flex-1">
              <span class="font-mono text-xs text-crust-dark">reminder for: Knead Dough</span>
              <p class="text-sm text-stone-700">Measure yield: weigh total dough (target ~750g)</p>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <input
                class="w-24 border-2 border-stone-200 p-1 text-sm bg-surface"
                placeholder="748g"
              />
              <button class="btn-primary text-xs py-1 px-2">Log</button>
              <button class="btn-secondary text-xs py-1 px-2" @click="bannerDemoChecked = false">Dismiss</button>
            </div>
          </div>
        </Transition>

        <div class="bg-surface p-4 border-2 border-stone-200" :class="{ 'opacity-50': bannerDemoChecked }">
          <div class="flex items-start gap-3">
            <button
              @click="triggerBannerDemo"
              class="mt-1 w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors"
              :class="bannerDemoChecked ? 'bg-ink border-ink text-stone-50' : 'border-ink hover:bg-stone-100'"
            >
              <span v-if="bannerDemoChecked" class="text-xs">&#10003;</span>
            </button>
            <div class="flex-1">
              <h4 class="font-medium text-stone-700" :class="{ 'line-through': bannerDemoChecked }">Knead Dough</h4>
              <p class="text-body text-sm mb-2">Transfer dough to lightly floured counter and knead to form smooth, round ball.</p>
              <p class="text-xs text-stone-400 italic">Done when: Dough is smooth, round, slightly tacky</p>
            </div>
          </div>
        </div>
        <div class="card">
          <p class="text-sm text-body"><strong class="font-mono text-xs">Banner:</strong> Full-width banner appears at top of stage card. Impossible to miss, but takes vertical space and could feel disruptive during active baking.</p>
        </div>
      </div>

      <!-- Variant C: Toast -->
      <div v-if="activeReminder === 'toast'" class="space-y-3">
        <div class="bg-surface p-4 border-2 border-stone-200" :class="{ 'opacity-50': toastDemoChecked }">
          <div class="flex items-start gap-3">
            <button
              @click="triggerToastDemo"
              class="mt-1 w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors"
              :class="toastDemoChecked ? 'bg-ink border-ink text-stone-50' : 'border-ink hover:bg-stone-100'"
            >
              <span v-if="toastDemoChecked" class="text-xs">&#10003;</span>
            </button>
            <div class="flex-1">
              <h4 class="font-medium text-stone-700" :class="{ 'line-through': toastDemoChecked }">Knead Dough</h4>
              <p class="text-body text-sm mb-2">Transfer dough to lightly floured counter and knead to form smooth, round ball.</p>
              <p class="text-xs text-stone-400 italic">Done when: Dough is smooth, round, slightly tacky</p>
            </div>
          </div>
        </div>

        <!-- Toast notification -->
        <Transition name="toast-slide">
          <div
            v-if="toastVisible"
            class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-stone-100 px-4 py-3 shadow-lg z-50 flex items-center gap-3 max-w-sm w-full"
          >
            <Bell class="w-4 h-4 text-accent flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <span class="font-mono text-xs text-stone-400 block">Knead Dough</span>
              <p class="text-sm truncate">Measure yield: weigh total dough (target ~750g)</p>
            </div>
            <button
              class="text-stone-400 hover:text-stone-100 flex-shrink-0"
              @click="toastVisible = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </Transition>

        <div class="card">
          <p class="text-sm text-body"><strong class="font-mono text-xs">Toast:</strong> Slides in from bottom, auto-dismisses after 4s. Least disruptive, but ephemeral -- if you miss it, the reminder is gone. Good for low-priority prompts, bad for must-capture data.</p>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SECTION 3: Data Capture UI                   -->
    <!-- ============================================ -->
    <div class="mb-12">
      <h3 class="text-heading text-xl font-mono mb-4 border-b-2 border-stone-200 pb-2">
        3. Data Capture UI
      </h3>
      <p class="text-body text-sm mb-4">What does the full note-capture panel look like? This mockup shows structured fields + freeform entry.</p>

      <div class="bg-surface border-2 border-stone-200 p-0">
        <!-- Panel header -->
        <div class="flex items-center justify-between p-3 border-b-2 border-stone-200 bg-stone-50">
          <div class="flex items-center gap-2">
            <Notebook class="w-4 h-4 text-accent" />
            <span class="font-mono text-xs text-stone-600">scratchpad: knead-dough</span>
          </div>
          <button
            @click="captureOpen = !captureOpen"
            class="text-stone-400 hover:text-ink transition-colors"
          >
            <ChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': captureOpen }" />
          </button>
        </div>

        <div class="p-4 space-y-4" :class="{ 'hidden': !captureOpen }">
          <!-- Prompted question -->
          <div class="bg-cream border-l-4 border-accent p-3">
            <div class="flex items-center gap-2 mb-1">
              <Bell class="w-3.5 h-3.5 text-accent" />
              <span class="font-mono text-xs text-crust-dark">prompted</span>
            </div>
            <p class="text-sm text-stone-700 mb-2">Measure yield: weigh total dough</p>
            <input
              v-model="captureYield"
              class="w-full border-2 border-stone-200 p-2 text-sm bg-surface"
              placeholder="e.g. 748g"
            />
          </div>

          <!-- Second prompted question -->
          <div class="bg-cream border-l-4 border-accent p-3">
            <div class="flex items-center gap-2 mb-1">
              <Bell class="w-3.5 h-3.5 text-accent" />
              <span class="font-mono text-xs text-crust-dark">prompted</span>
            </div>
            <p class="text-sm text-stone-700 mb-2">Dough temperature after kneading?</p>
            <input
              v-model="captureTemp"
              class="w-full border-2 border-stone-200 p-2 text-sm bg-surface"
              placeholder="e.g. 76F"
            />
          </div>

          <!-- Quick result rating -->
          <div>
            <span class="font-mono text-xs text-stone-500 mb-2 block">Quick rating</span>
            <div class="flex gap-2">
              <button
                v-for="r in (['good', 'ok', 'bad'] as const)"
                :key="r"
                class="btn text-xs py-1 px-3 border-2 border-stone-200"
                :class="captureResult === r
                  ? (r === 'good' ? 'bg-success text-stone-50 border-success' : r === 'ok' ? 'bg-warning text-ink border-warning' : 'bg-danger text-stone-50 border-danger')
                  : 'bg-surface text-ink hover:bg-stone-100'"
                @click="captureResult = captureResult === r ? null : r"
              >
                {{ r }}
              </button>
            </div>
          </div>

          <!-- Freeform note -->
          <div>
            <span class="font-mono text-xs text-stone-500 mb-2 block">Freeform note</span>
            <textarea
              v-model="captureNoteText"
              class="w-full border-2 border-stone-200 p-2 text-sm bg-surface resize-none"
              rows="3"
              placeholder="What happened? What did you notice? Texture, color, timing..."
            />
          </div>

          <!-- Save bar -->
          <div class="flex items-center justify-between pt-2 border-t-2 border-stone-200">
            <span class="font-mono text-[10px] text-stone-400">entries auto-save to localStorage</span>
            <div class="flex gap-2">
              <button class="btn-secondary text-xs py-1 px-3">Clear</button>
              <button class="btn-primary text-xs py-1 px-3">Save</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Toggle open by default -->
      <button
        @click="captureOpen = !captureOpen"
        class="btn-secondary text-xs mt-2"
      >
        {{ captureOpen ? 'Collapse panel' : 'Expand panel to interact' }}
      </button>

      <div class="card mt-4">
        <h4 class="font-mono text-xs text-stone-500 mb-2">Data capture notes</h4>
        <ul class="text-body text-sm space-y-1 pl-4 list-disc">
          <li>Prompted fields come from recipe JSON (set during recipe authoring)</li>
          <li>Quick rating is optional -- fast one-tap evaluation per step</li>
          <li>Freeform text captures anything the prompts don't cover</li>
          <li>All data stored in localStorage during bake, exported as JSON for /feedback session</li>
          <li>Panel can live inline (below step) or in the FAB popover -- same content either way</li>
        </ul>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SECTION 4: JSON Output Shapes                -->
    <!-- ============================================ -->
    <div class="mb-12">
      <h3 class="text-heading text-xl font-mono mb-4 border-b-2 border-stone-200 pb-2">
        4. JSON Output Shape
      </h3>
      <p class="text-body text-sm mb-4">How should captured data be structured for agentic ingestion during /feedback sessions?</p>

      <!-- Shape tabs -->
      <div class="flex gap-0 mb-4">
        <button
          v-for="s in (['A', 'B', 'C'] as const)"
          :key="s"
          class="btn text-sm border-2 border-stone-200"
          :class="activeJsonShape === s ? 'bg-ink text-stone-100' : 'bg-surface text-ink hover:bg-stone-100'"
          @click="activeJsonShape = s"
        >
          {{ s === 'A' ? 'A) Flat Event Log' : s === 'B' ? 'B) Step-Keyed' : 'C) Hybrid' }}
        </button>
      </div>

      <p class="text-sm text-body mb-3">{{ jsonShapeDescriptions[activeJsonShape] }}</p>

      <div class="bg-stone-800 text-stone-200 p-4 border-2 border-stone-600 overflow-x-auto">
        <pre class="font-mono text-xs leading-relaxed whitespace-pre">{{ currentJson }}</pre>
      </div>

      <div class="card mt-4">
        <h4 class="font-mono text-xs text-stone-500 mb-2">Shape trade-offs</h4>
        <div class="text-sm text-body space-y-2">
          <p><strong class="font-mono text-xs">A) Flat log:</strong> Easy to append during bake (just push entries). Agent can filter/group at ingestion time. Risk: loose structure makes parsing harder for typed extraction.</p>
          <p><strong class="font-mono text-xs">B) Step-keyed:</strong> Agent gets pre-grouped data per step. But requires knowing field names upfront -- less flexible for unexpected observations.</p>
          <p><strong class="font-mono text-xs">C) Hybrid:</strong> Separate arrays for reminders (structured) and notes (freeform) plus quick_ratings. Agent gets best of both: typed data where it exists, raw text where it doesn't.</p>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Summary                                      -->
    <!-- ============================================ -->
    <div class="card">
      <h3 class="text-heading font-mono text-sm mb-3">Decision Matrix</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-body">
          <thead>
            <tr class="border-b-2 border-stone-200">
              <th class="text-left py-2 pr-4 font-mono text-xs text-stone-500">Dimension</th>
              <th class="text-left py-2 pr-4 font-mono text-xs text-stone-500">Option A</th>
              <th class="text-left py-2 pr-4 font-mono text-xs text-stone-500">Option B</th>
              <th class="text-left py-2 font-mono text-xs text-stone-500">Option C</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-stone-100">
              <td class="py-2 pr-4 font-medium">Note placement</td>
              <td class="py-2 pr-4">FAB toolbar</td>
              <td class="py-2 pr-4">Inline per-step</td>
              <td class="py-2">Hybrid (both)</td>
            </tr>
            <tr class="border-b border-stone-100">
              <td class="py-2 pr-4 font-medium">Reminder UX</td>
              <td class="py-2 pr-4">Badge icon</td>
              <td class="py-2 pr-4">Stage banner</td>
              <td class="py-2">Toast notification</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-medium">JSON shape</td>
              <td class="py-2 pr-4">Flat event log</td>
              <td class="py-2 pr-4">Step-keyed objects</td>
              <td class="py-2">Hybrid arrays</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-muted mt-3">Pick one from each row. Choices are independent -- any combination works.</p>
    </div>
  </div>
</template>

<style scoped>
/* Slide-down transition for inline popovers */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Pop transition for badge icon */
.pop-enter-active {
  transition: all 0.2s ease;
}
.pop-enter-from {
  opacity: 0;
  transform: scale(0);
}

/* Toast slide transition */
.toast-slide-enter-active {
  transition: all 0.3s ease;
}
.toast-slide-leave-active {
  transition: all 0.2s ease;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, 20px);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
