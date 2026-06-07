<script setup lang="ts">
const CONTAINERS = [
  { size: '2 qt', form: 'round', qty: 1, heightPct: 48, purpose: 'small portions — salt, leaven, spice' },
  { size: '4 qt', form: 'round', qty: 1, heightPct: 62, purpose: 'mid portions — starter, soft butter, eggs' },
  { size: '8 qt', form: 'round', qty: 2, heightPct: 78, purpose: 'sugar bin · water scoop' },
  { size: '1/3 size · ~12¾ × 6¾ × 6"', form: 'rect-sm', qty: 1, heightPct: 52, purpose: 'small rectangle — shaping / portioning' },
  { size: 'Full size · 20¾ × 12¾ × 6"', form: 'rect-lg', qty: 1, heightPct: 66, purpose: 'big rectangle — sheet-pan staging / dough rest' },
  { size: '18 qt', form: 'square', qty: 1, heightPct: 86, purpose: 'wets — water / milk consolidation' },
  { size: '22 qt', form: 'square', qty: 1, heightPct: 96, purpose: 'dries — flour / sugar consolidation' }
] as const

const INGREDIENTS = [
  { name: 'Eggs', pkg: 'flat of 30', weight: '~1500 g' },
  { name: 'Butter block', pkg: '1 lb block', weight: '~454 g' },
  { name: 'Yeast block', pkg: '1 lb brick', weight: '~454 g' },
  { name: 'Milk jug', pkg: '1 gal', weight: '~3785 g' }
] as const

function printNow() {
  window.print()
}
</script>

