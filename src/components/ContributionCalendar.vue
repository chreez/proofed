<script setup lang="ts">
import { computed } from 'vue'

// --- Types ---
// Local copy of TimelineBakeInfo (also defined in StatsPage.vue).
// Calendar consumes these via the bakeMap prop.
export interface CalendarBakeInfo {
  recipeId: string
  recipeName: string
  heroThumb: string | null
  date: string
}

export interface CalendarBakeDay {
  date: string
  bakes: CalendarBakeInfo[]
  isAberration: boolean
}

interface Props {
  /** ISO date (YYYY-MM-DD) -> array of bakes that day */
  bakeMap: Map<string, CalendarBakeInfo[]>
  /** ISO dates that have at least one aberration bake */
  aberrationDates: Set<string>
  /** Defaults to today (start of day, local time) */
  endDate?: Date
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'cellHover', day: CalendarBakeDay, ev: MouseEvent): void
  (e: 'cellClick', day: CalendarBakeDay, ev: MouseEvent): void
}>()

// --- Grid constants ---
const CELL_SIZE = 14
const GAP = 3
const MONTH_GAP = 6 // extra horizontal space inserted at month boundaries
const LABEL_WIDTH = 28
const LABEL_TOP = 16
const WEEKS = 53

// --- Date helpers ---
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// --- Grid build ---

interface DayCell {
  iso: string
  date: Date
  blank: boolean // true for padding cells outside the 12-month window
}

interface WeekColumn {
  startDate: Date // Sunday of this week
  days: DayCell[] // 7 entries (Sun..Sat)
}

const weeks = computed<WeekColumn[]>(() => {
  const today = startOfDay(props.endDate ?? new Date())
  // Show 12 months ending today (52 weeks + 1 column for partial week alignment).
  // Anchor on the Saturday of the week containing today, then walk back 53 weeks.
  const todayDow = today.getDay() // 0 = Sun
  // Last column = week containing today. We want today's column to be the rightmost.
  // The Sunday of that column is `today - todayDow` days back.
  const lastSunday = addDays(today, -todayDow)
  const firstSunday = addDays(lastSunday, -(WEEKS - 1) * 7)

  // Window inclusive bounds: only mark cells inside the rolling 12-month window.
  // Window = [today - 364 days, today]
  const windowStart = addDays(today, -364)

  const cols: WeekColumn[] = []
  for (let w = 0; w < WEEKS; w++) {
    const sunday = addDays(firstSunday, w * 7)
    const days: DayCell[] = []
    for (let r = 0; r < 7; r++) {
      const d = addDays(sunday, r)
      const inWindow = d >= windowStart && d <= today
      days.push({
        iso: isoDate(d),
        date: d,
        blank: !inWindow,
      })
    }
    cols.push({ startDate: sunday, days })
  }
  return cols
})

// Per-column x positions, including extra gap at month boundaries.
// First column starts after LABEL_WIDTH; each subsequent column adds CELL_SIZE
// + GAP, plus MONTH_GAP whenever the column's first real day belongs to a new
// month (compared with the previous column's first real day).
const columnXs = computed<number[]>(() => {
  const xs: number[] = []
  let x = LABEL_WIDTH
  let prevMonth = -1
  weeks.value.forEach((col) => {
    const firstReal = col.days.find(d => !d.blank) ?? col.days[0]
    const m = firstReal.date.getMonth()
    if (prevMonth !== -1 && m !== prevMonth) {
      x += MONTH_GAP
    }
    xs.push(x)
    x += CELL_SIZE + GAP
    prevMonth = m
  })
  return xs
})

const svgWidth = computed(() => {
  const last = columnXs.value[columnXs.value.length - 1] ?? LABEL_WIDTH
  // Drop the trailing GAP after the last column.
  return last + CELL_SIZE
})
const svgHeight = computed(() => LABEL_TOP + 7 * CELL_SIZE + 6 * GAP)

// --- Month labels (above each column where a new month starts) ---
interface MonthLabel {
  text: string
  x: number
}

const monthLabels = computed<MonthLabel[]>(() => {
  const labels: MonthLabel[] = []
  let prevMonth = -1
  weeks.value.forEach((col, idx) => {
    // Use the first non-blank day of the column (or fall back to row 0)
    const firstReal = col.days.find(d => !d.blank) ?? col.days[0]
    const m = firstReal.date.getMonth()
    if (m !== prevMonth) {
      labels.push({ text: MONTH_NAMES[m], x: columnXs.value[idx] })
      prevMonth = m
    }
  })
  return labels
})

