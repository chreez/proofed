<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import HelpTooltip from '@/components/HelpTooltip.vue'
import { derivedMarkupPct, nearestPretty, salesToBreakEven } from '@/composables/usePricing'
import type { ProductionEntry } from '@/types/production'

/**
 * PricingRow — dense pricing row tied to a single ProductionEntry (PF-256.4).
 *
 * Renders cost-per-unit, markup slider (50–1500, step 1, default 150), the
 * raw decimal sell price (with a ≈$X.50 / ≈$X.00 hint when the raw is not
 * already on a pretty anchor), CP, an estimated-sell input (defaults to
 * full bake), and a sales-to-break-even line.
 *
 * "By-feel" override: double-click the sell price to type an absolute
 * dollar amount. When set, the slider becomes read-only and displays the
 * derived markup% (e.g. "derived: 1317%"); a ↺ reset link clears the
 * override and restores cost-×-markup math. Mirrors the
 * `ProductionCartEntry.vue` yieldOverride UX.
 *
 * Math comes from `usePricing.ts`; this component is presentational + emits
 * markup / estimated-sold / sell-price-override changes on user input.
 */

const props = withDefaults(
  defineProps<{
    entry: ProductionEntry
    recipeName: string
    yields?: string | null
    heroThumb?: string | null
    /** Effective units this entry will produce (batches × baseYield, or override). */
    unitsPerBake: number
    /** Cost per unit in dollars, or null when no cost data is available. */
    costPerUnit: number | null
    /** Current markup percent — display value, drives the slider. */
    markupPct: number
    /**
     * Estimated units that will actually sell this bake. Defaults to
     * `unitsPerBake` (full bake sells). Used in revenue/CP math upstream;
     * the row only displays the override value and emits changes.
     */
    estimatedSold?: number | null
    /**
     * Absolute per-unit sell price override. When set, the markup slider
     * becomes read-only and the displayed sell price is this value
     * verbatim. `null` (default) = compute from cost × markup.
     */
    sellPriceOverride?: number | null
    /** Slider bounds — defaults match the post-feedback range. */
    min?: number
    max?: number
    step?: number
  }>(),
  {
    yields: null,
    heroThumb: null,
    estimatedSold: null,
    sellPriceOverride: null,
    min: 50,
    max: 1500,
    step: 1,
  },
)

const emit = defineEmits<{
  'update-markup': [value: number]
  'update-estimated-sold': [value: number]
  'update-sell-price-override': [value: number | null]
}>()

const initials = computed(() => {
  const words = props.recipeName.trim().split(/\s+/).filter((w) => /^[A-Za-z]/.test(w))
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return props.recipeName.slice(0, 2).toUpperCase() || '??'
})

const hasCost = computed(
  () => typeof props.costPerUnit === 'number' && props.costPerUnit > 0,
)

const unitLabel = computed(() => props.entry.unit || 'unit')

const yieldsLine = computed(() => {
  const batches = Math.max(1, props.entry.batches)
  const batchLabel = batches === 1 ? '1 batch' : `${batches} batches`
  const n = props.unitsPerBake
  const noun = n === 1 ? unitLabel.value : pluralize(unitLabel.value)
  return `${batchLabel} · ${n} ${noun}`
})

const hasOverride = computed(
  () => typeof props.sellPriceOverride === 'number' && props.sellPriceOverride > 0,
)

/**
 * Raw decimal sell price — override wins when set, otherwise
 * `cost × (1 + markup%)`. Presentation rounds to two decimals; underlying
 * value stays unrounded so the pretty-anchor hint is computed against the
 * true price, not a display artifact.
 */
const sellPriceRaw = computed(() => {
  if (hasOverride.value) return props.sellPriceOverride as number
  if (!hasCost.value || props.costPerUnit == null) return null
  return props.costPerUnit * (1 + props.markupPct / 100)
})

