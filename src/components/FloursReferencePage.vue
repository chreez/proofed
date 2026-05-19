<script setup lang="ts">
import { useSeoMeta } from '@unhead/vue'

useSeoMeta({
  title: 'Barton Springs Mill Flours — proofed.',
  description:
    'Reference guide for the six Barton Springs Mill heritage flours: Sonora 00, Ryman Rye, Mediterranean, Marquis, Rouge de Bordeaux, Einkorn. Includes recipe applications.'
})

interface ApplyRow {
  id: string
  name: string
  swap: string
}

interface NewIdea {
  title: string
  detail: string
}

interface SourceLink {
  label: string
  url: string
}

interface Flour {
  slug: string
  number: number
  name: string
  protein: string
  className: string
  hydration: string
  hydrationKind: 'up' | 'down' | 'match'
  origin: string
  flavor: string
  strengths: string[]
  quirksTitle: string
  quirks: string[]
  applies: ApplyRow[]
  newIdeas: NewIdea[]
  sources: SourceLink[]
}

const flours: Flour[] = [
  {
    slug: 'sonora',
    number: 1,
    name: 'Sonora "00"',
    protein: '11.5% protein',
    className: 'Soft white winter',
    hydration: '+5% hyd',
    hydrationKind: 'up',
    origin:
      'Heritage Mexican / Sonoran wheat documented in the early 1700s. One of the oldest surviving wheats in North America — predates Red Fife and Turkey Red. The "00" version is stone-milled then sifted to pastry-fine grade.',
    flavor: 'Nutty, buttery, gently sweet. Distinctive warmth — not the bland soft-wheat profile.',
    strengths: [
      'Flaky pastry, pie crust, laminated doughs',
      'Flour tortillas, flatbreads (its historical use)',
      'Pancakes, scones, soft cookies'
    ],
    quirksTitle: 'Quirks',
    quirks: [
      'Low gluten — won\'t structure hearth loaves alone',
      'Sifted "00" loses bran cushion → toughens fast if over-mixed',
      'Thirsty — nudge hydration up if dough feels dry'
    ],
    applies: [
      { id: 'tartine-lemon-cream-tart', name: 'Tartine Lemon Cream Tart', swap: '1:1 swap of all 500g AP. Sonora\'s sweetness amplifies the tart shell.' },
      { id: 'tartine-rugelach', name: 'Tartine Rugelach', swap: 'Replace 260g AP with Sonora; keep einkorn portion. Even flakier laminated cream-cheese dough.' },
      { id: 'carrot-cake', name: 'Carrot Cake', swap: '1:1 for all 280g AP. Adds warmth + nuttiness behind the spice.' },
      { id: 'sourdough-cheddar-bay-biscuits', name: 'Sourdough Cheddar Bay Biscuits', swap: '1:1 for 220g AP. Sonora is a biscuit hall-of-famer.' },
      { id: 'sourdough-discard-cheese-crackers', name: 'Sourdough Cheese Crackers', swap: '1:1 for 100g AP. Snappier, more flavor.' },
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Cinnamon Buns', swap: 'Sub 50% (≈265g) of the AP. Don\'t go higher — needs some structure.' }
    ],
    newIdeas: [
      { title: 'Sonora flour tortillas', detail: 'Its native dish. Lard, salt, water, ~30min rest, comal.' },
      { title: 'Sonora sour-cream pie crust', detail: 'Bravetart-style, all-Sonora.' },
      { title: 'Sonora shortbread', detail: 'Three-ingredient showcase (butter / sugar / flour) where the flour is the headline.' }
    ],
    sources: [
      { label: 'BSM Sonora', url: 'https://bartonspringsmill.com/products/sonora-wheat' },
      { label: 'BSM 00 Sonora pastry flour', url: 'https://www.instacart.com/products/21540679-barton-springs-mill-00-sonora-wheat-pastry-flour-per-lb' }
    ]
  },
  {
    slug: 'ryman-rye',
    number: 2,
    name: 'Ryman Rye (whole)',
    protein: 'n/a (rye)',
    className: 'Heritage rye',
    hydration: '+5-10% hyd',
    hydrationKind: 'up',
    origin:
      'Italian Abruzzi-derived winter rye, developed in Georgia in 1953. Originally a cover crop — discovered to bake exceptionally. BSM sources from Enger Farms (Joshua, TX).',
    flavor: 'Lighter and subtly sweeter than pumpernickel-style ryes. Mild spice. Won\'t dominate a blend.',
    strengths: [
      'Sourdough starter food — extremely active fermentation',
      'Mild rye breads, German brötchen, deli rye',
      'Rye chocolate brownies / cookies (depth, no bitterness)'
    ],
    quirksTitle: 'Quirks',
    quirks: [
      'No real gluten — pentosans bind water & structure',
      'Sticky, slack doughs — wet hands, don\'t add flour',
      'High enzyme activity → easy to over-proof. Cooler dough temps, shorter bulk than wheat'
    ],
    applies: [
      { id: 'simple-sourdough-wheat', name: 'Whole Wheat Sourdough', swap: 'Already has 50g rye. Expand to 100-150g Ryman Rye for deeper character.' },
      { id: 'simple-sourdough', name: 'Sourdough Bread (70%)', swap: 'Add 200g Ryman Rye (drop bread flour to 800g). Classic mild-rye sandwich loaf.' },
      { id: 'sourdough-chocolate-chip-cookies', name: 'Sourdough Chocolate Chip Cookies', swap: 'Swap 60g of the 320g flour for Ryman Rye. Rye + chocolate = bakery secret.' },
      { id: 'jalapeno-cheddar-sourdough', name: 'Jalapeño Cheddar Sourdough', swap: 'Add 50-80g Ryman Rye to the 550g bread flour. Adds savory depth.' },
      { id: 'tartine-baguette', name: 'Tartine Baguette', swap: 'Replace 100g of the bread flour with rye for a rustic country baguette.' }
    ],
    newIdeas: [
      { title: '100% Ryman Rye sourdough', detail: 'Dense, dark, lasts a week. Pan-baked, very wet (~95% hyd).' },
      { title: 'Rye chocolate brownies', detail: 'King Arthur / Tartine style. Replaces AP entirely.' },
      { title: 'Rye pie crust', detail: 'For apple or pear pie. 30% rye / 70% AP, all butter.' }
    ],
    sources: [
      { label: 'BSM Ryman Rye', url: 'https://bartonspringsmill.com/products/ryman-rye' },
      { label: 'Central Market BSM Rye', url: 'https://www.centralmarket.com/product/barton-springs-mill-organic-rye-whole-grain-flour-by-lb/3521080' }
    ]
  },
  {
    slug: 'mediterranean',
    number: 3,
    name: 'Mediterranean (whole wheat)',
    protein: '9.4% protein',
    className: 'Soft red winter',
    hydration: '+5% hyd',
    hydrationKind: 'up',
    origin:
      'Colonial-era wheat brought from Genoa, Italy to North America in 1819 — was the most-grown wheat in Texas by 1919, then disappeared for 50 years. BSM revived it (exclusive).',
    flavor: 'Honeyed, soft, gently floral. One of the most delicate-tasting heritage flours.',
    strengths: [
      'Texas-style flour tortillas (its historical role)',
      'Cakes, muffins, pancakes, soft cookies',
      'Soft pizza crusts (Roman-style, not Neapolitan)'
    ],
    quirksTitle: 'Quirks',
    quirks: [
      'Soft wheat — will NOT structure a baguette. Don\'t try.',
      'Despite the name, it\'s not a hard durum — it\'s a delicate pastry-leaning flour.',
      'Cap at ~30% in lean hearth bread'
    ],
    applies: [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Cinnamon Buns', swap: 'Sub 50% (≈265g) of the 531g AP. Adds tenderness + honey notes.' },
      { id: 'sourdough-cinnamon-buns', name: 'Sourdough Cinnamon Buns', swap: '1:1 for the 84g AP. Small portion but adds floral character.' },
      { id: 'carrot-cake', name: 'Carrot Cake', swap: '1:1 for 280g AP. Softer crumb than Sonora swap.' },
      { id: 'sourdough-cheddar-bay-biscuits', name: 'Cheddar Bay Biscuits', swap: '1:1 for 220g AP. Honeyed undertone offsets the cheddar.' }
    ],
    newIdeas: [
      { title: 'Texas-style flour tortillas', detail: 'Mediterranean wheat + lard. The historically authentic build for Texas tortillas.' },
      { title: 'Genoa focaccia', detail: '50/50 Mediterranean + Marquis, olive oil, sea salt. Honors the Genoa origin.' },
      { title: 'Mediterranean drop biscuits', detail: 'Buttermilk, baking powder, no shaping. Showcase the flour.' }
    ],
    sources: [
      { label: 'BSM Mediterranean', url: 'https://bartonspringsmill.com/products/mediterranean' },
      { label: 'Texas Highways feature', url: 'https://texashighways.com/food-drink/barton-springs-mill-brings-previously-unavailable-grains-to-texas-bakers/' }
    ]
  },
  {
    slug: 'marquis',
    number: 4,
    name: 'Marquis',
    protein: '10.5-12% protein',
    className: 'Hard red (winter per BSM)',
    hydration: 'match AP',
    hydrationKind: 'match',
    origin:
      'Developed 1892-1909 in Canada: Red Fife × Hard Red Calcutta. By 1920 it was 90% of Canadian Prairie hard red spring and 11M US acres — Marquis literally built the North American bread-wheat industry. BSM\'s selection is hard red winter (Texas-adapted).',
    flavor: 'Nutty, very mild, non-bitter. The "approachable heritage bread flour" — milder than Red Fife or Turkey Red.',
    strengths: [
      'Sourdough country loaves (boule, batard)',
      'Croissants & laminated doughs (lower-protein wheat laminates well)',
      'Pretzels, bagels, soft pretzels, yeasted rolls'
    ],
    quirksTitle: 'Quirks',
    quirks: [
      'Lower protein than King Arthur Bread Flour (~12.7%)',
      'Use extended autolyse + longer bulk to build structure',
      'Won\'t hit massive oven spring of modern bread flour — expect tighter, more pleasant crumb',
      'Hydration ceiling ~75% for 100% Marquis hearth loaf'
    ],
    applies: [
      { id: 'simple-sourdough', name: 'Sourdough Bread (70%)', swap: '1:1 for all 1000g bread flour. The cleanest showcase for Marquis.' },
      { id: 'potato-buns', name: 'Potato Buns for Smashburgers', swap: '1:1 for 450g bread flour. Mid-protein is ideal for enriched buns.' },
      { id: 'ny-style-pizza', name: 'NY-Style Pizza Dough', swap: '1:1 for 463g bread flour. Slightly tighter chew, more flavor.' },
      { id: 'sourdough-pizza-dough', name: 'Sourdough Pizza Dough', swap: '1:1 for 413g bread flour. Or 50/50 with Rouge for flavor + structure.' },
      { id: 'jalapeno-cheddar-sourdough', name: 'Jalapeño Cheddar Sourdough', swap: '1:1 for all 550g bread flour. May want slightly less hydration (65% vs 67%).' },
      { id: 'sourdough-cheddar-cheese', name: 'Cheddar Cheese Bread', swap: '1:1 for 1000g bread flour.' },
      { id: 'ichiran-ramen', name: 'Ichiran Ramen', swap: '1:1 for 400g bread flour. Heritage-grain ramen is a vibe.' },
      { id: 'tomita-tsukemen', name: 'Tomita Tsukemen', swap: '1:1 for 940g bread flour.' },
      { id: 'tartine-baguette', name: 'Tartine Baguette', swap: '1:1 for 350g bread flour portion (keep AP as is, or swap that for Sonora).' }
    ],
    newIdeas: [
      { title: 'Croissants', detail: 'Marquis is famously well-suited for lamination. Classic French method.' },
      { title: 'Pretzel rolls', detail: 'Baking soda dip + Marquis chewy crumb.' },
      { title: 'Pain de mie', detail: 'Pullman loaf, milk-enriched, perfect Marquis showcase.' }
    ],
    sources: [
      { label: 'BSM Marquis', url: 'https://bartonspringsmill.com/products/marquis-wheat-heirloom' },
      { label: 'Wikipedia: Marquis Wheat', url: 'https://en.wikipedia.org/wiki/Marquis_wheat' },
      { label: 'Canadian Encyclopedia', url: 'https://www.thecanadianencyclopedia.ca/en/article/marquis-wheat' }
    ]
  },
  {
    slug: 'rouge',
    number: 5,
    name: 'Rouge de Bordeaux',
    protein: '14.2% protein',
    className: 'Hard red winter',
    hydration: '+5-10% hyd',
    hydrationKind: 'up',
    origin:
      'Mid-1800s French landrace from the Bordeaux region — beloved by French bakers for generations, used historically for baguettes, country loaves, and croissants before industrial cultivars displaced it.',
    flavor: 'The flavor flour. Rich, nutty, earthy, with pronounced cinnamon + baking-spice notes. Finished loaves smell pre-spiced.',
    strengths: [
      'High-hydration artisan sourdough — boule, batard, miche',
      'Baguettes (its historical use)',
      'Croissants & viennoiserie (flavor survives all that butter)',
      'Whole-grain pan loaves where the wheat itself should taste like something'
    ],
    quirksTitle: 'Quirks',
    quirks: [
      'Heritage gluten = extensible, not super-elastic',
      'Don\'t expect modern bread-flour oven spring — expect more open, irregular crumb instead',
      'Very thirsty: start 78-82% hydration with autolyse'
    ],
    applies: [
      { id: 'simple-sourdough', name: 'Sourdough Bread (70%)', swap: 'Perfect showcase. 1:1 for all 1000g bread flour, bump hydration to 78%. Best loaf you\'ll ever make.' },
      { id: 'simple-sourdough-wheat', name: 'Whole Wheat Sourdough', swap: 'Sub 300-500g of the 800g bread flour. Flavor on flavor.' },
      { id: 'tartine-baguette', name: 'Tartine Baguette', swap: 'This is what Rouge was MADE for. 1:1 swap the bread flour, keep AP. Iconic.' },
      { id: 'sourdough-pizza-dough', name: 'Sourdough Pizza Dough', swap: '30-50% Rouge blend with Marquis. Spiced, char-friendly crust.' },
      { id: 'jalapeno-cheddar-sourdough', name: 'Jalapeño Cheddar Sourdough', swap: 'Sub 100-200g for added depth — don\'t go 100% (cheddar needs structure).' },
      { id: 'sourdough-cinnamon-buns', name: 'Sourdough Cinnamon Buns', swap: 'The cinnamon notes in Rouge synergize with the filling. Sub the 84g AP and 20-30% of the bread flour.' }
    ],
    newIdeas: [
      { title: 'Rouge de Bordeaux miche', detail: 'Large 1.5kg country boule. Long ferment. The miche of your dreams.' },
      { title: 'Baguette tradition', detail: 'Long, slow, high-hydration baguettes using Rouge.' },
      { title: 'Rouge brioche', detail: 'For flavor that punches through butter and eggs.' }
    ],
    sources: [
      { label: 'BSM Rouge', url: 'https://bartonspringsmill.com/products/rouge-de-bordeax-wheat' },
      { label: 'Breadtopia Rouge', url: 'https://breadtopia.com/store/rouge-de-bordeaux-whole-grain-flour/' },
      { label: 'Weatherbury Farm', url: 'https://weatherburyfarm.com/organic-flours-milled-products/products/organic-whole-sifted-rouge-de-bordeaux-bread-flour/' }
    ]
  },
  {
    slug: 'einkorn',
    number: 6,
    name: 'Einkorn (whole)',
    protein: '~16-18% (weak gluten)',
    className: 'Ancient diploid',
    hydration: '−15-25% hyd',
    hydrationKind: 'down',
    origin:
      'Triticum monococcum — the oldest cultivated wheat (~30,000 years). Diploid (14 chromosomes vs modern wheat\'s 42). Domesticated in the Fertile Crescent. The hulled grain protects from weather + pests.',
    flavor: 'Pronounced sweetness, golden-yellow color, nutty with grassy hay undertones. Most distinctly flavored of the six.',
    strengths: [
      'Quick breads, pancakes, muffins, cookies (weak gluten irrelevant or a plus)',
      'Fresh pasta (low elasticity = silkier pasta)',
      'Flatbreads, crackers, pie crust (tender)',
      '20-30% blend in sourdough for flavor + color'
    ],
    quirksTitle: 'Quirks — the weakest gluten you\'ll bake with',
    quirks: [
      'Reduce hydration 15-25% — start 60-65% for 100% einkorn vs your usual 75%',
      'Don\'t over-mix. Window pane test LIES — dough feels strong, then collapses at shaping',
      'Wet hands, light touch, short bulk. Sticky throughout; resist adding flour',
      'High protein number is misleading — high gliadin-to-glutenin = lots of protein, poor structure'
    ],
    applies: [
      { id: 'tartine-rugelach', name: 'Tartine Rugelach', swap: 'Already uses 65g einkorn. Bump to 130g (half the AP) for amplified flakiness — your dough already proves out.' },
      { id: 'sourdough-chocolate-chip-cookies', name: 'Sourdough Chocolate Chip Cookies', swap: 'Sub 100g of the AP for einkorn. Cookies forgive weak gluten and gain nuttiness.' },
      { id: 'carrot-cake', name: 'Carrot Cake', swap: 'Sub 20% (≈55g) of the AP for einkorn. Don\'t push higher — eggs do enough lift.' },
      { id: 'sourdough-discard-cheese-crackers', name: 'Cheese Crackers', swap: 'Sub 30g of the 100g AP for einkorn. Crisper, nuttier.' },
      { id: 'simple-sourdough-wheat', name: 'Whole Wheat Sourdough', swap: 'Sub 100g of the 800g bread flour for einkorn. Adds golden color + flavor; cut total hydration by ~3%.' }
    ],
    newIdeas: [
      { title: 'Einkorn pancakes', detail: 'The gateway recipe. Butter, eggs, milk, einkorn, baking powder. Golden, sweet, distinct.' },
      { title: 'Fresh einkorn pasta', detail: 'Egg + flour. Roll thin, cut into tagliatelle. Pair with simple butter + sage.' },
      { title: '20% einkorn sourdough miche', detail: 'Blend with Marquis or Rouge. Best of both: structure + ancient-grain flavor.' },
      { title: 'Einkorn pie crust', detail: 'Extra-tender, golden hue. 50/50 with Sonora.' }
    ],
    sources: [
      { label: 'BAKERpedia Einkorn', url: 'https://bakerpedia.com/ingredients/einkorn/' },
      { label: 'Fresh Loaf: Troubles with Einkorn', url: 'https://www.thefreshloaf.com/node/42126/troubles-einkorn' },
      { label: 'Perfect Loaf: Einkorn Sourdough', url: 'https://www.theperfectloaf.com/einkorn-sourdough-bread/' },
      { label: 'Tinhat Eats Conversion Guide', url: 'https://tinhateats.com/einkorn-flour-recipes-a-beginners-guide-with-conversion-chart/' }
    ]
  }
]

