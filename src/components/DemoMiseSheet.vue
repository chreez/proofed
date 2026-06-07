<script setup lang="ts">
const CAMBROS = [
  { size: '2 qt', form: 'round', heightPct: 50 },
  { size: '4 qt', form: 'round', heightPct: 68 },
  { size: '6 qt', form: 'round', heightPct: 82 },
  { size: '12 qt', form: 'square', heightPct: 78 },
  { size: '22 qt', form: 'square', heightPct: 96 }
] as const

const SAMPLE_INGREDIENTS = [
  { name: 'Eggs', perPackage: 'flat of 30 · ~1500 g', form: 'flat' },
  { name: 'Butter block', perPackage: '1 lb · ~454 g', form: 'block' },
  { name: 'Yeast block', perPackage: '1 lb brick · ~454 g', form: 'brick' },
  { name: 'Milk jug', perPackage: '1 gal · ~3785 g', form: 'jug' }
] as const

function printNow() {
  window.print()
}
</script>

<template>
  <div class="mise-page">
    <div class="screen-toolbar no-print">
      <span class="font-mono text-xs text-stone-500">Demo · Mise-en-Place Container Sheet · pen-and-paper prototype</span>
      <button class="btn-secondary text-xs" @click="printNow">Print</button>
    </div>

    <article class="sheet">
      <header class="sheet-header">
        <h1 class="sheet-title font-mono">Mise-en-Place Container Sheet</h1>
        <div class="sheet-meta font-mono">proofed. · pastry station · v0 mock</div>

        <div class="pen-row">
          <label class="pen-label font-mono">Recipe</label>
          <div class="pen-line"></div>
        </div>

        <div class="pen-row pen-row-scale">
          <span class="pen-label font-mono">Scale</span>
          <span class="scale-opt"><span class="ck"></span> x1</span>
          <span class="scale-opt"><span class="ck"></span> x2</span>
          <span class="scale-opt"><span class="ck"></span> x4</span>
          <span class="scale-opt"><span class="ck"></span> x8</span>
          <span class="scale-opt scale-opt-custom">
            <span class="ck"></span> x<span class="pen-mini-line"></span>
          </span>
        </div>
      </header>

      <section class="sample-block">
        <div class="block-heading font-mono">
          Sample ingredient packages
          <span class="mock-pill font-mono">MOCK</span>
        </div>
        <p class="block-hint font-mono">
          Use per-package weight to compute: <em>target g ÷ per-package g = packages to grab</em>.
        </p>
        <table class="sample-table">
          <thead>
            <tr>
              <th class="font-mono">Ingredient</th>
              <th class="font-mono">Form</th>
              <th class="font-mono">~ Weight / package</th>
              <th class="font-mono">Target (g)</th>
              <th class="font-mono">Packages</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ing in SAMPLE_INGREDIENTS" :key="ing.name">
              <td>{{ ing.name }}</td>
              <td class="text-muted">{{ ing.form }}</td>
              <td class="font-mono">{{ ing.perPackage }}</td>
              <td class="pen-cell"></td>
              <td class="pen-cell pen-cell-narrow"></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="container-block">
        <div class="block-heading font-mono">
          Container grid — cambros
          <span class="mock-pill font-mono">MOCK SHAPES</span>
        </div>
        <p class="block-hint font-mono">
          One row per slot. Pen-fill what goes in each. All weights in grams.
        </p>

        <div class="grid-head font-mono">
          <div class="col col-cambro">Cambro</div>
          <div class="col col-qty">Qty</div>
          <div class="col col-ingredient">Ingredient</div>
          <div class="col col-target">Target g</div>
          <div class="col col-pkg">g / pkg</div>
          <div class="col col-pkgs">Pkgs</div>
          <div class="col col-notes">Notes</div>
        </div>

        <div v-for="cambro in CAMBROS" :key="cambro.size" class="grid-row">
          <div class="col col-cambro cambro-cell">
            <svg
              v-if="cambro.form === 'round'"
              class="cambro-svg"
              viewBox="0 0 60 100"
              :style="{ height: `${cambro.heightPct}%` }"
              aria-hidden="true"
            >
              <ellipse cx="30" cy="8" rx="22" ry="4" fill="none" stroke="currentColor" stroke-width="2" />
              <line x1="8" y1="8" x2="12" y2="94" stroke="currentColor" stroke-width="2" />
              <line x1="52" y1="8" x2="48" y2="94" stroke="currentColor" stroke-width="2" />
              <ellipse cx="30" cy="94" rx="18" ry="3.5" fill="none" stroke="currentColor" stroke-width="2" />
              <ellipse cx="30" cy="8" rx="22" ry="4" fill="currentColor" opacity="0.05" />
              <line x1="13" y1="30" x2="47" y2="30" stroke="currentColor" stroke-width="0.6" opacity="0.5" />
              <line x1="13" y1="50" x2="47" y2="50" stroke="currentColor" stroke-width="0.6" opacity="0.5" />
              <line x1="13" y1="70" x2="47" y2="70" stroke="currentColor" stroke-width="0.6" opacity="0.5" />
            </svg>
            <svg
              v-else
              class="cambro-svg"
              viewBox="0 0 60 100"
              :style="{ height: `${cambro.heightPct}%` }"
              aria-hidden="true"
            >
              <polygon
                points="8,6 52,6 47,95 13,95"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
              <line x1="8" y1="6" x2="52" y2="6" stroke="currentColor" stroke-width="2.5" />
              <line x1="13" y1="28" x2="47" y2="28" stroke="currentColor" stroke-width="0.6" opacity="0.5" />
              <line x1="13" y1="52" x2="47" y2="52" stroke="currentColor" stroke-width="0.6" opacity="0.5" />
              <line x1="13" y1="76" x2="47" y2="76" stroke="currentColor" stroke-width="0.6" opacity="0.5" />
            </svg>
            <span class="cambro-label font-mono">{{ cambro.size }}</span>
          </div>
          <div class="col col-qty pen-cell"></div>
          <div class="col col-ingredient pen-cell"></div>
          <div class="col col-target pen-cell"></div>
          <div class="col col-pkg pen-cell"></div>
          <div class="col col-pkgs pen-cell"></div>
          <div class="col col-notes pen-cell"></div>
        </div>
      </section>

      <section class="footer-block">
        <div class="block-heading font-mono">Pull list — final tally</div>
        <p class="block-hint font-mono">Tick as each item is staged at the station.</p>
        <div class="pull-grid">
          <div class="pull-col">
            <div class="pull-col-head font-mono">Containers</div>
            <div v-for="n in 5" :key="`c${n}`" class="pull-line">
              <span class="ck"></span><span class="pen-line pen-line-thin"></span>
            </div>
          </div>
          <div class="pull-col">
            <div class="pull-col-head font-mono">Ingredient packages</div>
            <div v-for="n in 5" :key="`i${n}`" class="pull-line">
              <span class="ck"></span><span class="pen-line pen-line-thin"></span>
            </div>
          </div>
        </div>
      </section>

      <footer class="sheet-footnote font-mono">
        Demo only · container sizes placeholder · confirm taxonomy with Chef Kate
      </footer>
    </article>
  </div>
