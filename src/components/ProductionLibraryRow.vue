<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  recipeId: string
  recipeName: string
  yields?: string | null
  /** 400w webp thumb path resolved from the latest cook_log hero photo. */
  heroThumb?: string | null
  /** Category label (e.g. "baking", "pizza & dough", "mains"). */
  category?: string | null
  /** Count of cook_log entries for this recipe (lifetime bake count). */
  bakeCount?: number
  /** True when this recipe already has an entry in the production cart. */
  inQueue?: boolean
  /** True when this row is the keyboard-focused row in the library list. */
  isFocused?: boolean
}>()

const emit = defineEmits<{
  add: [recipeId: string]
  focus: [recipeId: string]
}>()

const rowEl = ref<HTMLLIElement | null>(null)

const initials = computed(() => {
  // 2-letter mono initials from the first two whitespace-separated words.
  const words = props.recipeName.trim().split(/\s+/).filter(w => /^[A-Za-z]/.test(w))
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return props.recipeName.slice(0, 2).toUpperCase() || '??'
})

const yieldsLabel = computed(() => props.yields?.trim() || '—')
const categoryLabel = computed(() => props.category?.trim() || '')
const bakeCountLabel = computed(() => `${props.bakeCount ?? 0}×`)

function handleAdd(event: Event): void {
  event.stopPropagation()
  emit('add', props.recipeId)
}

function handleRowClick(): void {
  emit('focus', props.recipeId)
}

// When the parent marks this row as focused, scroll it into view if needed
// so keyboard nav (j/k/Arrow) keeps the active row visible. Guarded for
// environments (jsdom in tests) that don't implement scrollIntoView.
watch(
  () => props.isFocused,
  (focused) => {
    if (!focused || !rowEl.value) return
    if (typeof rowEl.value.scrollIntoView !== 'function') return
    try {
      rowEl.value.scrollIntoView({ block: 'nearest' })
    } catch {
      // no-op — jsdom and some older browsers can throw on options arg
    }
  }
)
</script>

<template>
  <li
    ref="rowEl"
    class="library-row"
    :class="{ 'in-queue': inQueue, 'is-focused': isFocused }"
    :data-recipe-id="recipeId"
    :data-in-queue="inQueue ? 'true' : 'false'"
    :data-focused="isFocused ? 'true' : 'false'"
    @click="handleRowClick"
  >
    <img
      v-if="heroThumb"
      class="library-row-thumb"
      :src="heroThumb"
      :alt="`${recipeName} — latest bake`"
      loading="lazy"
    />
    <div
      v-else
      class="library-row-thumb library-row-thumb-placeholder"
      aria-hidden="true"
    >{{ initials }}</div>

    <div class="library-row-name" :title="recipeName">{{ recipeName }}</div>

    <div class="library-row-yields">{{ yieldsLabel }}</div>

    <div
      v-if="categoryLabel"
      class="library-row-category"
      :title="`Category: ${categoryLabel}`"
    >{{ categoryLabel }}</div>
    <div v-else class="library-row-category library-row-category-empty">—</div>

    <div
      class="library-row-bakes"
      :title="`Baked ${bakeCount ?? 0} time${(bakeCount ?? 0) === 1 ? '' : 's'}`"
    >{{ bakeCountLabel }}</div>

    <button
      type="button"
      class="library-row-plus"
      :title="`Add ${recipeName} to production queue`"
      :aria-label="`Add ${recipeName} to production queue`"
      :data-testid="`add-library-${recipeId}`"
      @click="handleAdd"
    >+</button>
  </li>
</template>

<style scoped>
.library-row {
  position: relative;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto auto auto auto;
  align-items: center;
  gap: 0.875rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 2px solid var(--color-stone-300);
  border-bottom-width: 0;
  cursor: pointer;
  min-height: 64px;
  transition: background 80ms ease, border-color 80ms ease;
}

.library-row:last-child {
  border-bottom-width: 2px;
}

.library-row:hover {
  background: var(--color-stone-200);
}

.library-row.in-queue {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
  z-index: 1;
}

.library-row.is-focused {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
  background: var(--color-stone-200);
  z-index: 2;
}

.library-row-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  display: block;
  border: 2px solid var(--color-ink);
  background: var(--color-stone-300);
  flex-shrink: 0;
}

.library-row-thumb-placeholder {
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

.library-row-name {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.3;
  color: var(--color-ink);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.library-row-yields {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-stone-600);
  white-space: nowrap;
}

.library-row-category {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-700);
  background: var(--color-stone-100);
  border: 1px solid var(--color-stone-400);
  padding: 2px 6px;
  white-space: nowrap;
}

.library-row-category-empty {
  color: var(--color-stone-500);
  border-color: var(--color-stone-300);
  background: transparent;
}

.library-row-bakes {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-ink);
  text-align: right;
  min-width: 2.5rem;
  white-space: nowrap;
}

.library-row-plus {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--color-ink);
  background: var(--color-stone-100);
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1;
  color: var(--color-ink);
  cursor: pointer;
  border-radius: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 80ms ease, background 80ms ease, color 80ms ease, border-color 80ms ease;
}

.library-row-plus:hover,
.library-row-plus:focus-visible {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
  transform: scale(1.05);
  outline: none;
}

@media (max-width: 900px) {
  .library-row {
    grid-template-columns: 48px minmax(0, 1fr) auto auto auto;
    gap: 0.625rem;
    padding: 0.5rem;
  }
  .library-row-category {
    display: none;
  }
}
</style>
