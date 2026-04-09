<script setup lang="ts">
import { ref, computed, onMounted, watch, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { Link2, Check, ArrowRight } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type {
  CookLogEntry,
  CookLogPhoto,
  Recipe,
  BakeStatsBlock,
  DoughTemp,
  BakePhase,
  AliquotRise
} from '@/types/recipe'
import { sortedCookLog } from '@/composables/useCookLog'
import {
  sessionCount,
  itemsCreated,
  servingsCreated,
  caloriesCreated,
} from '@/composables/useCookLogStats'
import { copyToClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  cookLog: CookLogEntry[]
  sectionId: string
  recipeId?: string
  recipe?: Recipe
}>()

// --- Header stats row (PF-41 decision A2) ---
// Only renders when the parent supplies a `recipe` prop with stats + at least
// one completed bake. Existing callers that only pass `cookLog` (e.g. specs)
// render the plain header with no stats row.
const stats = computed(() => props.recipe?.config?.stats)
const completedCount = computed(() => sessionCount(props.cookLog))
const showStatsRow = computed(() => !!stats.value && completedCount.value > 0)

const statsItems = computed(() => itemsCreated(props.cookLog, props.recipe))
const statsServings = computed(() => servingsCreated(props.cookLog, props.recipe))
const statsCalories = computed(() => caloriesCreated(props.cookLog, props.recipe))

function formatCalories(cal: number | null): string {
  if (cal == null) return '—'
  if (cal >= 1000) return `${(cal / 1000).toFixed(1)}k`
  return Math.round(cal).toString()
}

const router = useRouter()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

// Collapse state: newest 4 shown by default when cook_log.length > 4.
// One-way expand, transient (resets on navigation / reload).
const COLLAPSE_THRESHOLD = 4
const expanded = ref(false)

const sortedEntries = computed(() => sortedCookLog(props.cookLog))

const visibleEntries = computed(() =>
  expanded.value || sortedEntries.value.length <= COLLAPSE_THRESHOLD
    ? sortedEntries.value
    : sortedEntries.value.slice(0, COLLAPSE_THRESHOLD)
)

const hiddenCount = computed(() =>
  Math.max(0, sortedEntries.value.length - COLLAPSE_THRESHOLD)
)

const showExpandButton = computed(() => !expanded.value && hiddenCount.value > 0)

function expandAll(): void {
  expanded.value = true
}

// Summary expand state: tracks which summaries show full text
const expandedSummaries = ref<Record<number, boolean>>({})

function isSummaryExpanded(index: number): boolean {
  return !!expandedSummaries.value[index]
}

function toggleSummary(event: MouseEvent, index: number): void {
  event.stopPropagation()
  expandedSummaries.value[index] = !expandedSummaries.value[index]
}

async function copyPermalink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}

function heroPhoto(photos: CookLogPhoto[]): CookLogPhoto {
  return photos[photos.length - 1]
}

function formatDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  return `${dateStr} — ${weekday}`
}

function formatDate(entry: { date: string }): string {
  return formatDateStr(entry.date)
}

function statusLabel(entry: { status?: string; start_date?: string }): string {
  if (entry.start_date) {
    const [, m, d] = entry.start_date.split('-').map(Number)
    const date = new Date(2026, m - 1, d)
    return `In Progress (since ${date.toLocaleDateString('en-US', { month: 'short' })} ${d})`
  }
  return 'In Progress'
}

function navigateToBake(event: MouseEvent, date: string): void {
  event.stopPropagation()
  if (props.recipeId) {
    router.push(`/recipe/${props.recipeId}/bake/${date}`)
  }
}

function entryId(date: string): string {
  return `bake-${date}`
}

// ============================================================
// PF-177.9 — Compact bake stats variant switcher (preview wiring)
// Three variants cribbed from DemoBakeLogFlow.vue v2:
//   A = 4-column tiles row
//   B = pills inline with summary
//   C = 2x2 mini table
// Persisted in localStorage under `proofed:compact-variant`.
// Only rendered when at least one entry has `bake_stats`.
// ============================================================