interface MatrixRow {
  name: string
  protein: string
  className: string
  hydration: string
  hydKind: 'up' | 'down' | 'match'
  bestFor: string
}

const matrixRows: MatrixRow[] = [
  { name: 'Sonora "00"', protein: '11.5%', className: 'Soft white winter', hydration: '+5%', hydKind: 'up', bestFor: 'Pastry, tortillas, scones' },
  { name: 'Ryman Rye', protein: 'n/a (rye)', className: 'Heritage rye', hydration: '+5-10%', hydKind: 'up', bestFor: 'Sourdough starter, rye blends' },
  { name: 'Mediterranean', protein: '9.4%', className: 'Soft red winter', hydration: '+5%', hydKind: 'up', bestFor: 'Tortillas, cakes, soft pizza' },
  { name: 'Marquis', protein: '10.5-12%', className: 'Hard red (winter per BSM)', hydration: 'match AP', hydKind: 'match', bestFor: 'Hearth bread, croissants, pretzels' },
  { name: 'Rouge de Bordeaux', protein: '14.2%', className: 'Hard red winter', hydration: '+5-10%', hydKind: 'up', bestFor: 'High-hydration sourdough, baguette' },
  { name: 'Einkorn', protein: '~16-18% (weak gluten)', className: 'Ancient diploid', hydration: '−15-25%', hydKind: 'down', bestFor: 'Pancakes, pasta, blends, flavor' }
]
</script>

