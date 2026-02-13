---
id: PF-128
title: QR code share system for bake gifts
status: In Progress
assignee: []
created_date: '2026-02-13 01:46'
updated_date: '2026-02-13 18:29'
labels: []
dependencies:
  - PF-130
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generate a QR code permalink for each recipe that can be printed on a label maker and stuck on the food/container. Links directly to cooking instructions. Also includes a splash page — who I am and what I'm doing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Recipe JSON schema includes a `reheat` object at root level with structured reheat instructions; changes to reheat data trigger a minor version bump in `change_log`
- [ ] #2 Recipe header displays a "Share" / QR icon button (consistent with existing `IconButton` pattern)
- [ ] #3 Tapping the QR button opens a bake picker showing all cook log entries for that recipe (date + summary), user selects which bake to share
- [ ] #4 After selecting a bake, a QR code is generated client-side encoding the URL `proofeddot.netlify.app/recipe/:recipeId?shared=true&bake=YYYY-MM-DD`
- [ ] #5 The generated QR code is displayed as a saveable image (long-press save on mobile / right-click save on desktop)
- [ ] #6 When the recipe page loads with `?shared=true&bake=DATE` params, a welcome popover renders on top of the recipe page
- [ ] #7 The popover displays: (a) personal intro ("Hey, I'm Chris" + brief context), (b) photos from the specified cook log entry, (c) reheat instructions from the recipe's `reheat` field
- [ ] #8 If no human-written reheat instructions exist for a recipe, the popover displays an agent-generated summary based on recipe data (clearly marked as auto-generated)
- [ ] #9 Dismissing the popover reveals the full recipe page underneath (normal recipe view, no disruption)
- [ ] #10 QR codes use `proofeddot.netlify.app` as the base URL
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## QR Library Decision\n\n`qr-code-styling` (MIT, ~50KB) — user-tested on iPhone, chosen for brand-matchable styling (rounded dots, accent corners). See PF-128.1 spike notes for full evaluation."

## OG Meta Tags Research (PF-128.3 Spike Output)

### 1. Problem Statement

**proofed.** is a Vue 3 SPA deployed to Netlify (`proofeddot.netlify.app`). The app sets OG meta tags client-side via `@unhead/vue` + `useSeoMeta()` in `src/composables/useRecipeMeta.ts`, but social media crawlers (iMessage, WhatsApp, Slack, Facebook, Twitter/X) do not execute JavaScript. When a bake link is shared, crawlers only see the static fallback OG tags from `index.html` (generic "proofed." title, default description, generic `og-image.png`). The hero photo, bake-specific title, and cook log summary never appear in link previews.

### 2. Approaches

#### Approach A: Netlify Edge Function + String Replacement

**Description:** A Deno-based edge function intercepts requests matching bake URL patterns (`/recipe/*`). It fetches the recipe JSON from the same origin via `fetch()` (targeting `/recipes/:recipeId.json` — note the plural path avoids recursive edge function invocation), extracts the cook_log entry and hero photo, then uses `context.next()` to get the `index.html` response and does simple string `.replace()` on the placeholder OG meta tag `content` attributes.

**Pros:**
- Runs at CDN edge worldwide — sub-millisecond added latency
- No external service dependency
- Recipe JSON files are static CDN assets, so fetching is fast
- Full control over OG tag content and logic
- Version-controlled alongside site code (`netlify/edge-functions/`)
- Deploy Previews and rollbacks work automatically
- Edge function invocations are cheap: 3 credits per 10,000 web requests

**Cons:**
- 50ms CPU time limit (sufficient for JSON parse + string replace)
- No filesystem access — must use `fetch()` for same-origin JSON
- Path scoping is critical to avoid recursive invocation loops
- HTMLRewriter import adds complexity — but simple `.replace()` is sufficient

**Complexity:** Medium (1-2 hours)
**Netlify Plan:** All plans including Free

#### Approach B: Netlify Prerender Extension (Headless Browser)

**Description:** Install the Netlify Prerender Extension (GA since Dec 2025). When a crawler is detected via User-Agent, Netlify routes through a serverless function running headless Chromium, fully renders the page (executing Vue + `@unhead/vue`), returns complete HTML with all OG tags populated. Regular visitors get the normal SPA.

**Pros:**
- Zero code changes — existing `useRecipeMeta.ts` already sets all the right OG tags
- No custom edge function to maintain
- Handles ANY route automatically
- Official Netlify-supported solution

**Cons:**
- Headless browser rendering is slow — 2-5 seconds per request
- Uses serverless function compute (5 credits/GB-hour), more expensive than edge functions
- Headless browser can be fragile — timeouts, asset loading failures
- No fine-grained control over returned HTML
- Opaque debugging if OG tags don't appear

**Complexity:** Low (30 minutes — install extension, redeploy)
**Netlify Plan:** All plans (extension is free; compute billed normally)

#### Approach C: Build-Time Static HTML Generation (SSG)

