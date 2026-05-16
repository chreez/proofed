<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import { useRecipe } from '@/composables/useRecipe'
import { loadPlan, parseBaseYield } from '@/composables/useProductionPlan'
import {
  loadPricing,
  getMarkupPct,
  getSellPriceOverride,
  costPerUnit,
  unitsForEntry,
  sellPrice as sellPriceFor,
} from '@/composables/usePricing'
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  loadHistory,
  openSession,
  recordTransaction,
  deleteTransaction,
  closeSession,
  setSessionLabel,
  appendToHistory,
  sessionTotals,
  aggregateSold,
  aggregateRevenue,
} from '@/composables/useSales'
import { findHeroPhoto, latestCookLogEntryWithHero } from '@/composables/useCookLog'
import type { ProductionPlan } from '@/types/production'
import type { Recipe } from '@/types/recipe'
import type { MarketSession, PlanSnapshot, TransactionItem } from '@/types/sales'
import {
  exportBakeryOpsSnapshot,
  downloadSnapshot,
} from '@/composables/useBakeryOpsSnapshot'
import SalesRow from '@/components/SalesRow.vue'
import NewSaleSheet from '@/components/NewSaleSheet.vue'
import SalesTransactionRow from '@/components/SalesTransactionRow.vue'
import HelpTooltip from '@/components/HelpTooltip.vue'

/**
 * SalesView — /sales route (PF-256.6 Slice 6.x).
 *
 * Per-transaction sales tracking. The user opens a session (snapshotting
 * production plan + pricing into initialPlan), then records each customer
 * interaction as a SalesTransaction via the New Sale sheet. Aggregate
 * sold-per-recipe is derived from transactions, not stored.
 *
 * Renders three sections:
 *   1. Active session header + transaction log (newest first).
 *   2. By-recipe aggregate (collapsed by default).
 *   3. Past sessions (legacy aggregate-shape sessions fall back to SalesRow).
 */

useSeoMeta({
  title: 'Sales · proofed.',
  description: 'Track per-customer sales during a market session; archive closed sessions.',
  ogTitle: 'Sales · proofed.',
  ogDescription: 'Track per-customer sales during a market session; archive closed sessions.',
  twitterCard: 'summary',
})

const { recipeList, loadManifest } = useRecipe()

const plan = ref<ProductionPlan>(loadPlan())
const activeSession = ref<MarketSession | null>(loadActiveSession())
const history = ref<MarketSession[]>(loadHistory())
const manifestLoaded = ref(false)
const recipesLoaded = ref(false)
const recipes = ref<Record<string, Recipe | null>>({})

const labelInput = ref(activeSession.value?.label ?? '')
const expandedHistoryIds = ref<Set<string>>(new Set())
const byRecipeOpen = ref(false)
const newSaleOpen = ref(false)
const recentlyClosedFlash = ref<string | null>(null)
const transactionFlash = ref<string | null>(null)

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

function unitForRecipe(recipeId: string): string {
  const entry = plan.value.entries.find((e) => e.recipeId === recipeId)
  if (entry?.unit) return entry.unit
  return 'unit'
}

const hasActive = computed(() => activeSession.value != null)
const hasHistory = computed(() => history.value.length > 0)
const hasPlanEntries = computed(() => plan.value.entries.length > 0)

const activeSummary = computed(() => {
  const s = activeSession.value
  if (!s) return null
  return sessionTotals(s)
})

const recipeNameMap = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  for (const entry of recipeList.value) {
    out[entry.id] = entry.name
  }
  return out
})

/** Plan rows used by the New Sale sheet — recipe name + thumb + unit noun. */
const newSaleRows = computed(() => {
  const s = activeSession.value
  if (!s?.initialPlan) return []
  return s.initialPlan.map((p: PlanSnapshot) => ({
    recipeId: p.recipeId,
    recipeName: recipeNameFor(p.recipeId),
    heroThumb: heroThumbFor(p.recipeId),
    unit: unitForRecipe(p.recipeId),
  }))
})

