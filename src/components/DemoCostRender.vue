<script setup lang="ts">
import type { CookLogCostItem, CostSourceType } from '@/types/recipe'

interface CostData {
  total: number
  perServing: number
  servings: number
  items: CookLogCostItem[]
}

const sampleCost: CostData = {
  total: 1.29,
  perServing: 1.29,
  servings: 1,
  items: [
    { ingredientId: 'bread_flour', name: 'Bread Flour', sourceType: 'heb', sourceName: 'King Arthur Bread Flour, 5 lb', amount: 500, unit: 'g', cost: 1.23 },
    { ingredientId: 'water', name: 'Water', sourceType: 'rate', sourceName: 'Tap water (negligible)', amount: 350, unit: 'g', cost: 0.00 },
    { ingredientId: 'starter', name: 'Sourdough Starter', sourceType: 'rate', sourceName: 'Derived: 50% AP flour rate', amount: 100, unit: 'g', cost: 0.06 },
    { ingredientId: 'salt', name: 'Fine Sea Salt', sourceType: 'manual', sourceName: 'H-E-B Mediterranean Sea Salt', amount: 10, unit: 'g', cost: 0.03 }
  ]
}

function sourceBadgeLabel(sourceType: CostSourceType): string {
  switch (sourceType) {
    case 'heb': return 'HEB'
    case 'rate': return 'RATE'
    case 'pantry': return 'PANTRY'
    case 'manual': return 'MANUAL'
  }
}

function sourceBadgeClass(sourceType: CostSourceType): string {
  switch (sourceType) {
    case 'heb': return 'bg-stone-200 text-stone-600'
    case 'rate': return 'bg-cream text-crust-dark'
    case 'pantry': return 'bg-cream text-crust-dark'
    case 'manual': return 'bg-accent-tint text-accent'
  }
}

function formatCost(cost: number, isNegligible: boolean): string {
  if (isNegligible) return 'negligible'
  return `$${cost.toFixed(2)}`
}

function isNegligible(item: CookLogCostItem): boolean {
  return item.cost === 0 && item.sourceType === 'rate'
}
</script>

<template>
  <div class="max-w-3xl mx-auto py-6 space-y-10">
    <div>
      <h2 class="text-heading text-xl font-mono mb-1">Cost Render Demo</h2>
      <p class="text-muted">Two rendering contexts for bake cost data — full table and one-liner.</p>
    </div>

    <!-- ============ SECTION 1: Bake Detail View — Full Table ============ -->
    <section>
      <h3 class="text-heading font-mono text-sm mb-4 pb-2 border-b-2 border-stone-200">
        Section 1: Bake Detail View — Full Table
      </h3>
      <p class="text-muted mb-4">
        Renders between Notes and Next Time on <code class="bg-stone-100 px-1 py-0.5 font-mono text-xs">BakeDetailView</code>.
      </p>

      <div class="bg-surface border-2 border-stone-200">
        <!-- Header -->
        <div class="flex items-center justify-between p-3 border-b-2 border-stone-200 bg-stone-50">
          <h4 class="font-mono text-sm text-heading font-semibold">Cost Breakdown</h4>
          <span class="font-mono text-xs text-stone-400">{{ sampleCost.servings }} serving</span>
        </div>

        <!-- Ingredient rows -->
        <div class="divide-y divide-stone-100">
          <div
            v-for="item in sampleCost.items"
            :key="item.ingredientId"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-ink">{{ item.name }}</span>
                <span
                  class="font-mono text-[10px] px-1.5 py-0.5"
                  :class="sourceBadgeClass(item.sourceType)"
                >
                  {{ sourceBadgeLabel(item.sourceType) }}
                </span>
              </div>
              <p class="text-xs text-stone-400">{{ item.sourceName }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="flex items-baseline gap-2">
                <span class="text-xs text-stone-400 font-mono">{{ item.amount }}{{ item.unit }}</span>
                <span
                  class="text-sm font-mono font-medium"
                  :class="isNegligible(item) ? 'text-stone-400 italic' : 'text-ink'"
                >
                  {{ formatCost(item.cost, isNegligible(item)) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Total row -->
        <div class="border-t-2 border-stone-200 bg-stone-50 px-4 py-3">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs text-stone-500">Total bake cost</span>
            <span class="text-lg font-mono font-medium text-ink">${{ sampleCost.total.toFixed(2) }}</span>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="font-mono text-xs text-stone-400">Per serving</span>
            <span class="font-mono text-sm text-accent font-medium">${{ sampleCost.perServing.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ SECTION 2: Cook Log Card — One-Liner ============ -->
    <section>
      <h3 class="text-heading font-mono text-sm mb-4 pb-2 border-b-2 border-stone-200">
        Section 2: Cook Log Card — One-Liner
      </h3>
      <p class="text-muted mb-4">
        Appears inside the collapsed/expanded card in <code class="bg-stone-100 px-1 py-0.5 font-mono text-xs">CookLogSection</code>.
      </p>

      <!-- Simulated collapsed cook log card (no-photo variant) -->
      <div class="border-2 border-stone-200 hover:border-stone-300 transition-colors p-3 cursor-pointer">
        <div class="flex items-center gap-3">
          <span class="font-semibold text-sm text-stone-700">2026-02-15 — Saturday</span>
          <span class="text-xs bg-stone-200 px-2 py-0.5">v1.0.0</span>
        </div>
        <p class="text-sm text-stone-500 mt-1.5 line-clamp-2">First bake with new starter. Good oven spring, slightly under-proofed crumb.</p>
        <div class="flex items-center gap-3 text-xs text-stone-400 mt-2">
          <span>3 notes</span>
          <span>2 photos</span>
          <span class="font-mono">${{ sampleCost.total.toFixed(2) }} total · ${{ sampleCost.perServing.toFixed(2) }}/serving</span>
        </div>
      </div>

      <!-- Simulated expanded cook log card -->
      <div class="mt-4">
        <p class="text-xs text-stone-400 mb-2 font-mono">expanded variant:</p>
        <div class="py-4 pr-4 pl-3 border-l-3 border-warning bg-warning-tint">
          <!-- Header -->
          <div class="flex items-center gap-3 mb-3">
            <span class="font-semibold text-stone-700">2026-02-15 — Saturday</span>
            <span class="text-xs bg-stone-200 px-2 py-0.5 rounded-none">v1.0.0</span>
          </div>

          <!-- Fake notes -->
          <div class="text-sm text-stone-600 leading-relaxed mb-3">
            <ul class="list-disc pl-5 space-y-1">
              <li>Good oven spring, slightly under-proofed crumb</li>
              <li>Bulk ferment ran 5 hours at 78°F (26°C)</li>
              <li>Scored with single ear — opened nicely</li>
            </ul>
          </div>

          <!-- Cost one-liner -->
          <div class="flex items-center gap-2 pt-3 border-t border-stone-200/60">
            <span class="font-mono text-xs text-stone-400">${{ sampleCost.total.toFixed(2) }} total</span>
            <span class="text-stone-300">·</span>
            <span class="font-mono text-xs text-stone-400">${{ sampleCost.perServing.toFixed(2) }}/serving</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