<template>
  <div class="mise-page">
    <section class="demo-intro no-print">
      <div class="demo-intro-head">
        <span class="demo-intro-eyebrow">Demo · v1</span>
        <h2 class="demo-intro-title">Mise-en-Place Pull Sheet</h2>
      </div>
      <p class="demo-intro-lede">
        A pre-flight checklist for the pastry bench. Set every container and ingredient
        before the first hand-touch, so the recipe runs from one station instead of three.
      </p>
      <ul class="demo-intro-benefits">
        <li><span class="bullet" aria-hidden="true">·</span> Fewer mid-recipe trips to the walk-in</li>
        <li><span class="bullet" aria-hidden="true">·</span> Faster pickup for newer hands</li>
        <li><span class="bullet" aria-hidden="true">·</span> Doubles as a self-guided tour of the station</li>
      </ul>
      <div class="demo-intro-actions">
        <span class="demo-intro-hint">↓ The printable sheet below contains no instructions — pure pen-and-paper form.</span>
        <button class="toolbar-print" @click="printNow">Print sheet</button>
      </div>
    </section>

    <article class="sheet">
      <header class="sheet-header">
        <div class="title-row">
          <span class="title-eyebrow">Pastry Station</span>
          <h1 class="sheet-title">Mise-en-Place Pull Sheet</h1>
          <span class="title-rule" aria-hidden="true"></span>
        </div>
      </header>

      <section class="form-block">
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
      </section>

      <section class="container-block">
        <div class="block-heading font-mono">
          Container pull
          <span class="mock-pill font-mono">SIZES TBD · CHEF KATE</span>
        </div>
        <p class="block-hint font-mono">
          Pre-printed counts + purpose hints. Tick as each is staged at the station.
        </p>

        <div class="grid-head font-mono">
          <div class="col col-cambro">Container</div>
          <div class="col col-purpose">Purpose hint · qty · pulled</div>
        </div>

        <div v-for="c in CONTAINERS" :key="`${c.size}-${c.purpose}`" class="grid-row">
          <div class="col col-cambro cambro-cell">
            <svg
              v-if="c.form === 'round'"
              class="cambro-svg"
              viewBox="0 0 60 100"
              :style="{ height: `${c.heightPct}%` }"
              aria-hidden="true"
            >
              <ellipse cx="30" cy="8" rx="22" ry="4" fill="none" stroke="currentColor" stroke-width="2.5" />
              <line x1="8" y1="8" x2="12" y2="94" stroke="currentColor" stroke-width="2.5" />
              <line x1="52" y1="8" x2="48" y2="94" stroke="currentColor" stroke-width="2.5" />
              <ellipse cx="30" cy="94" rx="18" ry="3.5" fill="none" stroke="currentColor" stroke-width="2.5" />
              <line x1="13" y1="26" x2="47" y2="26" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <line x1="13" y1="46" x2="47" y2="46" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <line x1="13" y1="66" x2="47" y2="66" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <line x1="13" y1="86" x2="47" y2="86" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <ellipse cx="30" cy="8" rx="22" ry="4" fill="currentColor" opacity="0.06" />
            </svg>
            <svg
              v-else-if="c.form === 'rect-sm'"
              class="cambro-svg cambro-svg-wide"
              viewBox="0 0 100 50"
              :style="{ height: `${c.heightPct}%` }"
              aria-hidden="true"
            >
              <rect x="20" y="6" width="60" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="2.5" />
              <line x1="20" y1="6" x2="80" y2="6" stroke="currentColor" stroke-width="3" />
              <line x1="26" y1="18" x2="74" y2="18" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <line x1="26" y1="28" x2="74" y2="28" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <line x1="26" y1="38" x2="74" y2="38" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <rect x="20" y="6" width="60" height="40" rx="2" fill="currentColor" opacity="0.04" />
            </svg>
            <svg
              v-else-if="c.form === 'rect-lg'"
              class="cambro-svg cambro-svg-wide"
              viewBox="0 0 100 60"
              :style="{ height: `${c.heightPct}%` }"
              aria-hidden="true"
            >
              <rect x="4" y="6" width="92" height="48" rx="2" fill="none" stroke="currentColor" stroke-width="2.5" />
              <line x1="4" y1="6" x2="96" y2="6" stroke="currentColor" stroke-width="3" />
              <line x1="12" y1="20" x2="88" y2="20" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <line x1="12" y1="32" x2="88" y2="32" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <line x1="12" y1="44" x2="88" y2="44" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <rect x="4" y="6" width="92" height="48" rx="2" fill="currentColor" opacity="0.04" />
            </svg>
            <svg
              v-else
              class="cambro-svg"
              viewBox="0 0 60 100"
              :style="{ height: `${c.heightPct}%` }"
              aria-hidden="true"
            >
              <polygon
                points="8,6 52,6 47,95 13,95"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              />
              <line x1="8" y1="6" x2="52" y2="6" stroke="currentColor" stroke-width="3" />
              <line x1="13" y1="26" x2="47" y2="26" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <line x1="13" y1="48" x2="47" y2="48" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <line x1="13" y1="70" x2="47" y2="70" stroke="currentColor" stroke-width="0.7" opacity="0.5" />
              <polygon points="8,6 52,6 47,95 13,95" fill="currentColor" opacity="0.04" />
            </svg>
            <span class="cambro-label font-mono">
              {{ c.size }}{{ c.form === 'round' ? ' round' : c.form === 'square' ? ' square' : '' }}
            </span>
          </div>
          <div class="col col-purpose purpose-cell">
            <div class="purpose-text">{{ c.purpose }}</div>
            <div class="purpose-meta">
              <span class="qty-pen">
                <span class="qty-pen-label">qty</span>
                <span class="qty-pen-box"></span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="ingredient-block">
        <div class="block-heading font-mono">
          Ingredient pull
          <span class="mock-pill font-mono mock-pill-soft">STANDING ORDER</span>
        </div>
        <p class="block-hint font-mono">
          Pre-printed for the bakery's standard packages. Pen the count needed. Tick when grabbed.
        </p>
        <table class="ing-table">
          <thead>
            <tr>
              <th class="font-mono">Ingredient</th>
              <th class="font-mono">Package</th>
              <th class="font-mono">~ Weight / pkg</th>
              <th class="font-mono"># needed</th>
              <th class="font-mono">Pulled</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ing in INGREDIENTS" :key="ing.name">
              <td>{{ ing.name }}</td>
              <td class="text-muted">{{ ing.pkg }}</td>
              <td class="font-mono">{{ ing.weight }}</td>
              <td class="pen-cell pen-cell-narrow"></td>
              <td class="check-cell"><span class="ck ck-lg"></span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="extras-block">
        <div class="block-heading font-mono">Extras / one-offs</div>
        <p class="block-hint font-mono">Anything not on the standing order. Pen-fill.</p>
        <div class="extras-grid">
          <div v-for="n in 4" :key="n" class="extras-row">
            <span class="ck ck-lg"></span>
            <span class="pen-line pen-line-thin"></span>
          </div>
        </div>
      </section>

      <footer class="sheet-footnote">
        Container taxonomy + standing-order weights pending Chef Kate's review
      </footer>
    </article>
  </div>
