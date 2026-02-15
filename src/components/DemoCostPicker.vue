<script setup lang="ts">
import { ref, computed } from 'vue'

// -- Mock HEB product data --
interface HebProduct {
  id: string
  name: string
  brand: string
  size: string
  price: number
  salePrice: number | null
  unitPrice: string
  inStock: boolean
}

const butterProducts: HebProduct[] = [
  { id: 'hcf-butter', name: 'Unsalted Butter Sticks', brand: 'Hill Country Fare', size: '4ct / 16oz', price: 3.28, salePrice: null, unitPrice: '$0.20/oz', inStock: true },
  { id: 'heb-butter', name: 'Sweet Cream Unsalted Butter Sticks', brand: 'H-E-B', size: '4ct / 16oz', price: 3.98, salePrice: null, unitPrice: '$0.25/oz', inStock: true },
  { id: 'cm-butter', name: 'European Style Unsalted Butter', brand: 'Central Market', size: '4ct / 16oz', price: 5.28, salePrice: 4.48, unitPrice: '$0.37/oz', inStock: true },
  { id: 'kg-butter', name: 'Unsalted Pure Irish Butter', brand: 'Kerrygold', size: '4ct / 16oz', price: 10.48, salePrice: null, unitPrice: '$0.66/oz', inStock: true }
]

const selectedButter = ref<string>('heb-butter')

// -- Pantry rate mode --
const flourPurchaseLbs = ref('5')
const flourPurchasePrice = ref('3.49')
const usePantryRate = ref(true)

const flourRatePerGram = computed(() => {
  const lbs = parseFloat(flourPurchaseLbs.value) || 0
  const price = parseFloat(flourPurchasePrice.value) || 0
  if (lbs <= 0 || price <= 0) return 0
  const grams = lbs * 453.592
  return price / grams
})

const flourCostForRecipe = computed(() => {
  return flourRatePerGram.value * 390
})

// -- Cost summary data --
interface CostLine {
  ingredient: string
  product: string
  source: 'heb' | 'pantry'
  packagePrice: number
  amountUsed: string
  totalInPackage: string
  cost: number
}

const costLines = computed<CostLine[]>(() => {
  const butterProduct = butterProducts.find(p => p.id === selectedButter.value)
  const butterPrice = butterProduct?.salePrice ?? butterProduct?.price ?? 3.98
  // 140g butter used out of 454g (16oz) package
  const butterCost = (140 / 454) * butterPrice

  return [
    {
      ingredient: 'Unsalted butter',
      product: butterProduct?.brand ? `${butterProduct.brand} ${butterProduct.name}` : 'H-E-B Sweet Cream',
      source: 'heb',
      packagePrice: butterPrice,
      amountUsed: '140g',
      totalInPackage: '454g (16oz)',
      cost: parseFloat(butterCost.toFixed(2))
    },
    {
      ingredient: 'All-purpose flour',
      product: 'Pantry rate',
      source: 'pantry',
      packagePrice: parseFloat(flourPurchasePrice.value) || 3.49,
      amountUsed: '390g',
      totalInPackage: `${flourPurchaseLbs.value} lbs`,
      cost: parseFloat(flourCostForRecipe.value.toFixed(2))
    },
    {
      ingredient: 'Dark brown sugar',
      product: 'H-E-B Dark Brown Sugar',
      source: 'heb',
      packagePrice: 2.78,
      amountUsed: '149g',
      totalInPackage: '907g (2 lbs)',
      cost: 0.46
    },
    {
      ingredient: 'Granulated sugar',
      product: 'Pantry rate',
      source: 'pantry',
      packagePrice: 4.28,
      amountUsed: '75g',
      totalInPackage: '1814g (4 lbs)',
      cost: 0.18
    },
    {
      ingredient: 'Whole milk',
      product: 'H-E-B Whole Milk',
      source: 'heb',
      packagePrice: 3.88,
      amountUsed: '296ml',
      totalInPackage: '1893ml (0.5 gal)',
      cost: 0.61
    },
    {
      ingredient: 'Cream cheese',
      product: 'H-E-B Cream Cheese',
      source: 'heb',
      packagePrice: 2.18,
      amountUsed: '85g',
      totalInPackage: '227g (8oz)',
      cost: 0.82
    },
    {
      ingredient: 'Confectioners\' sugar',
      product: 'Pantry rate',
      source: 'pantry',
      packagePrice: 2.98,
      amountUsed: '113g',
      totalInPackage: '907g (2 lbs)',
      cost: 0.37
    },
    {
      ingredient: 'Yeast, cinnamon, cloves, vanilla, salt',
      product: 'Pantry staples',
      source: 'pantry',
      packagePrice: 0,
      amountUsed: 'trace',
      totalInPackage: '--',
      cost: 0.35
    }
  ]
})

