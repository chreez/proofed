<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import HelpTooltip from '@/components/HelpTooltip.vue'
import type { PlanSnapshot, TransactionItem } from '@/types/sales'

/**
 * NewSaleSheet — modal/bottom-sheet for building one customer transaction
 * during an active market session (PF-256.6 Slice 6.x).
 *
 * Renders one row per recipe from the session's initialPlan. The user
 * builds a cart with +/− steppers (default 0) and may override unit price
 * per line. The live total updates as units/prices change.
 *
 * Layout:
 *   - Mobile (≤640px): slides up from the bottom, 80vh.
 *   - Desktop: centered modal, max-width 600px.
 *
 * Emits:
 *   - `complete: TransactionItem[]` when "Complete Sale" is clicked with a
 *     non-empty cart (units > 0 for at least one row).
 *   - `cancel` when the sheet is dismissed.
 *
 * Aggregate sold-so-far is passed in via `soldByRecipe` so the "available"
 * line can subtract prior transactions in the session.
 */

interface PlanRow {
  recipeId: string
  recipeName: string
  heroThumb: string | null
  unit: string
}

const props = withDefaults(
  defineProps<{
    open: boolean
    initialPlan: PlanSnapshot[]
    /** Per-recipe display data — name + thumb + unit noun. */
    rows: PlanRow[]
    /** Map of recipeId → units already sold this session (for "available"). */
    soldByRecipe: Record<string, number>
  }>(),
  {},
)

const emit = defineEmits<{
  complete: [items: TransactionItem[], notes: string]
  cancel: []
}>()

interface CartRow {
  recipeId: string
  recipeName: string
  heroThumb: string | null
  unit: string
  units: number
  unitPrice: number
  plannedUnits: number
  available: number
}

const cart = ref<CartRow[]>([])
const notes = ref('')

function buildCart(): CartRow[] {
  const rowMap = new Map(props.rows.map((r) => [r.recipeId, r]))
  return props.initialPlan.map((p) => {
    const r = rowMap.get(p.recipeId)
    const sold = props.soldByRecipe[p.recipeId] ?? 0
    return {
      recipeId: p.recipeId,
      recipeName: r?.recipeName ?? p.recipeId,
      heroThumb: r?.heroThumb ?? null,
      unit: r?.unit ?? 'unit',
      units: 0,
      unitPrice: p.unitPrice,
      plannedUnits: p.plannedUnits,
      available: Math.max(0, p.plannedUnits - sold),
    }
  })
}

// Reset cart whenever the sheet opens or the plan changes while open.
watch(
  () => [props.open, props.initialPlan, props.rows],
  () => {
    if (props.open) {
      cart.value = buildCart()
      notes.value = ''
    }
  },
  { immediate: true, deep: true },
)

const liveTotal = computed(() =>
  cart.value.reduce((acc, row) => acc + row.units * row.unitPrice, 0),
)

const cartItemCount = computed(() =>
  cart.value.reduce((acc, row) => acc + row.units, 0),
)

const canComplete = computed(() => cartItemCount.value > 0)

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => /^[A-Za-z]/.test(w))
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '??'
}

function pluralize(word: string, count: number): string {
  if (count === 1) return word
  if (!word) return word
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) return word
  return `${word}s`
}

function onDecrement(idx: number): void {
  const row = cart.value[idx]
  if (!row) return
  row.units = Math.max(0, row.units - 1)
}

function onIncrement(idx: number): void {
  const row = cart.value[idx]
  if (!row) return
  row.units = row.units + 1
}

function onUnitsInput(idx: number, event: Event): void {
  const row = cart.value[idx]
  if (!row) return
  const target = event.target as HTMLInputElement
  const raw = target.value.trim()
  if (raw === '') {
    row.units = 0
    return
  }
  const v = Number(raw)
  if (!Number.isFinite(v) || v < 0) return
  row.units = Math.max(0, Math.floor(v))
}

function onPriceInput(idx: number, event: Event): void {
  const row = cart.value[idx]
  if (!row) return
  const target = event.target as HTMLInputElement
  const raw = target.value.trim()
  if (raw === '') {
    row.unitPrice = 0
    return
  }
  const v = Number(raw)
  if (!Number.isFinite(v) || v < 0) return
  row.unitPrice = v
}

function onComplete(): void {
  if (!canComplete.value) return
  const items: TransactionItem[] = cart.value
    .filter((r) => r.units > 0)
    .map((r) => ({
      recipeId: r.recipeId,
      units: r.units,
      unitPrice: r.unitPrice,
      lineTotal: r.units * r.unitPrice,
    }))
  emit('complete', items, notes.value.trim())
}

function onCancel(): void {
  emit('cancel')
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    onCancel()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    onCancel()
  }
}
</script>