/** Map of recipeId → aggregate units sold this session (drives "available" line). */
const soldByRecipe = computed<Record<string, number>>(() => {
  const out: Record<string, number> = {}
  const s = activeSession.value
  if (!s) return out
  for (const p of s.initialPlan ?? []) {
    out[p.recipeId] = aggregateSold(s, p.recipeId)
  }
  return out
})

/** Reverse-chronological transactions of the active session. */
const activeTransactions = computed(() => {
  const txs = activeSession.value?.transactions ?? []
  return [...txs].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
})

function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

// ──────────────────────────────────────────────
// Lifecycle: open / record / close
// ──────────────────────────────────────────────

function handleStartSession(): void {
  if (!plan.value.entries.length) return
  const planEntries = plan.value.entries.map((entry) => {
    const r = recipeFor(entry.recipeId)
    const units = unitsForEntry(r, entry, parseBaseYield)
    return { recipeId: entry.recipeId, unitsPerBake: units }
  })
  const pricing = loadPricing()
  const recipeSellPrices: Record<string, number> = {}
  for (const entry of plan.value.entries) {
    const r = recipeFor(entry.recipeId)
    const cpu = costPerUnit(r, entry, parseBaseYield)
    const override = getSellPriceOverride(pricing, entry.recipeId)
    let sell = 0
    if (override != null) {
      sell = override
    } else if (cpu != null && cpu > 0) {
      const markup = getMarkupPct(pricing, entry.recipeId)
      sell = sellPriceFor(cpu, markup)
    }
    recipeSellPrices[entry.recipeId] = sell
  }
  const session = openSession({
    planEntries,
    recipeSellPrices,
    label: labelInput.value.trim() || undefined,
  })
  activeSession.value = session
  saveActiveSession(session)
}

function openNewSale(): void {
  if (!activeSession.value) return
  newSaleOpen.value = true
}

function handleCompleteSale(items: TransactionItem[], notes: string): void {
  if (!activeSession.value) return
  const next = recordTransaction(activeSession.value, items, notes || undefined)
  activeSession.value = next
  saveActiveSession(next)
  newSaleOpen.value = false
  const total = items.reduce((acc, it) => acc + it.lineTotal, 0)
  transactionFlash.value = `Sale recorded · ${fmtMoney(total)}`
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      transactionFlash.value = null
    }, 3000)
  }
}

function handleCancelSale(): void {
  newSaleOpen.value = false
}

function handleDeleteTransaction(txId: string): void {
  if (!activeSession.value) return
  const next = deleteTransaction(activeSession.value, txId)
  activeSession.value = next
  saveActiveSession(next)
}

function handleLabelChange(value: string): void {
  labelInput.value = value
  if (activeSession.value) {
    const next = setSessionLabel(activeSession.value, value)
    activeSession.value = next
    saveActiveSession(next)
  }
}

function handleCloseSession(): void {
  if (!activeSession.value) return
  if (typeof window !== 'undefined' && window.confirm) {
    const ok = window.confirm('Close this market session? It will move to history.')
    if (!ok) return
  }
  const closed = closeSession(activeSession.value)
  appendToHistory(closed)
  history.value = loadHistory()
  activeSession.value = null
  labelInput.value = ''
  clearActiveSession()
  recentlyClosedFlash.value = closed.id
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      if (recentlyClosedFlash.value === closed.id) recentlyClosedFlash.value = null
    }, 3000)
  }
}

function handleExportSnapshot(): void {
  const snap = exportBakeryOpsSnapshot()
  downloadSnapshot(snap)
}

