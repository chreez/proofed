<script setup lang="ts">
/**
 * DemoStatsBlock — PF-177.1 throwaway spike
 *
 * Renders ~3 visual variants of a per-bake stats block, stacked so the user
 * can compare them side-by-side on Mac and iPhone and pick a direction.
 * Data is hardcoded from simple-sourdough bakes #11 (2026-04-01) and #12
 * (2026-04-06). Synthetic fields (final internal temp, aliquot rise %) are
 * pulled directly from the note text; anything marked "inferred" below is
 * called out in the caption so the user evaluates layout, not data.
 *
 * NOTE: This file is disposable — delete after PF-177.3 ships.
 */

interface SfRow {
  time: string
  // date + timeOfDay are split versions of `time` used by Variant C so it can
  // render the date and time in separate aligned columns. Variants A and B
  // still use the single `time` field.
  date: string
  timeOfDay: string
  label: string
  temp: string
}

interface BakeParamsRow {
  label: string
  value: string
}

interface AliquotRow {
  time: string
  date: string
  timeOfDay: string
  rise: string
  note?: string
}

interface DemoBake {
  label: string
  date: string
  startDate?: string
  version: string
  variant: string
  summary: string
  yield: string
  cost: string
  costPerServing: string
  rating?: string
  finalTemp: string
  bulkHours: string
  doughTempAvg: string
  sfRows: SfRow[]
  bakeParams: BakeParamsRow[]
  aliquotRows: AliquotRow[]
  sfInferred: boolean
}

// --- Bake #11 (2026-04-01) — housewarming 2-loaf, fermentolyse, cross score
const bake11: DemoBake = {
  label: 'Bake #11',
  date: '2026-04-01',
  startDate: '2026-03-31',
  version: 'v2.1.0',
  variant: '2-loaf · fermentolyse · cross score',
  summary:
    'Housewarming bake. 60% aliquot rise, both loaves eaten at the party. One dough had too much flour during shaping.',
  yield: '2 loaves',
  cost: '$2.65',
  costPerServing: '$1.33/loaf',
  rating: '4/5',
  finalTemp: '—', // "Didn\u2019t measure internal temp" per notes
  bulkHours: '~5h 17m',
  doughTempAvg: '77.7°F',
  sfRows: [
    { time: '2026-04-01 - 19:52', date: '2026-04-01', timeOfDay: '19:52', label: 'fermentolyse start', temp: '77.5°F' },
    { time: '2026-04-01 - 21:06', date: '2026-04-01', timeOfDay: '21:06', label: 'S&F #1 (post-salt)', temp: '77.4°F' },
    { time: '2026-04-01 - 21:44', date: '2026-04-01', timeOfDay: '21:44', label: 'S&F #2', temp: '77.5°F' },
    { time: '2026-04-01 - 22:35', date: '2026-04-01', timeOfDay: '22:35', label: 'S&F #3 (last fold)', temp: '77.7°F' },
    { time: '2026-04-02 - 01:01', date: '2026-04-02', timeOfDay: '01:01', label: 'bulk end / turn out', temp: '78.8°F' }
  ],
  bakeParams: [
    { label: 'Preheat', value: '500°F' },
    { label: 'Covered', value: '450°F' },
    { label: 'Uncovered', value: '425°F, 18–22m' },
    { label: 'Flour', value: '100% bread' },
    { label: 'Score', value: 'cross, both' },
    { label: 'Cold proof', value: '~8h (3am–11am)' }
  ],
  aliquotRows: [
    { time: '2026-04-02 - 01:01', date: '2026-04-02', timeOfDay: '01:01', rise: '60%', note: 'turn out / bulk end' }
  ],
  sfInferred: false
}

