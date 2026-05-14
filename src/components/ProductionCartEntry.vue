<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { ProductionEntry } from '@/types/production'
import HelpTooltip from '@/components/HelpTooltip.vue'

const props = withDefaults(defineProps<{
  entry: ProductionEntry
  recipeName: string
  yields?: string | null
  /** 400w webp thumb path resolved from the latest cook_log hero photo. */
  heroThumb?: string | null
  /**
   * Base yield per batch (e.g. 8 for an 8-bun recipe). Parsed from
   * recipe.meta.yields by the parent. Used to scale display when no
   * override is active. Defaults to 1 if parent can't resolve it.
   */
  baseYield?: number
}>(), {
  yields: null,
  heroThumb: null,
  baseYield: 1,
})

const emit = defineEmits<{
  update: [patch: { batches?: number; yieldOverride?: number | null; unit?: string }]
  remove: []
}>()

const initials = computed(() => {
  const words = props.recipeName.trim().split(/\s+/).filter(w => /^[A-Za-z]/.test(w))
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return props.recipeName.slice(0, 2).toUpperCase() || '??'
})

/** Format ISO timestamp as locale date. */
const addedAtFormatted = computed(() => {
  try {
    return new Date(props.entry.addedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    })
  } catch {
    return props.entry.addedAt
  }
})

const safeBaseYield = computed(() => Math.max(1, Math.floor(props.baseYield || 1)))
const isOverride = computed(() => props.entry.yieldOverride !== null)

/** Effective yield displayed in the stepper. */
const displayYield = computed(() => {
  if (isOverride.value) return props.entry.yieldOverride as number
  return props.entry.batches * safeBaseYield.value
})

const unitLabel = computed(() => props.entry.unit || 'unit')

// Stepper button tooltips reflect the current mode.
const incTitle = computed(() =>
  isOverride.value ? `Add one ${unitLabel.value}` : 'Add one batch'
)
const decTitle = computed(() =>
  isOverride.value ? `Remove one ${unitLabel.value}` : 'Remove one batch'
)

// ──────────────────────────────────────────────
// Stepper actions
// ──────────────────────────────────────────────
function onIncrement(): void {
  if (isOverride.value) {
    const next = (props.entry.yieldOverride as number) + 1
    emit('update', { yieldOverride: Math.max(1, Math.floor(next)) })
  } else {
    emit('update', { batches: props.entry.batches + 1 })
  }
}

function onDecrement(): void {
  if (isOverride.value) {
    const next = Math.max(1, (props.entry.yieldOverride as number) - 1)
    if (next !== props.entry.yieldOverride) {
      emit('update', { yieldOverride: next })
    }
  } else {
    const next = Math.max(1, props.entry.batches - 1)
    if (next !== props.entry.batches) {
      emit('update', { batches: next })
    }
  }
}

function onReset(): void {
  if (!isOverride.value) return
  emit('update', { yieldOverride: null })
}

// ──────────────────────────────────────────────
// Inline override input (double-click to edit)
// ──────────────────────────────────────────────
const editing = ref(false)
const editValue = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

function onYieldDoubleClick(): void {
  editValue.value = String(displayYield.value)
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
  const next = Math.max(1, Math.floor(raw))
  // Always treat a typed value as an override — even if it matches the
  // batch-scaled number, the user explicitly typed it, and override mode
  // is the contract.
  if (next !== props.entry.yieldOverride) {
    emit('update', { yieldOverride: next })
  }
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

function onUnitInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update', { unit: target.value })
}

function onRemove(): void {
  emit('remove')
}
</script>

<template>
  <div
    class="cart-entry"
    :data-recipe-id="entry.recipeId"
    :data-entry-id="entry.id"
  >
    <div class="cart-entry-top">
      <div class="cart-entry-main">
        <img
          v-if="heroThumb"
          class="cart-entry-thumb"
          :src="heroThumb"
          :alt="`${recipeName} thumbnail`"
          loading="lazy"
        />
        <div
          v-else
          class="cart-entry-thumb cart-entry-thumb-placeholder"
          aria-hidden="true"
        >{{ initials }}</div>
        <div class="cart-entry-text">
          <HelpTooltip :text="`Open ${recipeName}`">
            <a
              :href="`/recipe/${entry.recipeId}`"
              class="cart-entry-name"
            >{{ recipeName }}</a>
          </HelpTooltip>
          <div v-if="yields" class="cart-entry-yields">makes: {{ yields }}</div>
        </div>
      </div>
      <HelpTooltip
        :text="`Remove ${recipeName} from production`"
        align="right"
      >
        <button
          type="button"
          class="cart-entry-remove"
          :aria-label="`Remove ${recipeName} from production`"
          @click="onRemove"
        >×</button>
      </HelpTooltip>
    </div>

    <div class="cart-entry-controls">
      <div class="cart-entry-qty">
        <HelpTooltip :text="decTitle">
          <button
            type="button"
            class="cart-entry-qty-btn"
            :aria-label="decTitle"
            @click="onDecrement"
          >−</button>
        </HelpTooltip>
        <HelpTooltip
          v-if="editing"
          :text="`Type a custom ${unitLabel} count, Enter to save, Esc to cancel`"
        >
          <input
            ref="editInputRef"
            v-model="editValue"
            type="number"
            class="cart-entry-qty-input cart-entry-qty-edit"
            inputmode="numeric"
            min="1"
            step="1"
            :aria-label="`Custom yield input for ${recipeName}`"
            data-testid="cart-entry-yield-edit"
            @keydown="onEditKeydown"
            @blur="commitEdit"
          />
        </HelpTooltip>
        <HelpTooltip v-else text="Double-click to set a custom amount">
          <span
            class="cart-entry-qty-display"
            :class="{ 'cart-entry-qty-display-override': isOverride }"
            :aria-label="`Quantity for ${recipeName}`"
            role="button"
            tabindex="0"
            data-testid="cart-entry-yield-display"
            @dblclick="onYieldDoubleClick"
            @keydown.enter.prevent="onYieldDoubleClick"
          >{{ displayYield }}</span>
        </HelpTooltip>
        <HelpTooltip :text="incTitle">
          <button
            type="button"
            class="cart-entry-qty-btn"
            :aria-label="incTitle"
            @click="onIncrement"
          >+</button>
        </HelpTooltip>
      </div>
      <HelpTooltip
        class="cart-entry-unit-tooltip"
        text="Per-recipe unit label (e.g. loaf, roll, cookie)"
        align="right"
      >
        <input
          type="text"
          class="cart-entry-unit"
          :value="entry.unit"
          placeholder="unit"
          :aria-label="`Unit for ${recipeName}`"
          @input="onUnitInput"
        />
      </HelpTooltip>
    </div>

    <div class="cart-entry-subtext">
      <template v-if="isOverride">
        <span class="cart-entry-subtext-custom" data-testid="cart-entry-custom-label">custom</span>
        ·
        <HelpTooltip text="Clear custom amount, go back to whole batches">
          <button
            type="button"
            class="cart-entry-reset"
            aria-label="Clear custom amount"
            data-testid="cart-entry-reset"
            @click="onReset"
          >↺ clear custom</button>
        </HelpTooltip>
      </template>
      <template v-else>
        <span class="cart-entry-subtext-scale" data-testid="cart-entry-scale-label">
          {{ entry.batches }} batch<span v-if="entry.batches !== 1">es</span>
        </span>
      </template>
    </div>

    <div class="cart-entry-meta">
      added by <span class="cart-entry-meta-by" :data-added-by="entry.addedBy">{{ entry.addedBy }}</span>
      · <span class="cart-entry-meta-date">{{ addedAtFormatted }}</span>
    </div>
  </div>