function toggleHistoryEntry(id: string): void {
  const next = new Set(expandedHistoryIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedHistoryIds.value = next
}

/** Detect legacy (pre-PF-256.6) session shape — no transactions, has sales[]. */
function isLegacySession(s: MarketSession): boolean {
  return !s.transactions && Array.isArray(s.sales)
}

/** Build a SaleEntry-like view for a new-shape session's by-recipe section. */
function aggregateRowsFor(session: MarketSession) {
  const out: Array<{
    recipeId: string
    plannedUnits: number
    soldUnits: number
    unitPrice: number
    revenue: number
  }> = []
  for (const p of session.initialPlan ?? []) {
    const sold = aggregateSold(session, p.recipeId)
    out.push({
      recipeId: p.recipeId,
      plannedUnits: p.plannedUnits,
      soldUnits: sold,
      unitPrice: p.unitPrice,
      revenue: aggregateRevenue(session, p.recipeId),
    })
  }
  return out
}
</script>

<template>
  <div class="sales-page">
    <header class="sales-toolbar" data-testid="sales-toolbar">
      <div class="sales-toolbar-text">
        <h1 class="sales-title">Sales</h1>
        <p v-if="hasActive && activeSummary" class="sales-subtitle" data-testid="sales-subtitle">
          <HelpTooltip text="Current market session — totals update as you record sales.">
            <span>Active session</span>
          </HelpTooltip>
          <template v-if="activeSession?.label">
            · <span class="sales-subtitle-label">{{ activeSession.label }}</span>
          </template>
          ·
          <HelpTooltip text="Number of recorded transactions this session.">
            <span>{{ activeSummary.transactionCount }} {{ activeSummary.transactionCount === 1 ? 'sale' : 'sales' }}</span>
          </HelpTooltip>
          ·
          <HelpTooltip text="Total units sold across all transactions.">
            <span>{{ activeSummary.itemsSold }} items</span>
          </HelpTooltip>
          ·
          <HelpTooltip text="Revenue so far — sum of line totals across all transactions.">
            <span>{{ fmtMoney(activeSummary.revenue) }}</span>
          </HelpTooltip>
        </p>
        <p v-else-if="hasHistory" class="sales-subtitle sales-subtitle--idle" data-testid="sales-subtitle-idle">
          No active session — past sessions below.
        </p>
        <p v-else class="sales-subtitle sales-subtitle--empty" data-testid="sales-subtitle-empty">
          No sessions yet.
        </p>
      </div>
      <div class="sales-toolbar-actions">
        <HelpTooltip
          text="Download a JSON snapshot of production + pricing + sales for agent ingestion or backup."
          align="right"
        >
          <button
            type="button"
            class="sales-export-btn"
            data-testid="sales-export-btn"
            aria-label="Export snapshot"
            @click="handleExportSnapshot"
          >Export</button>
        </HelpTooltip>
        <template v-if="hasActive">
          <HelpTooltip text="Open a New Sale sheet to build the next customer transaction." align="right">
            <button
              type="button"
              class="sales-newsale-btn"
              data-testid="sales-new-sale-btn"
              @click="openNewSale"
            >+ New Sale</button>
          </HelpTooltip>
          <HelpTooltip text="Label for this market session (e.g. 'Saturday Market 5/17').">
            <input
              type="text"
              class="sales-label-input"
              placeholder="Session label (optional)"
              :value="labelInput"
              data-testid="sales-label-input"
              @input="handleLabelChange(($event.target as HTMLInputElement).value)"
            />
          </HelpTooltip>
          <HelpTooltip text="Close this session, stamp the time, and move to history." align="right">
            <button
              type="button"
              class="sales-close-btn"
              data-testid="sales-close-btn"
              @click="handleCloseSession"
            >Close session</button>
          </HelpTooltip>
        </template>
        <template v-else-if="hasPlanEntries">
          <HelpTooltip text="Optional human label for the session." align="right">
            <input
              type="text"
              class="sales-label-input"
              placeholder="Session label (optional)"
              :value="labelInput"
              data-testid="sales-label-input"
              @input="labelInput = ($event.target as HTMLInputElement).value"
            />
          </HelpTooltip>
          <HelpTooltip text="Snapshot the current /production plan + /pricing into a new session." align="right">
            <button
              type="button"
              class="sales-start-btn"
              data-testid="sales-start-btn"
              @click="handleStartSession"
            >Start market session</button>
          </HelpTooltip>
        </template>
      </div>
    </header>

    <div
      v-if="!manifestLoaded || !recipesLoaded"
      class="sales-loading"
      data-testid="sales-loading"
    >
      Loading sales…
    </div>

    <div
      v-else-if="recentlyClosedFlash"
      class="sales-flash"
      data-testid="sales-flash"
      role="status"
    >Session closed — saved to history.</div>

    <div
      v-else-if="transactionFlash"
      class="sales-flash"
      data-testid="sales-transaction-flash"
      role="status"
    >{{ transactionFlash }}</div>

    <section
      v-if="hasActive && activeSession"
      class="sales-active"
      data-testid="sales-active"
    >
      <header class="sales-section-header sales-section-header--sticky">
        <h2 class="sales-section-title">Transactions</h2>
        <span v-if="activeSummary" class="sales-section-meta">
          {{ activeSummary.transactionCount }} {{ activeSummary.transactionCount === 1 ? 'sale' : 'sales' }} · {{ activeSummary.itemsSold }} items · {{ fmtMoney(activeSummary.revenue) }}
        </span>
      </header>

      <ul
        v-if="activeTransactions.length"
        class="sales-tx-log"
        data-testid="sales-tx-log"
      >
        <SalesTransactionRow
          v-for="tx in activeTransactions"
          :key="tx.id"
          :transaction="tx"
          :recipe-name-by-recipe="recipeNameMap"
          @delete="handleDeleteTransaction"
        />
      </ul>
      <p v-else class="sales-tx-empty" data-testid="sales-tx-empty">
        No transactions yet — tap "+ New Sale" to record the first customer.
      </p>

      <details
        class="sales-byrecipe"
        :open="byRecipeOpen"
        data-testid="sales-byrecipe"
        @toggle="byRecipeOpen = ($event.target as HTMLDetailsElement).open"
      >
        <summary class="sales-byrecipe-summary">
          <HelpTooltip text="Aggregate units sold per recipe — derived from all transactions.">
            <span>By recipe</span>
          </HelpTooltip>
        </summary>
        <ul class="sales-list" data-testid="sales-byrecipe-list">
          <SalesRow
            v-for="row in aggregateRowsFor(activeSession)"
            :key="row.recipeId"
            :entry="{ recipeId: row.recipeId, plannedUnits: row.plannedUnits, soldUnits: row.soldUnits, unitPrice: row.unitPrice }"
            :recipe-name="recipeNameFor(row.recipeId)"
            :hero-thumb="heroThumbFor(row.recipeId)"
            :unit="unitForRecipe(row.recipeId)"
            readonly
          />
        </ul>
      </details>
    </section>

    <section
      v-if="hasHistory"
      class="sales-history"
      data-testid="sales-history"
    >
      <header class="sales-section-header">
        <h2 class="sales-section-title">Past sessions</h2>
        <span class="sales-section-meta">{{ history.length }} {{ history.length === 1 ? 'session' : 'sessions' }}</span>
      </header>
      <ul class="sales-history-list">
        <li
          v-for="session in history"
          :key="session.id"
          class="sales-history-item"
          :data-session-id="session.id"
        >
          <button
            type="button"
            class="sales-history-row"
            :aria-expanded="expandedHistoryIds.has(session.id) ? 'true' : 'false'"
            data-testid="sales-history-toggle"
            @click="toggleHistoryEntry(session.id)"
          >
            <span class="sales-history-date">{{ fmtDate(session.closedAt) }}</span>
            <span v-if="session.label" class="sales-history-label">{{ session.label }}</span>
            <span class="sales-history-totals">
              {{ sessionTotals(session).itemsSold }} items · {{ fmtMoney(sessionTotals(session).revenue) }}
              <template v-if="!isLegacySession(session)">
                · {{ sessionTotals(session).transactionCount }} {{ sessionTotals(session).transactionCount === 1 ? 'sale' : 'sales' }}
              </template>
              <template v-else-if="session.sales">
                · {{ session.sales.length }} {{ session.sales.length === 1 ? 'recipe' : 'recipes' }}
              </template>
            </span>
            <span class="sales-history-chevron" :class="{ 'sales-history-chevron--open': expandedHistoryIds.has(session.id) }">›</span>
          </button>
          <div
            v-if="expandedHistoryIds.has(session.id)"
            class="sales-history-breakdown"
            data-testid="sales-history-breakdown"
          >
            <!-- Legacy aggregate-shape session -->
            <ul
              v-if="isLegacySession(session) && session.sales"
              class="sales-list"
              data-testid="sales-history-legacy"
            >
              <SalesRow
                v-for="entry in session.sales"
                :key="entry.recipeId"
                :entry="entry"
                :recipe-name="recipeNameFor(entry.recipeId)"
                :hero-thumb="heroThumbFor(entry.recipeId)"
                :unit="unitForRecipe(entry.recipeId)"
                readonly
              />
            </ul>
            <!-- New transaction-shape session -->
            <template v-else>
              <ul
                v-if="(session.transactions ?? []).length"
                class="sales-tx-log"
                data-testid="sales-history-tx-log"
              >
                <SalesTransactionRow
                  v-for="tx in session.transactions"
                  :key="tx.id"
                  :transaction="tx"
                  :recipe-name-by-recipe="recipeNameMap"
                  readonly
                />
              </ul>
              <p v-else class="sales-tx-empty">No transactions recorded.</p>
            </template>
          </div>
        </li>
      </ul>
    </section>

    <div
      v-if="manifestLoaded && recipesLoaded && !hasActive && !hasHistory"
      class="sales-empty"
      data-testid="sales-empty"
    >
      <p class="sales-empty-text">
        <template v-if="hasPlanEntries">
          No market session yet. Start one to track sales from your production plan.
        </template>
        <template v-else>
          No bakes queued yet. Add to your production plan, then start a market session.
        </template>
      </p>
      <a
        v-if="!hasPlanEntries"
        href="/production"
        class="sales-empty-cta"
        data-testid="sales-empty-cta"
      >Go to Production</a>
      <button
        v-else
        type="button"
        class="sales-empty-cta"
        data-testid="sales-empty-start"
        @click="handleStartSession"
      >Start market session</button>
    </div>

    <NewSaleSheet
      v-if="activeSession?.initialPlan"
      :open="newSaleOpen"
      :initial-plan="activeSession.initialPlan"
      :rows="newSaleRows"
      :sold-by-recipe="soldByRecipe"
      @complete="handleCompleteSale"
      @cancel="handleCancelSale"
    />
  </div>
</template>

<style scoped>
.sales-page {
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

.sales-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  border-bottom: 2px solid var(--color-stone-200);
  padding-bottom: 1rem;
  flex-shrink: 0;
}

.sales-toolbar-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sales-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sales-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
}

