<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import { useRecipe } from '@/composables/useRecipe'
import { loadPlan, parseBaseYield } from '@/composables/useProductionPlan'
import {
  loadPricing,
  savePricing,
  getMarkupPct,
  setMarkupPct,
  getEstimatedSold,
  setEstimatedSold,
  getSellPriceOverride,
  setSellPriceOverride,
  costPerUnit,
  unitsForEntry,
  sellPrice as sellPriceFor,
} from '@/composables/usePricing'
import type { ProductionPlan } from '@/types/production'
import type { PricingState } from '@/types/pricing'
import type { Recipe } from '@/types/recipe'
import { findHeroPhoto, latestCookLogEntryWithHero } from '@/composables/useCookLog'
import PricingRow from '@/components/PricingRow.vue'
import HelpTooltip from '@/components/HelpTooltip.vue'

/**
 * PricingView — /pricing route (PF-256.4 rework).
 *
 * Read-only lens over ProductionPlan. Renders one PricingRow per queued
 * entry; per-recipe markup overrides persist to localStorage (separate from
 * the ProductionPlan itself).
 *
 * Cost resolution lives in `usePricing.costPerUnit`: cook_log[].cost.total
 * first, then estimatedCost.total, then null sentinel.
 */

useSeoMeta({
  title: 'Pricing · proofed.',
  description: 'Set markup per queued bake; sell price + contribution profit at a glance.',
  ogTitle: 'Pricing · proofed.',
  ogDescription: 'Set markup per queued bake; sell price + contribution profit at a glance.',
  twitterCard: 'summary',
})

const { recipeList, loadManifest } = useRecipe()

const plan = ref<ProductionPlan>(loadPlan())
const pricing = ref<PricingState>(loadPricing())
const manifestLoaded = ref(false)
const recipesLoaded = ref(false)
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
    }),
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

function recipeFor(recipeId: string): Recipe | null {
  return recipes.value[recipeId] ?? null
}

function recipeNameFor(recipeId: string): string {
  const fromManifest = recipeList.value.find((r) => r.id === recipeId)?.name
  if (fromManifest) return fromManifest
  return recipes.value[recipeId]?.meta?.name ?? recipeId
}

function heroThumbFor(recipeId: string): string | null {
  const r = recipes.value[recipeId]
  if (!r) return null
  const cookLog = Array.isArray(r.cook_log) ? r.cook_log : []
  const latest = latestCookLogEntryWithHero(cookLog)
  if (!latest?.photos?.length) return null
  const hero = findHeroPhoto(latest.photos)
  return hero?.thumb ?? null
}

interface Row {
  entry: ProductionPlan['entries'][number]
  recipeName: string
  yields: string | null
  heroThumb: string | null
  unitsPerBake: number
  costPerUnit: number | null
  markupPct: number
  /** Raw decimal sell price per unit (or null if no cost data). */
  sellPrice: number | null
  /** Estimated units that will sell — defaults to unitsPerBake. */
  estimatedSold: number
  /** Absolute by-feel override; null when computing from markup. */
  sellPriceOverride: number | null
}

const rows = computed<Row[]>(() => {
  return plan.value.entries.map((entry) => {
    const r = recipeFor(entry.recipeId)
    const units = unitsForEntry(r, entry, parseBaseYield)
    const cpu = costPerUnit(r, entry, parseBaseYield)
    const markupPct = getMarkupPct(pricing.value, entry.recipeId)
    const override = getSellPriceOverride(pricing.value, entry.recipeId)
    // Override wins when set — otherwise compute from cost × markup.
    let sell: number | null
    if (override != null) {
      sell = override
    } else if (cpu != null && cpu > 0) {
      sell = sellPriceFor(cpu, markupPct)
    } else {
      sell = null
    }
    const estimatedSold = getEstimatedSold(pricing.value, entry.recipeId, units)
    return {
      entry,
      recipeName: recipeNameFor(entry.recipeId),
      yields: r?.meta?.yields ?? null,
      heroThumb: heroThumbFor(entry.recipeId),
      unitsPerBake: units,
      costPerUnit: cpu,
      markupPct,
      sellPrice: sell,
      estimatedSold,
      sellPriceOverride: override,
    }
  })
})

const hasEntries = computed(() => rows.value.length > 0)

/**
 * Summary math — cost is sunk on the full bake regardless of what sells:
 *
 *   totalCost     = Σ costPerUnit × unitsPerBake
 *   totalRevenue  = Σ sellPricePerUnit × estimatedSoldUnits
 *   totalCp       = totalRevenue − totalCost
 *
 * Per-row contribution profit is _not_ `(sell − cost) × estimatedSold` — that
 * would understate the cost on unsold units. The unsold inventory is real
 * spend that doesn't get recovered; we surface it as negative CP when sales
 * fall short of break-even.
 */