// --- Bake #12 (2026-04-06) — 2-loaf, emergency cold retard, creative bake
const bake12: DemoBake = {
  label: 'Bake #12',
  date: '2026-04-06',
  startDate: '2026-04-04',
  version: 'v3.0.0',
  variant: '2-loaf · cold retard rescue · mixed score',
  summary:
    'Timing got away — emergency cold retard at 40% aliquot rise, dough hit ~100% by preshape. Higher uncovered temp produced a noticeably better crust.',
  yield: '2 loaves',
  cost: '$2.65',
  costPerServing: '$1.32/loaf',
  rating: '3.5/5',
  finalTemp: '~210°F',
  bulkHours: '~3h (cut short)',
  doughTempAvg: '75.8°F',
  sfRows: [
    { time: '2026-04-04 - 16:04', date: '2026-04-04', timeOfDay: '16:04', label: 'fermentolyse start', temp: '—' },
    { time: '2026-04-04 - 16:39', date: '2026-04-04', timeOfDay: '16:39', label: 'salt incorporated', temp: '75.4°F' },
    { time: '2026-04-04 - 17:07', date: '2026-04-04', timeOfDay: '17:07', label: 'fold 1', temp: '75.5°F' },
    { time: '2026-04-04 - 17:36', date: '2026-04-04', timeOfDay: '17:36', label: 'fold 2', temp: '76.5°F' },
    { time: '2026-04-04 - 18:12', date: '2026-04-04', timeOfDay: '18:12', label: 'fold 3', temp: '75.9°F' },
    { time: '2026-04-04 - ~19:00', date: '2026-04-04', timeOfDay: '~19:00', label: 'into fridge (rescue)', temp: '—' }
  ],
  bakeParams: [
    { label: 'Preheat', value: '550°F' },
    { label: 'Covered', value: '~high, 20m' },
    { label: 'Uncovered', value: '~high, 22m+ flips' },
    { label: 'Flour', value: '100% bread' },
    { label: 'Score', value: 'cross + single' },
    { label: 'Cold proof', value: '~17h emergency retard' }
  ],
  aliquotRows: [
    { time: '2026-04-04 - ~19:00', date: '2026-04-04', timeOfDay: '~19:00', rise: '40%', note: 'emergency fridge' },
    { time: '2026-04-05 - ~13:00', date: '2026-04-05', timeOfDay: '~13:00', rise: '~100%', note: 'preshape (overproofed)' }
  ],
  sfInferred: false
}

const bakes: DemoBake[] = [bake11, bake12]
</script>