<template>
  <div class="flours-page">
    <h1>Barton Springs Mill Flours<span class="dot">.</span></h1>
    <div class="subtitle">
      Reference + recipe applications for the 6-flour haul. Stone-ground heritage grains from Dripping Springs, TX.
    </div>

    <div class="intro-callout">
      <strong>House rule from BSM:</strong> all their flours are <em>thirsty</em> — bump hydration 5-10% over conventional recipe
      expectations. Stone-ground whole grain absorbs more water than roller-milled flour. Einkorn is the exception — it goes the
      <em>other</em> way (reduce 15-25%).
    </div>

    <div class="section-header">Quick Reference Matrix</div>
    <table class="matrix">
      <thead>
        <tr>
          <th>Flour</th>
          <th>Protein</th>
          <th>Class</th>
          <th>Hydration vs AP</th>
          <th>Best For</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in matrixRows" :key="row.name">
          <td class="flour-name">{{ row.name }}</td>
          <td>{{ row.protein }}</td>
          <td>{{ row.className }}</td>
          <td :class="`hyd-${row.hydKind}`">{{ row.hydration }}</td>
          <td>{{ row.bestFor }}</td>
        </tr>
      </tbody>
    </table>

    <div class="toc">
      <a v-for="f in flours" :key="f.slug" :href="`#${f.slug}`">{{ f.name }}</a>
      <a href="#global">Global Rules</a>
    </div>

    <template v-for="f in flours" :key="f.slug">
      <div class="section-header" :id="f.slug">{{ f.number }} — {{ f.name }}</div>
      <div class="flour-card">
        <div class="head">
          <h2>{{ f.name }}</h2>
          <div class="badges">
            <span class="badge protein">{{ f.protein }}</span>
            <span class="badge class">{{ f.className }}</span>
            <span class="badge" :class="f.hydrationKind === 'down' ? 'hyd-low' : 'hyd'">{{ f.hydration }}</span>
          </div>
        </div>
        <div class="body">
          <div class="meta-line">{{ f.origin }}</div>

          <div class="row">
            <div>
              <h3>Flavor</h3>
              <p>{{ f.flavor }}</p>
              <h3>Strengths</h3>
              <ul>
                <li v-for="s in f.strengths" :key="s">{{ s }}</li>
              </ul>
            </div>
            <div>
              <div class="quirk-list">
                <h3 class="warning-h3">{{ f.quirksTitle }}</h3>
                <ul>
                  <li v-for="q in f.quirks" :key="q">{{ q }}</li>
                </ul>
              </div>
            </div>
          </div>

          <h3>Apply to existing recipes</h3>
          <ul class="apply-list">
            <li v-for="a in f.applies" :key="a.id">
              <span class="recipe-name">
                <router-link :to="`/recipe/${a.id}`">{{ a.name }}</router-link>
              </span>
              <span class="swap">{{ a.swap }}</span>
            </li>
          </ul>

          <h3>New recipes to discover</h3>
          <ul class="new-list">
            <li v-for="n in f.newIdeas" :key="n.title">
              <strong>{{ n.title }}</strong> — {{ n.detail }}
            </li>
          </ul>

          <div class="sources">
            Sources:
            <template v-for="(src, i) in f.sources" :key="src.url">
              <a :href="src.url" target="_blank" rel="noopener">{{ src.label }}</a>
              <span v-if="i < f.sources.length - 1"> · </span>
            </template>
          </div>
        </div>
      </div>
    </template>

    <div class="section-header" id="global">Global Rules for Heritage Stone-Ground Flours</div>
    <div class="global-rules">
      <h3>Substitution playbook</h3>
      <ol>
        <li><strong>Start with one swap, not three.</strong> Heritage flours behave individually — don't compound variables on the same bake.</li>
        <li><strong>Hydration adjustment is mandatory, not optional.</strong> Wheats: <code>+5-10%</code>. Einkorn: <code>−15-25%</code>. Watch the dough, not the spreadsheet.</li>
        <li><strong>Longer autolyse</strong> (60-90min instead of 30) helps stone-ground flours fully hydrate the bran particles before bulk ferment.</li>
        <li><strong>Lower oven spring expectations</strong> for heritage breads. The crumb will be tighter, more flavorful, more European. Not a failure — a feature.</li>
        <li><strong>20% blend rule</strong> — for any unfamiliar flour, start at 20% of total flour. Tastes the flavor without risking structure.</li>
        <li><strong>Freeze what you don't use within 6 weeks.</strong> Stone-ground whole flours have intact germ → oils oxidize fast at room temp.</li>
        <li><strong>Rye = sticky; Einkorn = sticky; Sonora "00" = velvet.</strong> Adjust your hand-feel expectations going in.</li>
      </ol>

      <h3 class="mt-large">Recipe-by-recipe upgrade order (recommended)</h3>
      <ol>
        <li><strong>Start with Marquis on <router-link to="/recipe/simple-sourdough">Simple Sourdough</router-link></strong> — clean 1:1 swap, no hydration change. Learn the flavor.</li>
        <li><strong>Then Rouge on <router-link to="/recipe/tartine-baguette">Tartine Baguette</router-link></strong> — its historical use. Bump hydration +5%.</li>
        <li><strong>Then Sonora on <router-link to="/recipe/sourdough-cheddar-bay-biscuits">Cheddar Bay Biscuits</router-link></strong> — instant payoff in a pastry context.</li>
        <li><strong>Then Ryman Rye into <router-link to="/recipe/simple-sourdough-wheat">Whole Wheat Sourdough</router-link></strong> — expand from 50g to 150g.</li>
        <li><strong>Then Einkorn pancakes</strong> — new recipe, low risk, immediate satisfaction.</li>
        <li><strong>Then Mediterranean tortillas</strong> — historically authentic Texas tortillas.</li>
      </ol>
    </div>

    <div class="footer-strip">
      Reference page · Barton Springs Mill flours · <span class="brand">proofed.</span>
    </div>
  </div>