/**
 * Markup% that's actually displayed next to the slider. When an override
 * is active, reverse-engineer the implied markup from cost + override so
 * the readout stays meaningful. Falls back to the prop value when no
 * override (or no cost) is available.
 */
const displayedMarkupPct = computed<number | null>(() => {
  if (hasOverride.value && props.costPerUnit != null) {
    const d = derivedMarkupPct(props.sellPriceOverride as number, props.costPerUnit)
    if (d != null) return Math.round(d)
  }
  return props.markupPct
})

const sellPriceDisplay = computed(() => {
  if (sellPriceRaw.value == null) return null
  // Round-trip through fixed(2) so the rendered value matches the value used
  // for CP math below. Avoids "raw 1.4999999..." showing as $1.50 while CP
  // is computed against 1.4999.
  return Math.round(sellPriceRaw.value * 100) / 100
})

/**
 * Nearest pretty anchor for the hint. Shown only when the rounded display
 * value isn't already a multiple of 0.50 — otherwise the hint is redundant.
 */
const prettyHint = computed<{ value: number; label: string } | null>(() => {
  if (sellPriceDisplay.value == null) return null
  const pretty = nearestPretty(sellPriceDisplay.value)
  // Hide the hint when the rounded raw is already at the anchor.
  if (Math.abs(pretty - sellPriceDisplay.value) < 0.005) return null
  return { value: pretty, label: fmtMoney(pretty) }
})

const cpDollar = computed(() => {
  if (sellPriceDisplay.value == null || props.costPerUnit == null) return null
  return sellPriceDisplay.value - props.costPerUnit
})

const cpPct = computed(() => {
  if (cpDollar.value == null || sellPriceDisplay.value == null || sellPriceDisplay.value <= 0) {
    return null
  }
  return (cpDollar.value / sellPriceDisplay.value) * 100
})

/**
 * Total ingredient cost across the entire bake — `costPerUnit × unitsPerBake`.
 * Used for the sales-to-break-even hint; we sink the full batch cost
 * regardless of how many units actually sell.
 */
const totalBatchCost = computed(() => {
  if (props.costPerUnit == null || !Number.isFinite(props.costPerUnit)) return null
  return props.costPerUnit * props.unitsPerBake
})

const breakEvenUnits = computed(() =>
  salesToBreakEven(totalBatchCost.value, sellPriceDisplay.value),
)

/**
 * Display value for the estimated-sell input. Returns an empty string when
 * the user hasn't overridden the default — the placeholder then surfaces
 * the implicit unitsPerBake value (e.g. "8" for an 8-bun recipe).
 */
const estimatedSoldDisplay = computed(() => {
  if (props.estimatedSold == null) return ''
  if (props.estimatedSold === props.unitsPerBake) return ''
  return String(props.estimatedSold)
})

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

// ──────────────────────────────────────────────
// Inline sell-price override (double-click to edit)
// Mirrors ProductionCartEntry.vue yieldOverride UX.
// ──────────────────────────────────────────────
const editing = ref(false)
const editValue = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

function onSellPriceDoubleClick(): void {
  // Seed with the current displayed price so the user can tweak rather
  // than retype. Falls back to "" when cost data is missing.
  if (sellPriceDisplay.value != null) {
    editValue.value = sellPriceDisplay.value.toFixed(2)
  } else {
    editValue.value = ''
  }
  editing.value = true
  nextTick(() => {
    const el = editInputRef.value
    if (el) {
      el.focus()
      el.select()
    }
  })
}

function commitEdit(): void {
  if (!editing.value) return
  const raw = Number(editValue.value)
  editing.value = false
  if (!Number.isFinite(raw)) return
  // Round to cents — input has step=0.01 but typed values can be sloppier.
  const cents = Math.round(raw * 100) / 100
  if (cents <= 0) return
  emit('update-sell-price-override', cents)
}

function cancelEdit(): void {
  editing.value = false
}