**Description:** Add a Vite build plugin or post-build script that reads recipe JSON, iterates over all cook_log entries, and generates static HTML files at bake paths (e.g., `dist/recipe/atk-cinnamon-buns-ultimate/bake/2026-02-10/index.html`). Each file has correct OG tags hardcoded plus SPA bootstrap script.

**Pros:**
- Zero runtime cost — all HTML is static CDN-served
- Fastest possible response (no function invocation)
- Works on any static host, not Netlify-specific

**Cons:**
- Requires Puppeteer (~200MB) or custom HTML template script
- Build time scales with recipes x bakes (currently trivial at ~24 pages)
- New bake entries require rebuild+deploy before OG tags update
- Template drift between SSG HTML and actual `index.html`
- SPA `_redirects` rule needs nuanced handling
- High maintenance burden

**Complexity:** High (4-8 hours Puppeteer approach; 2-4 hours custom script)
**Netlify Plan:** No plan requirements (pure static)

#### Approach D: Hybrid — Build-Time OG Manifest + Edge Function Lookup

**Description:** A build script generates a single `og-manifest.json` mapping `{recipeId}/{date}` to `{title, description, image}`. An edge function reads this manifest via `fetch()` on crawler requests and injects OG tags. Avoids parsing full recipe JSONs at runtime.

**Pros:**
- Edge function logic is trivial (key lookup + string replace)
- Manifest is small (few KB) and cacheable
- Decouples OG data extraction from runtime

**Cons:**
- Requires build step to generate manifest
- Staleness issue: manifest only updates on deploy
- Two moving parts (build script + edge function)

**Complexity:** Medium (2-3 hours)
**Netlify Plan:** Same as Approach A

### 3. Comparison Matrix

| Criteria | A: Edge Function | B: Prerender Ext | C: Build-Time SSG | D: Hybrid Manifest |
|---|---|---|---|---|
| Implementation complexity | Medium (1-2h) | Low (30min) | High (4-8h) | Medium (2-3h) |
| Maintenance burden | Low | Very Low | High | Medium |
| Latency (crawlers) | ~5-20ms | ~2-5s | 0ms (static) | ~5-20ms |
| Latency (real users) | 0ms (pass-through) | 0ms | 0ms | 0ms |
| Free plan compatible | Yes | Yes | Yes | Yes |
| Credit cost/crawler hit | ~0.0003 | ~0.005-0.05 | 0 | ~0.0003 |
| New bake availability | Instant | Instant | After rebuild | After rebuild |
| Control over OG output | Full | None | Full | Full |
| External dependencies | None | Headless Chromium | Puppeteer/custom | None |
| Debug difficulty | Easy | Hard | Easy | Easy |

### 4. Recommended Approach

**Approach A: Netlify Edge Function with string replacement** is the recommended approach.

**Rationale:**

1. **Instant availability.** When a new cook log entry is deployed, the edge function reads the live recipe JSON on-demand. No stale manifests, no waiting for a separate SSG build. This matches the proofed. workflow — deploy recipe JSON, immediately share the link.

2. **Minimal maintenance.** One edge function file (`netlify/edge-functions/og-meta.ts`) + one `netlify.toml` declaration. No build plugins, no external services, no headless browsers. The function logic is ~50 lines.

3. **Full control.** OG tag content is explicitly constructed from recipe data, not dependent on headless browser rendering. Eliminates an entire class of debugging headaches.

4. **Negligible cost.** 3 credits per 10,000 web requests. Social crawlers hitting a personal baking site generate maybe 10-50 requests/month. Effectively zero cost.

5. **No impact on real users.** The edge function can transform all responses (client-side `@unhead/vue` overrides on hydration) or only crawler User-Agents. Either works.

**Why not Prerender (B)?** 2-5s latency is unnecessary; headless browser is fragile. proofed. only needs a handful of meta tags swapped, not a full page render.

**Why not SSG (C)?** Staleness issue + maintenance burden make it overkill for ~9 recipes. The "deploy and immediately share" workflow matters.

### 5. OG Tag Specification

#### URL Pattern
```
https://proofeddot.netlify.app/recipe/{recipeId}/bake/{date}?shared=true
```

#### Concrete Example: ATK Cinnamon Buns, 2026-02-10 Bake

**Source data** (from `public/recipes/atk-cinnamon-buns-ultimate.json`):
- `meta.name`: "ATK Ultimate Cinnamon Buns"
- `cook_log[0].date`: "2026-02-10"
- `cook_log[0].summary`: "I did an overnight cold proof with the v1.2.0 reduced-sugar recipe..."
- Hero photo (last in `cook_log[0].photos[]`): `/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6794-vsco-800w.webp`
- Hero alt: "Fresh out of the oven (before icing)"

