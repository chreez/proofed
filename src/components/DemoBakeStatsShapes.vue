<script setup lang="ts">
/**
 * DemoBakeStatsShapes — PF-177.2 throwaway grooming spike
 *
 * Two unrelated decisions for the PF-177 epic rendered on one page:
 *
 *   1. Raw notes disclosure pattern — does the user want a verbatim paste of
 *      their bake log session preserved alongside structured bake_stats and
 *      curated notes[] prose? Section 1 shows what that looks like.
 *
 *   2. Bake params schema shape — three candidate interfaces for how the
 *      bake_stats data actually lives in the CookLogEntry JSON:
 *        A. Flat scalars + arrays (multi-phase forces bake_phases[])
 *        B. Grouped by phase (mix → bulk → shape → bake.{preheat,covered,uncovered} → cool)
 *        C. Unified chronological timeline of events
 *      Section 2 renders the same simple-sourdough 2026-04-05 bake three
 *      ways AND shows the underlying TS interface + JSON instance + parsing
 *      notes for each, so the user can see what the actual data shape
 *      difference looks like (the rendered output is identical on purpose).
 *      Also shows a partial-data Option B to demonstrate that "missing
 *      blocks don't render" (progressive render).
 *
 * NOTE: This file is disposable — delete after PF-177 epic lands.
 */
import { ref } from 'vue'

// ============================================================
// SCHEMA SHAPE INTERFACES (the whole point of this demo)
// ============================================================

interface StretchFoldEntry {
  time: string
  type: 'stretch_fold' | 'coil' | 'lamination'
  note?: string
}

interface AliquotEntry {
  time: string
  rise_pct: number
  stage: 'bulk' | 'preshape' | 'final'
  note?: string
}

interface BakePhaseEntry {
  stage: 'preheat' | 'covered' | 'uncovered'
  temp_f: number
  duration_min: number
  start_time?: string
}

interface DoughTempEntry {
  time: string
  temp_f: number
}

// --- Option A — Flat scalars + arrays ---
interface OptionA {
  bulk_ambient_temp_f?: number
  dough_temps?: DoughTempEntry[]
  bake_phases?: BakePhaseEntry[]
  stretch_folds?: StretchFoldEntry[]
  aliquot_rises?: AliquotEntry[]
}

// --- Option B — Grouped by phase ---
interface OptionB {
  mix?: { fermentolyse_min?: number }
  bulk?: {
    ambient_temp_f?: number
    duration_min?: number
    dough_temps?: DoughTempEntry[]
    stretch_folds?: StretchFoldEntry[]
    aliquot_rises?: Array<{ time: string; rise_pct: number; note?: string }>
  }
  shape?: { preshape_time?: string; final_shape_time?: string; bench_rest_min?: number }
  bake?: {
    preheat?: { temp_f: number; duration_min: number; start_time?: string }
    covered?: { temp_f: number; duration_min: number; start_time?: string }
    uncovered?: { temp_f: number; duration_min: number; start_time?: string }
  }
  cool?: { duration_min?: number }
}

// --- Option C — Unified chronological timeline ---
type BakeEventType =
  | 'mix'
  | 'fermentolyse'
  | 'stretch_fold'
  | 'aliquot_check'
  | 'preshape'
  | 'final_shape'
  | 'preheat_start'
  | 'bake_covered'
  | 'bake_uncovered'
  | 'bake_end'
  | 'cool'

interface BakeEvent {
  time: string
  type: BakeEventType
  data?: {
    dough_temp_f?: number
    ambient_temp_f?: number
    rise_pct?: number
    bake_temp_f?: number
  }
  note?: string
}

interface OptionC {
  events: BakeEvent[]
}

// ============================================================
// HARDCODED DATA — simple-sourdough 2026-04-05 overproofed bake
// Now with multi-phase bake (preheat / covered / uncovered)
// ============================================================

const dataA: OptionA = {
  bulk_ambient_temp_f: 68,
  dough_temps: [
    { time: '2026-04-04 - 21:42', temp_f: 76 },
    { time: '2026-04-04 - 23:38', temp_f: 75 },
    { time: '2026-04-05 - 07:30', temp_f: 68 },
    { time: '2026-04-05 - 13:00', temp_f: 71 }
  ],
  bake_phases: [
    { stage: 'preheat', temp_f: 500, duration_min: 45, start_time: '2026-04-05 - 13:15' },
    { stage: 'covered', temp_f: 500, duration_min: 20, start_time: '2026-04-05 - 14:00' },
    { stage: 'uncovered', temp_f: 475, duration_min: 25, start_time: '2026-04-05 - 14:20' }
  ],
  stretch_folds: [
    { time: '2026-04-04 - 22:15', type: 'stretch_fold' },
    { time: '2026-04-04 - 22:42', type: 'stretch_fold', note: 'feeling tacky' },
    { time: '2026-04-04 - 23:10', type: 'stretch_fold', note: 'smoother' },
    { time: '2026-04-04 - 23:38', type: 'stretch_fold', note: 'strong gluten' }
  ],
  aliquot_rises: [
    { time: '2026-04-05 - 07:30', rise_pct: 60, stage: 'bulk' },
    { time: '2026-04-05 - 09:15', rise_pct: 75, stage: 'bulk' },
    { time: '2026-04-05 - 11:00', rise_pct: 85, stage: 'bulk', note: 'thinking of pulling' },
    { time: '2026-04-05 - 13:00', rise_pct: 100, stage: 'bulk', note: 'overproofed' }
  ]
}

