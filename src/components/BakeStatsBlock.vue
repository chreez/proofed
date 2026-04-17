<script setup lang="ts">
/**
 * BakeStatsBlock — Full per-bake stats block for BakeDetailView (PF-177.5).
 *
 * 6 sections, all progressive render (a section only shows when its source
 * data is present):
 *
 *   1. 3-pill header           — bulk / proof / bake hours (reuses the
 *                                Variant B compact pattern from
 *                                CookLogSection.vue / PF-177.9).
 *   2. Low-confidence callout  — only when confidence === 'low'. Explains
 *                                stats were reconstructed and fall back to
 *                                recipe defaults.
 *   3. Temperatures            — avg dough temp + bulk ambient tiles with
 *                                raw readings list.
 *   4. Stretch & Folds         — 4-col grid with dotted day-break rule.
 *   5. Aliquot Rises           — 4-col grid with rise bars + dotted
 *                                day-break rule.
 *   6. Bake Phases             — 4-col grid (STAGE / START / TEMP /
 *                                DURATION). Falls back to
 *                                bake_defaults.bake_phases when the entry
 *                                has none.
 *
 * Raw notes disclosure lives on BakeDetailView.vue (Option C), not inside
 * this component — the chart is purely about structured data.
 */
import { computed } from 'vue'
import type {
  BakeStatsBlock as BakeStatsBlockData,
  BakePhase,
  DoughTemp,
  BulkAmbientTemp,
  StretchFold,
  AliquotRise,
  ProofPhase,
  RecipeBakeDefaults
} from '@/types/recipe'

const props = defineProps<{
  bake_stats: BakeStatsBlockData
  bake_defaults?: RecipeBakeDefaults
}>()

// ============================================================
// Time helpers — time strings are "YYYY-MM-DD - HH:MM"
// ============================================================

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

function splitTime(t: string): { date: string; timeOfDay: string } {
  const parts = t.split(' - ')
  if (parts.length === 2) {
    return { date: parts[0], timeOfDay: parts[1] }
  }
  return { date: t, timeOfDay: '' }
}

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

function fmtBakeDuration(v: number | null | undefined): string {
  if (v == null || v <= 0) return '—'
  return `${v}m`
}

