<script setup lang="ts">
import { computed } from 'vue'
import HelpTooltip from '@/components/HelpTooltip.vue'
import type { SaleEntry } from '@/types/sales'

/**
 * SalesRow — dense per-recipe row inside an active market session, or a
 * read-only row inside a closed history session (PF-256.5 Slice 6).
 *
 * Layout mirrors PricingRow density: 48px hero/initials thumb · name +
 * planned-units · stepper [− N +] + free-type input · revenue · leftover.
 *
 * Overshoot (soldUnits > plannedUnits) is allowed — the count gets accent
 * styling and the leftover line surfaces "+N over plan" instead of a count.
 *
 * Emits `update-sold: number` on stepper or input change. Parent persists.
 */

const props = withDefaults(
  defineProps<{
    entry: SaleEntry
    recipeName: string
    /** Latest hero photo for the thumb. Falls back to initials when null. */
    heroThumb?: string | null
    /** Unit noun, e.g. "bun", "loaf". Pluralized in the leftover line. */
    unit: string
    /** History-mode (closed session): stepper buttons disabled, input read-only. */
    readonly?: boolean
  }>(),
  {
    heroThumb: null,
    readonly: false,
  },
)

const emit = defineEmits<{
  'update-sold': [value: number]
}>()

const initials = computed(() => {
  const words = props.recipeName.trim().split(/\s+/).filter((w) => /^[A-Za-z]/.test(w))
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return props.recipeName.slice(0, 2).toUpperCase() || '??'
})

const sold = computed(() => props.entry.soldUnits)
const planned = computed(() => props.entry.plannedUnits)
const overshoot = computed(() => sold.value > planned.value)
const remaining = computed(() => planned.value - sold.value)

const revenue = computed(() => sold.value * props.entry.unitPrice)

function pluralize(word: string): string {
  if (!word) return word
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) return word
  return `${word}s`
}

const unitLabel = computed(() => props.unit || 'unit')
const unitsPlural = computed(() => pluralize(unitLabel.value))

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function emitSold(value: number): void {
  if (!Number.isFinite(value)) return
  emit('update-sold', Math.max(0, Math.floor(value)))
}

function onDecrement(): void {
  if (props.readonly) return
  emitSold(sold.value - 1)
}

function onIncrement(): void {
  if (props.readonly) return
  emitSold(sold.value + 1)
}