const dataB: OptionB = {
  mix: { fermentolyse_min: 27 },
  bulk: {
    ambient_temp_f: 68,
    duration_min: 13 * 60 + 55,
    dough_temps: [
      { time: '2026-04-04 - 21:42', temp_f: 76 },
      { time: '2026-04-04 - 23:38', temp_f: 75 },
      { time: '2026-04-05 - 07:30', temp_f: 68 },
      { time: '2026-04-05 - 13:00', temp_f: 71 }
    ],
    stretch_folds: [
      { time: '2026-04-04 - 22:15', type: 'stretch_fold' },
      { time: '2026-04-04 - 22:42', type: 'stretch_fold', note: 'feeling tacky' },
      { time: '2026-04-04 - 23:10', type: 'stretch_fold', note: 'smoother' },
      { time: '2026-04-04 - 23:38', type: 'stretch_fold', note: 'strong gluten' }
    ],
    aliquot_rises: [
      { time: '2026-04-05 - 07:30', rise_pct: 60 },
      { time: '2026-04-05 - 09:15', rise_pct: 75 },
      { time: '2026-04-05 - 11:00', rise_pct: 85, note: 'thinking of pulling' },
      { time: '2026-04-05 - 13:00', rise_pct: 100, note: 'overproofed' }
    ]
  },
  shape: {
    preshape_time: '2026-04-05 - 13:15',
    final_shape_time: '2026-04-05 - 13:35',
    bench_rest_min: 20
  },
  bake: {
    preheat: { temp_f: 500, duration_min: 45, start_time: '2026-04-05 - 13:15' },
    covered: { temp_f: 500, duration_min: 20, start_time: '2026-04-05 - 14:00' },
    uncovered: { temp_f: 475, duration_min: 25, start_time: '2026-04-05 - 14:20' }
  },
  cool: { duration_min: 60 }
}

const dataC: OptionC = {
  events: [
    { time: '2026-04-04 - 21:15', type: 'mix', note: 'flour 500g / water 350g (70% hydration)' },
    { time: '2026-04-04 - 21:42', type: 'fermentolyse', data: { dough_temp_f: 76 }, note: 'added levain + salt' },
    { time: '2026-04-04 - 22:15', type: 'stretch_fold' },
    { time: '2026-04-04 - 22:42', type: 'stretch_fold', note: 'feeling tacky' },
    { time: '2026-04-04 - 23:10', type: 'stretch_fold', note: 'smoother' },
    { time: '2026-04-04 - 23:38', type: 'stretch_fold', data: { dough_temp_f: 75 }, note: 'strong gluten, after final S&F' },
    { time: '2026-04-05 - 00:05', type: 'stretch_fold', data: { ambient_temp_f: 68 }, note: 'into fridge — cold bulk' },
    { time: '2026-04-05 - 07:30', type: 'aliquot_check', data: { rise_pct: 60, dough_temp_f: 68 }, note: 'cold bulk morning check' },
    { time: '2026-04-05 - 09:15', type: 'aliquot_check', data: { rise_pct: 75 } },
    { time: '2026-04-05 - 11:00', type: 'aliquot_check', data: { rise_pct: 85 }, note: 'thinking of pulling' },
    { time: '2026-04-05 - 13:00', type: 'aliquot_check', data: { rise_pct: 100, dough_temp_f: 71 }, note: 'overproofed, warming up' },
    { time: '2026-04-05 - 13:15', type: 'preshape', note: 'bench rest 20m' },
    { time: '2026-04-05 - 13:15', type: 'preheat_start', data: { bake_temp_f: 500 }, note: 'Dutch oven preheat' },
    { time: '2026-04-05 - 13:35', type: 'final_shape', note: 'into banneton' },
    { time: '2026-04-05 - 14:00', type: 'bake_covered', data: { bake_temp_f: 500 }, note: 'lid on, max steam' },
    { time: '2026-04-05 - 14:20', type: 'bake_uncovered', data: { bake_temp_f: 475 }, note: 'lid off, browning' },
    { time: '2026-04-05 - 14:45', type: 'bake_end', note: 'dark crust, good oven spring' },
    { time: '2026-04-05 - 15:45', type: 'cool', note: 'sliced' }
  ]
}

// Partial-data demo — Option B with bulk removed, only mix + bake.preheat populated.
// Demonstrates that missing sub-phases of bake also progressively don't render,
// and that the avg dough temp tile gracefully shows '—' when dough_temps is absent.
const dataBPartial: OptionB = {
  mix: { fermentolyse_min: 27 },
  bake: {
    preheat: { temp_f: 500, duration_min: 45, start_time: '2026-04-05 - 13:15' }
  }
}

// ============================================================
// RAW NOTES STRING (Section 1 disclosure)
// ============================================================

const rawNotes = `2026-04-04
9:15pm — mix done, autolyse start, flour 500g, water 350g (70% hydration)
9:42pm — fermentolyse done, added levain + salt, dough 76°F
10:15pm — S&F 1
10:42pm — S&F 2, feeling tacky
11:10pm — S&F 3, smoother
11:38pm — S&F 4 final, strong gluten
12:05am — into fridge for cold bulk, ambient 68°F

2026-04-05
7:30am — aliquot check ~60% rise
9:15am — ~75%
11:00am — ~85%, thinking of pulling soon
1:00pm — ~100% rise, overproofed, pulling now
1:15pm — preshape, bench rest 20min, Dutch oven preheat 500°F
1:35pm — final shape, into banneton
1:50pm — straight to oven (skipping second rise)
2:00pm — bake start, Dutch oven 500°F covered
2:20pm — lid off, dropped to 475°F
2:45pm — pulled, dark crust, good oven spring
3:45pm — cool done, sliced`

const showRaw = ref(false)

// ============================================================
// RENDER HELPERS — split "YYYY-MM-DD - HH:MM" into date + time
// ============================================================

interface RenderRow {
  date: string
  timeOfDay: string
  label: string
  note?: string
}

interface RenderAliquotRow {
  date: string
  timeOfDay: string
  rise_pct: number
  note?: string
}

interface RenderBakeRow {
  stage: string
  startTime?: string
  temp_f: number
  duration_min: number
}

function splitTime(t: string): { date: string; timeOfDay: string } {
  const parts = t.split(' - ')
  if (parts.length === 2) {
    return { date: parts[0], timeOfDay: parts[1] }
  }
  return { date: t, timeOfDay: '' }
}

function sfRowsFrom(entries: StretchFoldEntry[] | undefined): RenderRow[] {
  if (!entries) return []
  return entries.map((e, i) => {
    const { date, timeOfDay } = splitTime(e.time)
    return {
      date,
      timeOfDay,
      label: `${e.type.replace('_', ' ')} #${i + 1}`,
      note: e.note
    }
  })
}