.sales-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--color-stone-600);
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.sales-subtitle--idle,
.sales-subtitle--empty {
  color: var(--color-stone-500);
}

.sales-subtitle-label {
  color: var(--color-ink);
  font-weight: 600;
}

.sales-label-input {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-ink);
  background: var(--color-stone-50);
  border: 2px solid var(--color-stone-300);
  border-radius: 0;
  padding: 0.4rem 0.6rem;
  min-width: 14rem;
}

.sales-label-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.sales-start-btn,
.sales-close-btn,
.sales-newsale-btn,
.sales-export-btn {
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

.sales-export-btn {
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
  color: var(--color-ink);
  background: var(--color-surface);
}

.sales-export-btn:hover,
.sales-export-btn:focus-visible {
  background: var(--color-accent);
  color: var(--color-surface);
  border-color: var(--color-accent);
  outline: none;
}

.sales-newsale-btn {
  background: var(--color-accent);
  border-color: var(--color-accent);
  padding: 0.55rem 1.25rem;
  font-size: 0.9rem;
}

.sales-newsale-btn:hover,
.sales-newsale-btn:focus-visible {
  background: var(--color-ink);
  border-color: var(--color-ink);
  outline: none;
}

.sales-start-btn:hover,
.sales-start-btn:focus-visible,
.sales-close-btn:hover,
.sales-close-btn:focus-visible {
  background: var(--color-accent);
  border-color: var(--color-accent);
  outline: none;
}

.sales-loading,
.sales-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-stone-500);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  border: 2px dashed var(--color-stone-300);
  background: var(--color-stone-100);
}