<template>
  <div class="demo-stats-block">
    <header class="demo-header">
      <h1 class="demo-title">Demo — Stats Block Variants (PF-177.1)</h1>
      <p class="demo-blurb">
        Throwaway spike for PF-177. Three layout variants of a per-bake stats
        block, rendered against real data from simple-sourdough bakes #11 and
        #12. Pick a direction; the production implementation (PF-177.3) will
        build on the chosen variant and this page gets deleted.
      </p>
      <p class="demo-blurb">
        <strong>Evaluate:</strong> density, field grouping, how structured
        sub-blocks (S&amp;F table, bake params, aliquot timeline) read inline,
        and how it scales on mobile. Data is directly lifted from the cook log
        notes — not inferred.
      </p>
    </header>

    <!-- ============================================================
         VARIANT A — Horizontal bar (density champion)
         ============================================================ -->
    <section class="variant-card">
      <div class="variant-label">
        <span class="variant-letter">A</span>
        <span class="variant-name">Horizontal bar — 1-line summary + collapsible structured blocks</span>
      </div>
      <p class="variant-caption">
        Minimal vertical footprint. Key result fields in a single mono line at
        the top of each bake entry; structured S&amp;F / params / aliquot
        blocks live in disclosure rows beneath.
      </p>

      <div v-for="bake in bakes" :key="'A-' + bake.date" class="va-bake">
        <div class="va-header">
          <span class="va-label">{{ bake.label }}</span>
          <span class="va-date">{{ bake.date }}</span>
          <span class="va-version">{{ bake.version }}</span>
        </div>
        <div class="va-summary">{{ bake.summary }}</div>
        <div class="va-bar">
          <span class="va-stat">
            <span class="va-stat-label">yield</span>
            <span class="va-stat-value">{{ bake.yield }}</span>
          </span>
          <span class="va-stat">
            <span class="va-stat-label">bulk</span>
            <span class="va-stat-value">{{ bake.bulkHours }}</span>
          </span>
          <span class="va-stat">
            <span class="va-stat-label">dough&nbsp;°F</span>
            <span class="va-stat-value">{{ bake.doughTempAvg }}</span>
          </span>
          <span class="va-stat">
            <span class="va-stat-label">final&nbsp;°F</span>
            <span class="va-stat-value">{{ bake.finalTemp }}</span>
          </span>
          <span class="va-stat">
            <span class="va-stat-label">cost</span>
            <span class="va-stat-value">{{ bake.cost }}</span>
          </span>
          <span class="va-stat">
            <span class="va-stat-label">rating</span>
            <span class="va-stat-value">{{ bake.rating ?? '—' }}</span>
          </span>
        </div>

        <details class="va-details">
          <summary>S&amp;F timeline ({{ bake.sfRows.length }})</summary>
          <table class="va-sf-table">
            <thead>
              <tr>
                <th class="va-th">time</th>
                <th class="va-th">event</th>
                <th class="va-th va-th-right">temp</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in bake.sfRows" :key="row.time + row.label">
                <td class="va-td va-td-mono">{{ row.time }}</td>
                <td class="va-td">{{ row.label }}</td>
                <td class="va-td va-td-mono va-td-right">{{ row.temp }}</td>
              </tr>
            </tbody>
          </table>
        </details>

        <details class="va-details">
          <summary>Bake parameters</summary>
          <div class="va-params">
            <div
              v-for="row in bake.bakeParams"
              :key="row.label"
              class="va-param"
            >
              <span class="va-param-label">{{ row.label }}</span>
              <span class="va-param-value">{{ row.value }}</span>
            </div>
          </div>
        </details>

        <details class="va-details">
          <summary>Aliquot</summary>
          <table class="va-sf-table">
            <thead>
              <tr>
                <th class="va-th">time</th>
                <th class="va-th va-th-right">rise</th>
                <th class="va-th">note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in bake.aliquotRows" :key="row.time + row.rise">
                <td class="va-td va-td-mono">{{ row.time }}</td>
                <td class="va-td va-td-mono va-td-right">{{ row.rise }}</td>
                <td class="va-td">{{ row.note ?? '' }}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </div>
    </section>

    <!-- ============================================================
         VARIANT B — 2-column compact grid
         ============================================================ -->
    <section class="variant-card">
      <div class="variant-label">
        <span class="variant-letter">B</span>
        <span class="variant-name">2-column compact grid — inputs left, results right</span>
      </div>
      <p class="variant-caption">
        Splits input fields (what you did) from result fields (what you got).
        Sub-blocks are always visible — no disclosure, full transparency.
        Higher density per card, taller overall footprint.
      </p>

      <div v-for="bake in bakes" :key="'B-' + bake.date" class="vb-bake">
        <div class="vb-header">
          <div class="vb-title">
            <span class="vb-label">{{ bake.label }}</span>
            <span class="vb-variant">{{ bake.variant }}</span>
          </div>
          <div class="vb-meta">
            <span class="vb-date">{{ bake.date }}</span>
            <span class="vb-version">{{ bake.version }}</span>
          </div>
        </div>
        <p class="vb-summary">{{ bake.summary }}</p>

        <div class="vb-grid">
          <!-- Inputs column -->
          <div class="vb-col">
            <h3 class="vb-col-heading">Inputs</h3>

            <h4 class="vb-sub-heading">Stretch &amp; folds</h4>
            <table class="vb-table">
              <tbody>
                <tr v-for="row in bake.sfRows" :key="row.time + row.label">
                  <td class="vb-td vb-td-mono">{{ row.time }}</td>
                  <td class="vb-td">{{ row.label }}</td>
                  <td class="vb-td vb-td-mono vb-td-right">{{ row.temp }}</td>
                </tr>
              </tbody>
            </table>

            <h4 class="vb-sub-heading">Bake params</h4>
            <dl class="vb-dl">
              <template
                v-for="row in bake.bakeParams"
                :key="row.label"
              >
                <dt class="vb-dt">{{ row.label }}</dt>
                <dd class="vb-dd">{{ row.value }}</dd>
              </template>
            </dl>
          </div>

          <!-- Results column -->
          <div class="vb-col">
            <h3 class="vb-col-heading">Results</h3>

            <dl class="vb-dl">
              <dt class="vb-dt">Yield</dt>
              <dd class="vb-dd">{{ bake.yield }}</dd>
              <dt class="vb-dt">Bulk</dt>
              <dd class="vb-dd">{{ bake.bulkHours }}</dd>
              <dt class="vb-dt">Dough avg</dt>
              <dd class="vb-dd">{{ bake.doughTempAvg }}</dd>
              <dt class="vb-dt">Final °F</dt>
              <dd class="vb-dd">{{ bake.finalTemp }}</dd>
              <dt class="vb-dt">Cost</dt>
              <dd class="vb-dd">{{ bake.cost }} ({{ bake.costPerServing }})</dd>
              <dt class="vb-dt">Rating</dt>
              <dd class="vb-dd">{{ bake.rating ?? '—' }}</dd>
            </dl>

            <h4 class="vb-sub-heading">Aliquot</h4>
            <table class="vb-table">
              <tbody>
                <tr v-for="row in bake.aliquotRows" :key="row.time + row.rise">
                  <td class="vb-td vb-td-mono">{{ row.time }}</td>
                  <td class="vb-td vb-td-mono vb-td-right">{{ row.rise }}</td>
                  <td class="vb-td">{{ row.note ?? '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================
         VARIANT C — Vertical list with structured sub-blocks
         ============================================================ -->
    <section class="variant-card">
      <div class="variant-label">
        <span class="variant-letter">C</span>
        <span class="variant-name">Vertical list — stacked structured blocks, headline tiles on top</span>
      </div>
      <p class="variant-caption">
        Hybrid: four headline tiles (yield, bulk, dough °F, cost) at the top of
        each bake, then structured sub-blocks stacked below. Mobile-first:
        everything stays single-column so nothing gets squeezed.
      </p>

      <div v-for="bake in bakes" :key="'C-' + bake.date" class="vc-bake">
        <div class="vc-header">
          <span class="vc-label">{{ bake.label }}</span>
          <span class="vc-date">{{ bake.date }}</span>
          <span class="vc-version">{{ bake.version }}</span>
        </div>
        <p class="vc-summary">{{ bake.summary }}</p>

        <div class="vc-tiles">
          <div class="vc-tile">
            <span class="vc-tile-value">{{ bake.yield }}</span>
            <span class="vc-tile-label">yield</span>
          </div>
          <div class="vc-tile">
            <span class="vc-tile-value">{{ bake.bulkHours }}</span>
            <span class="vc-tile-label">bulk</span>
          </div>
          <div class="vc-tile">
            <span class="vc-tile-value">{{ bake.doughTempAvg }}</span>
            <span class="vc-tile-label">dough avg</span>
          </div>
          <div class="vc-tile">
            <span class="vc-tile-value">{{ bake.cost }}</span>
            <span class="vc-tile-label">cost</span>
          </div>
        </div>

        <div class="vc-block">
          <h4 class="vc-block-heading">Stretch &amp; Folds</h4>
          <div class="vc-sf-grid">
            <template v-for="(row, i) in bake.sfRows" :key="row.time + row.label">
              <div
                v-if="i > 0 && bake.sfRows[i - 1].date !== row.date"
                class="vc-day-break"
                aria-hidden="true"
              />
              <div class="vc-sf-row">
                <span class="vc-sf-date">
                  {{ i === 0 || bake.sfRows[i - 1].date !== row.date ? row.date : '' }}
                </span>
                <span class="vc-sf-time">{{ row.timeOfDay }}</span>
                <span class="vc-sf-label">{{ row.label }}</span>
                <span class="vc-sf-temp">{{ row.temp }}</span>
              </div>
            </template>
          </div>
        </div>

        <div class="vc-block">
          <h4 class="vc-block-heading">Bake Parameters</h4>
          <div class="vc-param-grid">
            <div
              v-for="row in bake.bakeParams"
              :key="row.label"
              class="vc-param"
            >
              <span class="vc-param-label">{{ row.label }}</span>
              <span class="vc-param-value">{{ row.value }}</span>
            </div>
          </div>
        </div>

        <div class="vc-block">
          <h4 class="vc-block-heading">Aliquot Rise</h4>
          <div class="vc-aliquot">
            <template v-for="(row, i) in bake.aliquotRows" :key="row.time + row.rise">
              <div
                v-if="i > 0 && bake.aliquotRows[i - 1].date !== row.date"
                class="vc-day-break"
                aria-hidden="true"
              />
              <div class="vc-aliquot-row">
                <span class="vc-sf-date">
                  {{ i === 0 || bake.aliquotRows[i - 1].date !== row.date ? row.date : '' }}
                </span>
                <span class="vc-sf-time">{{ row.timeOfDay }}</span>
                <span class="vc-aliquot-bar-wrap">
                  <span
                    class="vc-aliquot-bar"
                    :style="{ width: Math.min(parseInt(row.rise.replace(/^~/, ''), 10) || 0, 100) + '%' }"
                  />
                </span>
                <span class="vc-aliquot-pct">{{ row.rise }}</span>
                <span v-if="row.note" class="vc-aliquot-note">{{ row.note }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>

    <footer class="demo-footer">
      <p class="demo-blurb">
        <strong>Decision needed:</strong> pick A, B, or C (or call out a hybrid)
        so PF-177.3 can implement the chosen direction. Demo will be deleted
        when the production subtask ships.
      </p>
    </footer>
  </div>
</template>

<style scoped>
/* ================================================
   DemoStatsBlock — PF-177.1 throwaway spike
   ================================================ */

.demo-stats-block {
  font-family: var(--font-sans);
  color: var(--color-ink);
  max-width: 52rem;
  margin: 0 auto;
  padding: 1rem 0 2rem;
}

.demo-header {
  margin-bottom: 2rem;
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

/* --- Shared variant card frame --- */

.variant-card {
  border: 2px solid var(--color-stone-200);
  background: var(--color-surface);
  padding: 1.25rem 1.25rem 1.5rem;
  margin-bottom: 2rem;
}

.variant-label {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  margin-bottom: 0.375rem;
}

.variant-letter {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--color-accent);
  color: var(--color-stone-50);
  padding: 0.125rem 0.5rem;
  letter-spacing: 0.04em;
}

.variant-name {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-ink);
}

.variant-caption {
  font-size: 0.8125rem;
  color: var(--color-stone-500);
  margin: 0 0 1.25rem;
  line-height: 1.5;
  font-style: italic;
}

/* ============================================================
   VARIANT A — Horizontal bar
   ============================================================ */

.va-bake {
  padding: 0.875rem 0;
  border-top: 1px solid var(--color-stone-100);
}

.va-bake:first-of-type {
  border-top: none;
  padding-top: 0;
}

.va-header {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  margin-bottom: 0.25rem;
}

.va-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink);
}

