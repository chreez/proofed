<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import { useRecipe } from '@/composables/useRecipe'
import { getMostRecentCost } from '@/composables/useCost'
import {
  loadProfile,
  loadCommitted,
  saveProfile,
  saveCommitted,
  resolveMarkupPct,
  resolveSellPrice,
  isRecipeDirty,
  exportProfile,
  validateProfile,
} from '@/composables/usePricingProfile'
import type { PricingProfile, PerRecipePricing } from '@/types/pricing'
import type { Recipe, CookLogCost } from '@/types/recipe'
import PricingRow from '@/components/PricingRow.vue'
import HelpTooltip from '@/components/HelpTooltip.vue'

useSeoMeta({
  title: 'Pricing · proofed.',
  description: 'Set per-recipe markup and view contribution profit. Snaps to pretty retail prices.',
  ogTitle: 'Pricing · proofed.',
  ogDescription: 'Set per-recipe markup and view contribution profit.',
  twitterCard: 'summary',
})

const { recipeList, loadManifest } = useRecipe()

const profile = ref<PricingProfile>(loadProfile())
const committed = ref<PricingProfile | null>(loadCommitted())

// Per-recipe variable cost map (most recent cook_log[].cost.total)
const recipeCosts = ref<Record<string, number | null>>({})
const manifestLoaded = ref(false)
const recipesLoaded = ref(false)

async function fetchAllRecipeCosts(): Promise<void> {
  if (!recipeList.value.length) return
  const costs: Record<string, number | null> = {}
  await Promise.all(
    recipeList.value.map(async (entry) => {
      try {
        const res = await fetch(`/recipes/${entry.file}`)
        if (!res.ok) {
          costs[entry.id] = null
          return
        }
        const data = (await res.json()) as Recipe
        const cookCost: CookLogCost | null = getMostRecentCost(data)
        costs[entry.id] = cookCost?.total ?? null
      } catch {
        costs[entry.id] = null
      }
    })
  )
  recipeCosts.value = costs
  recipesLoaded.value = true
}

onMounted(async () => {
  // Page is reachable directly via /pricing — ensure manifest is loaded.
  if (!recipeList.value.length) {
    await loadManifest()
  }
  manifestLoaded.value = true
  await fetchAllRecipeCosts()

  // First-load: if no committed baseline, attempt to fetch default.json from public.
  if (!committed.value) {
    try {
      const res = await fetch('/profiles/pricing/default.json')
      if (res.ok) {
        const parsed = await res.json()
        const validated = validateProfile(parsed)
        if (!('error' in validated)) {
          committed.value = validated
          saveCommitted(validated)
          // If working profile is still the empty default we just created
          // and never persisted user edits, seed it from default.json too.
          const hasUserEdits =
            Object.keys(profile.value.perRecipe).length > 0 ||
            profile.value.name !== 'Default'
          if (!hasUserEdits) {
            profile.value = validated
            saveProfile(validated)
          }
        }
      }
    } catch {
      // No default file shipped yet — that's fine; diff is empty vs. empty.
    }
  }
})

watch(recipeList, async (list) => {
  if (list.length && !recipesLoaded.value) {
    await fetchAllRecipeCosts()
  }
})

// Persist working profile on every change.
watch(profile, (p) => {
  saveProfile(p)
}, { deep: true })

function ensureEntry(recipeId: string): PerRecipePricing {
  const existing = profile.value.perRecipe[recipeId]
  if (existing) return existing
  const fresh: PerRecipePricing = {}
  profile.value.perRecipe[recipeId] = fresh
  return fresh
}

function setRecipeMarkup(recipeId: string, value: number): void {
  const entry = ensureEntry(recipeId)
  // If the new value matches the profile default exactly, clear the override
  // so the row falls through to default and dirty-state stays clean.
  if (value === profile.value.default.markupPct) {
    delete entry.markupPct
    // If entry is now empty, drop it entirely.
    if (entry.markupPct === undefined && entry.sellPrice === undefined && entry.notes === undefined) {
      delete profile.value.perRecipe[recipeId]
    }
  } else {
    entry.markupPct = value
  }
}