</template>

<style scoped>
.flours-page {
  --ink: #1a1816;
  --stone-100: #f5f2ec;
  --stone-200: #e8e4dc;
  --stone-300: #d4cfc4;
  --stone-400: #999081;
  --stone-500: #6b6457;
  --stone-600: #4a443a;
  --accent: #a65d45;
  --accent-tint: #f3e3dc;
  --warning: #b8861f;
  --warning-tint: #f5ebcf;
  --success: #4a7a4a;
  --success-tint: #e0eedf;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  font-family: var(--font-body);
  color: var(--ink);
  line-height: 1.55;
}

h1 {
  font-family: var(--font-mono);
  font-size: 24px;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
}
h1 .dot { color: var(--accent); }
.subtitle { font-size: 14px; color: var(--stone-500); margin-bottom: 28px; }

.section-header {
  margin: 36px 0 14px;
  padding: 10px 14px;
  background: var(--ink);
  color: var(--stone-100);
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Matrix */
table.matrix { width: 100%; border-collapse: collapse; background: #fff; border: 2px solid var(--ink); font-size: 13px; }
table.matrix th, table.matrix td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--stone-300); vertical-align: top; }
table.matrix th { background: var(--stone-200); font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--ink); }
table.matrix tr:last-child td { border-bottom: none; }
table.matrix td.flour-name { font-family: var(--font-mono); font-weight: 600; color: var(--accent); }
table.matrix td.hyd-up { color: var(--success); font-family: var(--font-mono); font-size: 12px; }
table.matrix td.hyd-down { color: var(--accent); font-family: var(--font-mono); font-size: 12px; font-weight: 600; }
table.matrix td.hyd-match { color: var(--stone-500); font-family: var(--font-mono); font-size: 12px; }