type CompactVariant = 'A' | 'B' | 'C'
const VARIANT_STORAGE_KEY = 'proofed:compact-variant'
const variant = ref<CompactVariant>('A')

onMounted(() => {
  try {
    const saved = localStorage.getItem(VARIANT_STORAGE_KEY)
    if (saved === 'A' || saved === 'B' || saved === 'C') {
      variant.value = saved
    }
  } catch {
    // localStorage unavailable (SSR/private mode) — default is fine
  }
})

watch(variant, (v) => {
  try {
    localStorage.setItem(VARIANT_STORAGE_KEY, v)
  } catch {
    // Swallow — non-critical
  }
})

const hasAnyBakeStats = computed(() =>
  props.cookLog.some((e) => !!e.bake_stats)
)

// --- Derived stats helpers (PF-177.9 v2 — post HITL feedback) ---
//
// Time strings use the schema format `YYYY-MM-DD - HH:MM` (space-dash-space)
// as documented in src/types/recipe.ts.
//
// Three derived stats:
//   1. bulk   — bulk fermentation duration (first dough_temp → last dough_temp
//               or first bulk aliquot_rise, whichever is later).
//               Tooltip: avg dough temp during that window.
//   2. proof  — total proof time (first dough_temp → first non-preheat
//               bake_phase.start_time). Multi-day format: `Xd Yh`.
//               Tooltip: optional bulk / retard / final breakdown if derivable.
//   3. bake   — total bake time (covered + uncovered only, NOT preheat).
//               Tooltip: preheat / covered / uncovered temps (temps only,
//               no durations).

function timeToMin(t: string): number {
  const [d, hm] = t.split(' - ')
  if (!d || !hm) return 0
  const [y, mo, da] = d.split('-').map(Number)
  const [h, m] = hm.split(':').map(Number)
  return Date.UTC(y, mo - 1, da, h, m) / 60000
}

function minutesBetween(a: string, b: string): number {
  return timeToMin(b) - timeToMin(a)
}