</template>

<style scoped>
.cart-entry {
  background: white;
  border: 2px solid var(--color-ink);
  border-radius: 0;
  padding: 0.6rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  animation: cart-entry-in 220ms ease-out both;
}

@keyframes cart-entry-in {
  from { transform: translateX(28px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .cart-entry { animation: none; }
}

.cart-entry-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.cart-entry-main {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.cart-entry-thumb {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--color-ink);
  border-radius: 0;
  object-fit: cover;
  background: var(--color-stone-300);
  flex-shrink: 0;
  display: block;
}

.cart-entry-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--color-stone-600);
  text-transform: uppercase;
}

.cart-entry-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
}

.cart-entry-name {
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1.3;
  color: var(--color-ink);
  text-decoration: none;
  border-bottom: 1px dashed transparent;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cart-entry-name:hover {
  border-bottom-color: var(--color-accent);
}

.cart-entry-yields {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-stone-600);
  line-height: 1.3;
}

.cart-entry-remove {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--color-ink);
  background: var(--color-stone-200);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-ink);
  border-radius: 0;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cart-entry-remove:hover,
.cart-entry-remove:focus-visible {
  background: var(--color-accent-tint);
  color: var(--color-accent);
  border-color: var(--color-accent);
  outline: none;
}

.cart-entry-controls {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.cart-entry-qty {
  display: flex;
  align-items: stretch;
  border: 2px solid var(--color-ink);
  background: var(--color-stone-100);
  border-radius: 0;
}

.cart-entry-qty-btn {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--color-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cart-entry-qty-btn:hover,
.cart-entry-qty-btn:focus-visible {
  background: var(--color-stone-300);
  outline: none;
}

.cart-entry-qty-display {
  min-width: 2.25rem;
  padding: 0 0.25rem;
  text-align: center;
  border: none;
  border-left: 1px solid var(--color-stone-400);
  border-right: 1px solid var(--color-stone-400);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background: transparent;
  color: var(--color-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: text;
  user-select: none;
}

.cart-entry-qty-display:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.cart-entry-qty-display-override {
  font-style: italic;
  color: var(--color-accent);
  font-weight: 600;
}

.cart-entry-qty-input {
  width: 2.5rem;
  text-align: center;
  border: none;
  border-left: 1px solid var(--color-stone-400);
  border-right: 1px solid var(--color-stone-400);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0;
  background: transparent;
  color: var(--color-ink);
  -moz-appearance: textfield;
}

.cart-entry-qty-input::-webkit-outer-spin-button,
.cart-entry-qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.cart-entry-qty-input:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.cart-entry-qty-edit {
  background: var(--color-stone-50);
}

.cart-entry-unit-tooltip {
  flex: 1;
  min-width: 0;
  display: flex;
}

.cart-entry-unit-tooltip :deep(.help-tooltip-trigger) {
  flex: 1;
  min-width: 0;
  display: flex;
}

.cart-entry-unit {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  border: 2px solid var(--color-stone-400);
  border-radius: 0;
  padding: 0.15rem 0.4rem;
  background: var(--color-stone-50);
  color: var(--color-ink);
  min-width: 0;
  width: 100%;
}

.cart-entry-unit:focus-visible {
  border-color: var(--color-accent);
  outline: none;
}

.cart-entry-subtext {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-stone-500);
  line-height: 1.3;
}

.cart-entry-subtext-custom {
  color: var(--color-accent);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cart-entry-reset {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-style: dotted;
}

.cart-entry-reset:hover,
.cart-entry-reset:focus-visible {
  color: var(--color-accent-dark, var(--color-accent));
  outline: none;
  text-decoration-style: solid;
}

.cart-entry-meta {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-stone-500);
}

.cart-entry-meta-by[data-added-by='agent'] {
  color: var(--color-crust-dark);
}
</style>