function onEditKeydown(ev: KeyboardEvent): void {
  if (ev.key === 'Enter') {
    ev.preventDefault()
    commitEdit()
  } else if (ev.key === 'Escape') {
    ev.preventDefault()
    cancelEdit()
  }
}

function onClearOverride(): void {
  emit('update-sell-price-override', null)
}

function onSliderInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  if (Number.isFinite(value)) {
    emit('update-markup', value)
  }
}

function onEstimatedSoldInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const raw = target.value.trim()
  if (raw === '') {
    // Empty input → revert to default (sell-all). Surface as unitsPerBake so
    // the parent stores no override.
    emit('update-estimated-sold', props.unitsPerBake)
    return
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return
  emit('update-estimated-sold', Math.floor(value))
}

function pluralize(word: string): string {
  if (!word) return word
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) return word
  return `${word}s`
}
</script>

<template>
  <li
    class="pricing-row"
    :data-recipe-id="entry.recipeId"
    :data-entry-id="entry.id"
  >
    <img
      v-if="heroThumb"
      class="pricing-row-thumb"
      :src="heroThumb"
      :alt="`${recipeName} — latest bake`"
      loading="lazy"
    />
    <div
      v-else
      class="pricing-row-thumb pricing-row-thumb-placeholder"
      aria-hidden="true"
    >{{ initials }}</div>

    <div class="pricing-row-id">
      <HelpTooltip class="pricing-row-name-tooltip" :text="recipeName">
        <span class="pricing-row-name">{{ recipeName }}</span>
      </HelpTooltip>
      <span class="pricing-row-yields">{{ yieldsLine }}</span>
    </div>

    <div class="pricing-row-cost">
      <HelpTooltip
        v-if="hasCost && costPerUnit != null"
        text="Cost per unit — recipe total cost ÷ units in this bake. Pulls from most-recent cook_log, falls back to estimatedCost."
      >
        <span class="pricing-row-cost-value">{{ fmtMoney(costPerUnit) }}<span class="pricing-row-cost-unit">/{{ unitLabel }}</span></span>
      </HelpTooltip>
      <HelpTooltip
        v-else
        text="No cost data yet — add a cook_log entry with cost, or run /cost on the recipe."
      >
        <span class="pricing-row-cost-missing">no cost data</span>
      </HelpTooltip>
    </div>

    <div class="pricing-row-slider-wrap">
      <HelpTooltip
        class="pricing-row-slider-tooltip"
        :text="hasOverride
          ? `Markup slider disabled — a custom sell price is set. Clear it to use markup math again.`
          : `Markup percent — drag to set sell price (${min}% to ${max}%).`"
        align="left"
      >
        <input
          type="range"
          class="pricing-row-slider"
          :class="{ 'pricing-row-slider--disabled': hasOverride }"
          :min="min"
          :max="max"
          :step="step"
          :value="markupPct"
          :disabled="hasOverride"
          :aria-label="`Markup percent for ${recipeName}`"
          :aria-readonly="hasOverride ? 'true' : 'false'"
          data-testid="pricing-row-slider"
          @input="onSliderInput"
        />
      </HelpTooltip>
      <span
        class="pricing-row-markup"
        :class="{ 'pricing-row-markup--derived': hasOverride }"
        data-testid="pricing-row-markup"
      >
        <template v-if="hasOverride && displayedMarkupPct != null">derived: {{ displayedMarkupPct }}%</template>
        <template v-else>{{ markupPct }}%</template>
      </span>
      <HelpTooltip
        class="pricing-row-sold-tooltip"
        :text="`Estimated units sold (default: ${unitsPerBake}). Leave blank to assume the full bake sells.`"
        align="left"
      >
        <label class="pricing-row-sold-label">
          <span class="pricing-row-sold-text">≈ sell</span>
          <input
            type="number"
            class="pricing-row-sold-input"
            inputmode="numeric"
            step="1"
            min="0"
            :placeholder="String(unitsPerBake)"
            :value="estimatedSoldDisplay"
            :aria-label="`Estimated units sold for ${recipeName}`"
            @input="onEstimatedSoldInput"
          />
        </label>
      </HelpTooltip>
    </div>

    <div class="pricing-row-readout">
      <HelpTooltip
        v-if="editing"
        text="Type a custom sell price, Enter to save, Esc to cancel"
        align="right"
      >
        <input
          ref="editInputRef"
          v-model="editValue"
          type="number"
          class="pricing-row-sell-input"
          inputmode="decimal"
          step="0.01"
          min="0.01"
          :aria-label="`Custom sell price for ${recipeName}`"
          data-testid="pricing-row-sell-edit"
          @keydown="onEditKeydown"
          @blur="commitEdit"
        />
      </HelpTooltip>
      <HelpTooltip
        v-else-if="sellPriceDisplay != null"
        :text="hasOverride
          ? `Custom sell price — double-click to edit, ↺ to clear and go back to markup math.`
          : `Sell price per unit — cost × (1 + markup%). Double-click to type a custom price. The ≈$X.50 hint surfaces the nearest human-friendly anchor when the raw price isn't already on one.`"
        align="right"
      >
        <span
          class="pricing-row-sell"
          :class="{ 'pricing-row-sell--override': hasOverride }"
          role="button"
          tabindex="0"
          data-testid="pricing-row-sell-display"
          @dblclick="onSellPriceDoubleClick"
          @keydown.enter.prevent="onSellPriceDoubleClick"
        >{{ fmtMoney(sellPriceDisplay) }}</span>
      </HelpTooltip>
      <span v-else class="pricing-row-sell pricing-row-sell--missing">—</span>

      <HelpTooltip
        v-if="prettyHint && !hasOverride"
        :text="`Nearest pretty price — round to ${prettyHint.label} for a cleaner sticker.`"
        align="right"
      >
        <span class="pricing-row-sell-hint">≈ {{ prettyHint.label }}</span>
      </HelpTooltip>

      <span
        v-if="hasOverride"
        class="pricing-row-sell-custom"
        data-testid="pricing-row-sell-custom"
      >
        <span class="pricing-row-sell-custom-label">custom</span>
        ·
        <HelpTooltip
          text="Clear custom sell price, go back to markup math"
          align="right"
        >
          <button
            type="button"
            class="pricing-row-sell-reset"
            aria-label="Clear custom sell price"
            data-testid="pricing-row-sell-reset"
            @click="onClearOverride"
          >↺ clear custom</button>
        </HelpTooltip>
      </span>

      <HelpTooltip
        v-if="cpDollar != null && cpPct != null"
        text="Contribution profit per unit — sell price minus cost, and its share of the sell price."
        align="right"
      >
        <span class="pricing-row-cp">+{{ fmtMoney(cpDollar) }} · {{ Math.round(cpPct) }}%</span>
      </HelpTooltip>

      <span
        v-if="breakEvenUnits != null"
        class="pricing-row-breakeven"
      >break even: sell
        <HelpTooltip
          text="Sell at least N units to recover the batch's ingredient cost."
          align="right"
        >
          <span class="pricing-row-breakeven-n">{{ breakEvenUnits }}</span>
        </HelpTooltip>
        of {{ unitsPerBake }}</span>
    </div>
  </li>