</template>

<style scoped>
.mise-page {
  /* epicerie-inspired palette, scoped */
  --ep-bg: #efe9dd;
  --ep-paper: #faf6ed;
  --ep-ink: #2a2620;
  --ep-muted: #8a8170;
  --ep-rule: #d8cfbb;
  --ep-accent: #b89968;

  background: var(--ep-bg);
  color: var(--ep-ink);
  min-height: 100vh;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  font-family: 'Inter', system-ui, sans-serif;
}

.screen-toolbar {
  width: 100%;
  max-width: 8.5in;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 0.25rem;
}
.toolbar-print {
  background: var(--ep-ink);
  color: var(--ep-paper);
  border: none;
  padding: 0.4rem 1.1rem;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  font-family: inherit;
}
.toolbar-print:hover { background: var(--ep-accent); }

.sheet {
  width: 8.5in;
  min-height: 11in;
  background: var(--ep-paper);
  color: var(--ep-ink);
  border: 1px solid var(--ep-rule);
  padding: 0.6in 0.55in 0.45in;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  box-shadow: 0 2px 14px rgba(40,30,20,0.08);
}

.sheet-header {
  padding-bottom: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.title-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.7rem;
}

.title-eyebrow {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  color: var(--ep-muted);
  font-weight: 400;
}

.sheet-title {
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ep-ink);
  margin: 0;
}

.title-rule {
  display: inline-block;
  width: 1.6rem;
  height: 1px;
  background: var(--ep-accent);
}

.demo-intro {
  width: 8.5in;
  max-width: 100%;
  background: var(--ep-paper);
  border: 1px dashed var(--ep-rule);
  padding: 1.1rem 1.3rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.demo-intro-head {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
}
.demo-intro-eyebrow {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--ep-accent);
  font-weight: 500;
}
.demo-intro-title {
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ep-ink);
  margin: 0;
}
.demo-intro-lede {
  font-size: 0.85rem;
  color: var(--ep-ink);
  line-height: 1.55;
  margin: 0;
  max-width: 6.5in;
}
.demo-intro-benefits {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--ep-muted);
}
.demo-intro-benefits li {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.demo-intro-benefits .bullet {
  color: var(--ep-accent);
  font-size: 1rem;
  line-height: 0;
}
.demo-intro-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.3rem;
  padding-top: 0.7rem;
  border-top: 1px dashed var(--ep-rule);
}
.demo-intro-hint {
  font-size: 0.7rem;
  font-style: italic;
  color: var(--ep-muted);
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--ep-rule);
}

.pen-row {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
}
.pen-row-scale {
  flex-wrap: wrap;
  gap: 0.7rem;
}

.pen-label {
  font-size: 0.7rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--ep-muted);
  flex-shrink: 0;
}

