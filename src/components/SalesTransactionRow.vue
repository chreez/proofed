<script setup lang="ts">
import { computed, ref } from 'vue'
import HelpTooltip from '@/components/HelpTooltip.vue'
import type { SalesTransaction } from '@/types/sales'

/**
 * SalesTransactionRow — one row in the transaction log of an active or
 * closed market session (PF-256.6 Slice 6.x).
 *
 * Collapsed: time + item count + total. Expand toggle reveals line items
 * (compact "N × name @ $price = $total" lines), notes if present, and a
 * delete button. Delete fires a window.confirm before emitting.
 *
 * In readonly mode (closed sessions) the delete button is hidden.
 */

const props = withDefaults(
  defineProps<{
    transaction: SalesTransaction
    /** Map of recipeId → display name (for line items). */
    recipeNameByRecipe: Record<string, string>
    /** Hide delete button (closed session). */
    readonly?: boolean
    /** Start expanded (useful for tests / focused-rows). */
    initiallyExpanded?: boolean
  }>(),
  {
    readonly: false,
    initiallyExpanded: false,
  },
)

const emit = defineEmits<{
  delete: [txId: string]
}>()

const expanded = ref(props.initiallyExpanded)

const itemCount = computed(() =>
  props.transaction.items.reduce((acc, it) => acc + it.units, 0),
)

const occurredTime = computed(() => {
  try {
    const d = new Date(props.transaction.occurredAt)
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  } catch {
    return props.transaction.occurredAt
  }
})

const occurredDate = computed(() => {
  try {
    const d = new Date(props.transaction.occurredAt)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
})

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function nameFor(recipeId: string): string {
  return props.recipeNameByRecipe[recipeId] ?? recipeId
}

function toggle(): void {
  expanded.value = !expanded.value
}

function onDelete(): void {
  if (typeof window !== 'undefined' && window.confirm) {
    const ok = window.confirm('Delete this transaction? This cannot be undone.')
    if (!ok) return
  }
  emit('delete', props.transaction.id)
}
</script>

<template>
  <li
    class="tx-row"
    :class="{ 'tx-row--expanded': expanded, 'tx-row--readonly': readonly }"
    :data-tx-id="transaction.id"
  >
    <HelpTooltip
      :text="expanded ? 'Collapse this transaction.' : 'Expand to see line items.'"
    >
      <button
        type="button"
        class="tx-summary"
        :aria-expanded="expanded ? 'true' : 'false'"
        data-testid="tx-row-toggle"
        @click="toggle"
      >
        <span class="tx-time" data-testid="tx-row-time">{{ occurredTime }}</span>
        <span class="tx-meta">
          <span data-testid="tx-row-count">{{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}</span>
        </span>
        <span class="tx-total" data-testid="tx-row-total">{{ fmtMoney(transaction.totalAsk) }}</span>
        <span class="tx-chevron" :class="{ 'tx-chevron--open': expanded }">›</span>
      </button>
    </HelpTooltip>

    <div v-if="expanded" class="tx-details" data-testid="tx-row-details">
      <ul class="tx-items">
        <li
          v-for="(item, idx) in transaction.items"
          :key="idx"
          class="tx-item"
          :data-recipe-id="item.recipeId"
        >
          <span class="tx-item-units">{{ item.units }}×</span>
          <span class="tx-item-name">{{ nameFor(item.recipeId) }}</span>
          <span class="tx-item-price">@ {{ fmtMoney(item.unitPrice) }}</span>
          <span class="tx-item-linetotal">{{ fmtMoney(item.lineTotal) }}</span>
        </li>
      </ul>
      <p v-if="transaction.notes" class="tx-notes" data-testid="tx-row-notes">
        <span class="tx-notes-label">notes:</span> {{ transaction.notes }}
      </p>
      <p v-if="occurredDate" class="tx-occurred-date">{{ occurredDate }}</p>
      <div v-if="!readonly" class="tx-footer">
        <HelpTooltip text="Delete this transaction — basic undo." align="right">
          <button
            type="button"
            class="tx-delete-btn"
            data-testid="tx-row-delete"
            @click="onDelete"
          >Delete</button>
        </HelpTooltip>
      </div>
    </div>
  </li>
</template>

<style scoped>
.tx-row {
  list-style: none;
  background: white;
  border: 2px solid var(--color-stone-300);
  border-bottom-width: 0;
}

.tx-row:last-child {
  border-bottom-width: 2px;
}

.tx-row--readonly {
  background: var(--color-stone-100);
}

.tx-summary {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: baseline;
  gap: 0.75rem;
  width: 100%;
  text-align: left;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-ink);
  background: transparent;
  border: 0;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
}

.tx-summary:hover,
.tx-summary:focus-visible {
  background: var(--color-stone-100);
  outline: none;
}

.tx-time {
  font-weight: 600;
}

.tx-meta {
  color: var(--color-stone-600);
  font-size: 0.8rem;
}

.tx-total {
  font-weight: 700;
  font-size: 1rem;
}

.tx-chevron {
  font-family: var(--font-mono);
  font-size: 1rem;
  color: var(--color-stone-500);
  transition: transform 0.15s ease;
}

.tx-chevron--open {
  transform: rotate(90deg);
  color: var(--color-accent);
}

.tx-details {
  border-top: 1px solid var(--color-stone-200);
  padding: 0.6rem 0.75rem;
  background: var(--color-stone-50);
}

.tx-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tx-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: baseline;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-ink);
}

.tx-item-units {
  font-weight: 700;
}

.tx-item-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-item-price {
  color: var(--color-stone-600);
  font-size: 0.75rem;
}

.tx-item-linetotal {
  font-weight: 600;
}

.tx-notes {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-stone-600);
  margin: 0.5rem 0 0;
}

.tx-notes-label {
  color: var(--color-stone-500);
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
}

.tx-occurred-date {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-500);
  margin: 0.5rem 0 0;
}

.tx-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.tx-delete-btn {
  padding: 0.3rem 0.7rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-ink);
  background: var(--color-stone-100);
  border: 2px solid var(--color-stone-300);
  border-radius: 0;
  cursor: pointer;
}

.tx-delete-btn:hover,
.tx-delete-btn:focus-visible {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-surface);
  outline: none;
}
</style>