// --- Weekday labels ---
const weekdayLabels = [
  { row: 1, text: 'Mon' },
  { row: 3, text: 'Wed' },
  { row: 5, text: 'Fri' },
]

function weekdayY(row: number): number {
  return LABEL_TOP + row * (CELL_SIZE + GAP) + CELL_SIZE - 3
}

// --- Cell rendering ---
function cellX(weekIdx: number): number {
  return columnXs.value[weekIdx]
}

function cellY(rowIdx: number): number {
  return LABEL_TOP + rowIdx * (CELL_SIZE + GAP)
}

function hasBakes(iso: string): boolean {
  const bakes = props.bakeMap.get(iso)
  return !!bakes && bakes.length > 0
}

function isAberrationOnly(iso: string): boolean {
  return props.aberrationDates.has(iso) && !hasBakes(iso)
}

function cellFillClass(iso: string, blank: boolean): string {
  if (blank) return 'cal-cell--blank'
  if (hasBakes(iso)) return 'cal-cell--bake'
  if (isAberrationOnly(iso)) return 'cal-cell--aberration'
  return 'cal-cell--empty'
}

function toBakeDay(day: DayCell): CalendarBakeDay {
  return {
    date: day.iso,
    bakes: props.bakeMap.get(day.iso) ?? [],
    isAberration: props.aberrationDates.has(day.iso),
  }
}

function onCellMouseenter(day: DayCell, ev: MouseEvent): void {
  if (day.blank || !hasBakes(day.iso)) return
  emit('cellHover', toBakeDay(day), ev)
}

function onCellClick(day: DayCell, ev: MouseEvent): void {
  if (day.blank || !hasBakes(day.iso)) return
  emit('cellClick', toBakeDay(day), ev)
}

// --- Aria summary ---
const bakeDayCount = computed(() => {
  let count = 0
  for (const col of weeks.value) {
    for (const day of col.days) {
      if (!day.blank && hasBakes(day.iso)) count++
    }
  }
  return count
})

const ariaLabel = computed(() => `Baking cadence — last 12 months, ${bakeDayCount.value} bake days`)
</script>

<template>
  <svg
    class="contribution-calendar"
    :width="svgWidth"
    :height="svgHeight"
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    role="img"
    :aria-label="ariaLabel"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Month labels -->
    <text
      v-for="(label, idx) in monthLabels"
      :key="`m-${idx}`"
      class="cal-month"
      :x="label.x"
      :y="LABEL_TOP - 5"
    >{{ label.text }}</text>

    <!-- Weekday labels (Mon/Wed/Fri) -->
    <text
      v-for="dow in weekdayLabels"
      :key="`d-${dow.row}`"
      class="cal-dow"
      :x="0"
      :y="weekdayY(dow.row)"
    >{{ dow.text }}</text>

    <!-- Cells -->
    <template v-for="(col, weekIdx) in weeks" :key="`w-${weekIdx}`">
      <rect
        v-for="(day, rowIdx) in col.days"
        :key="day.iso"
        class="cal-cell"
        :class="cellFillClass(day.iso, day.blank)"
        :x="cellX(weekIdx)"
        :y="cellY(rowIdx)"
        :width="CELL_SIZE"
        :height="CELL_SIZE"
        :data-date="day.iso"
        @mouseenter="onCellMouseenter(day, $event)"
        @click.stop="onCellClick(day, $event)"
      >
        <title v-if="!day.blank && hasBakes(day.iso)">{{ bakeMap.get(day.iso)?.length }} bake(s) on {{ day.iso }}</title>
      </rect>
    </template>
  </svg>
</template>

<style scoped>
.contribution-calendar {
  display: block;
  shape-rendering: crispEdges;
  overflow: visible;
}

.cal-cell {
  transition: stroke 120ms ease;
}

.cal-cell--blank {
  fill: transparent;
  pointer-events: none;
}

.cal-cell--empty {
  fill: var(--color-stone-100);
  pointer-events: none;
}

.cal-cell--aberration {
  fill: var(--color-stone-400);
  cursor: pointer;
}

.cal-cell--bake {
  fill: var(--color-accent);
  cursor: pointer;
}

.cal-cell--bake:hover,
.cal-cell--aberration:hover {
  stroke: var(--color-ink);
  stroke-width: 1px;
  paint-order: stroke;
}

.cal-month,
.cal-dow {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  fill: var(--color-stone-400);
  user-select: none;
}

.cal-month {
  font-size: 10px;
}

.cal-dow {
  font-size: 9px;
}
</style>
