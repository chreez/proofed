<script setup lang="ts">
import { computed } from 'vue'
import { computePricing } from '@/composables/usePrettyPrice'

const props = defineProps<{
  recipeId: string
  recipeName: string
  /** Variable cost per recipe in dollars. Null = no cost data available. */
  cost: number | null
  /** Markup percent (e.g. 150 for +150%). */
  markupPct: number
  /** Min/max/step for the slider. Defaults: 50, 300, 1. */
  min?: number
  max?: number
  step?: number
  /** True when this row's profile entry differs from committed baseline. */
  dirty?: boolean
}>()

const emit = defineEmits<{
  'update:markupPct': [value: number]
}>()

const sliderMin = computed(() => props.min ?? 50)
const sliderMax = computed(() => props.max ?? 300)
const sliderStep = computed(() => props.step ?? 1)

const hasCost = computed(() => typeof props.cost === 'number' && props.cost > 0)

const pricing = computed(() => {
  if (!hasCost.value || props.cost == null) return null
  return computePricing(props.cost, props.markupPct)
})

const upliftCp = computed(() => {
  if (!pricing.value) return 0
  return Math.round((pricing.value.cpAtNextUp - pricing.value.cp) * 100) / 100
})

const showUplift = computed(() => {
  if (!pricing.value) return false
  return upliftCp.value > 0 && pricing.value.nextPrettyUp > pricing.value.prettyPrice
})

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function onSliderInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  if (Number.isFinite(value)) {
    emit('update:markupPct', value)
  }
}
</script>

<template>
  <div
    class="pricing-row"
    :data-recipe-id="recipeId"
    :data-dirty="dirty ? 'true' : 'false'"
  >
    <!-- Row 1: name + dirty badge + cost -->
    <div class="pricing-row-top">
      <div class="pricing-row-name-wrap">
        <span class="pricing-row-name">{{ recipeName }}</span>
        <span v-if="dirty" class="pricing-row-dirty" title="Differs from committed default. Export to save.">modified</span>
        <span class="pricing-row-id">{{ recipeId }}</span>
      </div>
      <div class="pricing-row-cost">
        <span v-if="hasCost" class="pricing-row-cost-value">{{ fmtMoney(cost ?? 0) }}</span>
        <span v-else class="pricing-row-cost-missing">no cost data</span>
        <span class="pricing-row-label">cost</span>
      </div>
    </div>

    <!-- Row 2: slider + readout -->
    <div class="pricing-row-controls">
      <div class="pricing-row-slider-wrap">
        <input
          type="range"
          class="pricing-row-slider"
          :min="sliderMin"
          :max="sliderMax"
          :step="sliderStep"
          :value="markupPct"
          :aria-label="`Markup percent for ${recipeName}`"
          @input="onSliderInput"
        />
        <div class="pricing-row-slider-readout">
          <span class="pricing-row-markup">{{ markupPct }}%</span>
          <span class="pricing-row-label">markup</span>
        </div>
      </div>

      <div class="pricing-row-readout">
        <div v-if="pricing" class="pricing-row-price">
          <span class="pricing-row-pretty">{{ fmtMoney(pricing.prettyPrice) }}</span>
          <span class="pricing-row-raw">raw {{ fmtMoney(pricing.rawPrice) }}</span>
        </div>
        <div v-else class="pricing-row-price pricing-row-price--missing">—</div>

        <div v-if="pricing" class="pricing-row-cp">
          <span class="pricing-row-cp-dollar">{{ fmtMoney(pricing.cp) }}</span>
          <span class="pricing-row-cp-pct">{{ pricing.cpPct.toFixed(1) }}% CP</span>
        </div>
      </div>
    </div>

    <!-- Row 3: nudge hint -->
    <div v-if="pricing && showUplift" class="pricing-row-hint">
      Nudge up to <strong>{{ fmtMoney(pricing.nextPrettyUp) }}</strong> for
      <strong>+{{ fmtMoney(upliftCp) }}</strong> CP
    </div>
  </div>
</template>

<style scoped>
.pricing-row {
  background: var(--color-surface);
  border: 2px solid var(--color-stone-200);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pricing-row[data-dirty='true'] {
  border-color: var(--color-accent);
}

.pricing-row-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.pricing-row-name-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
}

.pricing-row-name {
  font-weight: 600;
  color: var(--color-ink);
  font-size: 0.95rem;
}

.pricing-row-id {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-500);
}

.pricing-row-dirty {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  background: var(--color-accent);
  color: var(--color-surface);
  border: 2px solid var(--color-accent);
  padding: 0.05rem 0.4rem;
  text-transform: lowercase;
  letter-spacing: 0.02em;
}

.pricing-row-cost {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  flex-shrink: 0;
}

.pricing-row-cost-value {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  color: var(--color-ink);
}

.pricing-row-cost-missing {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-stone-400);
  font-style: italic;
}

.pricing-row-label {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--color-stone-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pricing-row-controls {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}

.pricing-row-slider-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pricing-row-slider {
  width: 100%;
  accent-color: var(--color-accent);
  height: 1.5rem;
}

.pricing-row-slider-readout {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.pricing-row-markup {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-ink);
  font-weight: 600;
}

.pricing-row-readout {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  flex-shrink: 0;
  min-width: 6.5rem;
}

.pricing-row-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.pricing-row-pretty {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1;
}

.pricing-row-price--missing {
  color: var(--color-stone-400);
  font-family: var(--font-mono);
  font-size: 1.5rem;
}

.pricing-row-raw {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-stone-500);
  margin-top: 0.1rem;
}

.pricing-row-cp {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.pricing-row-cp-dollar {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-success);
  font-weight: 600;
}

.pricing-row-cp-pct {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-500);
}

.pricing-row-hint {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-crust-dark);
  background: var(--color-cream);
  padding: 0.4rem 0.6rem;
  border-left: 2px solid var(--color-accent);
}

@media (max-width: 640px) {
  .pricing-row-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .pricing-row-readout {
    align-items: flex-start;
    min-width: 0;
  }

  .pricing-row-price {
    align-items: flex-start;
  }
}
</style>
