<script setup lang="ts">
/**
 * DemoStateNoteTables — PF-180.1 throwaway spike
 *
 * Renders 3 visual variants of a state-note table side by side, using a
 * home-made version of The Sourdough Journey V2.0 fermentation chart
 * (dough temp → target aliquot rise %). The goal is to pick a table style
 * for structured content inside state notes.
 *
 * NOTE: This file is disposable — delete after PF-180 implementation ships.
 */

interface ChartRow {
  temp: string
  tempF: number
  rise: string
}

// Sourdough Journey V2.0 style fermentation chart — homemade, from community bread baking references
const rows: ChartRow[] = [
  { temp: '74°F', tempF: 74, rise: '50%' },
  { temp: '76°F', tempF: 76, rise: '60%' },
  { temp: '78°F', tempF: 78, rise: '70%' },
  { temp: '80°F', tempF: 80, rise: '75%' },
  { temp: '82°F', tempF: 82, rise: '80%' }
]
</script>

<template>
  <div class="demo-state-note-tables">
    <header class="demo-header">
      <h1 class="demo-title">Demo — State Note Table Styles (PF-180.1)</h1>
      <p class="demo-blurb">
        Throwaway spike for PF-180. Three table styles side-by-side using the
        same data: a home-made fermentation chart (dough temp → target
        aliquot rise %) styled after The Sourdough Journey V2.0. Pick the
        direction that feels right for structured content inside state notes,
        and PF-180 implementation will build against it.
      </p>
      <p class="demo-blurb">
        <strong>Evaluate:</strong> border style, header tone, row striping,
        numeric alignment, density, and how each variant handles narrow
        mobile screens.
      </p>
    </header>

    <!-- ============================================================
         VARIANT A — Full grid
         ============================================================ -->
    <section class="variant-card">
      <div class="variant-label">
        <span class="variant-letter">A</span>
        <span class="variant-name">Full grid — borders on all cells, bold header, comfortable padding</span>
      </div>
      <p class="variant-caption">
        Classic spreadsheet feel. Heavier visual weight; good for longer
        reference tables the user scans often. Not optimized for narrow
        mobile widths — will shrink in place.
      </p>

      <table class="va-table">
        <caption class="va-caption">Target aliquot rise by dough temperature</caption>
        <thead>
          <tr>
            <th scope="col" class="va-th">Dough Temp</th>
            <th scope="col" class="va-th va-th-right">Target Rise</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="'A-' + row.temp">
            <td class="va-td">{{ row.temp }}</td>
            <td class="va-td va-td-right va-td-mono">{{ row.rise }}</td>
          </tr>
        </tbody>
      </table>

      <p class="va-source">Adapted from The Sourdough Journey V2.0 fermentation chart</p>
    </section>

    <!-- ============================================================
         VARIANT B — Bottom borders + subtle mono uppercase header + zebra
         ============================================================ -->
    <section class="variant-card">
      <div class="variant-label">
        <span class="variant-letter">B</span>
        <span class="variant-name">Bottom borders only — subtle header, zebra striping, editorial feel</span>
      </div>
      <p class="variant-caption">
        Lighter weight than Variant A; borrows from editorial / prose tables.
        Zebra rows help scanability without adding grid lines. Still not
        mobile-adaptive (horizontal scroll only if overflowed).
      </p>

      <p class="vb-source">Adapted from The Sourdough Journey V2.0 fermentation chart</p>

      <table class="vb-table">
        <thead>
          <tr>
            <th scope="col" class="vb-th">Dough Temp</th>
            <th scope="col" class="vb-th vb-th-right">Target Rise</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="'B-' + row.temp">
            <td class="vb-td">{{ row.temp }}</td>
            <td class="vb-td vb-td-right vb-td-mono">{{ row.rise }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ============================================================
         VARIANT C — Monospace compact + mobile horizontal scroll wrapper
         ============================================================ -->
    <section class="variant-card">
      <div class="variant-label">
        <span class="variant-letter">C</span>
        <span class="variant-name">Monospace compact — all mono, tight padding, mobile-adaptive</span>
      </div>
      <p class="variant-caption">
        All-mono for a "code table" feel that matches the proofed. brand.
        <strong>This variant is mobile-adaptive:</strong> the table is wrapped
        in a horizontal scroll container so tight mobile viewports don't
        squeeze columns. Right-aligned numerics, no borders — just rhythm.
      </p>

      <div class="vc-scroll">
        <table class="vc-table">
          <thead>
            <tr>
              <th scope="col" class="vc-th">dough_temp</th>
              <th scope="col" class="vc-th vc-th-right">target_rise</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="'C-' + row.temp">
              <td class="vc-td">{{ row.temp }}</td>
              <td class="vc-td vc-td-right">{{ row.rise }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="vc-source">// adapted from The Sourdough Journey V2.0 fermentation chart</p>
    </section>

    <footer class="demo-footer">
      <p class="demo-blurb">
        <strong>Decision needed:</strong> pick A, B, or C (or a hybrid) so
        PF-180 can implement the chosen direction for structured tables in
        state notes. Demo will be deleted when PF-180 ships.
      </p>
    </footer>
  </div>
</template>

<style scoped>
/* ================================================
   DemoStateNoteTables — PF-180.1 throwaway spike
   ================================================ */

.demo-state-note-tables {
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
  margin: 0 0 1rem;
  line-height: 1.5;
  font-style: italic;
}

.variant-caption strong {
  color: var(--color-ink);
  font-weight: 600;
  font-style: normal;
}

/* ============================================================
   VARIANT A — Full grid
   ============================================================ */

.va-table {
  width: 100%;
  max-width: 28rem;
  border-collapse: collapse;
  border: 2px solid var(--color-stone-300);
}

.va-caption {
  caption-side: top;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-stone-600);
  padding: 0 0 0.5rem;
}

.va-th {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-ink);
  background: var(--color-stone-100);
  text-align: left;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-stone-300);
}

