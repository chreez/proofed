<script setup lang="ts">
import { useTemplateRef, ref, computed, inject } from 'vue'
import { ClipboardList, Check, RotateCcw } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import ResetConfirmDialog from '@/components/ResetConfirmDialog.vue'
import ScalingControl from '@/components/ScalingControl.vue'
import { copyToClipboard } from '@/composables/useClipboard'
import { useScaling } from '@/composables/useScaling'
import { useRecipe } from '@/composables/useRecipe'
import type { Recipe } from '@/types/recipe'
import { SCALING_MULTIPLIER_KEY } from '@/composables/scalingKey'

const props = defineProps<{
  recipe: Recipe
  hasProgress?: boolean
  checkedCount?: number
  completedStageCount?: number
  scratchpadNoteCount?: number
}>()

const emit = defineEmits<{
  reset: []
  select: [recipeId: string]
}>()

const copyBtn = useTemplateRef<InstanceType<typeof IconButton>>('copyBtn')
const resetBtn = useTemplateRef<InstanceType<typeof IconButton>>('resetBtn')
const resetDialog = useTemplateRef<InstanceType<typeof ResetConfirmDialog>>('resetDialog')

// Inject app-level multiplier ref (provided by App.vue so all siblings can share it)
const appMultiplier = inject(SCALING_MULTIPLIER_KEY, ref(1))
const scaling = useScaling(props.recipe, appMultiplier)
const dismissedCaveats = ref(new Set<number>())

const { recipeList } = useRecipe()
const supersederName = computed<string | null>(() => {
  const id = props.recipe.meta.outdated?.supersededBy
  if (!id) return null
  return recipeList.value.find(r => r.id === id)?.name ?? null
})

function gotoSuperseder(): void {
  const id = props.recipe.meta.outdated?.supersededBy
  if (id) emit('select', id)
}

const visibleCaveats = computed(() => {
  return scaling.processCaveats.value.filter((_, idx) => !dismissedCaveats.value.has(idx))
})

// Format version as v{major}.{minor} (drop patch)
function formatVersion(version: string): string {
  const match = version.match(/^v?(\d+)\.(\d+)/)
  if (!match) return version
  return `v${match[1]}.${match[2]}`
}

// Get scaled yields display
function getYieldsDisplay(): string {
  if (scaling.multiplier.value === 1) return props.recipe.meta.yields
  const yields = props.recipe.meta.yields
  const match = yields.match(/^(\d+)/)
  if (!match) return yields
  const num = parseInt(match[1])
  const scaled = num * scaling.multiplier.value
  const unit = yields.slice(match[1].length)
  return `${scaled}${unit} (×${scaling.multiplier.value})`
}

function dismissCaveat(idx: number) {
  dismissedCaveats.value.add(idx)
  dismissedCaveats.value = new Set(dismissedCaveats.value)
}

function formatRecipeForPaprika(): string {
  const { meta, stages, states } = props.recipe
  const lines: string[] = []

  // Recipe name
  lines.push(meta.name)
  lines.push('')

  // Collect all ingredients from all stages
  const allIngredients: string[] = []
  for (const stage of stages) {
    if (stage.gather?.ingredients) {
      for (const ing of stage.gather.ingredients) {
        allIngredients.push(`${ing.name} — ${ing.unit === 'whole' ? `${ing.total}x` : `${ing.total}${ing.unit}`}`)
      }
    }
  }

  if (allIngredients.length) {
    lines.push('Ingredients:')
    for (const ing of allIngredients) {
      lines.push(`- ${ing}`)
    }
    lines.push('')
  }

  // Directions from all states
  lines.push('Directions:')
  let stepNum = 1
  for (const stage of stages) {
    for (const stateId of stage.states) {
      const state = states.find(s => s.id === stateId)
      if (state) {
        lines.push(`${stepNum}. ${state.direction}`)
        stepNum++
      }
    }
  }

  return lines.join('\n')
}

async function copyRecipe(): Promise<void> {
  const text = formatRecipeForPaprika()
  await copyToClipboard(text)
  copyBtn.value?.flashCopied()
}

function handleReset(): void {
  resetBtn.value?.flashSpin()
  resetDialog.value?.open()
}

function handleResetConfirm(): void {
  emit('reset')
}
</script>

<template>
  <div>
    <div class="card">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl text-heading">{{ recipe.meta.name }}</h2>
          <div v-if="recipe.version" class="font-mono text-sm text-stone-400 mb-2">{{ formatVersion(recipe.version) }}</div>
          <div class="flex flex-wrap gap-4 text-muted mb-3">
            <span v-if="recipe.meta.source">{{ recipe.meta.source.name }}</span>
            <span>{{ getYieldsDisplay() }}</span>
            <span>{{ recipe.meta.total_time }}</span>
          </div>
          <ScalingControl
            v-if="recipe.scaling"
            v-model="scaling.multiplier.value"
            :scaling="recipe.scaling"
          />
        </div>
        <div class="flex gap-1 shrink-0">
          <IconButton
            v-if="hasProgress"
            ref="resetBtn"
            tooltip="Reset Bake"
            @click="handleReset"
          >
            <RotateCcw />
          </IconButton>
          <IconButton
            ref="copyBtn"
            tooltip="Copy Recipe"
            @click="copyRecipe"
          >
            <ClipboardList />
            <template #feedback>
              <Check />
            </template>
          </IconButton>
        </div>
      </div>
    </div>

    <!-- Outdated banner -->
    <div
      v-if="recipe.meta.outdated"
      class="mt-4 bg-stone-100 border-l-4 border-stone-400 p-3 text-sm text-stone-600"
    >
      <div class="font-mono text-xs uppercase tracking-wide text-stone-500 mb-1">outdated</div>
      <p class="text-ink">{{ recipe.meta.outdated.reason }}</p>
      <p v-if="recipe.meta.outdated.supersededBy" class="mt-2">
        <a
          v-if="supersederName"
          href="#"
          class="text-accent hover:underline"
          @click.prevent="gotoSuperseder"
        >→ {{ supersederName }}</a>
      </p>
    </div>

    <!-- Process caveats banner when scaled -->
    <div v-if="visibleCaveats.length > 0" class="mt-4 space-y-2">
      <div
        v-for="(caveat, idx) in visibleCaveats"
        :key="idx"
        class="bg-warning-tint border-l-4 border-warning p-3 flex items-start justify-between gap-3"
      >
        <p class="text-sm text-ink">{{ caveat }}</p>
        <button
          class="text-xs text-stone-500 hover:text-stone-700 shrink-0 font-mono"
          @click="dismissCaveat(scaling.processCaveats.value.indexOf(caveat))"
        >
          ✕
        </button>
      </div>
    </div>
  </div>

  <ResetConfirmDialog
    ref="resetDialog"
    :checked-count="checkedCount"
    :completed-stage-count="completedStageCount"
    :scratchpad-note-count="scratchpadNoteCount"
    @confirm="handleResetConfirm"
  />
</template>