.va-date,
.va-version {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
}

.va-summary {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-stone-700);
  margin-bottom: 0.5rem;
}

.va-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-stone-50);
  border-left: 2px solid var(--color-accent);
  margin-bottom: 0.625rem;
}

.va-stat {
  display: flex;
  align-items: baseline;
  gap: 0.3125rem;
}

.va-stat-label {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-stone-400);
}

.va-stat-value {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-ink);
}

.va-details {
  margin-top: 0.375rem;
  border-top: 1px dashed var(--color-stone-200);
  padding-top: 0.375rem;
}

.va-details summary {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-stone-500);
  cursor: pointer;
  padding: 0.25rem 0;
}

.va-details summary:hover {
  color: var(--color-ink);
}

.va-details[open] summary {
  color: var(--color-ink);
}

.va-sf-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.25rem 0 0.5rem;
}

.va-th {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-400);
  font-weight: 600;
  text-align: left;
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--color-stone-200);
}

.va-th-right {
  text-align: right;
}

.va-td {
  font-size: 0.8125rem;
  color: var(--color-stone-700);
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--color-stone-100);
}

.va-td-mono {
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.va-td-right {
  text-align: right;
}

.va-params {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.375rem 0.75rem;
  padding: 0.375rem 0 0.25rem;
}

.va-param {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.va-param-label {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-stone-400);
}

.va-param-value {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-ink);
}