**Generated OG tags:**
```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="proofed.">
<meta property="og:title" content="ATK Ultimate Cinnamon Buns - Feb 10, 2026 Bake">
<meta property="og:description" content="Overnight cold proof with reduced-sugar recipe. Sweetness much better than v1.0 - overall a success.">
<meta property="og:url" content="https://proofeddot.netlify.app/recipe/atk-cinnamon-buns-ultimate/bake/2026-02-10?shared=true">
<meta property="og:image" content="https://proofeddot.netlify.app/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6794-vsco-800w.webp">
<meta property="og:image:width" content="800">
<meta property="og:image:alt" content="Fresh out of the oven (before icing)">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ATK Ultimate Cinnamon Buns - Feb 10, 2026 Bake">
<meta name="twitter:description" content="Overnight cold proof with reduced-sugar recipe. Sweetness much better than v1.0 - overall a success.">
<meta name="twitter:image" content="https://proofeddot.netlify.app/images/atk-cinnamon-buns-ultimate/2026-02-10/img-6794-vsco-800w.webp">
```

**Tag construction rules:**
- `og:title`: `"{meta.name} - {formatted date} Bake"` (e.g., "Feb 10, 2026 Bake")
- `og:description`: Condensed `cook_log[].summary` truncated to ~150 chars. Fallback: `"{meta.name} - {meta.yields}, {meta.total_time} total"`
- `og:image`: Full absolute URL to hero photo (last in matching cook_log `photos[]`, 800w). Fallback: `/og-image.png`
- `og:url`: Canonical bake URL including `?shared=true`
- Recipe-level URLs (`/recipe/:recipeId`): use most recent cook_log hero, title without date

### 6. Implementation Notes

#### File Structure
```
netlify/
  edge-functions/
    og-meta.ts          # The edge function
netlify.toml              # Edge function declarations
```

#### Edge Function Logic (`og-meta.ts`)

1. Parse request URL to extract `recipeId` and optional `date`
   - Match: `/recipe/:recipeId/bake/:date`
   - Match: `/recipe/:recipeId`
   - Other paths: return (pass through, no transformation)

2. Fetch recipe JSON from same origin
   - `const jsonUrl = new URL('/recipes/' + recipeId + '.json', request.url)`
   - `const recipeRes = await fetch(jsonUrl)`
   - SAFE: JSON path (`/recipes/*.json`) does NOT match edge function path (`/recipe/*`)
   - On 404: fall through to default OG tags via `context.next()`

3. Extract bake-specific data
   - Find cook_log entry matching date param (or `cook_log[0]` if no date)
   - Hero photo: last element in `photos[]` array
   - Construct title, description, image URL

4. Get origin HTML: `const response = await context.next()` then `response.text()`

5. Replace placeholder OG tags in `index.html` using string `.replace()`
   - Existing `index.html` has default OG values (lines 8-22) that serve as replacement targets
   - No `index.html` changes needed

6. Return: `new Response(html, { headers: response.headers })`

#### netlify.toml
```toml
[[edge_functions]]
  path = "/recipe/*"
  function = "og-meta"
```

**Key:** Edge function path `/recipe/*` vs JSON path `/recipes/*.json` -- no overlap, no recursion.

#### Testing
- Local: `netlify dev`
- Crawler simulation: `curl -H 'User-Agent: facebookexternalhit/1.1' <url>`
- Validators: Facebook Sharing Debugger, Twitter Card Validator, opengraph.xyz

### 7. Pricing/Plan Notes

Netlify uses credit-based pricing (since Sept 2025):

| Plan | Credits/Mo | Cost |
|---|---|---|
| Free | 300 (hard limit) | $0 |
| Personal | 1,000 | $9/mo |
| Pro | 3,000 | $20/member/mo |

**Edge function cost:** 3 credits per 10,000 web requests (classified as "web requests", NOT "compute").

**proofed. impact:** ~10-50 crawler requests/month = effectively 0 credits. The Free plan's 300 credits are mainly consumed by deploys (15 each) and bandwidth (10/GB). Edge function OG cost is negligible.

**vs Prerender:** Prerender uses serverless compute (5 credits/GB-hour). Headless browser for ~3s uses significantly more credits than edge function doing JSON fetch + string replace in ~5ms.

**Recommendation:** Free plan is sufficient. No upgrade needed for OG meta tags.

### Sources
- [Edge Functions Overview](https://docs.netlify.com/build/edge-functions/overview/)
- [Edge Functions API](https://docs.netlify.com/build/edge-functions/api/)
- [Edge Functions Limits](https://docs.netlify.com/build/edge-functions/limits/)
- [Edge Functions Get Started](https://docs.netlify.com/build/edge-functions/get-started/)
- [Prerendering](https://docs.netlify.com/build/post-processing/prerendering/)
- [HTMLRewriter](https://github.com/netlify/htmlrewriter)
- [SPA SEO with Edge Functions](https://tj.ie/spa-seo-with-netlify-edge-functions/)
- [Transforming HTML with Edge Functions](https://blog.jim-nielsen.com/2025/transform-html-with-edge-functions/)
- [Credit-Based Plans](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)
- [How Credits Work](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)
- [Netlify Pricing](https://www.netlify.com/pricing/)
<!-- SECTION:NOTES:END -->
