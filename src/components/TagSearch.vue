<script setup lang="ts" generic="T">
import { computed, ref } from 'vue'

export interface TagDef {
  key: string
  category: string
  name: string
  count: number
}

const props = defineProps<{
  items: readonly T[]
  tokensFn: (item: T) => string[]
  matchTextFn: (item: T, q: string) => boolean
  previewSortFn?: (a: T, b: T) => number
  placeholder?: string
  maxTagSuggestions?: number
  maxPreviewSuggestions?: number
  compact?: boolean
}>()

const emit = defineEmits<{
  'navigate': [item: T]
}>()

const filterTags = defineModel<string[]>({ default: () => [] })

const query = ref('')
const activeIdx = ref(-1)
const dropdownOpen = ref(false)

const maxTags = computed(() => props.maxTagSuggestions ?? 4)
const maxPreviews = computed(() => props.maxPreviewSuggestions ?? 4)

const allTags = computed<TagDef[]>(() => {
  const m = new Map<string, number>()
  for (const it of props.items) {
    for (const t of props.tokensFn(it)) {
      m.set(t, (m.get(t) ?? 0) + 1)
    }
  }
  return [...m.entries()].map(([key, count]) => {
    const idx = key.indexOf(':')
    const category = idx < 0 ? '' : key.slice(0, idx)
    const name = idx < 0 ? key : key.slice(idx + 1)
    return { key, category, name, count }
  }).sort((a, b) => b.count - a.count)
})

const scopedItems = computed<T[]>(() => {
  if (!filterTags.value.length) return [...props.items]
  return props.items.filter(it => {
    const tokens = new Set(props.tokensFn(it))
    return filterTags.value.every(t => tokens.has(t))
  })
})

const tagSuggestions = computed<(TagDef & { liveCount: number })[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return allTags.value
    .filter(t => !filterTags.value.includes(t.key))
    .filter(t => t.name.toLowerCase().includes(q) || t.key.toLowerCase().includes(q))
    .map(t => ({
      ...t,
      liveCount: scopedItems.value.filter(it => new Set(props.tokensFn(it)).has(t.key)).length,
    }))
    .filter(t => t.liveCount > 0)
    .slice(0, maxTags.value)
})

const previewItems = computed<T[]>(() => {
  const q = query.value.trim()
  if (!q) return []
  const matched = scopedItems.value.filter(it => props.matchTextFn(it, q))
  const sorted = props.previewSortFn ? [...matched].sort(props.previewSortFn) : matched
  return sorted.slice(0, maxPreviews.value)
})

const totalRows = computed(() => tagSuggestions.value.length + previewItems.value.length)

function chipLabel(key: string): string {
  const tag = allTags.value.find(t => t.key === key)
  return tag ? `${tag.category}:${tag.name}` : key
}

function removeChip(key: string): void {
  filterTags.value = filterTags.value.filter(t => t !== key)
}

function addChip(key: string): void {
  if (!filterTags.value.includes(key)) filterTags.value = [...filterTags.value, key]
  query.value = ''
  activeIdx.value = -1
  dropdownOpen.value = false
}

function navigate(item: T): void {
  emit('navigate', item)
  query.value = ''
  activeIdx.value = -1
  dropdownOpen.value = false
}

function activateAt(i: number): void {
  if (i < tagSuggestions.value.length) {
    addChip(tagSuggestions.value[i].key)
  } else {
    const j = i - tagSuggestions.value.length
    navigate(previewItems.value[j])
  }
}

function onInput(): void {
  activeIdx.value = -1
  dropdownOpen.value = query.value.trim().length > 0
}

function onFocus(): void {
  if (query.value.trim().length > 0) dropdownOpen.value = true
}

function onBlur(): void {
  setTimeout(() => { dropdownOpen.value = false }, 150)
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (totalRows.value === 0) return
    activeIdx.value = Math.min(activeIdx.value + 1, totalRows.value - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIdx.value = Math.max(activeIdx.value - 1, 0)
  } else if (e.key === 'Enter') {
    if (activeIdx.value >= 0 && activeIdx.value < totalRows.value) {
      e.preventDefault()
      activateAt(activeIdx.value)
    }
  } else if (e.key === 'Escape') {
    dropdownOpen.value = false
  } else if (e.key === 'Backspace' && !query.value && filterTags.value.length) {
    filterTags.value = filterTags.value.slice(0, -1)
  }
}

function clearFilter(): void {
  filterTags.value = []
  query.value = ''
  dropdownOpen.value = false
}

defineExpose({ scopedItems, filterTags, query })
</script>