function aliquotRowsFromA(entries: AliquotEntry[] | undefined): RenderAliquotRow[] {
  if (!entries) return []
  return entries.map((e) => {
    const { date, timeOfDay } = splitTime(e.time)
    return { date, timeOfDay, rise_pct: e.rise_pct, note: e.note }
  })
}

function aliquotRowsFromB(
  entries: Array<{ time: string; rise_pct: number; note?: string }> | undefined
): RenderAliquotRow[] {
  if (!entries) return []
  return entries.map((e) => {
    const { date, timeOfDay } = splitTime(e.time)
    return { date, timeOfDay, rise_pct: e.rise_pct, note: e.note }
  })
}

// Bake phase row helpers — one per shape
function bakeRowsFromA(d: OptionA): RenderBakeRow[] {
  if (!d.bake_phases) return []
  return d.bake_phases.map((p) => {
    const startTime = p.start_time ? splitTime(p.start_time).timeOfDay : undefined
    return { stage: p.stage, startTime, temp_f: p.temp_f, duration_min: p.duration_min }
  })
}

function bakeRowsFromB(d: OptionB): RenderBakeRow[] {
  if (!d.bake) return []
  const rows: RenderBakeRow[] = []
  const order: Array<keyof NonNullable<OptionB['bake']>> = ['preheat', 'covered', 'uncovered']
  for (const k of order) {
    const phase = d.bake[k]
    if (phase) {
      const startTime = phase.start_time ? splitTime(phase.start_time).timeOfDay : undefined
      rows.push({ stage: k, startTime, temp_f: phase.temp_f, duration_min: phase.duration_min })
    }
  }
  return rows
}

function bakeRowsFromC(d: OptionC): RenderBakeRow[] {
  // Walk events, find preheat_start / bake_covered / bake_uncovered, look ahead
  // for next phase or bake_end to compute duration_min.
  const phaseTypes: BakeEventType[] = ['preheat_start', 'bake_covered', 'bake_uncovered']
  const stageLabel: Record<string, string> = {
    preheat_start: 'preheat',
    bake_covered: 'covered',
    bake_uncovered: 'uncovered'
  }
  const sentinelTypes: BakeEventType[] = [...phaseTypes, 'bake_end']
  const indexed = d.events.map((e, i) => ({ e, i }))
  const phaseEvents = indexed.filter((x) => phaseTypes.includes(x.e.type))
  const rows: RenderBakeRow[] = []
  for (const { e, i } of phaseEvents) {
    // Find next sentinel after i
    const next = indexed.slice(i + 1).find((x) => sentinelTypes.includes(x.e.type))
    const duration = next ? minutesBetween(e.time, next.e.time) : 0
    const startTime = splitTime(e.time).timeOfDay
    rows.push({
      stage: stageLabel[e.type] ?? e.type,
      startTime,
      temp_f: e.data?.bake_temp_f ?? 0,
      duration_min: duration
    })
  }
  return rows
}

function minutesBetween(a: string, b: string): number {
  // a/b are "YYYY-MM-DD - HH:MM"
  const toMin = (t: string): number => {
    const [d, hm] = t.split(' - ')
    if (!d || !hm) return 0
    const [y, mo, da] = d.split('-').map(Number)
    const [h, m] = hm.split(':').map(Number)
    // Use UTC to dodge DST. We just need a delta in minutes.
    return Date.UTC(y, mo - 1, da, h, m) / 60000
  }
  return toMin(b) - toMin(a)
}

// Tiles: avg dough temp + window / bulk ambient / bake phases count / total bake time
interface TilesData {
  avg_dough_temp_f: number | null
  avg_dough_window_h: number | null
  bulk_ambient_temp_f?: number
  bake_phases_count?: number
  total_bake_min?: number
}

interface DoughTempStat {
  avg: number | null
  hours: number | null
}

// Shared computation: avg + span hours from a list of dough temp samples.
function computeAvgDoughTemp(samples: DoughTempEntry[]): DoughTempStat {
  if (samples.length === 0) return { avg: null, hours: null }
  const sum = samples.reduce((s, x) => s + x.temp_f, 0)
  const avg = Math.round(sum / samples.length)
  if (samples.length === 1) return { avg, hours: null }
  const times = samples.map((x) => x.time)
  const sorted = [...times].sort()
  const minutes = minutesBetween(sorted[0], sorted[sorted.length - 1])
  const hours = Math.round(minutes / 60)
  return { avg, hours }
}

// One helper per option — each walks its shape differently to surface the
// schema difference at the parsing layer.
function avgDoughTempFromA(data: OptionA): DoughTempStat {
  return computeAvgDoughTemp(data.dough_temps ?? [])
}

function avgDoughTempFromB(data: OptionB): DoughTempStat {
  return computeAvgDoughTemp(data.bulk?.dough_temps ?? [])
}

function avgDoughTempFromC(data: OptionC): DoughTempStat {
  const samples: DoughTempEntry[] = []
  for (const e of data.events) {
    if (e.data?.dough_temp_f != null) {
      samples.push({ time: e.time, temp_f: e.data.dough_temp_f })
    }
  }
  return computeAvgDoughTemp(samples)
}

function tilesFromBakeRows(
  doughStat: DoughTempStat,
  bulkAmbient: number | undefined,
  bakeRows: RenderBakeRow[]
): TilesData {
  const tiles: TilesData = {
    avg_dough_temp_f: doughStat.avg,
    avg_dough_window_h: doughStat.hours,
    bulk_ambient_temp_f: bulkAmbient
  }
  if (bakeRows.length > 0) {
    tiles.bake_phases_count = bakeRows.length
    tiles.total_bake_min = bakeRows.reduce((s, r) => s + r.duration_min, 0)
  }
  return tiles
}

function tilesFromA(d: OptionA): TilesData {
  return tilesFromBakeRows(avgDoughTempFromA(d), d.bulk_ambient_temp_f, bakeRowsFromA(d))
}

function tilesFromB(d: OptionB): TilesData {
  return tilesFromBakeRows(avgDoughTempFromB(d), d.bulk?.ambient_temp_f, bakeRowsFromB(d))
}