const totalCost = computed(() => {
  return costLines.value.reduce((sum, l) => sum + l.cost, 0)
})

const perServingCost = computed(() => {
  return totalCost.value / 8
})

// -- JSON output --
const sampleJson = computed(() => {
  const butterProduct = butterProducts.find(p => p.id === selectedButter.value)
  return JSON.stringify({
    costs: [
      {
        ingredient: 'unsalted butter',
        product: butterProduct?.brand ? `${butterProduct.brand} ${butterProduct.name}` : 'H-E-B Sweet Cream',
        packagePrice: butterProduct?.salePrice ?? butterProduct?.price ?? 3.98,
        packageSize: butterProduct?.size ?? '4ct / 16oz',
        amountUsed: '140g',
        cost: costLines.value[0]?.cost ?? 1.23
      },
      {
        ingredient: 'all-purpose flour',
        source: 'pantry',
        rate: parseFloat(flourRatePerGram.value.toFixed(6)),
        rateUnit: '$/g',
        amountUsed: '390g',
        cost: costLines.value[1]?.cost ?? 0.60
      },
      { ingredient: 'dark brown sugar', product: 'H-E-B Dark Brown Sugar', packagePrice: 2.78, packageSize: '2 lbs', amountUsed: '149g', cost: 0.46 },
      { ingredient: 'granulated sugar', source: 'pantry', rate: 0.0024, rateUnit: '$/g', amountUsed: '75g', cost: 0.18 },
      { ingredient: 'whole milk', product: 'H-E-B Whole Milk', packagePrice: 3.88, packageSize: '0.5 gal', amountUsed: '296ml', cost: 0.61 },
      { ingredient: 'cream cheese', product: 'H-E-B Cream Cheese', packagePrice: 2.18, packageSize: '8oz', amountUsed: '85g', cost: 0.82 },
      { ingredient: 'confectioners\' sugar', source: 'pantry', rate: 0.0033, rateUnit: '$/g', amountUsed: '113g', cost: 0.37 },
      { ingredient: 'pantry staples (yeast, spices, vanilla, salt)', source: 'pantry', cost: 0.35, note: 'estimated' }
    ],
    total: parseFloat(totalCost.value.toFixed(2)),
    perServing: parseFloat(perServingCost.value.toFixed(2)),
    servings: 8
  }, null, 2)
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-8">
    <h2 class="text-heading text-2xl font-mono mb-2">Bake Cost Picker: UI Variants</h2>
    <p class="text-body mb-1">Evaluating product selection, pantry rate entry, and cost summary UX for per-bake costing.</p>
    <p class="text-muted mb-8">PF-134.2 spike -- throwaway demo for HITL review.</p>

    <!-- ============================================ -->
    <!-- SECTION 1: HEB Product Picker                -->
    <!-- ============================================ -->
    <div class="mb-12">
      <h3 class="text-heading text-xl font-mono mb-4 border-b-2 border-stone-200 pb-2">
        1. HEB Product Picker
      </h3>
      <p class="text-body text-sm mb-4">Given an ingredient, show matching HEB products for selection. Two layout variants compared side by side.</p>

      <div class="mb-3">
        <span class="font-mono text-xs text-stone-600">ingredient:</span>
        <span class="ml-2 text-body font-medium">Unsalted Butter</span>
        <span class="text-muted ml-2">(recipe needs 140g)</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Variant A: Compact List -->
        <div>
          <h4 class="font-mono text-xs text-stone-600 mb-3">A) Compact List</h4>
          <div class="border-2 border-stone-200 divide-y-2 divide-stone-200">
            <label
              v-for="product in butterProducts"
              :key="product.id"
              class="flex items-center gap-3 p-3 cursor-pointer transition-colors"
              :class="selectedButter === product.id ? 'bg-accent-tint' : 'bg-surface hover:bg-stone-50'"
            >
              <input
                type="radio"
                name="butter-compact"
                :value="product.id"
                v-model="selectedButter"
                class="w-4 h-4 accent-accent flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-ink truncate">{{ product.brand }}</span>
                  <span v-if="product.salePrice" class="font-mono text-[10px] bg-accent text-stone-50 px-1.5 py-0.5">SALE</span>
                </div>
                <p class="text-xs text-stone-500 truncate">{{ product.name }} -- {{ product.size }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="flex items-center gap-1.5">
                  <span v-if="product.salePrice" class="text-xs text-stone-400 line-through">${{ product.price.toFixed(2) }}</span>
                  <span class="text-sm font-mono font-medium" :class="product.salePrice ? 'text-accent' : 'text-ink'">
                    ${{ (product.salePrice ?? product.price).toFixed(2) }}
                  </span>
                </div>
                <span class="text-[10px] text-stone-400 font-mono">{{ product.unitPrice }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Variant B: Cards -->
        <div>
          <h4 class="font-mono text-xs text-stone-600 mb-3">B) Cards</h4>
          <div class="space-y-3">
            <button
              v-for="product in butterProducts"
              :key="product.id"
              class="w-full text-left p-4 border-2 transition-colors"
              :class="selectedButter === product.id
                ? 'border-accent bg-accent-tint'
                : 'border-stone-200 bg-surface hover:border-stone-300'"
              @click="selectedButter = product.id"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-ink">{{ product.brand }}</span>
                    <span v-if="product.salePrice" class="font-mono text-[10px] bg-accent text-stone-50 px-1.5 py-0.5">SALE</span>
                  </div>
                  <p class="text-sm text-stone-600">{{ product.name }}</p>
                </div>
                <div
                  class="w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                  :class="selectedButter === product.id ? 'border-accent bg-accent' : 'border-stone-300'"
                >
                  <span v-if="selectedButter === product.id" class="text-stone-50 text-xs">&#10003;</span>
                </div>
              </div>
              <div class="flex items-baseline gap-3">
                <span class="text-sm text-stone-500">{{ product.size }}</span>
                <span class="text-stone-300">|</span>
                <div class="flex items-center gap-1.5">
                  <span v-if="product.salePrice" class="text-xs text-stone-400 line-through">${{ product.price.toFixed(2) }}</span>
                  <span class="font-mono font-medium" :class="product.salePrice ? 'text-accent' : 'text-ink'">
                    ${{ (product.salePrice ?? product.price).toFixed(2) }}
                  </span>
                </div>
                <span class="text-stone-300">|</span>
                <span class="text-xs text-stone-400 font-mono">{{ product.unitPrice }}</span>
              </div>
              <div v-if="selectedButter === product.id" class="mt-2 pt-2 border-t border-stone-200">
                <span class="font-mono text-xs text-stone-500">140g used of 454g package</span>
                <span class="font-mono text-xs text-accent ml-2">
                  = ${{ ((140 / 454) * (product.salePrice ?? product.price)).toFixed(2) }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="card mt-4">
        <h4 class="font-mono text-xs text-stone-500 mb-2">Picker trade-offs</h4>
        <div class="text-sm text-body space-y-2">
          <p><strong class="font-mono text-xs">A) Compact list:</strong> Dense, scannable, radio buttons make selection obvious. Works well when there are many results. Less room for extra info.</p>
          <p><strong class="font-mono text-xs">B) Cards:</strong> More breathing room, shows calculated cost for recipe amount inline. Better for 3-5 results. Takes more vertical space.</p>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SECTION 2: Pantry Rate Mode                  -->
    <!-- ============================================ -->
    <div class="mb-12">
      <h3 class="text-heading text-xl font-mono mb-4 border-b-2 border-stone-200 pb-2">
        2. Pantry Rate Mode
      </h3>
      <p class="text-body text-sm mb-4">For bulk staples (flour, sugar), enter what you paid and calculate the rate per gram used in this recipe.</p>

      <div class="bg-surface border-2 border-stone-200 p-0">
        <!-- Header -->
        <div class="flex items-center justify-between p-3 border-b-2 border-stone-200 bg-stone-50">
          <div>
            <span class="font-mono text-xs text-stone-600">ingredient:</span>
            <span class="ml-2 text-sm font-medium text-ink">All-Purpose Flour</span>
            <span class="text-muted ml-2">(recipe needs 390g)</span>
          </div>
        </div>

        <div class="p-4 space-y-4">
          <!-- Toggle: fresh purchase vs stored rate -->
          <div class="flex gap-0">
            <button
              class="btn text-xs border-2 border-stone-200"
              :class="!usePantryRate ? 'bg-ink text-stone-100' : 'bg-surface text-ink hover:bg-stone-100'"
              @click="usePantryRate = false"
            >
              Fresh Purchase
            </button>
            <button
              class="btn text-xs border-2 border-stone-200"
              :class="usePantryRate ? 'bg-ink text-stone-100' : 'bg-surface text-ink hover:bg-stone-100'"
              @click="usePantryRate = true"
            >
              Use Stored Rate
            </button>
          </div>

          <template v-if="!usePantryRate">
            <!-- HEB search results for flour would go here -->
            <div class="bg-stone-50 border-2 border-dashed border-stone-300 p-4 text-center">
              <p class="text-sm text-stone-500">HEB product picker would appear here</p>
              <p class="text-xs text-stone-400 mt-1">(Same compact list / card UI from Section 1)</p>
            </div>
          </template>

          <template v-else>
            <!-- Manual rate entry -->
            <div class="space-y-3">
              <div class="flex gap-4 items-end">
                <div class="flex-1">
                  <label class="font-mono text-xs text-stone-500 mb-1 block">Purchase size</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="flourPurchaseLbs"
                      type="text"
                      inputmode="decimal"
                      class="w-20 border-2 border-stone-200 p-2 text-sm bg-surface font-mono text-right"
                    />
                    <span class="text-sm text-stone-500">lbs</span>
                  </div>
                </div>
                <div class="flex-1">
                  <label class="font-mono text-xs text-stone-500 mb-1 block">Price paid</label>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-stone-500">$</span>
                    <input
                      v-model="flourPurchasePrice"
                      type="text"
                      inputmode="decimal"
                      class="w-20 border-2 border-stone-200 p-2 text-sm bg-surface font-mono text-right"
                    />
                  </div>
                </div>
              </div>

              <!-- Calculated rate -->
              <div class="bg-stone-50 border-2 border-stone-200 p-3">
                <div class="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span class="font-mono text-xs text-stone-500 block mb-1">Rate</span>
                    <span class="font-mono text-sm text-ink">${{ flourRatePerGram.toFixed(4) }}/g</span>
                  </div>
                  <div>
                    <span class="font-mono text-xs text-stone-500 block mb-1">Recipe uses</span>
                    <span class="font-mono text-sm text-ink">390g</span>
                  </div>
                  <div>
                    <span class="font-mono text-xs text-stone-500 block mb-1">Cost</span>
                    <span class="font-mono text-sm text-accent font-medium">${{ flourCostForRecipe.toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <!-- Stored rates info -->
              <div class="flex items-center gap-2 text-xs text-stone-400">
                <span class="font-mono">last updated:</span>
                <span>2026-02-10</span>
                <span class="text-stone-300">|</span>
                <span class="font-mono">source:</span>
                <span>H-E-B Unbleached AP Flour, 5 lb</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="card mt-4">
        <h4 class="font-mono text-xs text-stone-500 mb-2">Pantry rate notes</h4>
        <ul class="text-body text-sm space-y-1 pl-4 list-disc">
          <li>Rates persist across bakes -- enter once, reuse until price changes</li>
          <li>Toggle between "I'm buying this today" (HEB picker) and "I already have this" (stored rate)</li>
          <li>Rate auto-calculates: (price / total grams) * recipe grams needed</li>
          <li>Stored rates could be tied to a specific HEB product for one-tap refresh</li>
        </ul>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SECTION 3: Cost Summary                      -->
    <!-- ============================================ -->
    <div class="mb-12">
      <h3 class="text-heading text-xl font-mono mb-4 border-b-2 border-stone-200 pb-2">
        3. Cost Summary
      </h3>
      <p class="text-body text-sm mb-4">Running total of all ingredients with selected products and calculated costs.</p>

      <div class="bg-surface border-2 border-stone-200">
        <!-- Header -->
        <div class="flex items-center justify-between p-3 border-b-2 border-stone-200 bg-stone-50">
          <span class="font-mono text-xs text-stone-600">ATK Cinnamon Buns (Quick) -- Cost Breakdown</span>
          <span class="font-mono text-xs text-stone-400">8 servings</span>
        </div>

        <!-- Ingredient rows -->
        <div class="divide-y divide-stone-100">
          <div
            v-for="line in costLines"
            :key="line.ingredient"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-ink">{{ line.ingredient }}</span>
                <span
                  class="font-mono text-[10px] px-1.5 py-0.5"
                  :class="line.source === 'heb' ? 'bg-stone-200 text-stone-600' : 'bg-cream text-crust-dark'"
                >
                  {{ line.source === 'heb' ? 'HEB' : 'PANTRY' }}
                </span>
              </div>
              <p class="text-xs text-stone-400">{{ line.product }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="flex items-baseline gap-2">
                <span class="text-xs text-stone-400 font-mono">{{ line.amountUsed }}</span>
                <span class="text-sm font-mono font-medium text-ink">${{ line.cost.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Total row -->
        <div class="border-t-2 border-stone-200 bg-stone-50 px-4 py-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-mono text-xs text-stone-500">Total bake cost</span>
            </div>
            <span class="text-lg font-mono font-medium text-ink">${{ totalCost.toFixed(2) }}</span>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="font-mono text-xs text-stone-400">Per serving (8 buns)</span>
            <span class="font-mono text-sm text-accent font-medium">${{ perServingCost.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="card mt-4">
        <h4 class="font-mono text-xs text-stone-500 mb-2">Summary UX notes</h4>
        <ul class="text-body text-sm space-y-1 pl-4 list-disc">
          <li>Changing product selection in Section 1 updates the butter line here in real-time</li>
          <li>Changing pantry rates in Section 2 updates the flour line here in real-time</li>
          <li>HEB vs PANTRY badge makes source clear at a glance</li>
          <li>"Pantry staples" groups low-cost items that aren't worth individual tracking</li>
          <li>Per-serving cost = total / recipe servings (always shown)</li>
        </ul>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SECTION 4: JSON Output                       -->
    <!-- ============================================ -->
    <div class="mb-12">
      <h3 class="text-heading text-xl font-mono mb-4 border-b-2 border-stone-200 pb-2">
        4. JSON Output
      </h3>
      <p class="text-body text-sm mb-4">Structured output shape for storing cost data in the cook_log entry. Values update live based on selections above.</p>

      <div class="bg-stone-800 text-stone-200 p-4 border-2 border-stone-600 overflow-x-auto">
        <pre class="font-mono text-xs leading-relaxed whitespace-pre">{{ sampleJson }}</pre>
      </div>

      <div class="card mt-4">
        <h4 class="font-mono text-xs text-stone-500 mb-2">JSON structure notes</h4>
        <ul class="text-body text-sm space-y-1 pl-4 list-disc">
          <li><code class="font-mono text-xs bg-stone-100 px-1">costs[]</code> array -- one entry per ingredient, source-tagged</li>
          <li>HEB products include <code class="font-mono text-xs bg-stone-100 px-1">product</code> + <code class="font-mono text-xs bg-stone-100 px-1">packagePrice</code> + <code class="font-mono text-xs bg-stone-100 px-1">packageSize</code></li>
          <li>Pantry items include <code class="font-mono text-xs bg-stone-100 px-1">rate</code> + <code class="font-mono text-xs bg-stone-100 px-1">rateUnit</code></li>
          <li>All items have <code class="font-mono text-xs bg-stone-100 px-1">amountUsed</code> (from recipe JSON) and calculated <code class="font-mono text-xs bg-stone-100 px-1">cost</code></li>
          <li>Top-level <code class="font-mono text-xs bg-stone-100 px-1">total</code> and <code class="font-mono text-xs bg-stone-100 px-1">perServing</code> for quick access</li>
        </ul>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Summary / Decision Matrix                    -->
    <!-- ============================================ -->
    <div class="card">
      <h3 class="text-heading font-mono text-sm mb-3">Decision Matrix</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-body">
          <thead>
            <tr class="border-b-2 border-stone-200">
              <th class="text-left py-2 pr-4 font-mono text-xs text-stone-500">Dimension</th>
              <th class="text-left py-2 pr-4 font-mono text-xs text-stone-500">Option A</th>
              <th class="text-left py-2 font-mono text-xs text-stone-500">Option B</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-stone-100">
              <td class="py-2 pr-4 font-medium">Product picker</td>
              <td class="py-2 pr-4">Compact radio list</td>
              <td class="py-2">Selection cards</td>
            </tr>
            <tr class="border-b border-stone-100">
              <td class="py-2 pr-4 font-medium">Bulk ingredients</td>
              <td class="py-2 pr-4" colspan="2">Pantry rate entry with stored rates + one-tap HEB refresh</td>
            </tr>
            <tr class="border-b border-stone-100">
              <td class="py-2 pr-4 font-medium">Cost summary</td>
              <td class="py-2 pr-4" colspan="2">Inline line items with HEB/PANTRY badges, total + per-serving</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-medium">Data shape</td>
              <td class="py-2 pr-4" colspan="2">Source-tagged costs[] array in cook_log entry</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-muted mt-3">Main open question: compact list vs cards for HEB product picker. Everything else converges on one approach.</p>
    </div>
  </div>
</template>