</template>

<style scoped>
.pricing-row {
  position: relative;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto minmax(180px, 1.4fr) auto;
  align-items: center;
  gap: 0.875rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 2px solid var(--color-stone-300);
  border-bottom-width: 0;
  min-height: 64px;
}

.pricing-row:last-child {
  border-bottom-width: 2px;
}

.pricing-row-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  display: block;
  border: 2px solid var(--color-ink);
  background: var(--color-stone-300);
  flex-shrink: 0;
}

.pricing-row-thumb-placeholder {
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

.pricing-row-id {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.pricing-row-name-tooltip {
  min-width: 0;
  display: flex;
}

.pricing-row-name-tooltip :deep(.help-tooltip-trigger) {
  min-width: 0;
  display: flex;
  width: 100%;
}

.pricing-row-name {
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

.pricing-row-yields {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-600);
  white-space: nowrap;
}

.pricing-row-cost {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-stone-700);
  white-space: nowrap;
}

.pricing-row-cost-value {
  font-weight: 600;
  color: var(--color-ink);
}

.pricing-row-cost-unit {
  font-weight: 400;
  color: var(--color-stone-500);
}

.pricing-row-cost-missing {
  color: var(--color-stone-500);
  font-style: italic;
}

.pricing-row-slider-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.pricing-row-slider-tooltip {
  flex: 1;
  display: flex;
  min-width: 0;
}

.pricing-row-slider-tooltip :deep(.help-tooltip-trigger) {
  display: flex;
  width: 100%;
}

.pricing-row-slider {
  width: 100%;
  accent-color: var(--color-accent);
  height: 1.25rem;
}

.pricing-row-markup {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-ink);
  min-width: 3rem;
  text-align: right;
}