.pen-line {
  flex: 1;
  border-bottom: 1px solid var(--ep-rule);
  height: 1.25rem;
}
.pen-line-thin { height: 1rem; }
.pen-mini-line {
  display: inline-block;
  width: 2.4rem;
  border-bottom: 1px solid var(--ep-rule);
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
.ck-lg {
  width: 1.05rem;
  height: 1.05rem;
  margin-right: 0.25rem;
}

.block-heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.72rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--ep-ink);
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--ep-rule);
}

.block-hint {
  font-size: 0.72rem;
  color: var(--ep-muted);
  margin: 0.35rem 0 0.4rem 0;
  font-style: italic;
}

.mock-pill {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.58rem;
  background: transparent;
  color: var(--ep-accent);
  border: 1px solid var(--ep-accent);
  padding: 0.12rem 0.45rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 400;
}
.mock-pill-soft {
  color: var(--ep-muted);
  border-color: var(--ep-rule);
}

/* Container grid */
.grid-head,
.grid-row {
  display: grid;
  grid-template-columns: 1.6fr 3fr;
  border-bottom: 1px solid var(--ep-rule);
}
.grid-head {
  border-top: 1px solid var(--ep-rule);
  border-bottom: 1px solid var(--ep-rule);
  background: transparent;
}
.grid-head .col {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--ep-muted);
  font-weight: 400;
  padding: 0.35rem 0.55rem;
}
.grid-row {
  min-height: 0.76in;
}
.grid-row .col {
  padding: 0.3rem 0.55rem;
  display: flex;
  align-items: center;
}

.cambro-cell {
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  color: var(--ep-accent);
  padding: 0.35rem 0.45rem;
  border-right: 1px solid var(--ep-rule);
}
.cambro-svg {
  width: 2.2rem;
  height: 0.72in;
  display: block;
}
.cambro-svg-wide {
  width: 3rem;
  height: 0.48in;
}
.cambro-label {
  font-size: 0.55rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ep-ink);
  text-align: center;
  line-height: 1.25;
}

.purpose-cell {
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 0.5rem;
}
.purpose-text {
  font-size: 0.78rem;
  color: var(--ep-muted);
  line-height: 1.45;
  font-style: italic;
  font-weight: 300;
}
.purpose-meta {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.qty-pen {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.qty-pen-label {
  font-size: 0.58rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ep-muted);
}
.qty-pen-box {
  display: inline-block;
  width: 2rem;
  height: 1.15rem;
  border: 1px solid var(--ep-ink);
  background: transparent;
}
.check-strip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.check-label {
  font-size: 0.58rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ep-muted);
}

/* Ingredient table */
.ing-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.ing-table th,
.ing-table td {
  border-bottom: 1px solid var(--ep-rule);
  padding: 0.45rem 0.55rem;
  text-align: left;
  vertical-align: middle;
  height: 1.85rem;
}
.ing-table th {
  background: transparent;
  border-top: 1px solid var(--ep-rule);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--ep-muted);
  font-weight: 400;
}
.text-muted { color: var(--ep-muted); font-style: italic; }

.pen-cell {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 99%,
    var(--ep-rule) 99%,
    var(--ep-rule) 100%
  );
}
.pen-cell-narrow { width: 14%; }
.check-cell { width: 9%; text-align: center; }

.ck {
  border-color: var(--ep-ink);
  background: transparent;
}

/* Extras */
.extras-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
  border-top: 1px solid var(--ep-rule);
  border-bottom: 1px solid var(--ep-rule);
  padding: 0.55rem 0.1rem;
}
.extras-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.sheet-footnote {
  font-size: 0.62rem;
  color: var(--ep-muted);
  text-align: center;
  margin-top: auto;
  padding-top: 0.5rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-style: normal;
}

@media print {
  .no-print { display: none !important; }
  .mise-page {
    background: white;
    padding: 0;
    min-height: 0;
  }
  .sheet {
    background: white;
    border: none;
    box-shadow: none;
    width: 100%;
    min-height: 0;
    padding: 0.4in 0.45in;
  }
  @page {
    size: letter;
    margin: 0.35in;
  }
}
</style>