.sales-empty {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.sales-empty-text {
  margin: 0;
  color: var(--color-stone-600);
}

.sales-empty-cta {
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
  cursor: pointer;
}

.sales-empty-cta:hover,
.sales-empty-cta:focus-visible {
  background: var(--color-accent);
  border-color: var(--color-accent);
  outline: none;
}

.sales-flash {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--color-surface);
  background: var(--color-accent);
  border: 2px solid var(--color-accent);
  padding: 0.4rem 0.8rem;
  flex-shrink: 0;
}

.sales-active,
.sales-history {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 1.5rem;
}

.sales-active {
  flex: 1;
}

.sales-history {
  flex-shrink: 0;
  max-height: 50vh;
}

.sales-section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0;
  background: var(--color-stone-50);
}

.sales-section-header--sticky {
  position: sticky;
  top: 0;
  z-index: 5;
  border-bottom: 2px solid var(--color-stone-200);
}

.sales-section-title {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-ink);
  margin: 0;
}

.sales-section-meta {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-stone-600);
}

.sales-list,
.sales-tx-log {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.sales-tx-empty {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-stone-500);
  text-align: center;
  padding: 1.5rem 1rem;
  background: var(--color-stone-100);
  border: 2px dashed var(--color-stone-300);
  margin: 0 0 1rem 0;
}