.va-th-right {
  text-align: right;
}

.va-td {
  font-size: 0.875rem;
  color: var(--color-stone-800);
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-stone-300);
}

.va-td-right {
  text-align: right;
}

.va-td-mono {
  font-family: var(--font-mono);
}

.va-source {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-style: italic;
  color: var(--color-stone-400);
  margin: 0.625rem 0 0;
}

/* ============================================================
   VARIANT B — Bottom borders only, subtle mono header, zebra
   ============================================================ */

.vb-source {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-style: italic;
  color: var(--color-stone-400);
  margin: 0 0 0.5rem;
}

.vb-table {
  width: 100%;
  max-width: 28rem;
  border-collapse: collapse;
}

.vb-th {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-stone-400);
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 2px solid var(--color-stone-300);
  background: transparent;
}

.vb-th-right {
  text-align: right;
}

.vb-td {
  font-size: 0.875rem;
  color: var(--color-stone-800);
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-stone-100);
}

.vb-table tbody tr:nth-child(odd) {
  background: var(--color-stone-50);
}

.vb-td-right {
  text-align: right;
}

.vb-td-mono {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}

/* ============================================================
   VARIANT C — Monospace compact with horizontal scroll wrapper
   ============================================================ */

.vc-scroll {
  overflow-x: auto;
  /* Visual hint that it can scroll on narrow screens */
  border-left: 2px solid var(--color-accent);
  padding-left: 0.75rem;
  margin-bottom: 0.5rem;
}

.vc-table {
  width: 100%;
  max-width: 28rem;
  min-width: 16rem;
  border-collapse: collapse;
  font-family: var(--font-mono);
}

.vc-th {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: lowercase;
  color: var(--color-stone-400);
  text-align: left;
  padding: 0.375rem 0.75rem 0.375rem 0;
  border-bottom: 1px dashed var(--color-stone-300);
}

.vc-th-right {
  text-align: right;
  padding-right: 0;
}

.vc-td {
  font-size: 0.8125rem;
  color: var(--color-ink);
  padding: 0.3125rem 0.75rem 0.3125rem 0;
}

.vc-td-right {
  text-align: right;
  padding-right: 0;
  color: var(--color-accent);
  font-weight: 500;
}

.vc-source {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-stone-400);
  margin: 0.375rem 0 0;
}

/* --- Mobile responsive --- */

@media (max-width: 640px) {
  .demo-state-note-tables {
    padding: 0.75rem 0 2rem;
  }

  .variant-card {
    padding: 1rem 0.875rem 1.25rem;
  }

  /* Variant A/B: shrink cell padding on narrow screens */
  .va-th,
  .va-td {
    padding: 0.5rem 0.625rem;
    font-size: 0.8125rem;
  }

  .vb-th,
  .vb-td {
    padding: 0.4375rem 0.5rem;
  }

  .vb-td {
    font-size: 0.8125rem;
  }

  /* Variant C: already mobile-adaptive via .vc-scroll wrapper */
  .vc-td {
    font-size: 0.75rem;
  }
}
</style>
