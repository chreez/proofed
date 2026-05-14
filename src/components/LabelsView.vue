<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import { useRecipe } from '@/composables/useRecipe'
import { loadPlan } from '@/composables/useProductionPlan'
import type { ProductionPlan } from '@/types/production'
import type { Recipe } from '@/types/recipe'
import LabelCard from '@/components/LabelCard.vue'
import HelpTooltip from '@/components/HelpTooltip.vue'

/**
 * LabelsView — /labels route (PF-256.3 Slice 2).
 *
 * Read-only lens over ProductionPlan. Renders one LabelCard per queued
 * entry; the Print button hands off to the browser's native print/PDF flow.
 *
 * No state mutation here — labels are derived from existing plan + recipe
 * snapshots.
 */

useSeoMeta({
  title: 'Labels · proofed.',
  description: 'Print per-unit nutrition + ingredient + allergen labels for queued bakes.',
  ogTitle: 'Labels · proofed.',
  ogDescription: 'Print per-unit nutrition + ingredient + allergen labels for queued bakes.',
  twitterCard: 'summary',
})

const { recipeList, loadManifest } = useRecipe()

const plan = ref<ProductionPlan>(loadPlan())
const manifestLoaded = ref(false)
const recipesLoaded = ref(false)

/**
 * Map of recipe id → full Recipe JSON. Populated in parallel from the
 * manifest after mount. Recipes that fail to load fall through as `null`,
 * letting LabelCard render its "Nutrition data pending" / empty ingredient
 * fallbacks without crashing.
 */
const recipes = ref<Record<string, Recipe | null>>({})

async function fetchAllRecipes(): Promise<void> {
  if (!recipeList.value.length) return
  const out: Record<string, Recipe | null> = {}
  await Promise.all(
    recipeList.value.map(async (entry) => {
      try {
        const res = await fetch(`/recipes/${entry.file}`)
        if (!res.ok) {
          out[entry.id] = null
          return
        }
        const data = (await res.json()) as Recipe
        out[entry.id] = data
      } catch {
        out[entry.id] = null
      }
    })
  )
  recipes.value = out
  recipesLoaded.value = true
}

onMounted(async () => {
  if (!recipeList.value.length) {
    await loadManifest()
  }
  manifestLoaded.value = true
  await fetchAllRecipes()
})

watch(recipeList, async (list) => {
  if (list.length && !recipesLoaded.value) {
    await fetchAllRecipes()
  }
})

const entryCount = computed(() => plan.value.entries.length)
const hasEntries = computed(() => entryCount.value > 0)

function recipeNameFor(recipeId: string): string {
  const fromManifest = recipeList.value.find(r => r.id === recipeId)?.name
  if (fromManifest) return fromManifest
  return recipes.value[recipeId]?.meta?.name ?? recipeId
}

function recipeFor(recipeId: string): Recipe | null {
  return recipes.value[recipeId] ?? null
}

function handlePrint(): void {
  window.print()
}
</script>

<template>
  <div class="labels-page">
    <header class="labels-toolbar" data-testid="labels-toolbar">
      <div class="labels-toolbar-text">
        <h1 class="labels-title">Labels</h1>
        <p class="labels-subtitle" data-testid="labels-subtitle">
          <template v-if="hasEntries">
            {{ entryCount }} {{ entryCount === 1 ? 'bake' : 'bakes' }} queued ·
            <span class="labels-subtitle-hint">click Print</span>
          </template>
          <template v-else>
            No bakes queued yet.
          </template>
        </p>
      </div>
      <div class="labels-toolbar-actions">
        <HelpTooltip
          text="Open the browser print dialog. Each label prints on its own 4×6 page."
          align="right"
        >
          <button
            type="button"
            class="labels-print-btn"
            :disabled="!hasEntries"
            data-testid="labels-print"
            @click="handlePrint"
          >Print</button>
        </HelpTooltip>
      </div>
    </header>

    <div
      v-if="!manifestLoaded || !recipesLoaded"
      class="labels-loading"
      data-testid="labels-loading"
    >
      Loading labels…
    </div>

    <section
      v-else-if="hasEntries"
      class="labels-grid"
      data-testid="labels-grid"
    >
      <LabelCard
        v-for="entry in plan.entries"
        :key="entry.id"
        :entry="entry"
        :recipe="recipeFor(entry.recipeId)"
        :recipe-name="recipeNameFor(entry.recipeId)"
      />
    </section>

    <div
      v-else
      class="labels-empty"
      data-testid="labels-empty"
    >
      <p class="labels-empty-text">
        No bakes queued. Add to your production plan to print labels.
      </p>
      <a href="/production" class="labels-empty-cta" data-testid="labels-empty-cta">
        Go to Production
      </a>
    </div>
  </div>
</template>

<style scoped>
.labels-page {
  max-width: 64rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: var(--color-stone-50);
  min-height: calc(100vh - 4rem);
}

/* ────────────────────────────────────────────────
   Toolbar
   ──────────────────────────────────────────────── */
.labels-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  border-bottom: 2px solid var(--color-stone-200);
  padding-bottom: 1rem;
}

.labels-toolbar-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.labels-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

.labels-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--color-stone-600);
  margin: 0;
}

.labels-subtitle-hint {
  color: var(--color-stone-500);
}

.labels-print-btn {
  padding: 0.5rem 1.1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-surface);
  background: var(--color-ink);
  border: 2px solid var(--color-ink);
  border-radius: 0;
  cursor: pointer;
}

.labels-print-btn:hover:not(:disabled),
.labels-print-btn:focus-visible:not(:disabled) {
  background: var(--color-accent);
  border-color: var(--color-accent);
  outline: none;
}

.labels-print-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ────────────────────────────────────────────────
   Grid of label cards
   ──────────────────────────────────────────────── */
.labels-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  justify-content: flex-start;
}

.labels-loading,
.labels-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-stone-500);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  border: 2px dashed var(--color-stone-300);
  background: var(--color-stone-100);
}

.labels-empty {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.labels-empty-text {
  margin: 0;
  color: var(--color-stone-600);
}

.labels-empty-cta {
  display: inline-block;
  padding: 0.5rem 1.1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-surface);
  background: var(--color-ink);
  border: 2px solid var(--color-ink);
  border-radius: 0;
  text-decoration: none;
}

.labels-empty-cta:hover,
.labels-empty-cta:focus-visible {
  background: var(--color-accent);
  border-color: var(--color-accent);
  outline: none;
}

@media (max-width: 640px) {
  .labels-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .labels-toolbar-actions {
    display: flex;
    justify-content: flex-end;
  }
  .labels-grid {
    flex-direction: column;
    align-items: stretch;
  }
}

/* ────────────────────────────────────────────────
   Print: hide toolbar; one label per 4×6 page.
   ──────────────────────────────────────────────── */
@media print {
  @page {
    size: 4in 6in;
    margin: 0;
  }
  .labels-page {
    max-width: none;
    padding: 0;
    background: white;
    min-height: 0;
  }
  .labels-toolbar,
  .labels-loading,
  .labels-empty {
    display: none !important;
  }
  .labels-grid {
    display: block;
    gap: 0;
  }
  .labels-grid :deep(.label-card) {
    page-break-inside: avoid;
    break-inside: avoid;
    page-break-after: always;
    break-after: page;
    width: 4in;
    height: 6in;
    margin: 0;
    border: none;
  }
  .labels-grid :deep(.label-card:last-child) {
    page-break-after: auto;
    break-after: auto;
  }
}
</style>