function tilesFromC(d: OptionC): TilesData {
  let bulkAmbient: number | undefined
  for (const e of d.events) {
    if (e.data?.ambient_temp_f != null && bulkAmbient == null) bulkAmbient = e.data.ambient_temp_f
  }
  return tilesFromBakeRows(avgDoughTempFromC(d), bulkAmbient, bakeRowsFromC(d))
}

function sfRowsFromC(d: OptionC): RenderRow[] {
  const sfEvents = d.events.filter((e) => e.type === 'stretch_fold')
  return sfEvents.map((e, i) => {
    const { date, timeOfDay } = splitTime(e.time)
    return { date, timeOfDay, label: `stretch fold #${i + 1}`, note: e.note }
  })
}

function aliquotRowsFromC(d: OptionC): RenderAliquotRow[] {
  const aliquotEvents = d.events.filter((e) => e.type === 'aliquot_check')
  return aliquotEvents.map((e) => {
    const { date, timeOfDay } = splitTime(e.time)
    return {
      date,
      timeOfDay,
      rise_pct: e.data?.rise_pct ?? 0,
      note: e.note
    }
  })
}

// ============================================================
// PRECOMPUTED RENDER DATA (keeps template simple)
// ============================================================

interface SourcePanel {
  interfaceTs: string
  jsonInstance: string
  parsingNote: string
}

interface ShapeBlock {
  key: string
  label: string
  caption: string
  tiles: TilesData
  sfRows: RenderRow[]
  aliquotRows: RenderAliquotRow[]
  bakeRows: RenderBakeRow[]
  source: SourcePanel
}

// --- TS interface strings (literal — these are what the user sees) ---

const interfaceA = `interface OptionA {
  bulk_ambient_temp_f?: number
  dough_temps?: Array<{ time: string; temp_f: number }>
  bake_phases?: Array<{
    stage: 'preheat' | 'covered' | 'uncovered'
    temp_f: number
    duration_min: number
    start_time?: string
  }>
  stretch_folds?: SfEvent[]
  aliquot_rises?: RiseEvent[]
}`

const interfaceB = `interface OptionB {
  mix?: { fermentolyse_min?: number }
  bulk?: {
    ambient_temp_f?: number
    duration_min?: number
    dough_temps?: Array<{ time: string; temp_f: number }>
    stretch_folds?: SfEvent[]
    aliquot_rises?: RiseEvent[]
  }
  shape?: {
    preshape_time?: string
    final_shape_time?: string
    bench_rest_min?: number
  }
  bake?: {
    preheat?: { temp_f: number; duration_min: number; start_time?: string }
    covered?: { temp_f: number; duration_min: number; start_time?: string }
    uncovered?: { temp_f: number; duration_min: number; start_time?: string }
  }
  cool?: { duration_min?: number }
}`

const interfaceC = `type BakeEventType =
  | 'mix' | 'fermentolyse' | 'stretch_fold' | 'aliquot_check'
  | 'preshape' | 'final_shape'
  | 'preheat_start' | 'bake_covered' | 'bake_uncovered' | 'bake_end'
  | 'cool'

interface OptionC {
  events: Array<{
    time: string
    type: BakeEventType
    data?: {
      dough_temp_f?: number
      ambient_temp_f?: number
      rise_pct?: number
      bake_temp_f?: number
    }
    note?: string
  }>
}`