</template>

<style scoped>
.mise-page {
  background: var(--color-stone-100);
  min-height: 100vh;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.screen-toolbar {
  width: 100%;
  max-width: 8.5in;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.25rem;
}

.sheet {
  width: 8.5in;
  min-height: 11in;
  background: var(--color-surface);
  color: var(--color-ink);
  border: 2px solid var(--color-stone-300);
  padding: 0.5in 0.5in 0.4in;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-family: 'Inter', system-ui, sans-serif;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.sheet-header {
  border-bottom: 2px solid var(--color-ink);
  padding-bottom: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.sheet-title {
  font-size: 1.45rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
}

.sheet-meta {
  font-size: 0.7rem;
  color: var(--color-stone-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.pen-row {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
}
.pen-row-scale {
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 0.15rem;
}

.pen-label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-700);
  flex-shrink: 0;
}

.pen-line {
  flex: 1;
  border-bottom: 1px solid var(--color-stone-500);
  height: 1.2rem;
}
.pen-line-thin {
  height: 1rem;
}
.pen-mini-line {
  display: inline-block;
  width: 2.4rem;
  border-bottom: 1px solid var(--color-stone-500);
  height: 0.9rem;
}

.scale-opt {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
}
.scale-opt-custom { gap: 0.25rem; }

.ck {
  display: inline-block;
  width: 0.85rem;
  height: 0.85rem;
  border: 1.5px solid var(--color-ink);
  background: var(--color-surface);
}

.block-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-ink);
}

.block-hint {
  font-size: 0.7rem;
  color: var(--color-stone-500);
  margin: 0 0 0.3rem 0;
}
.block-hint em {
  color: var(--color-crust-dark);
  font-style: normal;
}

.mock-pill {
  font-size: 0.6rem;
  background: var(--color-warning-tint);
  color: var(--color-crust-dark);
  border: 1px solid var(--color-crust);
  padding: 0.1rem 0.35rem;
  letter-spacing: 0.1em;
}

/* Sample table */
.sample-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.sample-table th,
.sample-table td {
  border: 1px solid var(--color-stone-400);
  padding: 0.3rem 0.45rem;
  text-align: left;
  vertical-align: middle;
  height: 1.6rem;
}
.sample-table th {
  background: var(--color-stone-100);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-700);
  font-weight: 600;
}
.text-muted { color: var(--color-stone-500); }