function onInput(event: Event): void {
  if (props.readonly) return
  const target = event.target as HTMLInputElement
  const raw = target.value.trim()
  if (raw === '') {
    emitSold(0)
    return
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return
  emitSold(value)
}
</script>

<template>
  <li
    class="sales-row"
    :class="{ 'sales-row--readonly': readonly, 'sales-row--overshoot': overshoot }"
    :data-recipe-id="entry.recipeId"
  >
    <img
      v-if="heroThumb"
      class="sales-row-thumb"
      :src="heroThumb"
      :alt="`${recipeName} — latest bake`"
      loading="lazy"
    />
    <div
      v-else
      class="sales-row-thumb sales-row-thumb-placeholder"
      aria-hidden="true"
    >{{ initials }}</div>

    <div class="sales-row-id">
      <HelpTooltip class="sales-row-name-tooltip" :text="recipeName">
        <span class="sales-row-name">{{ recipeName }}</span>
      </HelpTooltip>
      <span class="sales-row-planned">planned: {{ planned }} {{ planned === 1 ? unitLabel : unitsPlural }}</span>
    </div>

    <div class="sales-row-stepper">
      <HelpTooltip text="Decrement sold count">
        <button
          type="button"
          class="sales-row-step-btn"
          :disabled="readonly || sold <= 0"
          :aria-label="`Decrement sold for ${recipeName}`"
          data-testid="sales-row-dec"
          @click="onDecrement"
        >−</button>
      </HelpTooltip>
      <HelpTooltip
        :text="overshoot
          ? `Sold ${sold} (over plan by ${sold - planned}). Type any value to record restock sales.`
          : `Sold ${sold} of ${planned}. Type a value to record sales directly.`"
      >
        <input
          type="number"
          class="sales-row-count-input"
          :class="{ 'sales-row-count-input--overshoot': overshoot }"
          inputmode="numeric"
          step="1"
          min="0"
          :value="sold"
          :readonly="readonly"
          :aria-label="`Sold units for ${recipeName}`"
          data-testid="sales-row-count"
          @input="onInput"
        />
      </HelpTooltip>
      <HelpTooltip text="Increment sold count">
        <button
          type="button"
          class="sales-row-step-btn"
          :disabled="readonly"
          :aria-label="`Increment sold for ${recipeName}`"
          data-testid="sales-row-inc"
          @click="onIncrement"
        >+</button>
      </HelpTooltip>
    </div>

    <div class="sales-row-readout">
      <HelpTooltip
        :text="`Revenue — sold × unit price (${fmtMoney(entry.unitPrice)} each).`"
        align="right"
      >
        <span class="sales-row-revenue" data-testid="sales-row-revenue">{{ fmtMoney(revenue) }}</span>
      </HelpTooltip>
      <HelpTooltip
        v-if="overshoot"
        :text="`Sold ${sold - planned} more than planned (restock or under-counted bake).`"
        align="right"
      >
        <span class="sales-row-leftover sales-row-leftover--overshoot" data-testid="sales-row-leftover">+{{ sold - planned }} over plan</span>
      </HelpTooltip>
      <HelpTooltip
        v-else
        :text="`Units left to sell at current pace.`"
        align="right"
      >
        <span class="sales-row-leftover" data-testid="sales-row-leftover">{{ remaining }} {{ remaining === 1 ? unitLabel : unitsPlural }} left</span>
      </HelpTooltip>
    </div>
  </li>
</template>

<style scoped>
.sales-row {
  position: relative;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.875rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 2px solid var(--color-stone-300);
  border-bottom-width: 0;
  min-height: 64px;
}

.sales-row:last-child {
  border-bottom-width: 2px;
}

.sales-row--readonly {
  background: var(--color-stone-100);
}

.sales-row-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  display: block;
  border: 2px solid var(--color-ink);
  background: var(--color-stone-300);
  flex-shrink: 0;
}

.sales-row-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-stone-600);
  text-transform: uppercase;
}

.sales-row-id {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.sales-row-name-tooltip {
  min-width: 0;
  display: flex;
}

.sales-row-name-tooltip :deep(.help-tooltip-trigger) {
  min-width: 0;
  display: flex;
  width: 100%;
}

.sales-row-name {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.3;
  color: var(--color-ink);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.sales-row-planned {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-600);
  white-space: nowrap;
}

.sales-row-stepper {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.sales-row-step-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-ink);
  background: var(--color-stone-100);
  border: 2px solid var(--color-stone-300);
  border-radius: 0;
  cursor: pointer;
  line-height: 1;
}

.sales-row-step-btn:hover:not(:disabled),
.sales-row-step-btn:focus-visible:not(:disabled) {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-surface);
  outline: none;
}

.sales-row-step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sales-row-count-input {
  width: 56px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-ink);
  background: var(--color-stone-50);
  border: 2px solid var(--color-stone-300);
  border-radius: 0;
  padding: 0.25rem 0.4rem;
  text-align: center;
  -moz-appearance: textfield;
}

.sales-row-count-input::-webkit-outer-spin-button,
.sales-row-count-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.sales-row-count-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.sales-row-count-input:read-only {
  background: var(--color-stone-200);
  cursor: default;
}

.sales-row-count-input--overshoot {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.sales-row-readout {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  flex-shrink: 0;
  min-width: 6rem;
}

.sales-row-revenue {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1;
}

.sales-row-leftover {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-500);
  white-space: nowrap;
}

.sales-row-leftover--overshoot {
  color: var(--color-accent);
  font-weight: 600;
}

@media (max-width: 640px) {
  .sales-row {
    grid-template-columns: 48px minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    row-gap: 0.5rem;
  }
  .sales-row-stepper {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
  .sales-row-step-btn {
    width: 44px;
    height: 44px;
    font-size: 1.25rem;
  }
  .sales-row-count-input {
    width: 64px;
    height: 44px;
    font-size: 1rem;
  }
  .sales-row-readout {
    grid-column: 1 / -1;
    align-items: flex-start;
    flex-direction: row;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
}
</style>