.sales-byrecipe {
  margin-top: 1rem;
  border-top: 2px solid var(--color-stone-200);
  padding-top: 0.5rem;
}

.sales-byrecipe-summary {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-700);
  cursor: pointer;
  padding: 0.5rem 0;
  list-style: none;
}

.sales-byrecipe-summary::-webkit-details-marker {
  display: none;
}

.sales-byrecipe-summary::before {
  content: '›';
  display: inline-block;
  margin-right: 0.4rem;
  transition: transform 0.15s ease;
  color: var(--color-stone-500);
}

.sales-byrecipe[open] .sales-byrecipe-summary::before {
  transform: rotate(90deg);
  color: var(--color-accent);
}

.sales-history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sales-history-item {
  display: flex;
  flex-direction: column;
}

.sales-history-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 0.75rem;
  align-items: baseline;
  width: 100%;
  text-align: left;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-ink);
  background: white;
  border: 2px solid var(--color-stone-300);
  padding: 0.6rem 0.75rem;
  cursor: pointer;
}

.sales-history-row:hover,
.sales-history-row:focus-visible {
  background: var(--color-stone-100);
  outline: none;
  border-color: var(--color-ink);
}

.sales-history-date {
  font-weight: 600;
}

.sales-history-label {
  color: var(--color-stone-700);
}

.sales-history-totals {
  color: var(--color-stone-600);
  font-size: 0.75rem;
}

.sales-history-chevron {
  font-family: var(--font-mono);
  font-size: 1rem;
  color: var(--color-stone-500);
  transition: transform 0.15s ease;
}

.sales-history-chevron--open {
  transform: rotate(90deg);
  color: var(--color-accent);
}

.sales-history-breakdown {
  margin: 0;
}

@media (max-width: 640px) {
  .sales-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .sales-toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .sales-label-input {
    min-width: 0;
    width: 100%;
  }
  .sales-history-row {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    row-gap: 0.25rem;
  }
  .sales-history-totals {
    grid-column: 1 / -1;
  }
}
</style>