.pen-cell {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 99%,
    var(--color-stone-300) 99%,
    var(--color-stone-300) 100%
  );
}
.pen-cell-narrow { width: 14%; }

/* Container grid */
.grid-head,
.grid-row {
  display: grid;
  grid-template-columns: 1.1fr 0.5fr 1.8fr 0.8fr 0.8fr 0.6fr 1.6fr;
  border: 1px solid var(--color-stone-400);
  border-top: none;
}
.grid-head {
  border-top: 1px solid var(--color-stone-400);
  background: var(--color-stone-100);
}
.grid-head .col {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-700);
  font-weight: 600;
  padding: 0.3rem 0.4rem;
  border-right: 1px solid var(--color-stone-300);
}
.grid-row {
  height: 0.85in;
}
.grid-row .col {
  border-right: 1px solid var(--color-stone-300);
  padding: 0.25rem 0.4rem;
  display: flex;
  align-items: center;
}
.grid-head .col:last-child,
.grid-row .col:last-child { border-right: none; }

.cambro-cell {
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.15rem;
  color: var(--color-crust-dark);
}
.cambro-svg {
  width: 1.4rem;
  display: block;
}
.cambro-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-ink);
}

/* Pull list */
.pull-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  border: 1px solid var(--color-stone-400);
  padding: 0.4rem 0.5rem;
}
.pull-col-head {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-700);
  margin-bottom: 0.2rem;
}
.pull-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.15rem;
}

.sheet-footnote {
  font-size: 0.65rem;
  color: var(--color-stone-500);
  text-align: center;
  margin-top: auto;
  padding-top: 0.4rem;
  border-top: 1px dashed var(--color-stone-300);
}

@media print {
  .no-print { display: none !important; }
  .mise-page {
    background: white;
    padding: 0;
    min-height: 0;
  }
  .sheet {
    border: none;
    box-shadow: none;
    width: 100%;
    min-height: 0;
    padding: 0.35in 0.4in;
  }
  @page {
    size: letter;
    margin: 0.35in;
  }
}
</style>
