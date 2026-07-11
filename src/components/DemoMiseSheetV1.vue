<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function openPrintout() {
  router.push('/mise-sheet/v1/printout')
}
</script>

<template>
  <div class="intro-page">
    <article class="intro-card">
      <header class="intro-head">
        <span class="intro-eyebrow">Demo · v1</span>
        <h1 class="intro-title">Mise-en-Place Pull Sheet</h1>
      </header>

      <p class="intro-lede">
        A pre-flight checklist for the pastry bench. Set every container and ingredient
        before the first hand-touch, so the recipe runs from one station instead of three.
      </p>

      <section class="intro-benefits">
        <h2 class="intro-section-label">Why it helps</h2>
        <ul>
          <li><span class="bullet" aria-hidden="true">·</span> Fewer mid-recipe trips to the walk-in</li>
          <li><span class="bullet" aria-hidden="true">·</span> Faster pickup for newer hands — sheet doubles as a station tour</li>
          <li><span class="bullet" aria-hidden="true">·</span> Same form for any recipe — pen-fill, no per-recipe printing</li>
        </ul>
      </section>

      <section class="intro-howto">
        <h2 class="intro-section-label">How to use</h2>
        <ol>
          <li>Write the <strong>recipe</strong> and tick the <strong>scale</strong> at the top.</li>
          <li>Walk down the <strong>container pull</strong> — purpose hints next to each cambro tell you what they're for.</li>
          <li>Fill the qty box for each container as you stage it.</li>
          <li>The <strong>ingredient pull</strong> is pre-printed for the bakery's standing order — eggs, butter blocks, yeast bricks, milk jugs. Just write the count needed.</li>
          <li>Tick the box when each item lands on the bench.</li>
        </ol>
      </section>

      <div class="intro-actions">
        <button class="intro-cta" @click="openPrintout">Open printable sheet →</button>
        <a class="intro-link" href="/mise-sheet/v1/printout" target="_blank" rel="noopener">Open in new tab</a>
      </div>

      <footer class="intro-foot">
        Optimized for mobile review — open the printable on a phone for a true full-bleed preview.
      </footer>
    </article>
  </div>
</template>

<style scoped>
.intro-page {
  --ep-bg: #efe9dd;
  --ep-paper: #faf6ed;
  --ep-ink: #2a2620;
  --ep-muted: #8a8170;
  --ep-rule: #d8cfbb;
  --ep-accent: #b89968;

  display: flex;
  justify-content: center;
  padding: 1.2rem 1rem 3rem;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ep-ink);
}

.intro-card {
  width: 100%;
  max-width: 38rem;
  background: var(--ep-paper);
  border: 1px solid var(--ep-rule);
  padding: 1.5rem 1.6rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.intro-head {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.intro-eyebrow {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--ep-accent);
  font-weight: 500;
}
.intro-title {
  font-size: 1.45rem;
  font-weight: 300;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin: 0;
}

.intro-lede {
  font-size: 0.95rem;
  line-height: 1.55;
  margin: 0;
  color: var(--ep-ink);
}

.intro-section-label {
  font-size: 0.62rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: var(--ep-muted);
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--ep-rule);
}

.intro-benefits ul,
.intro-howto ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--ep-ink);
}
.intro-benefits li {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.intro-benefits .bullet {
  color: var(--ep-accent);
  font-size: 1.1rem;
  line-height: 0;
}
.intro-howto ol {
  counter-reset: step;
}
.intro-howto li {
  counter-increment: step;
  padding-left: 1.7rem;
  position: relative;
}
.intro-howto li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0.05rem;
  width: 1.2rem;
  height: 1.2rem;
  border: 1px solid var(--ep-accent);
  color: var(--ep-accent);
  font-size: 0.65rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.intro-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.4rem;
  padding-top: 0.9rem;
  border-top: 1px dashed var(--ep-rule);
}
.intro-cta {
  background: var(--ep-ink);
  color: var(--ep-paper);
  border: none;
  padding: 0.7rem 1.4rem;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
}
.intro-cta:hover { background: var(--ep-accent); }
.intro-link {
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ep-muted);
  text-decoration: none;
  border-bottom: 1px dashed var(--ep-rule);
  padding-bottom: 0.15rem;
}
.intro-link:hover { color: var(--ep-ink); border-color: var(--ep-ink); }

.intro-foot {
  font-size: 0.7rem;
  font-style: italic;
  color: var(--ep-muted);
  text-align: center;
  border-top: 1px solid var(--ep-rule);
  padding-top: 0.7rem;
}

@media (max-width: 600px) {
  .intro-page { padding: 0.8rem 0.6rem 2rem; }
  .intro-card { padding: 1.1rem 1rem 1.2rem; gap: 0.9rem; }
  .intro-title { font-size: 1.15rem; letter-spacing: 0.12em; }
  .intro-lede { font-size: 0.88rem; }
  .intro-benefits ul,
  .intro-howto ol { font-size: 0.82rem; }
  .intro-actions { gap: 0.6rem; }
  .intro-cta { width: 100%; text-align: center; }
}
</style>