/* TOC */
.toc { display: flex; flex-wrap: wrap; gap: 6px; margin: 24px 0; }
.toc a {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 4px 10px;
  background: var(--stone-200);
  border: 1px solid var(--ink);
  color: var(--ink);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.toc a:hover { background: var(--accent); color: var(--stone-100); }

/* Flour card */
.flour-card { background: #fff; border: 2px solid var(--ink); margin-bottom: 24px; }
.flour-card .head {
  background: var(--stone-200);
  padding: 14px 18px;
  border-bottom: 2px solid var(--ink);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}
.flour-card .head h2 { font-family: var(--font-mono); font-size: 18px; letter-spacing: -0.01em; }
.flour-card .head .badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 8px;
  background: var(--ink);
  color: var(--stone-100);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.badge.protein { background: var(--accent); }
.badge.class { background: var(--stone-600); }
.badge.hyd { background: var(--success); }
.badge.hyd-low { background: var(--warning); color: var(--ink); }

.flour-card .body { padding: 18px; }
.flour-card .row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px; }
@media (max-width: 720px) { .flour-card .row { grid-template-columns: 1fr; } }
.flour-card h3 {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--accent);
  margin-bottom: 6px;
  margin-top: 12px;
}
.flour-card h3:first-child { margin-top: 0; }
.flour-card p { font-size: 14px; margin-bottom: 10px; }
.flour-card ul { font-size: 14px; padding-left: 18px; }
.flour-card ul li { margin-bottom: 4px; }
.flour-card .meta-line { font-size: 13px; color: var(--stone-500); margin-bottom: 16px; }

