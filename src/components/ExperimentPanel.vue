<script setup lang="ts">
import { ref, computed } from 'vue'
import { RotateCcw, Plus, X, Pencil, Link2, Check } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { Recipe, ExperimentConfig, ExperimentIngredient, ExperimentRole, WaterContentTable } from '@/types/recipe'
import type { useExperiment } from '@/composables/useExperiment'
import { copyToClipboard } from '@/composables/useClipboard'
import { useTemplateRef } from 'vue'

const props = defineProps<{
  recipe: Recipe
  recipeId: string
  waterContentTable: WaterContentTable
  experimentConfig: ExperimentConfig
  experimentInstance: ReturnType<typeof useExperiment>
  sliderNotes: Record<string, string>
  sectionId: string
}>()

const emit = defineEmits<{
  'update:sliderNotes': [notes: Record<string, string>]
}>()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

const config = computed(() => props.experimentConfig)

const {
  adjustments,
  freeformIngredients,
  baseHydration,
  effectiveHydration,
  inclusionLoad,
  totalDoughWeight,
  totalFlourGrams,
  perInclusionBakers,
  adjustIngredient,
  resetIngredient,
  resetAll,
  addFreeform,
  removeFreeform,
  getAmount
} = props.experimentInstance

// Collapsed state
const isCollapsed = ref(true)

function toggle(): void {
  const selection = window.getSelection()
  if (selection && selection.toString().length > 0) return
  isCollapsed.value = !isCollapsed.value
}

// Check if any adjustments have been made
const hasAdjustments = computed(() => adjustments.value.size > 0 || freeformIngredients.value.length > 0)

// Track which ingredients have slider visible (edit mode)
const editingIngredients = ref<Set<string>>(new Set())

