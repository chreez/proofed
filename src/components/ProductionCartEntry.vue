<script setup lang="ts">
import { computed } from 'vue'
import type { ProductionEntry } from '@/types/production'

const props = defineProps<{
  entry: ProductionEntry
  recipeName: string
  yields?: string | null
  /** 400w webp thumb path resolved from the latest cook_log hero photo. */
  heroThumb?: string | null
}>()

const emit = defineEmits<{
  update: [patch: { quantity?: number; unit?: string }]
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

function emitQuantity(value: number): void {
  if (!Number.isFinite(value)) return
  const next = Math.max(1, Math.floor(value))
  if (next !== props.entry.quantity) {
    emit('update', { quantity: next })
  }
}

function onIncrement(): void {
  emitQuantity(props.entry.quantity + 1)
}

function onDecrement(): void {
  emitQuantity(props.entry.quantity - 1)
}

function onQuantityInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const raw = Number(target.value)
  if (!Number.isFinite(raw)) return
  emitQuantity(raw)
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
          <a
            :href="`/recipe/${entry.recipeId}`"
            class="cart-entry-name"
            :title="`Open ${recipeName}`"
          >{{ recipeName }}</a>
          <div v-if="yields" class="cart-entry-yields">makes: {{ yields }}</div>
        </div>
      </div>
      <button
        type="button"
        class="cart-entry-remove"
        :title="`Remove ${recipeName} from production`"
        :aria-label="`Remove ${recipeName} from production`"
        @click="onRemove"
      >×</button>
    </div>

    <div class="cart-entry-controls">
      <div class="cart-entry-qty">
        <button
          type="button"
          class="cart-entry-qty-btn"
          title="Decrease quantity"
          aria-label="Decrease quantity"
          @click="onDecrement"
        >−</button>
        <input
          type="number"
          class="cart-entry-qty-input"
          inputmode="numeric"
          min="1"
          step="1"
          :value="entry.quantity"
          :title="`Number of ${entry.unit || 'unit'}s to bake`"
          :aria-label="`Quantity for ${recipeName}`"
          @change="onQuantityInput"
        />
        <button
          type="button"
          class="cart-entry-qty-btn"
          title="Increase quantity"
          aria-label="Increase quantity"
          @click="onIncrement"
        >+</button>
      </div>
      <input
        type="text"
        class="cart-entry-unit"
        :value="entry.unit"
        placeholder="unit"
        title="Per-recipe unit label (e.g. loaf, roll, cookie)"
        :aria-label="`Unit for ${recipeName}`"
        @input="onUnitInput"
      />
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

.cart-entry-qty-input {
  width: 2rem;
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
}

.cart-entry-unit:focus-visible {
  border-color: var(--color-accent);
  outline: none;
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