<template>
  <div
    v-if="open"
    class="new-sale-backdrop"
    data-testid="new-sale-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="new-sale-title"
    @click="onBackdropClick"
    @keydown="onKeydown"
  >
    <div class="new-sale-sheet" data-testid="new-sale-sheet">
      <header class="new-sale-header">
        <h2 id="new-sale-title" class="new-sale-title">New Sale</h2>
        <HelpTooltip text="Cancel — close without recording." align="right">
          <button
            type="button"
            class="new-sale-close"
            aria-label="Cancel new sale"
            data-testid="new-sale-cancel"
            @click="onCancel"
          >×</button>
        </HelpTooltip>
      </header>

      <div class="new-sale-body">
        <ul class="new-sale-list" data-testid="new-sale-list">
          <li
            v-for="(row, idx) in cart"
            :key="row.recipeId"
            class="new-sale-row"
            :data-recipe-id="row.recipeId"
          >
            <img
              v-if="row.heroThumb"
              class="new-sale-row-thumb"
              :src="row.heroThumb"
              :alt="`${row.recipeName} — latest bake`"
              loading="lazy"
            />
            <div
              v-else
              class="new-sale-row-thumb new-sale-row-thumb-placeholder"
              aria-hidden="true"
            >{{ initialsFor(row.recipeName) }}</div>

            <div class="new-sale-row-id">
              <span class="new-sale-row-name">{{ row.recipeName }}</span>
              <HelpTooltip
                :text="`Available: planned ${row.plannedUnits} minus sold-so-far. May go negative if you restock.`"
              >
                <span class="new-sale-row-meta">available: {{ row.available }} {{ pluralize(row.unit, row.available) }}</span>
              </HelpTooltip>
            </div>

            <div class="new-sale-row-qty">
              <HelpTooltip text="Decrement units in cart">
                <button
                  type="button"
                  class="new-sale-step-btn"
                  :disabled="row.units <= 0"
                  :aria-label="`Decrement ${row.recipeName}`"
                  :data-testid="`new-sale-dec-${row.recipeId}`"
                  @click="onDecrement(idx)"
                >−</button>
              </HelpTooltip>
              <HelpTooltip text="Units in cart for this recipe">
                <input
                  type="number"
                  class="new-sale-units-input"
                  inputmode="numeric"
                  step="1"
                  min="0"
                  :value="row.units"
                  :aria-label="`Units for ${row.recipeName}`"
                  :data-testid="`new-sale-units-${row.recipeId}`"
                  @input="onUnitsInput(idx, $event)"
                />
              </HelpTooltip>
              <HelpTooltip text="Increment units in cart">
                <button
                  type="button"
                  class="new-sale-step-btn"
                  :aria-label="`Increment ${row.recipeName}`"
                  :data-testid="`new-sale-inc-${row.recipeId}`"
                  @click="onIncrement(idx)"
                >+</button>
              </HelpTooltip>
            </div>

            <div class="new-sale-row-price">
              <HelpTooltip text="Unit price — defaults to session snapshot. Override for discounts." align="right">
                <label class="new-sale-price-label">
                  <span class="new-sale-price-prefix">$</span>
                  <input
                    type="number"
                    class="new-sale-price-input"
                    inputmode="decimal"
                    step="0.01"
                    min="0"
                    :value="row.unitPrice"
                    :aria-label="`Unit price for ${row.recipeName}`"
                    :data-testid="`new-sale-price-${row.recipeId}`"
                    @input="onPriceInput(idx, $event)"
                  />
                </label>
              </HelpTooltip>
              <span
                class="new-sale-line-total"
                :data-testid="`new-sale-linetotal-${row.recipeId}`"
              >{{ fmtMoney(row.units * row.unitPrice) }}</span>
            </div>
          </li>
        </ul>

        <HelpTooltip text="Optional notes — e.g. customer name, payment method.">
          <textarea
            v-model="notes"
            class="new-sale-notes"
            placeholder="Notes (optional)"
            rows="2"
            data-testid="new-sale-notes"
          />
        </HelpTooltip>
      </div>

      <footer class="new-sale-footer">
        <div class="new-sale-total" data-testid="new-sale-total">
          Total: <strong>{{ fmtMoney(liveTotal) }}</strong>
        </div>
        <div class="new-sale-actions">
          <HelpTooltip text="Discard cart and close." align="right">
            <button
              type="button"
              class="new-sale-cancel-btn"
              data-testid="new-sale-cancel-btn"
              @click="onCancel"
            >Cancel</button>
          </HelpTooltip>
          <HelpTooltip
            :text="canComplete ? 'Record this sale and append to the transaction log.' : 'Add at least one unit to record a sale.'"
            align="right"
          >
            <button
              type="button"
              class="new-sale-complete-btn"
              :disabled="!canComplete"
              data-testid="new-sale-complete"
              @click="onComplete"
            >Complete Sale</button>
          </HelpTooltip>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.new-sale-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26, 24, 22, 0.55);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.new-sale-sheet {
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  background: var(--color-stone-50);
  border: 2px solid var(--color-ink);
  border-radius: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.new-sale-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid var(--color-stone-200);
  background: white;
  flex-shrink: 0;
}