function fmtTemp(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v}°F`
}

// ============================================================
// Confidence flag — drives fallback + callout
// ============================================================

const isLowConfidence = computed(
  () => props.bake_stats.confidence === 'low'
)

// ============================================================
// Header pills (3): bulk / proof / bake
// Mirrors the compact variant B logic from CookLogSection.vue so the same
// source data renders the same numbers in both places.
// ============================================================

interface PillView {
  duration: string
  tooltip: string
  hasTooltip: boolean
}

// Bulk end derivation — same priority chain as CookLogSection:
//   1. explicit shape_time
//   2. proof_phases (cold_retard.start − bench_rest.duration_min)
//   3. null (caller falls back to last active bulk timestamp)
function deriveBulkEndMin(stats: BakeStatsBlockData): number | null {
  if (stats.shape_time) return timeToMin(stats.shape_time)
  const phases: ProofPhase[] = stats.proof_phases ?? []
  const coldRetard = phases.find((p) => p.type === 'cold_retard')
  const benchRest = phases.find((p) => p.type === 'bench_rest')
  if (coldRetard?.start && benchRest?.duration_min) {
    return timeToMin(coldRetard.start) - benchRest.duration_min
  }
  if (coldRetard?.start) return timeToMin(coldRetard.start)
  return null
}

function computeBulkPill(): PillView {
  if (isLowConfidence.value) {
    return {
      duration: '—',
      tooltip: 'not directly logged',
      hasTooltip: true
    }
  }
  const samples: DoughTemp[] = props.bake_stats.dough_temps ?? []
  if (samples.length === 0) {
    return { duration: '—', tooltip: '', hasTooltip: false }
  }
  const avg = samples.reduce((s, x) => s + x.temp_f, 0) / samples.length
  const avgDough = `${(Math.round(avg * 10) / 10).toFixed(1)}°F`

  // Bulk start = first dough_temp (proxy for leaven/mix time)
  const startMin = timeToMin(samples.map((x) => x.time).sort()[0])

  // Bulk end: shape_time → proof_phases derivation → last active timestamp
  const shapeEndMin = deriveBulkEndMin(props.bake_stats)
  let endMin: number
  if (shapeEndMin !== null) {
    endMin = shapeEndMin
  } else {
    const allTimes = [
      ...samples.map((x) => x.time),
      ...(props.bake_stats.stretch_folds ?? []).map((f) => f.time),
      ...(props.bake_stats.aliquot_rises ?? [])
        .filter((a) => a.stage === 'bulk')
        .map((a) => a.time)
    ].sort((a, b) => timeToMin(a) - timeToMin(b))
    endMin = timeToMin(allTimes[allTimes.length - 1])
  }

  const mins = Math.max(0, endMin - startMin)
  if (mins === 0) {
    return {
      duration: '—',
      tooltip: `avg dough: ${avgDough}`,
      hasTooltip: true
    }
  }
  return {
    duration: fmtDurationLong(mins),
    tooltip: `avg dough: ${avgDough}`,
    hasTooltip: true
  }
}

function computeProofPill(): PillView {
  if (isLowConfidence.value) {
    return {
      duration: '—',
      tooltip: 'not directly logged',
      hasTooltip: true
    }
  }
  const samples: DoughTemp[] = props.bake_stats.dough_temps ?? []
  const phases: BakePhase[] = props.bake_stats.bake_phases ?? []
  if (samples.length === 0 || phases.length === 0) {
    return { duration: '—', tooltip: '', hasTooltip: false }
  }
  const start = samples.map((x) => x.time).sort()[0]
  const oven = phases.find((p) => p.stage !== 'preheat' && p.start_time)
    ?.start_time
  if (!oven) return { duration: '—', tooltip: '', hasTooltip: false }
  const total = minutesBetween(start, oven)
  if (total <= 0) return { duration: '—', tooltip: '', hasTooltip: false }

  // Tooltip: bulk / retard breakdown using shape_time derivation
  let bulkEndMinProof = deriveBulkEndMin(props.bake_stats)
  // Fallback: last active bulk timestamp (for entries without shape data)
  if (bulkEndMinProof === null) {
    const folds: StretchFold[] = props.bake_stats.stretch_folds ?? []
    const rises: AliquotRise[] = props.bake_stats.aliquot_rises ?? []
    const allActiveTimes = [
      ...samples.map((x) => x.time),
      ...folds.map((f) => f.time),
      ...rises.filter((r) => r.stage === 'bulk').map((r) => r.time)
    ].sort((a, b) => timeToMin(a) - timeToMin(b))
    if (allActiveTimes.length >= 2) {
      bulkEndMinProof = timeToMin(allActiveTimes[allActiveTimes.length - 1])
    }
  }
  let tooltip = `total proof ${fmtDurationLong(total)}`
  if (bulkEndMinProof !== null) {
    const bulkMin = Math.max(0, bulkEndMinProof - timeToMin(start))
    const retardMin = Math.max(0, timeToMin(oven) - bulkEndMinProof)
    if (bulkMin > 0 && retardMin > 0) {
      tooltip = `bulk ${fmtDurationLong(bulkMin)} · retard ${fmtDurationLong(retardMin)}`
    }
  }
  return { duration: fmtDurationLong(total), tooltip, hasTooltip: true }
}

function computeBakePill(): PillView {
  // For low-confidence, derive from recipe defaults. For everything else,
  // use the entry's own bake_phases.
  if (isLowConfidence.value) {
    const fallback = props.bake_defaults?.bake_phases ?? []
    if (fallback.length === 0) {
      return {
        duration: '—',
        tooltip: 'not directly logged',
        hasTooltip: true
      }
    }
    const totalMin = fallback
      .filter((p) => p.stage === 'covered' || p.stage === 'uncovered')
      .reduce((s, p) => s + p.duration_min, 0)
    const tempParts: string[] = []
    const order: Array<'preheat' | 'covered' | 'uncovered'> = [
      'preheat',
      'covered',
      'uncovered'
    ]
    for (const stage of order) {
      const p = fallback.find((x) => x.stage === stage)
      if (p) tempParts.push(`${stage} ${fmtTemp(p.temp_f)}`)
    }
    return {
      duration: totalMin > 0 ? fmtBakeDuration(totalMin) : '—',
      tooltip: `${tempParts.join(' · ')} (recipe baseline)`,
      hasTooltip: true
    }
  }
  const phases: BakePhase[] = props.bake_stats.bake_phases ?? []
  if (phases.length === 0) {
    return { duration: '—', tooltip: '', hasTooltip: false }
  }
  const totalMin = phases
    .filter((p) => p.stage === 'covered' || p.stage === 'uncovered')
    .reduce((s, p) => s + p.duration_min, 0)
  const tempParts: string[] = []
  const order: Array<'preheat' | 'covered' | 'uncovered'> = [
    'preheat',
    'covered',
    'uncovered'
  ]
  for (const stage of order) {
    const p = phases.find((x) => x.stage === stage)
    if (p) tempParts.push(`${stage} ${fmtTemp(p.temp_f)}`)
  }
  return {
    duration: totalMin > 0 ? fmtBakeDuration(totalMin) : '—',
    tooltip: tempParts.join(' · '),
    hasTooltip: tempParts.length > 0
  }
}

const bulkPill = computed(() => computeBulkPill())
const proofPill = computed(() => computeProofPill())
const bakePill = computed(() => computeBakePill())

// ============================================================
// Temperatures section — avg dough temp + bulk ambient
// ============================================================

interface DoughStat {
  avg: string
  windowHours: number | null
  samples: DoughTemp[]
}

const doughStat = computed<DoughStat>(() => {
  const samples: DoughTemp[] = props.bake_stats.dough_temps ?? []
  if (samples.length === 0) {
    return { avg: '—', windowHours: null, samples: [] }
  }
  const avg = samples.reduce((s, x) => s + x.temp_f, 0) / samples.length
  const avgStr = `${(Math.round(avg * 10) / 10).toFixed(1)}°F`
  let windowHours: number | null = null
  if (samples.length > 1) {
    const sorted = [...samples.map((s) => s.time)].sort()
    const mins = minutesBetween(sorted[0], sorted[sorted.length - 1])
    if (mins > 0) windowHours = Math.round(mins / 60)
  }
  return { avg: avgStr, windowHours, samples }
})

const ambientStat = computed<{
  avg: string
  readings: BulkAmbientTemp[]
}>(() => {
  const readings: BulkAmbientTemp[] = props.bake_stats.bulk_ambient_temps ?? []
  if (readings.length === 0) return { avg: '—', readings: [] }
  const avg = readings.reduce((s, x) => s + x.temp_f, 0) / readings.length
  return { avg: `${Math.round(avg)}°F`, readings }
})

const showTemperatures = computed(() => {
  return (
    (props.bake_stats.dough_temps?.length ?? 0) > 0 ||
    (props.bake_stats.bulk_ambient_temps?.length ?? 0) > 0
  )
})

// ============================================================
// Stretch & Folds — 4-col grid with day-break rule
// ============================================================

interface SfRow {
  date: string
  timeOfDay: string
  label: string
  note?: string
}

const sfRows = computed<SfRow[]>(() => {
  const entries: StretchFold[] = props.bake_stats.stretch_folds ?? []
  return entries.map((e, i) => {
    const { date, timeOfDay } = splitTime(e.time)
    return {
      date,
      timeOfDay,
      label: `${e.type.replace('_', ' ')} #${i + 1}`,
      note: e.note
    }
  })
})