// pretty-print JSON for the source panel
function pj(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

const shapes: ShapeBlock[] = [
  {
    key: 'A',
    label: 'Option A — Flat scalars + arrays',
    caption:
      "Simplest top-level. Multi-phase bake forces an array (bake_phases[]) since flat scalars can't hold multiple temps + durations.",
    tiles: tilesFromA(dataA),
    sfRows: sfRowsFrom(dataA.stretch_folds),
    aliquotRows: aliquotRowsFromA(dataA.aliquot_rises),
    bakeRows: bakeRowsFromA(dataA),
    source: {
      interfaceTs: interfaceA,
      jsonInstance: pj(dataA),
      parsingNote:
        'Flat top-level fields plus parallel arrays — dough_temps[], bake_phases[], stretch_folds[], aliquot_rises[] all sit at the root. The avg dough temp tile reads dough_temps[] directly and averages temp_f across the timestamp span.'
    }
  },
  {
    key: 'B',
    label: 'Option B — Grouped by phase',
    caption:
      'Matches mix → bulk → shape → bake mental model. Multi-phase bake nests cleanly under bake.preheat / bake.covered / bake.uncovered.',
    tiles: tilesFromB(dataB),
    sfRows: sfRowsFrom(dataB.bulk?.stretch_folds),
    aliquotRows: aliquotRowsFromB(dataB.bulk?.aliquot_rises),
    bakeRows: bakeRowsFromB(dataB),
    source: {
      interfaceTs: interfaceB,
      jsonInstance: pj(dataB),
      parsingNote:
        'Each cooking phase is a named group. Dough temps live under bulk since that\'s when they\'re measured; the avg dough temp tile walks bulk.dough_temps[]. Progressive render walks groups; absent sub-phases (e.g. no bake.uncovered) just don\'t render.'
    }
  },
  {
    key: 'C',
    label: 'Option C — Unified chronological timeline',
    caption:
      'Perfectly matches raw note chronology. Bake phases become event types; render code groups events back into blocks.',
    tiles: tilesFromC(dataC),
    sfRows: sfRowsFromC(dataC),
    aliquotRows: aliquotRowsFromC(dataC),
    bakeRows: bakeRowsFromC(dataC),
    source: {
      interfaceTs: interfaceC,
      jsonInstance: pj(dataC),
      parsingNote:
        'One chronological stream. Dough temps, S&Fs, and aliquot checks are all events — filter by which events have data.dough_temp_f to compute the average. Multi-phase bake = three more event types (preheat_start / bake_covered / bake_uncovered) with durations inferred from gaps.'
    }
  }
]

// Section 1 uses Option B visually (grouped by phase feels natural next to
// a curated note list that follows phase order).
const section1Shape: ShapeBlock = shapes[1]

// Partial-data Option B — only mix + bake.preheat populated.
const partialShape: ShapeBlock = {
  key: 'B-partial',
  label: 'Option B — Partial data (no bulk, no shape, no cool, only bake.preheat)',
  caption:
    "Progressive render demo. Only mix + bake.preheat populated; S&F, aliquot, and the covered/uncovered bake phases are absent so nothing renders for them.",
  tiles: tilesFromB(dataBPartial),
  sfRows: sfRowsFrom(dataBPartial.bulk?.stretch_folds),
  aliquotRows: aliquotRowsFromB(dataBPartial.bulk?.aliquot_rises),
  bakeRows: bakeRowsFromB(dataBPartial),
  source: {
    interfaceTs: interfaceB,
    jsonInstance: pj(dataBPartial),
    parsingNote: 'Same Option B shape, mostly empty. bake.covered and bake.uncovered being undefined cause those rows to disappear from the bake phases table. bulk.dough_temps is also absent, so the avg dough temp tile gracefully shows "—" instead of hiding the tile — same contract applies to sub-phases and to derived stats.'
  }
}

// ============================================================
// FORMATTING HELPERS
// ============================================================

function fmtTemp(v: number | undefined): string {
  return v == null ? '—' : `${v}°F`
}

function fmtAvgDoughTemp(v: number | null | undefined): string {
  return v == null ? '—' : `${v}°F`
}

function fmtDoughWindow(h: number | null | undefined): string {
  return h == null ? '' : `over ${h}h`
}

function fmtDuration(v: number | undefined): string {
  if (v == null) return '—'
  if (v < 60) return `${v}m`
  const h = Math.floor(v / 60)
  const m = v % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function fmtCount(v: number | undefined): string {
  return v == null ? '—' : String(v)
}
</script>

<template>
  <div class="demo-bake-shapes">
    <header class="demo-header">
      <h1 class="demo-title">Bake Stats Shapes — Demo (PF-177.2)</h1>
      <p class="demo-blurb">
        Grooming spike for PF-177 (Structured bake log stats block). Two
        schema decisions rendered visually before we commit to a production
        shape. Delete this page after PF-177 ships.
      </p>
    </header>

    <!-- ============================================================
         SECTION 1 — Raw notes disclosure preview
         ============================================================ -->
    <section class="demo-section">
      <h2 class="section-heading">
        Section 1 — Raw notes + structured stats + curated prose
      </h2>
      <p class="section-intro">
        One bake, three layers of fidelity stacked together: structured
        <code>bake_stats</code> (the Variant C block), curated
        <code>notes[]</code> prose, and a verbatim <code>raw_notes</code>
        paste hidden behind a disclosure. This is what a real
        <code>CookLogEntry</code> would render if we keep the raw paste.
      </p>

      <!-- Fake CookLogEntry card -->
      <article class="cle-card">
        <div class="cle-header">
          <span class="cle-label">2026-04-05 — Sunday</span>
          <span class="cle-version">v3.2.0</span>
        </div>
        <p class="cle-summary">
          Overproofed — aliquot hit ~100% before preshape. Long cold bulk
          took me by surprise after the last few faster bakes.
        </p>

        <!-- Variant C stats block (Option B data, grouped by phase) -->
        <div class="vc-bake">
          <div class="vc-tiles">
            <div class="vc-tile">
              <span class="vc-tile-value">{{ fmtAvgDoughTemp(section1Shape.tiles.avg_dough_temp_f) }}</span>
              <span class="vc-tile-label">avg dough</span>
              <span
                v-if="section1Shape.tiles.avg_dough_window_h != null"
                class="vc-tile-label vc-tile-sublabel"
              >{{ fmtDoughWindow(section1Shape.tiles.avg_dough_window_h) }}</span>
            </div>
            <div class="vc-tile">
              <span class="vc-tile-value">{{ fmtTemp(section1Shape.tiles.bulk_ambient_temp_f) }}</span>
              <span class="vc-tile-label">bulk amb</span>
            </div>
            <div class="vc-tile">
              <span class="vc-tile-value">{{ fmtCount(section1Shape.tiles.bake_phases_count) }}</span>
              <span class="vc-tile-label">bake phases</span>
            </div>
            <div class="vc-tile">
              <span class="vc-tile-value">{{ fmtDuration(section1Shape.tiles.total_bake_min) }}</span>
              <span class="vc-tile-label">total bake</span>
            </div>
          </div>

          <div v-if="section1Shape.sfRows.length > 0" class="vc-block">
            <h4 class="vc-block-heading">Stretch &amp; Folds</h4>
            <div class="vc-sf-grid">
              <template v-for="(row, i) in section1Shape.sfRows" :key="'s1-sf-' + i">
                <div
                  v-if="i > 0 && section1Shape.sfRows[i - 1].date !== row.date"
                  class="vc-day-break"
                  aria-hidden="true"
                />
                <div class="vc-sf-row">
                  <span class="vc-sf-date">
                    {{ i === 0 || section1Shape.sfRows[i - 1].date !== row.date ? row.date : '' }}
                  </span>
                  <span class="vc-sf-time">{{ row.timeOfDay }}</span>
                  <span class="vc-sf-label">{{ row.label }}</span>
                  <span class="vc-sf-temp">{{ row.note ?? '' }}</span>
                </div>
              </template>
            </div>
          </div>

          <div v-if="section1Shape.aliquotRows.length > 0" class="vc-block">
            <h4 class="vc-block-heading">Aliquot Rise</h4>
            <div class="vc-aliquot">
              <template v-for="(row, i) in section1Shape.aliquotRows" :key="'s1-al-' + i">
                <div
                  v-if="i > 0 && section1Shape.aliquotRows[i - 1].date !== row.date"
                  class="vc-day-break"
                  aria-hidden="true"
                />
                <div class="vc-aliquot-row">
                  <span class="vc-sf-date">
                    {{ i === 0 || section1Shape.aliquotRows[i - 1].date !== row.date ? row.date : '' }}
                  </span>
                  <span class="vc-sf-time">{{ row.timeOfDay }}</span>
                  <span class="vc-aliquot-bar-wrap">
                    <span
                      class="vc-aliquot-bar"
                      :style="{ width: Math.min(row.rise_pct, 100) + '%' }"
                    />
                  </span>
                  <span class="vc-aliquot-pct">{{ row.rise_pct }}%</span>
                  <span v-if="row.note" class="vc-aliquot-note">{{ row.note }}</span>
                </div>
              </template>
            </div>
          </div>

          <div v-if="section1Shape.bakeRows.length > 0" class="vc-block">
            <h4 class="vc-block-heading">Bake Phases</h4>
            <div class="vc-sf-grid">
              <div
                v-for="(row, i) in section1Shape.bakeRows"
                :key="'s1-bk-' + i"
                class="vc-bake-row"
              >
                <span class="vc-sf-label vc-bake-stage">{{ row.stage }}</span>
                <span class="vc-sf-time">{{ row.startTime ?? '' }}</span>
                <span class="vc-sf-temp">{{ fmtTemp(row.temp_f) }}</span>
                <span class="vc-sf-temp">{{ fmtDuration(row.duration_min) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Curated notes[] prose -->
        <div class="cle-notes">
          <h4 class="cle-notes-heading">Notes</h4>
          <ul class="cle-notes-list">
            <li>Long cold bulk produced an overproofed aliquot — ~100% at preshape</li>
            <li>Crumb was slightly gummy near the base — probably tied to overproof</li>
            <li>Oven spring was OK but shape flattened on transfer to Dutch oven</li>
          </ul>
        </div>

        <!-- Meta row + disclosure -->
        <div class="cle-meta">
          <span class="cle-meta-text">3 notes · 0 photos</span>
          <button
            type="button"
            class="cle-raw-toggle"
            @click="showRaw = !showRaw"
          >
            {{ showRaw ? '▾ Hide raw notes' : '▸ Show raw notes' }}
          </button>
        </div>
        <pre v-if="showRaw" class="cle-raw">{{ rawNotes }}</pre>
      </article>
    </section>

    <!-- ============================================================
         SECTION 2 — Schema shape options side-by-side
         ============================================================ -->
    <section class="demo-section">
      <h2 class="section-heading">
        Section 2 — Schema shape options (side-by-side)
      </h2>
      <p class="section-intro">
        Same source bake rendered three ways. The rendered output is
        intentionally identical — the difference is in the underlying
        <strong>data shape</strong>. Each card shows the rendered Variant C
        block (left) next to the TypeScript interface, JSON instance, and
        parsing notes (right).
      </p>
      <p class="section-intro">
        All three options now include a multi-phase bake (preheat / covered /
        uncovered) so you can see how each shape accommodates a real
        sourdough oven sequence.
      </p>

      <article
        v-for="shape in shapes"
        :key="shape.key"
        class="shape-card"
      >
        <header class="shape-header">
          <h3 class="shape-title">{{ shape.label }}</h3>
          <p class="shape-caption">{{ shape.caption }}</p>
        </header>

        <div class="shape-split">
          <!-- LEFT: rendered Variant C block -->
          <div class="shape-render">
            <div class="vc-bake">
              <div class="vc-tiles">
                <div class="vc-tile">
                  <span class="vc-tile-value">{{ fmtAvgDoughTemp(shape.tiles.avg_dough_temp_f) }}</span>
                  <span class="vc-tile-label">avg dough</span>
                  <span
                    v-if="shape.tiles.avg_dough_window_h != null"
                    class="vc-tile-label vc-tile-sublabel"
                  >{{ fmtDoughWindow(shape.tiles.avg_dough_window_h) }}</span>
                </div>
                <div class="vc-tile">
                  <span class="vc-tile-value">{{ fmtTemp(shape.tiles.bulk_ambient_temp_f) }}</span>
                  <span class="vc-tile-label">bulk amb</span>
                </div>
                <div class="vc-tile">
                  <span class="vc-tile-value">{{ fmtCount(shape.tiles.bake_phases_count) }}</span>
                  <span class="vc-tile-label">bake phases</span>
                </div>
                <div class="vc-tile">
                  <span class="vc-tile-value">{{ fmtDuration(shape.tiles.total_bake_min) }}</span>
                  <span class="vc-tile-label">total bake</span>
                </div>
              </div>

              <div v-if="shape.sfRows.length > 0" class="vc-block">
                <h4 class="vc-block-heading">Stretch &amp; Folds</h4>
                <div class="vc-sf-grid">
                  <template v-for="(row, i) in shape.sfRows" :key="shape.key + '-sf-' + i">
                    <div
                      v-if="i > 0 && shape.sfRows[i - 1].date !== row.date"
                      class="vc-day-break"
                      aria-hidden="true"
                    />
                    <div class="vc-sf-row">
                      <span class="vc-sf-date">
                        {{ i === 0 || shape.sfRows[i - 1].date !== row.date ? row.date : '' }}
                      </span>
                      <span class="vc-sf-time">{{ row.timeOfDay }}</span>
                      <span class="vc-sf-label">{{ row.label }}</span>
                      <span class="vc-sf-temp">{{ row.note ?? '' }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <div v-if="shape.aliquotRows.length > 0" class="vc-block">
                <h4 class="vc-block-heading">Aliquot Rise</h4>
                <div class="vc-aliquot">
                  <template v-for="(row, i) in shape.aliquotRows" :key="shape.key + '-al-' + i">
                    <div
                      v-if="i > 0 && shape.aliquotRows[i - 1].date !== row.date"
                      class="vc-day-break"
                      aria-hidden="true"
                    />
                    <div class="vc-aliquot-row">
                      <span class="vc-sf-date">
                        {{ i === 0 || shape.aliquotRows[i - 1].date !== row.date ? row.date : '' }}
                      </span>
                      <span class="vc-sf-time">{{ row.timeOfDay }}</span>
                      <span class="vc-aliquot-bar-wrap">
                        <span
                          class="vc-aliquot-bar"
                          :style="{ width: Math.min(row.rise_pct, 100) + '%' }"
                        />
                      </span>
                      <span class="vc-aliquot-pct">{{ row.rise_pct }}%</span>
                      <span v-if="row.note" class="vc-aliquot-note">{{ row.note }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <div v-if="shape.bakeRows.length > 0" class="vc-block">
                <h4 class="vc-block-heading">Bake Phases</h4>
                <div class="vc-sf-grid">
                  <div
                    v-for="(row, i) in shape.bakeRows"
                    :key="shape.key + '-bk-' + i"
                    class="vc-bake-row"
                  >
                    <span class="vc-sf-label vc-bake-stage">{{ row.stage }}</span>
                    <span class="vc-sf-time">{{ row.startTime ?? '' }}</span>
                    <span class="vc-sf-temp">{{ fmtTemp(row.temp_f) }}</span>
                    <span class="vc-sf-temp">{{ fmtDuration(row.duration_min) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: source panel (interface + JSON + parsing note) -->
          <aside class="shape-source">
            <div class="src-block">
              <h5 class="src-heading">TypeScript interface</h5>
              <pre class="src-code">{{ shape.source.interfaceTs }}</pre>
            </div>
            <div class="src-block">
              <h5 class="src-heading">JSON instance</h5>
              <pre class="src-code src-code-json">{{ shape.source.jsonInstance }}</pre>
            </div>
            <p class="src-parse">{{ shape.source.parsingNote }}</p>
          </aside>
        </div>
      </article>

      <!-- Progressive render demo -->
      <article class="shape-card shape-card-partial">
        <header class="shape-header">
          <h3 class="shape-title">{{ partialShape.label }}</h3>
          <p class="shape-caption">{{ partialShape.caption }}</p>
        </header>

        <div class="shape-split">
          <div class="shape-render">
            <div class="vc-bake">
              <div class="vc-tiles">
                <div class="vc-tile">
                  <span class="vc-tile-value">{{ fmtAvgDoughTemp(partialShape.tiles.avg_dough_temp_f) }}</span>
                  <span class="vc-tile-label">avg dough</span>
                  <span
                    v-if="partialShape.tiles.avg_dough_window_h != null"
                    class="vc-tile-label vc-tile-sublabel"
                  >{{ fmtDoughWindow(partialShape.tiles.avg_dough_window_h) }}</span>
                </div>
                <div class="vc-tile">
                  <span class="vc-tile-value">{{ fmtTemp(partialShape.tiles.bulk_ambient_temp_f) }}</span>
                  <span class="vc-tile-label">bulk amb</span>
                </div>
                <div class="vc-tile">
                  <span class="vc-tile-value">{{ fmtCount(partialShape.tiles.bake_phases_count) }}</span>
                  <span class="vc-tile-label">bake phases</span>
                </div>
                <div class="vc-tile">
                  <span class="vc-tile-value">{{ fmtDuration(partialShape.tiles.total_bake_min) }}</span>
                  <span class="vc-tile-label">total bake</span>
                </div>
              </div>

              <div v-if="partialShape.sfRows.length > 0" class="vc-block">
                <h4 class="vc-block-heading">Stretch &amp; Folds</h4>
                <!-- Won't render — sfRows is empty -->
              </div>
              <div v-if="partialShape.aliquotRows.length > 0" class="vc-block">
                <h4 class="vc-block-heading">Aliquot Rise</h4>
                <!-- Won't render — aliquotRows is empty -->
              </div>

              <div v-if="partialShape.bakeRows.length > 0" class="vc-block">
                <h4 class="vc-block-heading">Bake Phases</h4>
                <div class="vc-sf-grid">
                  <div
                    v-for="(row, i) in partialShape.bakeRows"
                    :key="'p-bk-' + i"
                    class="vc-bake-row"
                  >
                    <span class="vc-sf-label vc-bake-stage">{{ row.stage }}</span>
                    <span class="vc-sf-time">{{ row.startTime ?? '' }}</span>
                    <span class="vc-sf-temp">{{ fmtTemp(row.temp_f) }}</span>
                    <span class="vc-sf-temp">{{ fmtDuration(row.duration_min) }}</span>
                  </div>
                </div>
              </div>

              <p class="partial-footnote">
                <em>
                  Note: tiles row + a single-row Bake Phases block render.
                  S&amp;F and aliquot blocks are omitted entirely (their
                  source arrays are undefined). Within the bake block, only
                  the <code>preheat</code> sub-phase rendered — covered and
                  uncovered are also undefined and don't show up. This is
                  the progressive render contract PF-177.3 will enforce, and
                  it works at both the block level and the sub-phase level.
                </em>
              </p>
            </div>
          </div>

          <aside class="shape-source">
            <div class="src-block">
              <h5 class="src-heading">TypeScript interface</h5>
              <pre class="src-code">{{ partialShape.source.interfaceTs }}</pre>
            </div>
            <div class="src-block">
              <h5 class="src-heading">JSON instance (partial)</h5>
              <pre class="src-code src-code-json">{{ partialShape.source.jsonInstance }}</pre>
            </div>
            <p class="src-parse">{{ partialShape.source.parsingNote }}</p>
          </aside>
        </div>
      </article>
    </section>

    <footer class="demo-footer">
      <p class="demo-blurb">
        <strong>Decisions needed:</strong> (1) keep raw_notes disclosure
        pattern yes/no, (2) pick schema shape A / B / C. Groomer writes
        PF-177.3 ACs against the chosen direction, then this page gets
        deleted.
      </p>
    </footer>
  </div>
</template>

<style scoped>
/* ================================================
   DemoBakeStatsShapes — PF-177.2 throwaway spike
   ================================================ */

.demo-bake-shapes {
  font-family: var(--font-sans);
  color: var(--color-ink);
  max-width: 72rem;
  margin: 0 auto;
  padding: 1rem 1rem 2rem;
}

.demo-header {
  margin-bottom: 1.5rem;
}

.demo-title {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 0.5rem;
}

.demo-blurb {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--color-stone-600);
  margin: 0 0 0.5rem;
}

.demo-blurb strong {
  color: var(--color-ink);
}

.demo-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--color-stone-300);
}

.demo-section {
  margin-top: 3rem;
}

.section-heading {
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-ink);
  margin: 0 0 0.5rem;
  padding-bottom: 0.375rem;
  border-bottom: 2px solid var(--color-accent);
}

.section-intro {
  font-size: 0.875rem;
  color: var(--color-stone-600);
  line-height: 1.55;
  margin: 0 0 0.875rem;
}

.section-intro code {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background: var(--color-stone-100);
  padding: 0.0625rem 0.3125rem;
  color: var(--color-ink);
}

.section-intro strong {
  color: var(--color-ink);
}

/* ============================================================
   Fake CookLogEntry card (Section 1)
   ============================================================ */

.cle-card {
  border: 2px solid var(--color-stone-200);
  background: var(--color-surface);
  padding: 1.25rem 1.25rem 1rem;
  max-width: 52rem;
}

.cle-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
}

.cle-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink);
}

.cle-version {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  background: var(--color-accent);
  color: var(--color-stone-50);
  padding: 0.125rem 0.4375rem;
  letter-spacing: 0.04em;
}

.cle-summary {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-stone-700);
  margin: 0 0 1rem;
}