.new-sale-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

.new-sale-close {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-ink);
  background: var(--color-stone-100);
  border: 2px solid var(--color-stone-300);
  border-radius: 0;
  cursor: pointer;
  line-height: 1;
}

.new-sale-close:hover,
.new-sale-close:focus-visible {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-surface);
  outline: none;
}

.new-sale-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
}

.new-sale-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem 0;
  display: flex;
  flex-direction: column;
}

.new-sale-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem;
  background: white;
  border: 2px solid var(--color-stone-300);
  border-bottom-width: 0;
  min-height: 60px;
}

.new-sale-row:last-child {
  border-bottom-width: 2px;
}

.new-sale-row-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  display: block;
  border: 2px solid var(--color-ink);
  background: var(--color-stone-300);
}

.new-sale-row-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-stone-600);
  text-transform: uppercase;
}

.new-sale-row-id {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.new-sale-row-name {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.new-sale-row-meta {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-600);
}

.new-sale-row-qty {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.new-sale-step-btn {
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

.new-sale-step-btn:hover:not(:disabled),
.new-sale-step-btn:focus-visible:not(:disabled) {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-surface);
  outline: none;
}

.new-sale-step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.new-sale-units-input {
  width: 48px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-ink);
  background: var(--color-stone-50);
  border: 2px solid var(--color-stone-300);
  border-radius: 0;
  padding: 0.2rem 0.3rem;
  text-align: center;
  -moz-appearance: textfield;
}

.new-sale-units-input::-webkit-outer-spin-button,
.new-sale-units-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.new-sale-units-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.new-sale-row-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  min-width: 5rem;
}

.new-sale-price-label {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-stone-600);
  background: var(--color-stone-50);
  border: 2px solid var(--color-stone-300);
  padding: 0.15rem 0.25rem;
}

.new-sale-price-label:focus-within {
  border-color: var(--color-accent);
}

.new-sale-price-prefix {
  color: var(--color-stone-500);
}

.new-sale-price-input {
  width: 50px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-ink);
  background: transparent;
  border: 0;
  padding: 0;
  text-align: right;
  -moz-appearance: textfield;
}

.new-sale-price-input::-webkit-outer-spin-button,
.new-sale-price-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.new-sale-price-input:focus {
  outline: none;
}

.new-sale-line-total {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-ink);
}

.new-sale-notes {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-ink);
  background: var(--color-stone-50);
  border: 2px solid var(--color-stone-300);
  border-radius: 0;
  padding: 0.4rem 0.6rem;
  resize: vertical;
  margin-top: 0.5rem;
  box-sizing: border-box;
}

.new-sale-notes:focus {
  outline: none;
  border-color: var(--color-accent);
}

.new-sale-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-top: 2px solid var(--color-stone-200);
  background: white;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.new-sale-total {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  color: var(--color-stone-700);
}

.new-sale-total strong {
  color: var(--color-ink);
  font-weight: 700;
  font-size: 1.25rem;
}

.new-sale-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.new-sale-cancel-btn,
.new-sale-complete-btn {
  padding: 0.5rem 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 0;
  cursor: pointer;
}

.new-sale-cancel-btn {
  color: var(--color-ink);
  background: var(--color-stone-100);
  border: 2px solid var(--color-stone-300);
}

.new-sale-cancel-btn:hover,
.new-sale-cancel-btn:focus-visible {
  background: var(--color-stone-200);
  outline: none;
}

.new-sale-complete-btn {
  color: var(--color-surface);
  background: var(--color-ink);
  border: 2px solid var(--color-ink);
}

.new-sale-complete-btn:hover:not(:disabled),
.new-sale-complete-btn:focus-visible:not(:disabled) {
  background: var(--color-accent);
  border-color: var(--color-accent);
  outline: none;
}

.new-sale-complete-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .new-sale-backdrop {
    padding: 0;
    align-items: flex-end;
  }
  .new-sale-sheet {
    max-width: 100%;
    max-height: 80vh;
    height: 80vh;
    border-bottom: 0;
  }
  .new-sale-row {
    grid-template-columns: 40px minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    row-gap: 0.4rem;
  }
  .new-sale-row-qty {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
  .new-sale-step-btn {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
  .new-sale-units-input {
    width: 56px;
    height: 40px;
    font-size: 1rem;
  }
  .new-sale-row-price {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .new-sale-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .new-sale-actions {
    width: 100%;
    justify-content: stretch;
  }
  .new-sale-actions :deep(.help-tooltip),
  .new-sale-actions :deep(.help-tooltip-trigger) {
    flex: 1;
  }
  .new-sale-cancel-btn,
  .new-sale-complete-btn {
    width: 100%;
  }
}
</style>