const showStretchFolds = computed(() => sfRows.value.length > 0)

// ============================================================
// Aliquot Rises — 4-col grid with rise bars + day-break rule
// ============================================================

interface AliquotRow {
  date: string
  timeOfDay: string
  rise_pct: number
  stage: AliquotRise['stage']
  note?: string
}

const aliquotRows = computed<AliquotRow[]>(() => {
  const entries: AliquotRise[] = props.bake_stats.aliquot_rises ?? []
  return entries.map((e) => {
    const { date, timeOfDay } = splitTime(e.time)
    return {
      date,
      timeOfDay,
      rise_pct: e.rise_pct,
      stage: e.stage,
      note: e.note
    }
  })
})

const showAliquotRises = computed(() => aliquotRows.value.length > 0)

// ============================================================
// Bake Phases — 4-col grid, falls back to recipe bake_defaults
// ============================================================

interface BakeRow {
  stage: string
  startTime?: string
  temp_f: number
  duration_min: number
}

const bakeRows = computed<BakeRow[]>(() => {
  const entryPhases = props.bake_stats.bake_phases ?? []
  const phases: BakePhase[] =
    entryPhases.length > 0
      ? entryPhases
      : (props.bake_defaults?.bake_phases ?? [])
  return phases.map((p) => ({
    stage: p.stage,
    startTime: p.start_time ? splitTime(p.start_time).timeOfDay : undefined,
    temp_f: p.temp_f,
    duration_min: p.duration_min
  }))
})