.cle-notes {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--color-stone-200);
}

.cle-notes-heading {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
  margin: 0 0 0.5rem;
}

.cle-notes-list {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--color-stone-700);
}

.cle-notes-list li {
  margin-bottom: 0.25rem;
}

.cle-meta {
  margin-top: 1rem;
  padding-top: 0.625rem;
  border-top: 1px dashed var(--color-stone-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.cle-meta-text {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-500);
}

.cle-raw-toggle {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-stone-500);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.375rem;
}

.cle-raw-toggle:hover {
  color: var(--color-ink);
}

.cle-raw {
  margin: 0.625rem 0 0;
  padding: 0.75rem;
  background: var(--color-stone-100);
  border: 1px dashed var(--color-stone-300);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  line-height: 1.5;
  color: var(--color-stone-700);
  white-space: pre-wrap;
  overflow-x: auto;
}

/* ============================================================
   Shape card (Section 2)
   ============================================================ */

.shape-card {
  border: 2px solid var(--color-stone-200);
  background: var(--color-surface);
  padding: 1rem 1.25rem 1.25rem;
  margin-bottom: 1.5rem;
}

.shape-card-partial {
  border-style: dashed;
  border-color: var(--color-stone-300);
  background: var(--color-stone-50);
}

.shape-header {
  margin-bottom: 0.875rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed var(--color-stone-200);
}