function markupFor(recipeId: string): number {
  // Manual sell-price lock bypasses markup for display purposes, but the
  // slider still represents the per-row markup state. Until sell-price
  // editing lands in slice 1.5, slider drives display directly.
  return resolveMarkupPct(recipeId, profile.value)
}

function manualSellFor(recipeId: string): number | null {
  return resolveSellPrice(recipeId, profile.value)
}

function dirtyFor(recipeId: string): boolean {
  return isRecipeDirty(recipeId, profile.value, committed.value)
}

const rows = computed(() => {
  return recipeList.value.map((entry) => ({
    recipeId: entry.id,
    recipeName: entry.name,
    cost: recipeCosts.value[entry.id] ?? null,
    markupPct: markupFor(entry.id),
    manualSell: manualSellFor(entry.id),
    dirty: dirtyFor(entry.id),
  }))
})

const headerDirty = computed(() => {
  if (!committed.value) return false
  if (profile.value.default.markupPct !== committed.value.default.markupPct) return true
  if (profile.value.name !== committed.value.name) return true
  return false
})

function onExport(): void {
  exportProfile(profile.value)
  // Re-read so any `updated` bump shows up locally.
  profile.value = loadProfile()
  committed.value = loadCommitted()
}
</script>

<template>
  <div class="pricing-page">
    <header class="pricing-header">
      <div class="pricing-header-text">
        <h1 class="pricing-title">Pricing</h1>
        <p class="pricing-subtitle">
          Profile:
          <HelpTooltip text="Active pricing profile name. Exports inherit this label.">
            <span class="pricing-profile-name">{{ profile.name }}</span>
          </HelpTooltip>
          <HelpTooltip
            v-if="headerDirty"
            text="Profile-level fields differ from committed baseline."
          >
            <span class="pricing-header-dirty">modified</span>
          </HelpTooltip>
        </p>
      </div>
      <div class="pricing-header-actions">
        <HelpTooltip
          text="Download the current pricing profile as JSON to commit and share."
          align="right"
        >
          <button class="pricing-btn" type="button" @click="onExport">Export profile JSON</button>
        </HelpTooltip>
      </div>
    </header>

    <div v-if="!manifestLoaded || !recipesLoaded" class="pricing-loading">
      Loading pricing data...
    </div>

    <ul v-else-if="rows.length" class="pricing-list">
      <li v-for="row in rows" :key="row.recipeId" class="pricing-list-item">
        <PricingRow
          :recipe-id="row.recipeId"
          :recipe-name="row.recipeName"
          :cost="row.cost"
          :markup-pct="row.markupPct"
          :dirty="row.dirty"
          @update:markup-pct="(v) => setRecipeMarkup(row.recipeId, v)"
        />
      </li>
    </ul>

    <div v-else class="pricing-empty">No recipes in the manifest.</div>
  </div>
</template>

<style scoped>
.pricing-page {
  max-width: 56rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.pricing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  border-bottom: 2px solid var(--color-stone-200);
  padding-bottom: 1rem;
}

.pricing-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pricing-title {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

.pricing-subtitle {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-stone-500);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pricing-profile-name {
  color: var(--color-ink);
}

.pricing-header-dirty {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  background: var(--color-accent);
  color: var(--color-surface);
  border: 2px solid var(--color-accent);
  padding: 0.05rem 0.4rem;
  text-transform: lowercase;
  letter-spacing: 0.02em;
}

.pricing-btn {
  padding: 0.45rem 0.9rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-surface);
  background: var(--color-ink);
  border: 2px solid var(--color-ink);
  cursor: pointer;
  border-radius: 0;
}

.pricing-btn:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.pricing-loading,
.pricing-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-stone-500);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.pricing-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pricing-list-item {
  margin: 0;
}

@media (max-width: 640px) {
  .pricing-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