const bakePhasesFromFallback = computed(() => {
  return (
    (props.bake_stats.bake_phases?.length ?? 0) === 0 &&
    (props.bake_defaults?.bake_phases?.length ?? 0) > 0
  )
})

const showBakePhases = computed(() => bakeRows.value.length > 0)
</script>

<template>
  <section class="bsb" data-testid="bake-stats-block">
    <!-- 1. Header pills: bulk / proof / bake -->
    <div
      class="bsb-pills"
      :class="{ 'bsb-low-conf': isLowConfidence }"
      data-testid="bsb-pills"
    >
      <span
        class="bsb-pill"
        :class="{ 'bundle-host': bulkPill.hasTooltip }"
        :tabindex="bulkPill.hasTooltip ? 0 : undefined"
        data-testid="bsb-pill-bulk"
      >
        <span class="bsb-pill-label">bulk</span>
        {{ bulkPill.duration }}
        <span
          v-if="bulkPill.hasTooltip"
          class="bsb-tooltip"
          role="tooltip"
        >{{ bulkPill.tooltip }}</span>
      </span>
      <span
        class="bsb-pill"
        :class="{ 'bundle-host': proofPill.hasTooltip }"
        :tabindex="proofPill.hasTooltip ? 0 : undefined"
        data-testid="bsb-pill-proof"
      >
        <span class="bsb-pill-label">proof</span>
        {{ proofPill.duration }}
        <span
          v-if="proofPill.hasTooltip"
          class="bsb-tooltip"
          role="tooltip"
        >{{ proofPill.tooltip }}</span>
      </span>
      <span
        class="bsb-pill"
        :class="{ 'bundle-host': bakePill.hasTooltip }"
        :tabindex="bakePill.hasTooltip ? 0 : undefined"
        data-testid="bsb-pill-bake"
      >
        <span class="bsb-pill-label">bake</span>
        {{ bakePill.duration }}
        <span
          v-if="bakePill.hasTooltip"
          class="bsb-tooltip"
          role="tooltip"
        >{{ bakePill.tooltip }}</span>
      </span>
    </div>

    <!-- 2. Low-confidence callout -->
    <div
      v-if="isLowConfidence"
      class="bsb-callout"
      data-testid="bsb-low-conf-callout"
    >
      <span class="bsb-callout-label">reconstructed</span>
      <p class="bsb-callout-body">
        These stats weren't logged in real time — they've been recalled
        from memory. Bake phases fall back to the recipe's current
        baseline; bulk and proof times are not directly comparable to
        logged bakes.
      </p>
    </div>

    <!-- 3. Temperatures -->
    <div
      v-if="showTemperatures"
      class="bsb-block"
      data-testid="bsb-temps"
    >
      <h4 class="bsb-block-heading">Temperatures</h4>
      <div class="bsb-tiles">
        <div class="bsb-tile">
          <span class="bsb-tile-value">{{ doughStat.avg }}</span>
          <span class="bsb-tile-label">avg dough</span>
          <span
            v-if="doughStat.windowHours != null"
            class="bsb-tile-label bsb-tile-sublabel"
          >over {{ doughStat.windowHours }}h</span>
        </div>
        <div class="bsb-tile">
          <span class="bsb-tile-value">{{ ambientStat.avg }}</span>
          <span class="bsb-tile-label">bulk ambient</span>
        </div>
      </div>

      <div
        v-if="doughStat.samples.length > 0"
        class="bsb-readings"
        data-testid="bsb-dough-readings"
      >
        <span class="bsb-readings-label">dough readings</span>
        <div class="bsb-readings-list">
          <span
            v-for="(s, i) in doughStat.samples"
            :key="'dt-' + i"
            class="bsb-reading"
          >
            <span class="bsb-reading-time">{{ splitTime(s.time).timeOfDay }}</span>
            <span class="bsb-reading-val">{{ s.temp_f }}°F</span>
          </span>
        </div>
      </div>

      <div
        v-if="ambientStat.readings.length > 0"
        class="bsb-readings"
        data-testid="bsb-ambient-readings"
      >
        <span class="bsb-readings-label">ambient readings</span>
        <div class="bsb-readings-list">
          <span
            v-for="(s, i) in ambientStat.readings"
            :key="'amb-' + i"
            class="bsb-reading"
          >
            <span class="bsb-reading-time">{{ s.date }}</span>
            <span class="bsb-reading-val">{{ s.temp_f }}°F</span>
            <span v-if="s.note" class="bsb-reading-note">{{ s.note }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 4. Stretch & Folds -->
    <div
      v-if="showStretchFolds"
      class="bsb-block"
      data-testid="bsb-stretch-folds"
    >
      <h4 class="bsb-block-heading">Stretch &amp; Folds</h4>
      <div class="bsb-grid">
        <template v-for="(row, i) in sfRows" :key="'sf-' + i">
          <div
            v-if="i > 0 && sfRows[i - 1].date !== row.date"
            class="bsb-day-break"
            aria-hidden="true"
          />
          <div class="bsb-row">
            <span class="bsb-row-date">
              {{ i === 0 || sfRows[i - 1].date !== row.date ? row.date : '' }}
            </span>
            <span class="bsb-row-time">{{ row.timeOfDay }}</span>
            <span class="bsb-row-label">{{ row.label }}</span>
            <span class="bsb-row-note">{{ row.note ?? '' }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 5. Aliquot Rises -->
    <div
      v-if="showAliquotRises"
      class="bsb-block"
      data-testid="bsb-aliquot-rises"
    >
      <h4 class="bsb-block-heading">Aliquot Rises</h4>
      <div class="bsb-aliquot">
        <template v-for="(row, i) in aliquotRows" :key="'al-' + i">
          <div
            v-if="i > 0 && aliquotRows[i - 1].date !== row.date"
            class="bsb-day-break"
            aria-hidden="true"
          />
          <div class="bsb-aliquot-row">
            <span class="bsb-row-date">
              {{ i === 0 || aliquotRows[i - 1].date !== row.date ? row.date : '' }}
            </span>
            <span class="bsb-row-time">{{ row.timeOfDay }}</span>
            <span class="bsb-aliquot-bar-wrap">
              <span
                class="bsb-aliquot-bar"
                :style="{ width: Math.min(row.rise_pct, 100) + '%' }"
              />
            </span>
            <span class="bsb-aliquot-pct">{{ row.rise_pct }}%</span>
            <span
              v-if="row.note"
              class="bsb-aliquot-note"
            >{{ row.note }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 6. Bake Phases (falls back to recipe defaults) -->
    <div
      v-if="showBakePhases"
      class="bsb-block"
      data-testid="bsb-bake-phases"
    >
      <h4 class="bsb-block-heading">
        Bake Phases
        <span
          v-if="bakePhasesFromFallback"
          class="bsb-block-subheading"
        >(recipe baseline)</span>
      </h4>
      <div class="bsb-grid">
        <div
          v-for="(row, i) in bakeRows"
          :key="'bk-' + i"
          class="bsb-bake-row"
        >
          <span class="bsb-row-label bsb-bake-stage">{{ row.stage }}</span>
          <span class="bsb-row-time">{{ row.startTime ?? '' }}</span>
          <span class="bsb-row-temp">{{ fmtTemp(row.temp_f) }}</span>
          <span class="bsb-row-temp">{{ fmtBakeDuration(row.duration_min) }}</span>
        </div>
      </div>
    </div>

  </section>
</template>

<style scoped>
/* ============================================================
   BakeStatsBlock — warm stone palette, monospace accents.
   Layout mirrors DemoBakeStatsShapes vc-* classes and the
   CookLogSection cf-pills pattern (PF-177.9) so numbers line up.
   ============================================================ */

.bsb {
  border: 2px solid var(--color-stone-200);
  background: var(--color-surface);
  padding: 0.875rem 1rem 1rem;
  margin-bottom: 1.5rem;
}

/* --- Pills (header) --- */
.bsb-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.bsb-low-conf {
  opacity: 0.75;
}

.bsb-pill {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-ink);
  background: var(--color-stone-100);
  border: 1px solid var(--color-stone-200);
  padding: 0.1875rem 0.5rem;
  position: relative;
}

.bsb-pill-label {
  font-weight: 400;
  color: var(--color-stone-500);
  text-transform: uppercase;
  font-size: 0.625rem;
  letter-spacing: 0.04em;
  margin-right: 0.3125rem;
}

/* Tooltip bubble reused for pill hover/focus */
.bundle-host {
  cursor: help;
}

.bundle-host .bsb-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-ink);
  color: var(--color-stone-50);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 400;
  padding: 0.375rem 0.5rem;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}