.shape-title {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-ink);
  margin: 0 0 0.25rem;
}

.shape-caption {
  font-size: 0.75rem;
  color: var(--color-stone-500);
  font-style: italic;
  margin: 0;
  line-height: 1.5;
}

.shape-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

@media (max-width: 900px) {
  .shape-split {
    grid-template-columns: 1fr;
  }
}

.shape-render {
  min-width: 0;
}

.shape-source {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.src-block {
  display: flex;
  flex-direction: column;
}

.src-heading {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
  margin: 0 0 0.25rem;
}

.src-code {
  margin: 0;
  padding: 0.625rem 0.75rem;
  background: var(--color-stone-100);
  border: 1px solid var(--color-stone-200);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.5;
  color: var(--color-ink);
  white-space: pre;
  overflow-x: auto;
  max-height: 22rem;
  overflow-y: auto;
}

.src-code-json {
  background: var(--color-stone-50);
}

.src-parse {
  margin: 0.125rem 0 0;
  padding: 0.5rem 0.625rem;
  font-size: 0.6875rem;
  font-style: italic;
  color: var(--color-stone-600);
  line-height: 1.5;
  background: var(--color-surface);
  border-left: 2px solid var(--color-accent);
}

.partial-footnote {
  margin: 0.875rem 0 0;
  padding: 0.625rem 0.75rem;
  background: var(--color-surface);
  border-left: 2px solid var(--color-accent);
  font-size: 0.75rem;
  color: var(--color-stone-600);
  line-height: 1.5;
}

.partial-footnote code {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  background: var(--color-stone-100);
  padding: 0.0625rem 0.25rem;
  color: var(--color-ink);
}

/* ============================================================
   Variant C render (reused from DemoStatsBlock.vue)
   ============================================================ */

.vc-bake {
  /* no padding/border — lives inside a card already */
}

.vc-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 2px solid var(--color-stone-200);
  background: var(--color-surface);
  margin-bottom: 0.875rem;
}