function fmtTemp(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v}°F`
}

// Format duration under 24h as `Xh Ym`, 24h+ as `Xd Yh`.
function fmtDurationLong(v: number | null | undefined): string {
  if (v == null || v <= 0) return '—'
  if (v < 60) return `${v}m`
  if (v < 24 * 60) {
    const h = Math.floor(v / 60)
    const m = v % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
  }
  const totalH = Math.floor(v / 60)
  const d = Math.floor(totalH / 24)
  const h = totalH % 24
  return h === 0 ? `${d}d` : `${d}d ${h}h`
}

// Short format for the bake pill ("42m").
function fmtBakeDuration(v: number | null | undefined): string {
  if (v == null || v <= 0) return '—'
  return `${v}m`
}

// --- Bulk stat ---
interface BulkStat {
  duration: string   // display, e.g. "4h 20m"
  avgDough: string   // display, e.g. "76.1°F" or ''
  hasTooltip: boolean
}

function computeBulk(stats: BakeStatsBlock | undefined): BulkStat {
  const samples: DoughTemp[] = stats?.dough_temps ?? []
  if (samples.length === 0) {
    return { duration: '—', avgDough: '', hasTooltip: false }
  }
  const avg = samples.reduce((s, x) => s + x.temp_f, 0) / samples.length
  const avgDough = `${(Math.round(avg * 10) / 10).toFixed(1)}°F`

  // Bulk end = last dough_temp OR first bulk aliquot_rise, whichever is later.
  // Bulk start = first dough_temp (proxy for mix start).
  const times = [...samples.map((x) => x.time)].sort()
  let start = times[0]
  let end = times[times.length - 1]
  const bulkRise = (stats?.aliquot_rises ?? []).find((a) => a.stage === 'bulk')
  if (bulkRise && timeToMin(bulkRise.time) > timeToMin(end)) {
    end = bulkRise.time
  }
  const mins = Math.max(0, minutesBetween(start, end))
  if (mins === 0) {
    // Only one dough temp sample — no window to derive duration, but we still
    // have an avg temp to show in the tooltip.
    return { duration: '—', avgDough, hasTooltip: true }
  }
  return { duration: fmtDurationLong(mins), avgDough, hasTooltip: true }
}

// --- Proof stat ---
interface ProofStat {
  total: string    // display, e.g. "19h 30m" or "1d 21h"
  detail: string   // optional tooltip body (bulk · retard · final)
}

function computeProof(stats: BakeStatsBlock | undefined): ProofStat {
  const samples: DoughTemp[] = stats?.dough_temps ?? []
  const phases: BakePhase[] = stats?.bake_phases ?? []
  if (samples.length === 0 || phases.length === 0) {
    return { total: '—', detail: '' }
  }
  const start = samples.map((x) => x.time).sort()[0]
  const oven = phases.find((p) => p.stage !== 'preheat' && p.start_time)?.start_time
  if (!oven) return { total: '—', detail: '' }
  const total = minutesBetween(start, oven)
  if (total <= 0) return { total: '—', detail: '' }

  // Tooltip breakdown: bulk (mix → last dough_temp or first bulk aliquot_rise)
  // · retard (bulk end → last aliquot_rise in fridge or 'preshape'/'final' rise)
  // · final (retard end → oven)
  // Only populate when the math is clean — otherwise omit the tooltip.
  const rises: AliquotRise[] = stats?.aliquot_rises ?? []
  let detail = ''
  if (rises.length >= 2) {
    const sortedRises = [...rises].sort(
      (a, b) => timeToMin(a.time) - timeToMin(b.time)
    )
    const bulkEnd = sortedRises[0].time
    const retardEnd = sortedRises[sortedRises.length - 1].time
    const bulkMin = Math.max(0, minutesBetween(start, bulkEnd))
    const retardMin = Math.max(0, minutesBetween(bulkEnd, retardEnd))
    const finalMin = Math.max(0, minutesBetween(retardEnd, oven))
    if (bulkMin > 0 && retardMin > 0 && finalMin > 0) {
      detail = `bulk ${fmtDurationLong(bulkMin)} · retard ${fmtDurationLong(
        retardMin
      )} · final ${fmtDurationLong(finalMin)}`
    }
  }
  return { total: fmtDurationLong(total), detail }
}

// --- Bake stat ---
interface BakeStat {
  total: string    // display, e.g. "42m"
  detail: string   // tooltip: preheat/covered/uncovered temps only
  hasTooltip: boolean
}

function computeBake(stats: BakeStatsBlock | undefined): BakeStat {
  const phases: BakePhase[] = stats?.bake_phases ?? []
  if (phases.length === 0) {
    return { total: '—', detail: '', hasTooltip: false }
  }
  // Total bake = covered + uncovered (NOT preheat).
  const bakePhases = phases.filter(
    (p) => p.stage === 'covered' || p.stage === 'uncovered'
  )
  const totalMin = bakePhases.reduce((s, p) => s + p.duration_min, 0)

  // Tooltip: preheat · covered · uncovered temps (temps only, no durations).
  const parts: string[] = []
  const order: Array<'preheat' | 'covered' | 'uncovered'> = [
    'preheat',
    'covered',
    'uncovered'
  ]
  for (const stage of order) {
    const p = phases.find((x) => x.stage === stage)
    if (p) parts.push(`${stage} ${fmtTemp(p.temp_f)}`)
  }
  const detail = parts.join(' · ')
  return {
    total: totalMin > 0 ? fmtBakeDuration(totalMin) : '—',
    detail,
    hasTooltip: parts.length > 0
  }
}

// Per-entry view-model so the template stays tidy
interface CompactStatsView {
  bulk: BulkStat
  proof: ProofStat
  bake: BakeStat
  // PF-177.9 v4 — confidence awareness + recipe-defaults fallback
  lowConfidence: boolean
  // Tooltip text helpers (reflect fallback behavior for low-conf)
  bulkTooltip: string
  proofTooltip: string
  bakeTooltip: string
}

// PF-177.9 v4 — recipe defaults fallback
//
// Low-confidence entries (`bake_stats.confidence === 'low'`) were not directly
// logged by the user. Rather than SHOW their stored guesstimate values,
// we fall back to what the recipe prescribes at the current version —
// `recipe.bake_defaults.bake_phases`.
//
// - For the bake pill: derive display from recipe defaults (still greyed,
//   tooltip suffix `(recipe baseline)` to indicate these are the recipe's
//   prescribed values, not the user's).
// - For bulk and proof: no recipe default exists for these, so they render
//   `—` with tooltip `not directly logged`.
// - If the recipe has no `bake_defaults`, the bake pill also falls back
//   to `—` (defensive — prevents stale low-conf data leaking through).
function compactViewOf(
  stats: BakeStatsBlock | undefined,
  recipe: Recipe | undefined
): CompactStatsView {
  const low = stats?.confidence === 'low'

  if (low) {
    // v4: fall back to recipe defaults for the bake pill only.
    // bulk + proof are not available as recipe defaults — render em-dash
    // with `not directly logged` tooltip.
    const fallbackPhases = recipe?.bake_defaults?.bake_phases ?? []
    const bakeFromDefaults = computeBake({ bake_phases: fallbackPhases })
    const bakeBody = bakeFromDefaults.detail
    const bakeHasPhases = fallbackPhases.length > 0
    return {
      bulk: { duration: '—', avgDough: '', hasTooltip: true },
      proof: { total: '—', detail: '' },
      bake: {
        total: bakeFromDefaults.total,
        detail: bakeBody,
        hasTooltip: bakeHasPhases
      },
      lowConfidence: true,
      bulkTooltip: 'not directly logged',
      proofTooltip: 'not directly logged',
      bakeTooltip: bakeHasPhases
        ? `${bakeBody} (recipe baseline)`
        : 'not directly logged'
    }
  }

  // Normal path — use the entry's own stats.
  const bulk = computeBulk(stats)
  const proof = computeProof(stats)
  const bake = computeBake(stats)
  const bulkBody = bulk.hasTooltip ? `avg dough: ${bulk.avgDough}` : ''
  const proofBody = proof.detail
  const bakeBody = bake.detail
  return {
    bulk,
    proof,
    bake,
    lowConfidence: false,
    bulkTooltip: bulkBody,
    proofTooltip: proofBody,
    bakeTooltip: bakeBody
  }
}
</script>

<template>
  <section>
    <div class="flex items-center gap-1 mb-4 pb-2 border-b-2 border-stone-200">
      <h3 class="card-title">Cook Log</h3>
      <IconButton
        ref="linkBtn"
        tooltip="Copy link"
        size="sm"
        tooltip-align="center"
        class="text-stone-300"
        @click="copyPermalink"
      >
        <Link2 />
        <template #feedback>
          <Check />
        </template>
      </IconButton>
    </div>

    <!-- PF-41 decision A2: stacked mini-tiles row (sessions · items · [servings] · calories) -->
    <div v-if="showStatsRow && stats" class="cook-log-stats">
      <div class="cook-log-stats-tile">
        <span class="cook-log-stats-value">{{ completedCount }}</span>
        <span class="cook-log-stats-label">sessions</span>
      </div>
      <div class="cook-log-stats-tile">
        <span class="cook-log-stats-value">{{ statsItems }}</span>
        <span class="cook-log-stats-label">{{ stats.unit }}</span>
      </div>
      <div v-if="stats.servingsPerItem > 1" class="cook-log-stats-tile">
        <span class="cook-log-stats-value">~{{ statsServings }}</span>
        <span class="cook-log-stats-label">{{ stats.servingUnit }}</span>
      </div>
      <div class="cook-log-stats-tile">
        <span class="cook-log-stats-value">{{ formatCalories(statsCalories) }}</span>
        <span class="cook-log-stats-label">calories</span>
      </div>
    </div>

    <!-- PF-177.9 — Compact bake stats variant switcher (preview only) -->
    <div v-if="hasAnyBakeStats" class="cf-variant-switch" data-testid="compact-variant-switch">
      <span class="cf-variant-label">COMPACT FORM:</span>
      <button
        type="button"
        class="cf-variant-btn"
        :class="{ 'cf-variant-btn-active': variant === 'A' }"
        data-variant="A"
        aria-label="Variant A — tiles row"
        @click="variant = 'A'"
      >A</button>
      <button
        type="button"
        class="cf-variant-btn"
        :class="{ 'cf-variant-btn-active': variant === 'B' }"
        data-variant="B"
        aria-label="Variant B — pills inline"
        @click="variant = 'B'"
      >B</button>
      <button
        type="button"
        class="cf-variant-btn"
        :class="{ 'cf-variant-btn-active': variant === 'C' }"
        data-variant="C"
        aria-label="Variant C — mini table"
        @click="variant = 'C'"
      >C</button>
    </div>

    <div
      v-for="(entry, index) in visibleEntries"
      :key="index"
      :id="entryId(entry.date)"
      class="mb-4 scroll-mt-16"
    >
      <div class="border-2 border-stone-200 p-3 flex gap-3">
        <!-- Optional hero thumbnail -->
        <img
          v-if="entry.photos?.length"
          :src="heroPhoto(entry.photos).thumb"
          :alt="heroPhoto(entry.photos).alt"
          loading="lazy"
          decoding="async"
          class="w-20 h-20 object-cover flex-shrink-0 border-2 border-stone-200"
        />
        <!-- Text content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <span class="font-semibold text-sm text-stone-700">{{ formatDate(entry) }}</span>
            <span class="text-xs bg-stone-200 px-2 py-0.5">{{ entry.version }}</span>
            <span v-if="entry.status === 'in_progress'" class="text-xs font-mono px-2 py-0.5 bg-warning-tint text-warning border border-warning">
              {{ statusLabel(entry) }}
            </span>
          </div>
          <p
            v-if="entry.summary"
            class="text-sm text-stone-500 mt-1.5 cursor-pointer"
            :class="{ 'line-clamp-2': !isSummaryExpanded(index) }"
            @click="toggleSummary($event, index)"
          >{{ entry.summary }}</p>

          <!-- PF-177.9 — Compact bake stats (selected variant) -->
          <template v-if="entry.bake_stats">
            <!-- Variant A: Tiles row (3 tiles: bulk · proof · bake) -->
            <div
              v-if="variant === 'A'"
              class="cf-tiles cf-tiles-inline cf-tiles-3"
              data-testid="compact-variant-a"
            >
              <template v-for="view in [compactViewOf(entry.bake_stats, props.recipe)]" :key="'va-' + index">
                <div
                  class="cf-tile"
                  :class="{
                    'bundle-host': view.bulk.hasTooltip,
                    'cf-low-confidence': view.lowConfidence
                  }"
                  :tabindex="view.bulk.hasTooltip ? 0 : undefined"
                >
                  <span class="cf-tile-value">{{ view.bulk.duration }}</span>
                  <span class="cf-tile-label">bulk</span>
                  <span
                    v-if="view.bulk.hasTooltip"
                    class="bundle-tooltip"
                    role="tooltip"
                  >{{ view.bulkTooltip }}</span>
                </div>
                <div
                  class="cf-tile"
                  :class="{
                    'bundle-host': !!view.proof.detail || view.lowConfidence,
                    'cf-low-confidence': view.lowConfidence
                  }"
                  :tabindex="view.proof.detail || view.lowConfidence ? 0 : undefined"
                >
                  <span class="cf-tile-value">{{ view.proof.total }}</span>
                  <span class="cf-tile-label">proof</span>
                  <span
                    v-if="view.proof.detail || view.lowConfidence"
                    class="bundle-tooltip"
                    role="tooltip"
                  >{{ view.proofTooltip }}</span>
                </div>
                <div
                  class="cf-tile"
                  :class="{
                    'bundle-host': view.bake.hasTooltip || view.lowConfidence,
                    'cf-low-confidence': view.lowConfidence
                  }"
                  :tabindex="view.bake.hasTooltip || view.lowConfidence ? 0 : undefined"
                >
                  <span class="cf-tile-value">{{ view.bake.total }}</span>
                  <span class="cf-tile-label">bake</span>
                  <span
                    v-if="view.bake.hasTooltip || view.lowConfidence"
                    class="bundle-tooltip"
                    role="tooltip"
                  >{{ view.bakeTooltip }}</span>
                </div>
              </template>
            </div>

            <!-- Variant B: Pills inline (winner) — bulk · proof · bake -->
            <div
              v-else-if="variant === 'B'"
              class="cf-pills"
              data-testid="compact-variant-b"
            >
              <template v-for="view in [compactViewOf(entry.bake_stats, props.recipe)]" :key="'vb-' + index">
                <span
                  class="cf-pill"
                  :class="{
                    'bundle-host': view.bulk.hasTooltip,
                    'cf-low-confidence': view.lowConfidence
                  }"
                  :tabindex="view.bulk.hasTooltip ? 0 : undefined"
                >
                  <span class="cf-pill-label">bulk</span>
                  {{ view.bulk.duration }}
                  <span
                    v-if="view.bulk.hasTooltip"
                    class="bundle-tooltip"
                    role="tooltip"
                  >{{ view.bulkTooltip }}</span>
                </span>
                <span
                  class="cf-pill"
                  :class="{
                    'bundle-host': !!view.proof.detail || view.lowConfidence,
                    'cf-low-confidence': view.lowConfidence
                  }"
                  :tabindex="view.proof.detail || view.lowConfidence ? 0 : undefined"
                >
                  <span class="cf-pill-label">proof</span>
                  {{ view.proof.total }}
                  <span
                    v-if="view.proof.detail || view.lowConfidence"
                    class="bundle-tooltip"
                    role="tooltip"
                  >{{ view.proofTooltip }}</span>
                </span>
                <span
                  class="cf-pill"
                  :class="{
                    'bundle-host': view.bake.hasTooltip || view.lowConfidence,
                    'cf-low-confidence': view.lowConfidence
                  }"
                  :tabindex="view.bake.hasTooltip || view.lowConfidence ? 0 : undefined"
                >
                  <span class="cf-pill-label">bake</span>
                  {{ view.bake.total }}
                  <span
                    v-if="view.bake.hasTooltip || view.lowConfidence"
                    class="bundle-tooltip"
                    role="tooltip"
                  >{{ view.bakeTooltip }}</span>
                </span>
              </template>
            </div>

            <!-- Variant C: 1x3 mini table (3 rows, label left / value right) -->
            <div
              v-else
              class="cf-minitable cf-minitable-3"
              data-testid="compact-variant-c"
            >
              <template v-for="view in [compactViewOf(entry.bake_stats, props.recipe)]" :key="'vc-' + index">
                <div
                  class="cf-row"
                  :class="{
                    'bundle-host': view.bulk.hasTooltip,
                    'cf-low-confidence': view.lowConfidence
                  }"
                  :tabindex="view.bulk.hasTooltip ? 0 : undefined"
                >
                  <span class="cf-row-label">bulk</span>
                  <span class="cf-row-value">{{ view.bulk.duration }}</span>
                  <span
                    v-if="view.bulk.hasTooltip"
                    class="bundle-tooltip"
                    role="tooltip"
                  >{{ view.bulkTooltip }}</span>
                </div>
                <div
                  class="cf-row"
                  :class="{
                    'bundle-host': !!view.proof.detail || view.lowConfidence,
                    'cf-low-confidence': view.lowConfidence
                  }"
                  :tabindex="view.proof.detail || view.lowConfidence ? 0 : undefined"
                >
                  <span class="cf-row-label">proof</span>
                  <span class="cf-row-value">{{ view.proof.total }}</span>
                  <span
                    v-if="view.proof.detail || view.lowConfidence"
                    class="bundle-tooltip"
                    role="tooltip"
                  >{{ view.proofTooltip }}</span>
                </div>
                <div
                  class="cf-row"
                  :class="{
                    'bundle-host': view.bake.hasTooltip || view.lowConfidence,
                    'cf-low-confidence': view.lowConfidence
                  }"
                  :tabindex="view.bake.hasTooltip || view.lowConfidence ? 0 : undefined"
                >
                  <span class="cf-row-label">bake</span>
                  <span class="cf-row-value">{{ view.bake.total }}</span>
                  <span
                    v-if="view.bake.hasTooltip || view.lowConfidence"
                    class="bundle-tooltip"
                    role="tooltip"
                  >{{ view.bakeTooltip }}</span>
                </div>
              </template>
            </div>

            <!-- PF-177.9 v4 — "not directly logged" badge (renamed from v3 "low confidence")
                 Entry shows recipe baseline for bake; bulk/proof unavailable. -->
            <div
              v-if="entry.bake_stats.confidence === 'low'"
              class="cf-low-badge"
              data-testid="compact-low-confidence-badge"
              tabindex="0"
              aria-label="Not directly logged"
            >
              <span aria-hidden="true">ⓘ</span>
              not directly logged
              <span class="bundle-tooltip" role="tooltip">Data was not directly logged by the user. Bake phases show recipe baseline. Bulk and proof are not available.</span>
            </div>
          </template>

          <div class="flex items-center gap-3 text-xs text-stone-400 mt-2">
            <span>{{ entry.notes.length }} notes</span>
            <span v-if="entry.photos?.length">{{ entry.photos.length }} photos</span>
            <span v-if="entry.next_time?.length">{{ entry.next_time.length }} next-time</span>
            <span v-if="entry.cost" class="font-mono">${{ entry.cost.total.toFixed(2) }} total · ${{ entry.cost.perServing.toFixed(2) }}/serving</span>
            <span
              v-if="recipeId"
              class="ml-auto flex items-center gap-1 text-stone-400 hover:text-accent transition-colors cursor-pointer"
              @click="navigateToBake($event, entry.date)"
            >
              View bake <ArrowRight class="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showExpandButton" class="text-center py-2">
      <button
        type="button"
        data-testid="cook-log-expand-button"
        class="text-xs text-stone-400 hover:text-accent hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0"
        @click="expandAll"
      >Show {{ hiddenCount }} more {{ hiddenCount === 1 ? 'bake' : 'bakes' }}</button>
    </div>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* PF-41 A2 header stats row — mirrors the StatsPage ds3-hero tile styling
   at a smaller recipe-level scale. */
.cook-log-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
  border: 1px solid var(--color-stone-200);
  background: var(--color-surface);
  margin-bottom: 1rem;
}

.cook-log-stats-tile {
  padding: 0.625rem 0.5rem;
  text-align: center;
  border-right: 1px solid var(--color-stone-200);
}

.cook-log-stats-tile:last-child {
  border-right: none;
}

.cook-log-stats-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1;
  color: var(--color-ink);
}

.cook-log-stats-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
  margin-top: 0.375rem;
}

/* ================================================
   PF-177.9 — Compact bake stats variant switcher
   Markup + styles cribbed from DemoBakeLogFlow.vue v2
   ================================================ */

.cf-variant-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.4375rem 0.625rem;
  background: var(--color-stone-50);
  border: 1px dashed var(--color-stone-300);
}

.cf-variant-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
}

.cf-variant-btn {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-ink);
  background: var(--color-surface);
  border: 2px solid var(--color-stone-300);
  padding: 0.1875rem 0.625rem;
  cursor: pointer;
  line-height: 1;
  border-radius: 0;
}

.cf-variant-btn:hover {
  border-color: var(--color-accent);
}

.cf-variant-btn-active {
  background: var(--color-accent);
  color: var(--color-stone-50);
  border-color: var(--color-accent);
}

/* --- Variant A: Tiles-only row --- */
.cf-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--color-stone-200);
  background: var(--color-surface);
}

/* 3-tile variant (bulk · proof · bake) — post HITL iteration */
.cf-tiles-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cf-tiles-inline {
  margin-top: 0.5rem;
}

.cf-tile {
  padding: 0.4375rem 0.25rem;
  text-align: center;
  border-right: 1px solid var(--color-stone-200);
  position: relative;
}

.cf-tile:last-child {
  border-right: none;
}

.cf-tile-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.15;
}

.cf-tile-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-400);
  margin-top: 0.1875rem;
}

/* --- Variant B: Pills inline --- */
.cf-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.cf-pill {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--color-ink);
  background: var(--color-stone-100);
  border: 1px solid var(--color-stone-200);
  padding: 0.125rem 0.4375rem;
  position: relative;
}

.cf-pill-label {
  font-weight: 400;
  color: var(--color-stone-500);
  text-transform: uppercase;
  font-size: 0.5625rem;
  letter-spacing: 0.04em;
  margin-right: 0.25rem;
}

/* --- Variant C: Mini table (1x3 stacked rows, post HITL iteration) --- */
.cf-minitable {
  display: grid;
  grid-template-columns: 1fr;
  border: 1px solid var(--color-stone-200);
  background: var(--color-surface);
  margin-top: 0.5rem;
}

.cf-minitable-3 {
  grid-template-columns: 1fr;
}

.cf-row {
  padding: 0.3125rem 0.625rem;
  border-bottom: 1px solid var(--color-stone-200);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  position: relative;
}

.cf-row:last-child {
  border-bottom: none;
}

.cf-row-label {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-400);
}

.cf-row-value {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.15;
}

/* --- PF-177.9 v3 — Low-confidence treatment ---
   Applied to bulk + proof elements when bake_stats.confidence === 'low'.
   Bake is protected (duration is still reliable per user carve-out). */
.cf-low-confidence {
  opacity: 0.6;
}

/* Small inline badge annotated near the compact form block for low-conf
   entries. Subtle monospace caveat styling — aligns with variant switcher
   aesthetic. Hover/focus reveals the full explanation via bundle-tooltip. */
.cf-low-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.4375rem;
  padding: 0.125rem 0.4375rem;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-500);
  background: var(--color-stone-50);
  border: 1px dashed var(--color-stone-300);
  cursor: help;
  position: relative;
  outline: none;
}

.cf-low-badge:hover,
.cf-low-badge:focus-visible {
  color: var(--color-ink);
  border-color: var(--color-accent);
}

.cf-low-badge .bundle-tooltip {
  white-space: normal;
  min-width: 14rem;
  text-align: center;
}

.cf-low-badge:hover .bundle-tooltip,
.cf-low-badge:focus-visible .bundle-tooltip {
  opacity: 1;
}

/* --- Bake process bundle hover tooltip --- */
.bundle-host {
  cursor: help;
  outline: none;
}

.bundle-host:hover,
.bundle-host:focus-visible {
  background: var(--color-stone-50);
  box-shadow: inset 0 0 0 1px var(--color-accent);
}

.bundle-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-ink);
  color: var(--color-stone-50);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-accent);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease-out;
  z-index: 10;
  text-transform: none;
  letter-spacing: 0.02em;
}

.bundle-host:hover .bundle-tooltip,
.bundle-host:focus-visible .bundle-tooltip {
  opacity: 1;
}

.bundle-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--color-accent);
}
</style>