.pricing-row-sold-tooltip {
  flex-shrink: 0;
}

.pricing-row-sold-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-600);
  white-space: nowrap;
}

.pricing-row-sold-text {
  color: var(--color-stone-500);
}

.pricing-row-sold-input {
  width: 60px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-ink);
  background: var(--color-stone-50);
  border: 2px solid var(--color-stone-300);
  border-radius: 0;
  padding: 0.25rem 0.4rem;
  text-align: right;
  -moz-appearance: textfield;
}

.pricing-row-sold-input::-webkit-outer-spin-button,
.pricing-row-sold-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.pricing-row-sold-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.pricing-row-readout {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  flex-shrink: 0;
  min-width: 6rem;
}

.pricing-row-sell {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1;
}

.pricing-row-sell--missing {
  color: var(--color-stone-400);
}

.pricing-row-sell {
  cursor: text;
  user-select: none;
}

.pricing-row-sell:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.pricing-row-sell--override {
  font-style: italic;
  color: var(--color-accent);
}

.pricing-row-sell-input {
  width: 5.5rem;
  font-family: var(--font-mono);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-ink);
  background: var(--color-stone-50);
  border: 2px solid var(--color-accent);
  border-radius: 0;
  padding: 0.1rem 0.3rem;
  text-align: right;
  -moz-appearance: textfield;
}

.pricing-row-sell-input::-webkit-outer-spin-button,
.pricing-row-sell-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.pricing-row-sell-input:focus {
  outline: none;
}

.pricing-row-sell-custom {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-500);
  white-space: nowrap;
  display: inline-flex;
  gap: 0.3rem;
  align-items: baseline;
}

.pricing-row-sell-custom-label {
  color: var(--color-accent);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pricing-row-sell-reset {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-style: dotted;
}

.pricing-row-sell-reset:hover,
.pricing-row-sell-reset:focus-visible {
  text-decoration-style: solid;
  outline: none;
}

.pricing-row-slider--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pricing-row-markup--derived {
  font-style: italic;
  color: var(--color-accent);
  min-width: 6rem;
}

.pricing-row-sell-hint {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-500);
  white-space: nowrap;
}

.pricing-row-cp {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-600);
  white-space: nowrap;
}

.pricing-row-breakeven {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-500);
  white-space: nowrap;
}

.pricing-row-breakeven-n {
  font-weight: 600;
  color: var(--color-stone-700);
  text-decoration: underline dotted;
  text-decoration-color: var(--color-stone-400);
  text-underline-offset: 2px;
}

@media (max-width: 640px) {
  .pricing-row {
    grid-template-columns: 48px minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    row-gap: 0.5rem;
  }
  .pricing-row-slider-wrap {
    grid-column: 1 / -1;
    flex-wrap: wrap;
  }
  .pricing-row-readout {
    grid-column: 1 / -1;
    align-items: flex-start;
    flex-direction: row;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .pricing-row-cost {
    grid-column: 3;
  }
}
</style>