.vc-tile {
  padding: 0.625rem 0.5rem;
  text-align: center;
  border-right: 1px solid var(--color-stone-200);
}

.vc-tile:last-child {
  border-right: none;
}

.vc-tile-value {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.2;
}

.vc-tile-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-400);
  margin-top: 0.1875rem;
}

.vc-tile-sublabel {
  margin-top: 0.0625rem;
  color: var(--color-stone-500);
}

.vc-block {
  margin-top: 0.625rem;
  padding: 0.625rem 0.75rem;
  background: var(--color-stone-50);
  border-left: 2px solid var(--color-stone-300);
}

.vc-block-heading {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-500);
  margin: 0 0 0.375rem;
}

.vc-sf-grid {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.vc-sf-row {
  display: grid;
  grid-template-columns: 5.5rem 3.25rem 1fr auto;
  /* date   time   label  note */
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
}

.vc-bake-row {
  display: grid;
  grid-template-columns: 5.5rem 3.25rem 1fr auto;
  /* stage  time   temp   duration */
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
}

.vc-bake-stage {
  text-transform: uppercase;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  color: var(--color-ink);
}

.vc-sf-date,
.vc-sf-time {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-500);
  white-space: nowrap;
}

.vc-sf-time {
  text-align: right;
}

.vc-day-break {
  border-top: 1px dotted var(--color-stone-300);
  margin: 0.375rem 0 0.25rem;
}

.vc-sf-label {
  color: var(--color-stone-700);
}

.vc-sf-temp {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-ink);
  font-style: italic;
}

.vc-aliquot {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.vc-aliquot-row {
  display: grid;
  grid-template-columns: 5.5rem 3.25rem 1fr 3rem;
  /* date   time     bar    pct */
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
}

.vc-aliquot-bar-wrap {
  height: 8px;
  background: var(--color-stone-100);
  border: 1px solid var(--color-stone-200);
  position: relative;
  overflow: hidden;
}

.vc-aliquot-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--color-accent);
}

.vc-aliquot-pct {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-ink);
  text-align: right;
}

.vc-aliquot-note {
  grid-column: 1 / -1;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  color: var(--color-stone-500);
  padding-left: 9.75rem;
  margin-top: -0.125rem;
}
</style>