<template>
  <div class="tag-search" :class="{ 'tag-search--compact': compact }">
    <div class="search-row">
      <div v-if="filterTags.length" class="chips-inline">
        <span
          v-for="key in filterTags"
          :key="key"
          class="chip"
          data-testid="tag-chip"
        >
          {{ chipLabel(key) }}
          <button
            type="button"
            class="chip-x"
            :aria-label="`Remove ${chipLabel(key)}`"
            @click="removeChip(key)"
          >×</button>
        </span>
      </div>
      <input
        v-model="query"
        type="text"
        class="search-input"
        :placeholder="placeholder ?? 'Search...'"
        autocomplete="off"
        data-testid="tag-search-input"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeyDown"
      />
      <button
        v-if="filterTags.length || query"
        type="button"
        class="clear-btn"
        data-testid="tag-clear"
        @mousedown.prevent
        @click="clearFilter"
      >clear</button>
    </div>

    <div
      v-if="dropdownOpen && query.trim()"
      class="dropdown"
      data-testid="tag-dropdown"
    >
      <template v-if="tagSuggestions.length">
        <div class="dd-section-title">Add filter tag</div>
        <div
          v-for="(s, i) in tagSuggestions"
          :key="s.key"
          class="dd-tag-row"
          :class="{ active: activeIdx === i }"
          data-testid="tag-suggestion"
          @mousedown.prevent="addChip(s.key)"
          @mouseenter="activeIdx = i"
        >
          <span>
            <span class="dd-tag-name">{{ s.name }}</span>
            <span class="dd-tag-cat">{{ s.category }}</span>
          </span>
          <span class="dd-tag-count">{{ s.liveCount }}</span>
        </div>
      </template>

      <template v-if="previewItems.length">
        <div class="dd-section-title">Jump to result</div>
        <div
          v-for="(it, j) in previewItems"
          :key="j"
          class="dd-result-row"
          :class="{ active: activeIdx === tagSuggestions.length + j }"
          data-testid="result-preview"
          @mousedown.prevent="navigate(it)"
          @mouseenter="activeIdx = tagSuggestions.length + j"
        >
          <slot name="preview" :item="it" :query="query.trim()" />
        </div>
      </template>

      <div
        v-if="!tagSuggestions.length && !previewItems.length"
        class="dd-empty"
      >No tags or matches for "{{ query.trim() }}"</div>
    </div>
  </div>
</template>

<style scoped>
.tag-search {
  position: relative;
  font-family: var(--font-body);
  width: 100%;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 2px solid var(--color-ink);
  padding: 6px 10px;
  background: #fff;
  flex-wrap: wrap;
}

.search-row:focus-within {
  background: var(--color-stone-50);
}

/* Compact variant (header-mounted) */
.tag-search--compact .search-row {
  border-width: 1px;
  border-color: var(--color-stone-400);
  padding: 4px 8px;
  background: var(--color-stone-100);
}

.tag-search--compact .search-row:focus-within {
  background: #fff;
  border-color: var(--color-ink);
}

.tag-search--compact .search-input {
  font-size: 0.8125rem;
  padding: 2px 0;
}

.tag-search--compact .chip {
  font-size: 0.625rem;
  padding: 1px 4px 1px 6px;
}

.chips-inline {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  padding: 2px 4px 2px 8px;
  background: var(--color-accent-tint);
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
  white-space: nowrap;
}

.chip-x {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1;
  color: var(--color-accent);
  padding: 0 2px;
}

.chip-x:hover {
  color: var(--color-ink);
}

.search-input {
  flex: 1;
  min-width: 80px;
  border: none;
  outline: none;
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-ink);
  background: transparent;
  padding: 4px 0;
}

.search-input::placeholder {
  color: var(--color-stone-400);
}

.clear-btn {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-accent);
  cursor: pointer;
  border: none;
  background: none;
  text-decoration: underline;
  padding: 0 4px;
}

.clear-btn:hover {
  color: var(--color-ink);
}

.dropdown {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  background: #fff;
  border: 2px solid var(--color-ink);
  max-height: 360px;
  overflow-y: auto;
  z-index: 20;
  box-shadow: 4px 4px 0 var(--color-ink);
}

.dd-section-title {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 10px 4px;
  color: var(--color-stone-400);
  background: var(--color-stone-100);
  border-bottom: 1px solid var(--color-stone-200);
}

.dd-tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-stone-200);
}

.dd-tag-row.active,
.dd-tag-row:hover {
  background: var(--color-stone-100);
}

.dd-tag-name {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--color-ink);
}

.dd-tag-cat {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-stone-400);
  margin-left: 6px;
}

.dd-tag-count {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
}

.dd-result-row {
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-stone-200);
}

.dd-result-row.active,
.dd-result-row:hover {
  background: var(--color-stone-100);
}

.dd-empty {
  padding: 14px 10px;
  font-size: 0.75rem;
  color: var(--color-stone-400);
  font-style: italic;
  text-align: center;
}
</style>