const summary = computed(() => {
  let totalCost = 0
  let totalRevenue = 0
  for (const row of rows.value) {
    if (row.costPerUnit != null && row.sellPrice != null) {
      totalCost += row.costPerUnit * row.unitsPerBake
      totalRevenue += row.sellPrice * row.estimatedSold
    }
  }
  const totalCp = totalRevenue - totalCost
  return {
    bakeCount: plan.value.entries.length,
    totalCost,
    totalRevenue,
    totalCp,
  }
})

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function handleMarkupChange(recipeId: string, value: number): void {
  pricing.value = setMarkupPct(pricing.value, recipeId, value)
  savePricing(pricing.value)
}

function handleEstimatedSoldChange(recipeId: string, value: number, defaultUnits: number): void {
  // Treat "matches the default" as "no override" — keeps localStorage clean
  // when the user types the default back in.
  const next = value === defaultUnits ? null : value
  pricing.value = setEstimatedSold(pricing.value, recipeId, next)
  savePricing(pricing.value)
}

function handleSellPriceOverrideChange(recipeId: string, value: number | null): void {
  pricing.value = setSellPriceOverride(pricing.value, recipeId, value)
  savePricing(pricing.value)
}
</script>

<template>
  <div class="pricing-page">
    <header class="pricing-toolbar" data-testid="pricing-toolbar">
      <div class="pricing-toolbar-text">
        <h1 class="pricing-title">Pricing</h1>
        <p
          v-if="hasEntries"
          class="pricing-subtitle"
          data-testid="pricing-subtitle"
        >
          <HelpTooltip text="Number of entries currently in your production plan.">
            <span>{{ summary.bakeCount }} {{ summary.bakeCount === 1 ? 'bake' : 'bakes' }} queued</span>
          </HelpTooltip>
          ·
          <HelpTooltip text="Total ingredient cost across all queued bakes — sunk on the full batch regardless of what sells (cost per unit × units per bake).">
            <span>cost {{ fmtMoney(summary.totalCost) }}</span>
          </HelpTooltip>
          ·
          <HelpTooltip text="Projected revenue at the current per-recipe markup, scoped to estimated units sold (defaults to the full bake).">
            <span>revenue {{ fmtMoney(summary.totalRevenue) }}</span>
          </HelpTooltip>
          ·
          <HelpTooltip text="Total contribution profit — projected revenue minus full-batch cost. Goes negative when estimated sales don't recover the batch.">
            <span>CP {{ fmtMoney(summary.totalCp) }}</span>
          </HelpTooltip>
        </p>
        <p v-else class="pricing-subtitle pricing-subtitle--empty">
          No bakes in production.
        </p>
      </div>
    </header>

    <div
      v-if="!manifestLoaded || !recipesLoaded"
      class="pricing-loading"
      data-testid="pricing-loading"
    >
      Loading pricing…
    </div>

    <ul
      v-else-if="hasEntries"
      class="pricing-list"
      data-testid="pricing-list"
    >
      <PricingRow
        v-for="row in rows"
        :key="row.entry.id"
        :entry="row.entry"
        :recipe-name="row.recipeName"
        :yields="row.yields"
        :hero-thumb="row.heroThumb"
        :units-per-bake="row.unitsPerBake"
        :cost-per-unit="row.costPerUnit"
        :markup-pct="row.markupPct"
        :estimated-sold="row.estimatedSold"
        :sell-price-override="row.sellPriceOverride"
        @update-markup="(v: number) => handleMarkupChange(row.entry.recipeId, v)"
        @update-estimated-sold="(v: number) => handleEstimatedSoldChange(row.entry.recipeId, v, row.unitsPerBake)"
        @update-sell-price-override="(v: number | null) => handleSellPriceOverrideChange(row.entry.recipeId, v)"
      />
    </ul>

    <div
      v-else
      class="pricing-empty"
      data-testid="pricing-empty"
    >
      <p class="pricing-empty-text">
        No bakes in production. Add to your plan to start pricing.
      </p>
      <a
        href="/production"
        class="pricing-empty-cta"
        data-testid="pricing-empty-cta"
      >Go to Production</a>
    </div>
  </div>
</template>

<style scoped>
.pricing-page {
  /* Scroll isolation: page-level container fixed to viewport, list scrolls. */
  height: calc(100dvh - 3rem);
  overflow: hidden;
  max-width: 64rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: var(--color-stone-50);
}

.pricing-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  border-bottom: 2px solid var(--color-stone-200);
  padding-bottom: 1rem;
  flex-shrink: 0;
}

.pricing-toolbar-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pricing-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

.pricing-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--color-stone-600);
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.pricing-subtitle--empty {
  color: var(--color-stone-500);
}

.pricing-loading,
.pricing-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-stone-500);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  border: 2px dashed var(--color-stone-300);
  background: var(--color-stone-100);
}

.pricing-empty {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.pricing-empty-text {
  margin: 0;
  color: var(--color-stone-600);
}

.pricing-empty-cta {
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

.pricing-empty-cta:hover,
.pricing-empty-cta:focus-visible {
  background: var(--color-accent);
  border-color: var(--color-accent);
  outline: none;
}

.pricing-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  padding-bottom: 1.5rem;
}

@media (max-width: 640px) {
  .pricing-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .pricing-subtitle {
    font-size: 0.75rem;
  }
}
</style>