/* ============================================================
   VARIANT B — 2-column compact grid
   ============================================================ */

.vb-bake {
  padding: 1rem 0 0.25rem;
  border-top: 1px solid var(--color-stone-100);
}

.vb-bake:first-of-type {
  border-top: none;
  padding-top: 0;
}

.vb-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.vb-title {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.vb-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink);
}

.vb-variant {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-500);
}

.vb-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.vb-date,
.vb-version {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
}

.vb-summary {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-stone-700);
  margin: 0.5rem 0 0.875rem;
}

.vb-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  background: var(--color-stone-50);
  border: 1px solid var(--color-stone-200);
  padding: 0.875rem 1rem;
}

.vb-col-heading {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-accent);
  margin: 0 0 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--color-stone-200);
}

.vb-sub-heading {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-400);
  margin: 0.75rem 0 0.25rem;
}

.vb-sub-heading:first-of-type {
  margin-top: 0;
}

.vb-table {
  width: 100%;
  border-collapse: collapse;
}

.vb-td {
  font-size: 0.75rem;
  color: var(--color-stone-700);
  padding: 0.1875rem 0.25rem;
  border-bottom: 1px solid var(--color-stone-100);
}

.vb-td-mono {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
}

.vb-td-right {
  text-align: right;
}

.vb-dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.1875rem 0.75rem;
  margin: 0;
}