.bundle-host:hover .bsb-tooltip,
.bundle-host:focus .bsb-tooltip {
  display: block;
}

/* --- Low-confidence callout --- */
.bsb-callout {
  padding: 0.5rem 0.75rem;
  background: var(--color-stone-50);
  border-left: 2px solid var(--color-accent);
  margin-bottom: 0.75rem;
}

.bsb-callout-label {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-accent);
  margin-bottom: 0.25rem;
}

.bsb-callout-body {
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-stone-600);
  margin: 0;
  font-style: italic;
}

/* --- Block wrapper (temps / S&F / rises / phases) --- */
.bsb-block {
  margin-top: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: var(--color-stone-50);
  border-left: 2px solid var(--color-stone-300);
}

.bsb-block-heading {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
  margin: 0 0 0.375rem;
}

.bsb-block-subheading {
  font-weight: 400;
  font-style: italic;
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-stone-400);
  margin-left: 0.375rem;
}

/* --- Temperatures tiles --- */
.bsb-tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid var(--color-stone-200);
  background: var(--color-surface);
  margin-bottom: 0.625rem;
}

.bsb-tile {
  padding: 0.625rem 0.5rem;
  text-align: center;
  border-right: 1px solid var(--color-stone-200);
}

.bsb-tile:last-child {
  border-right: none;
}