.apply-list { list-style: none; padding: 0 !important; }
.apply-list li {
  padding: 8px 10px;
  border-left: 3px solid var(--accent);
  background: var(--stone-100);
  margin-bottom: 6px;
  font-size: 13px;
}
.apply-list li .recipe-name { font-family: var(--font-mono); font-weight: 600; color: var(--ink); }
.apply-list li .swap { color: var(--stone-500); font-size: 12px; display: block; margin-top: 2px; }
.apply-list li a { color: var(--accent); text-decoration: none; }
.apply-list li a:hover { text-decoration: underline; }

.new-list { list-style: none; padding: 0 !important; }
.new-list li {
  padding: 8px 10px;
  border-left: 3px solid var(--success);
  background: var(--success-tint);
  margin-bottom: 6px;
  font-size: 13px;
}
.new-list li strong { font-family: var(--font-mono); color: var(--success); }

.quirk-list { background: var(--warning-tint); padding: 10px 14px; border-left: 3px solid var(--warning); }
.quirk-list ul { padding-left: 18px; }
.quirk-list .warning-h3 { color: var(--warning); margin-top: 0; }

.sources { font-size: 11px; color: var(--stone-500); padding-top: 12px; border-top: 1px solid var(--stone-300); margin-top: 16px; font-family: var(--font-mono); }
.sources a { color: var(--stone-600); text-decoration: underline; }

.intro-callout {
  background: var(--accent-tint);
  border-left: 4px solid var(--accent);
  padding: 14px 18px;
  margin-bottom: 24px;
  font-size: 14px;
}
.intro-callout strong { font-family: var(--font-mono); color: var(--accent); }

.global-rules { background: #fff; border: 2px solid var(--ink); padding: 18px; margin-bottom: 24px; }
.global-rules h3 { font-family: var(--font-mono); font-size: 13px; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
.global-rules h3.mt-large { margin-top: 20px; }
.global-rules ol { padding-left: 22px; font-size: 14px; }
.global-rules ol li { margin-bottom: 8px; }
.global-rules code { font-family: var(--font-mono); font-size: 12px; background: var(--stone-200); padding: 1px 6px; border: 1px solid var(--stone-300); }
.global-rules a { color: var(--accent); text-decoration: none; }
.global-rules a:hover { text-decoration: underline; }

.footer-strip {
  margin-top: 40px;
  padding: 16px;
  background: var(--stone-200);
  border: 2px solid var(--ink);
  font-size: 12px;
  color: var(--stone-600);
  font-family: var(--font-mono);
}
.footer-strip .brand { color: var(--accent); }
</style>