.vb-dt {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-400);
  align-self: center;
}

.vb-dd {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-ink);
  margin: 0;
}

/* ============================================================
   VARIANT C — Vertical list with stacked blocks
   ============================================================ */

.vc-bake {
  padding: 1rem 0 0.25rem;
  border-top: 1px solid var(--color-stone-100);
}

.vc-bake:first-of-type {
  border-top: none;
  padding-top: 0;
}

.vc-header {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  margin-bottom: 0.25rem;
}

.vc-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink);
}

.vc-date,
.vc-version {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-400);
}

.vc-summary {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-stone-700);
  margin: 0 0 0.75rem;
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
  /* date   time   label  temp */
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
}

.vc-sf-date,
.vc-sf-time {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-stone-600);
  white-space: nowrap;
}

.vc-sf-date {
  /* Date is only rendered on the first row of each day, so the empty slot
     on subsequent rows keeps the time column aligned. */
  color: var(--color-stone-500);
}

.vc-sf-time {
  text-align: right;
  color: var(--color-stone-500);
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
}

.vc-param-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.375rem 0.75rem;
}

.vc-param {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.75rem;
  padding: 0.1875rem 0;
  border-bottom: 1px dotted var(--color-stone-200);
}

.vc-param-label {
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-400);
}

.vc-param-value {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-ink);
  text-align: right;
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

/* --- Mobile responsive --- */

@media (max-width: 640px) {
  .demo-stats-block {
    padding: 0.75rem 0 2rem;
  }

  .variant-card {
    padding: 1rem 0.875rem 1.25rem;
  }

  /* Variant A: collapse details into tighter stack */
  .va-bar {
    gap: 0.375rem 0.75rem;
    padding: 0.5rem;
  }

  .va-params {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Variant B: stack columns on mobile */
  .vb-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .vb-header {
    flex-direction: column;
    gap: 0.25rem;
  }

  .vb-meta {
    align-items: flex-start;
    flex-direction: row;
    gap: 0.75rem;
  }

  /* Variant C: 2x2 tiles instead of 1x4 */
  .vc-tiles {
    grid-template-columns: repeat(2, 1fr);
  }

  .vc-tile:nth-child(2) {
    border-right: none;
  }

  .vc-tile:nth-child(-n+2) {
    border-bottom: 1px solid var(--color-stone-200);
  }

  .vc-param-grid {
    grid-template-columns: 1fr;
  }

  .vc-sf-row {
    grid-template-columns: 5rem 2.75rem 1fr auto;
    font-size: 0.6875rem;
  }

  .vc-aliquot-row {
    grid-template-columns: 5rem 2.75rem 1fr 2.5rem;
  }

  .vc-aliquot-note {
    padding-left: 8.75rem;
  }
}
</style>