function toggleEdit(id: string): void {
  const next = new Set(editingIngredients.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  editingIngredients.value = next
}

function isEditing(id: string): boolean {
  return editingIngredients.value.has(id)
}

// Freeform addition form
const freeformName = ref('')
const freeformAmount = ref<number | null>(null)
const freeformRole = ref<ExperimentRole>('inclusion')
const showFreeformForm = ref(false)

function handleAddFreeform(): void {
  if (!freeformName.value.trim() || !freeformAmount.value) return
  const id = `freeform-${Date.now()}`
  addFreeform({
    id,
    name: freeformName.value.trim(),
    amount: freeformAmount.value,
    role: freeformRole.value
  })
  freeformName.value = ''
  freeformAmount.value = null
  freeformRole.value = 'inclusion'
  showFreeformForm.value = false
}

function handleResetAll(): void {
  resetAll()
  emit('update:sliderNotes', {})
  editingIngredients.value = new Set()
  // Storage is managed by App.vue — clearing adjustments triggers auto-save
}

function handleSliderInput(ingredient: ExperimentIngredient, event: Event): void {
  const target = event.target as HTMLInputElement
  adjustIngredient(ingredient.id, Number(target.value))
}

function isAdjusted(ingredient: ExperimentIngredient): boolean {
  return adjustments.value.has(ingredient.id)
}

function getDiff(ingredient: ExperimentIngredient): number {
  return getAmount(ingredient) - ingredient.defaultAmount
}

// Group ingredients by role for display
const flourIngredients = computed(() => config.value.ingredients.filter(i => i.role === 'base_flour'))
const liquidIngredients = computed(() => config.value.ingredients.filter(i => i.role === 'base_liquid'))
const enrichmentIngredients = computed(() => config.value.ingredients.filter(i => i.role === 'enrichment'))
const inclusionIngredients = computed(() => config.value.ingredients.filter(i => i.role === 'inclusion'))

// Unified role groups for single-loop template
const roleGroups = computed(() => [
  { label: 'Base Flour', items: flourIngredients.value, showBakers: false },
  { label: 'Base Liquid', items: liquidIngredients.value, showBakers: false },
  { label: 'Inclusions', items: inclusionIngredients.value, showBakers: true },
  { label: 'Enrichments', items: enrichmentIngredients.value, showBakers: false }
].filter(g => g.items.length > 0))

// Ingredient display name lookup
function getIngredientName(id: string): string {
  for (const stage of props.recipe.stages) {
    if (stage.gather?.ingredients) {
      const found = stage.gather.ingredients.find(i => i.id === id)
      if (found) return found.name
    }
  }
  return id
}


async function copyPermalink(event: MouseEvent): Promise<void> {
  event.stopPropagation()
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}

// Note handling
const editingNoteId = ref<string | null>(null)
const noteInput = ref('')

function startNote(id: string): void {
  editingNoteId.value = id
  noteInput.value = props.sliderNotes[id] || ''
}

function saveNote(id: string): void {
  if (noteInput.value.trim()) {
    emit('update:sliderNotes', { ...props.sliderNotes, [id]: noteInput.value.trim() })
  } else {
    const updated = { ...props.sliderNotes }
    delete updated[id]
    emit('update:sliderNotes', updated)
  }
  editingNoteId.value = null
  noteInput.value = ''
}

function cancelNote(): void {
  editingNoteId.value = null
  noteInput.value = ''
}

// Inline amount editing (double-click on value)
const editingAmountId = ref<string | null>(null)
const amountInput = ref<number | null>(null)

function startAmountEdit(ing: ExperimentIngredient): void {
  editingAmountId.value = ing.id
  amountInput.value = getAmount(ing)
}

function commitAmountEdit(ing: ExperimentIngredient): void {
  if (amountInput.value != null) {
    const clamped = Math.max(ing.min, Math.min(ing.max, amountInput.value))
    adjustIngredient(ing.id, clamped)
  }
  editingAmountId.value = null
  amountInput.value = null
}

function cancelAmountEdit(): void {
  editingAmountId.value = null
  amountInput.value = null
}
</script>

<template>
  <div class="card" data-testid="experiment-panel">
    <!-- Header: matches StageCard pattern -->
    <div
      @click="toggle"
      class="w-full flex items-center justify-between scroll-mt-16 cursor-pointer select-text"
      role="button"
    >
      <div class="flex items-center gap-1">
        <h3 class="card-title">Experiment</h3>
        <IconButton
          ref="linkBtn"
          tooltip="Copy link"
          size="sm"
          tooltip-align="center"
          class="text-stone-300"
          @click="copyPermalink"
        >
          <Link2 />
          <template #feedback>
            <Check />
          </template>
        </IconButton>
      </div>
      <div class="flex items-center gap-3">
        <span class="live-badge">
          <span class="font-mono text-[10px] bg-accent-tint text-accent px-1.5 py-0.5 uppercase tracking-wide font-medium cursor-help">Live</span>
          <span class="live-tooltip">Derived values update in real-time as you adjust sliders</span>
        </span>
        <span v-if="isCollapsed" class="text-muted text-sm">
          {{ effectiveHydration.percent }}% eff.
        </span>
        <span
          class="text-stone-400 transition-transform duration-200"
          :class="{ 'rotate-180': !isCollapsed }"
        >▼</span>
      </div>
    </div>

    <!-- Collapsible body -->
    <div
      class="grid transition-[grid-template-rows] duration-300 ease-out"
      :class="isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'"
    >
      <div class="overflow-hidden">
        <div class="mt-4 space-y-4">
          <!-- Derived values summary -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="text-center">
              <div class="font-mono text-lg font-medium text-ink">{{ baseHydration.percent }}%</div>
              <div class="text-[11px] text-stone-500">Base Hydration</div>
              <div class="font-mono text-[10px] text-stone-400">({{ baseHydration.grams }}g)</div>
            </div>
            <div class="text-center">
              <div class="font-mono text-lg font-medium text-ink">{{ effectiveHydration.percent }}%</div>
              <div class="text-[11px] text-stone-500">Effective Hydration</div>
              <div class="font-mono text-[10px] text-stone-400">({{ effectiveHydration.grams }}g)</div>
            </div>
            <div class="text-center">
              <div class="font-mono text-lg font-medium text-ink">{{ inclusionLoad.percent }}%</div>
              <div class="text-[11px] text-stone-500">Inclusion Load</div>
              <div class="font-mono text-[10px] text-stone-400">({{ inclusionLoad.grams }}g)</div>
            </div>
            <div class="text-center">
              <div class="font-mono text-lg font-medium text-ink">{{ totalDoughWeight }}g</div>
              <div class="text-[11px] text-stone-500">Total Dough</div>
              <div class="font-mono text-[10px] text-stone-400">({{ totalFlourGrams }}g flour)</div>
            </div>
          </div>

          <!-- Ingredient groups -->
          <div v-for="group in roleGroups" :key="group.label" class="space-y-2">
            <div class="font-mono text-[10px] text-stone-400 uppercase tracking-wide">{{ group.label }}</div>
            <div v-for="ing in group.items" :key="ing.id">
              <div
                class="flex items-center justify-between py-1.5"
                :class="{ 'border-l-3 border-accent pl-2 -ml-2': isAdjusted(ing) }"
              >
                <span class="text-sm text-ink">{{ getIngredientName(ing.id) }}</span>
                <div class="flex items-center gap-2">
                  <input
                    v-if="editingAmountId === ing.id"
                    v-model.number="amountInput"
                    type="number"
                    :min="ing.min"
                    :max="ing.max"
                    :step="ing.step"
                    class="font-mono text-sm font-medium w-16 border-b-2 border-accent bg-transparent text-accent outline-none text-right tabular-nums"
                    @blur="commitAmountEdit(ing)"
                    @keydown.enter="commitAmountEdit(ing)"
                    @keydown.esc="cancelAmountEdit"
                    @vue:mounted="({ el }: { el: HTMLInputElement }) => { el.focus(); el.select() }"
                  />
                  <span
                    v-else
                    class="font-mono text-sm font-medium cursor-text tabular-nums"
                    :class="isAdjusted(ing) ? 'text-accent' : 'text-ink'"
                    :title="'Double-click to type a value'"
                    @dblclick="startAmountEdit(ing)"
                  >{{ getAmount(ing) }}g</span>
                  <span v-if="isAdjusted(ing)" class="font-mono text-[10px] text-stone-500">({{ getDiff(ing) > 0 ? '+' : '' }}{{ getDiff(ing) }}g)</span>
                  <span v-if="group.showBakers" class="font-mono text-[10px] text-stone-400">{{ perInclusionBakers.find(p => p.id === ing.id)?.percent ?? 0 }}% bkr</span>
                  <IconButton
                    v-if="isAdjusted(ing)"
                    tooltip="Reset to default"
                    size="sm"
                    class="text-stone-400"
                    @click="resetIngredient(ing.id)"
                  ><RotateCcw /></IconButton>
                  <IconButton
                    :tooltip="isEditing(ing.id) ? 'Hide slider' : 'Adjust amount'"
                    size="sm"
                    class="text-stone-300"
                    @click="toggleEdit(ing.id)"
                  ><Pencil /></IconButton>
                </div>
              </div>
              <!-- Slider (revealed on edit) -->
              <div v-if="isEditing(ing.id)" class="pl-2 pb-2 space-y-1">
                <input
                  type="range"
                  :min="ing.min"
                  :max="ing.max"
                  :step="ing.step"
                  :value="getAmount(ing)"
                  class="experiment-slider w-full"
                  @input="handleSliderInput(ing, $event)"
                />
                <div class="flex justify-between">
                  <span class="font-mono text-[10px] text-stone-400">{{ ing.min }}g</span>
                  <span class="font-mono text-[10px] text-stone-400">{{ ing.max }}g</span>
                </div>
                <!-- Note -->
                <div v-if="sliderNotes[ing.id] && editingNoteId !== ing.id" class="flex items-center gap-1.5">
                  <span class="font-mono text-[10px] text-stone-500 italic">{{ sliderNotes[ing.id] }}</span>
                  <button class="text-stone-400 hover:text-accent text-[10px]" @click="startNote(ing.id)">edit</button>
                </div>
                <div v-else-if="editingNoteId !== ing.id">
                  <button class="font-mono text-[10px] text-stone-400 hover:text-accent px-1.5 py-0.5 border border-stone-200 hover:border-accent transition-colors" @click="startNote(ing.id)">+ note</button>
                </div>
                <div v-if="editingNoteId === ing.id" class="flex gap-1.5">
                  <input
                    v-model="noteInput"
                    class="flex-1 border-2 border-stone-200 p-1 text-xs bg-surface rounded-none font-mono"
                    placeholder="Why this adjustment..."
                    @keydown.enter="saveNote(ing.id)"
                    @keydown.esc="cancelNote"
                  />
                  <button class="btn-primary text-[10px] py-0.5 px-2 border-2 border-stone-700" @click="saveNote(ing.id)">save</button>
                  <button class="btn-secondary text-[10px] py-0.5 px-2 border-2 border-stone-200" @click="cancelNote">cancel</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Freeform ingredients -->
          <div v-if="freeformIngredients.length" class="space-y-2">
            <div class="font-mono text-[10px] text-stone-400 uppercase tracking-wide">Freeform Additions</div>
            <div
              v-for="f in freeformIngredients"
              :key="f.id"
              class="flex items-center justify-between border-l-3 border-accent pl-2 -ml-2 py-1.5"
            >
              <div>
                <span class="text-sm text-ink">{{ f.name }}</span>
                <span class="font-mono text-xs text-accent ml-2">{{ f.amount }}g</span>
                <span class="font-mono text-[10px] text-stone-400 ml-1">({{ f.role }})</span>
              </div>
              <IconButton
                tooltip="Remove"
                size="sm"
                class="text-stone-400"
                @click="removeFreeform(f.id)"
              ><X /></IconButton>
            </div>
          </div>

          <!-- Add freeform button / form -->
          <div>
            <button
              v-if="!showFreeformForm"
              class="btn-secondary text-xs py-1.5 px-3 border-2 border-stone-200"
              @click="showFreeformForm = true"
            >
              <Plus class="w-3.5 h-3.5 inline mr-1" />Add ingredient
            </button>

            <div v-else class="bg-stone-50 border-2 border-stone-200 p-3 space-y-2">
              <div class="font-mono text-[10px] text-stone-400 uppercase tracking-wide">Add Freeform Ingredient</div>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  v-model="freeformName"
                  class="flex-1 border-2 border-stone-200 p-1.5 text-xs bg-surface rounded-none"
                  placeholder="Name (e.g., Kalamata olives)"
                />
                <input
                  v-model.number="freeformAmount"
                  type="number"
                  class="w-20 border-2 border-stone-200 p-1.5 text-xs bg-surface rounded-none font-mono"
                  placeholder="grams"
                  min="0"
                />
                <select
                  v-model="freeformRole"
                  class="border-2 border-stone-200 p-1.5 text-xs bg-surface rounded-none"
                >
                  <option value="inclusion">Inclusion</option>
                  <option value="enrichment">Enrichment</option>
                  <option value="base_flour">Flour</option>
                  <option value="base_liquid">Liquid</option>
                </select>
              </div>
              <div class="flex gap-2">
                <button class="btn-primary text-xs py-1.5 px-3 border-2 border-stone-700" @click="handleAddFreeform">Add</button>
                <button class="btn-secondary text-xs py-1.5 px-3 border-2 border-stone-200" @click="showFreeformForm = false">Cancel</button>
              </div>
            </div>
          </div>

          <!-- Actions bar -->
          <div v-if="hasAdjustments" class="flex items-center border-t border-stone-200 pt-3">
            <button
              class="btn-secondary text-xs py-1.5 px-3 border-2 border-stone-200"
              @click="handleResetAll"
            >
              <RotateCcw class="w-3.5 h-3.5 inline mr-1" />Reset all
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Hide number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

.live-badge {
  position: relative;
  display: inline-flex;
}

.live-tooltip {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  padding: 4px 8px;
  background: var(--color-ink);
  color: var(--color-surface);
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
  z-index: 10;
}

.live-badge:hover .live-tooltip {
  opacity: 1;
}

.experiment-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: var(--color-stone-200);
  outline: none;
  cursor: pointer;
}

.experiment-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--color-surface);
  border: 2px solid var(--color-accent);
  cursor: grab;
}

.experiment-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
}

.experiment-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--color-surface);
  border: 2px solid var(--color-accent);
  border-radius: 0;
  cursor: grab;
}

.experiment-slider::-moz-range-thumb:active {
  cursor: grabbing;
}

/* Fill the track up to the thumb position */
.experiment-slider::-webkit-slider-runnable-track {
  height: 6px;
  background: var(--color-stone-200);
}

.experiment-slider::-moz-range-track {
  height: 6px;
  background: var(--color-stone-200);
}

/* Use accent color for progress (webkit) */
.experiment-slider::-moz-range-progress {
  height: 6px;
  background: var(--color-accent);
}
</style>