.bsb-tile-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.2;
}

.bsb-tile-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-400);
  margin-top: 0.1875rem;
}

.bsb-tile-sublabel {
  margin-top: 0.0625rem;
  color: var(--color-stone-500);
}

.bsb-readings {
  margin-top: 0.5rem;
}

.bsb-readings-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-400);
  margin-bottom: 0.25rem;
}

.bsb-readings-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.bsb-reading {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  background: var(--color-surface);
  border: 1px solid var(--color-stone-200);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
}

.bsb-reading-time {
  color: var(--color-stone-500);
}

.bsb-reading-val {
  color: var(--color-ink);
  font-weight: 600;
}

.bsb-reading-note {
  color: var(--color-stone-500);
  font-style: italic;
}

/* --- S&F / Bake phase grid --- */
.bsb-grid {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bsb-row,
.bsb-bake-row {
  display: grid;
  grid-template-columns: 5.5rem 3.25rem 1fr auto;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
}

.bsb-row-date,
.bsb-row-time {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-500);
  white-space: nowrap;
}

.bsb-row-time {
  text-align: right;
}

.bsb-row-label {
  color: var(--color-stone-700);
}

.bsb-bake-stage {
  text-transform: uppercase;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  color: var(--color-ink);
}

.bsb-row-note,
.bsb-row-temp {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-ink);
  font-style: italic;
  text-align: right;
}

.bsb-row-temp {
  font-style: normal;
}

.bsb-day-break {
  border-top: 1px dotted var(--color-stone-300);
  margin: 0.375rem 0 0.25rem;
}

/* --- Aliquot rows --- */
.bsb-aliquot {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.bsb-aliquot-row {
  display: grid;
  grid-template-columns: 5.5rem 3.25rem 1fr 3rem;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
}

.bsb-aliquot-bar-wrap {
  height: 8px;
  background: var(--color-stone-100);
  border: 1px solid var(--color-stone-200);
  position: relative;
  overflow: hidden;
}

.bsb-aliquot-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--color-accent);
}

.bsb-aliquot-pct {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-ink);
  text-align: right;
}

.bsb-aliquot-note {
  grid-column: 1 / -1;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  color: var(--color-stone-500);
  padding-left: 9.75rem;
  margin-top: -0.125rem;
}
</style>
