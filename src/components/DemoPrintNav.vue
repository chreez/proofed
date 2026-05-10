<script setup lang="ts">
/**
 * PF-211.11 — Print page navigation discovery demo.
 * Shows 3 navigation patterns side-by-side for user to pick from.
 * Throwaway demo page — excluded from diff-coverage via Demo*.vue pattern.
 */
import { Printer, QrCode, MoreVertical, FileText } from 'lucide-vue-next'

const demoRecipeId = 'simple-sourdough'
const printUrl = `/recipe/${demoRecipeId}/print`
</script>

<template>
  <div class="demo-page">
    <h1 class="demo-title font-mono">PF-211.11 — Print Navigation Discovery</h1>
    <p class="demo-subtitle">Pick one. Each shows how users get to <code>/recipe/:id/print</code> from the recipe page.</p>

    <div class="options-grid">
      <!-- Option A: Print icon alongside QR/Share button -->
      <section class="option-card">
        <h2 class="option-label font-mono">A — Header icon (alongside Share)</h2>
        <div class="mockup">
          <div class="mock-header">
            <div class="mock-header-left">
              <span class="mock-brand font-mono">proofed<span class="text-accent">.</span></span>
              <span class="mock-recipe-name">Simple Sourdough</span>
              <span class="mock-version font-mono">v3.6</span>
            </div>
            <div class="mock-header-right">
              <a :href="printUrl" class="mock-icon-btn" title="Print bake sheet">
                <Printer :size="18" />
              </a>
              <button class="mock-icon-btn" title="Share">
                <QrCode :size="18" />
              </button>
            </div>
          </div>
        </div>
        <table class="pros-cons">
          <tbody>
            <tr><td class="pro">Discoverable</td><td>Always visible in header</td></tr>
            <tr><td class="pro">Familiar</td><td>Print icon is universally understood</td></tr>
            <tr><td class="pro">Mobile-ready</td><td>Icon button meets 44px touch target</td></tr>
            <tr><td class="con">Adds chrome</td><td>Second icon in header — still minimal</td></tr>
            <tr><td class="con">Visibility</td><td>Only shows on recipe pages with cook_log (matches Share behavior)</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Option B: TOC sidebar link -->
      <section class="option-card">
        <h2 class="option-label font-mono">B — TOC sidebar link</h2>
        <div class="mockup">
          <div class="mock-toc">
            <div class="mock-toc-header font-mono">Contents</div>
            <ul class="mock-toc-list">
              <li class="mock-toc-item">Dough</li>
              <li class="mock-toc-item">Shape</li>
              <li class="mock-toc-item">Bake</li>
              <li class="mock-toc-divider"></li>
              <li class="mock-toc-item">Nutrition</li>
              <li class="mock-toc-item">Cook Log</li>
              <li class="mock-toc-item">Version History</li>
              <li class="mock-toc-divider"></li>
              <li class="mock-toc-item mock-toc-action">
                <a :href="printUrl" class="mock-toc-link">
                  <Printer :size="14" />
                  <span>Print Bake Sheet</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <table class="pros-cons">
          <tbody>
            <tr><td class="pro">No clutter</td><td>Hidden in sidebar — doesn't add header chrome</td></tr>
            <tr><td class="pro">Contextual</td><td>Print is a document action, fits TOC mental model</td></tr>
            <tr><td class="con">Discoverable?</td><td>Users may not look in TOC for print</td></tr>
            <tr><td class="con">Mobile</td><td>Behind FAB → bottom sheet — two taps to reach</td></tr>
            <tr><td class="con">Desktop only</td><td>Sidebar hidden below md breakpoint</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Option C: Action menu (overflow) -->
      <section class="option-card">
        <h2 class="option-label font-mono">C — Overflow menu</h2>
        <div class="mockup">
          <div class="mock-header">
            <div class="mock-header-left">
              <span class="mock-brand font-mono">proofed<span class="text-accent">.</span></span>
              <span class="mock-recipe-name">Simple Sourdough</span>
              <span class="mock-version font-mono">v3.6</span>
            </div>
            <div class="mock-header-right">
              <button class="mock-icon-btn" title="Share">
                <QrCode :size="18" />
              </button>
              <div class="mock-overflow-wrapper">
                <button class="mock-icon-btn" title="More actions">
                  <MoreVertical :size="18" />
                </button>
                <div class="mock-overflow-menu">
                  <a :href="printUrl" class="mock-menu-item">
                    <Printer :size="14" />
                    <span>Print Bake Sheet</span>
                  </a>
                  <a href="#" class="mock-menu-item">
                    <FileText :size="14" />
                    <span>Copy Recipe</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <table class="pros-cons">
          <tbody>
            <tr><td class="pro">Scalable</td><td>Menu can hold future actions (export, copy, etc.)</td></tr>
            <tr><td class="pro">Clean header</td><td>Single overflow icon replaces multiple buttons</td></tr>
            <tr><td class="con">Hidden</td><td>Two clicks to print — worse discoverability</td></tr>
            <tr><td class="con">Overkill</td><td>Only 2 actions currently — menu feels heavy</td></tr>
            <tr><td class="con">Complexity</td><td>Dropdown state management, click-outside dismissal</td></tr>
          </tbody>
        </table>
      </section>
    </div>

    <div class="recommendation">
      <h2 class="font-mono">Recommendation: A</h2>
      <p>Header icon is most discoverable, minimal implementation, matches existing Share button pattern. Print is a primary document action — shouldn't be buried.</p>
    </div>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.demo-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: 0.25rem;
}

.demo-subtitle {
  font-size: 0.875rem;
  color: var(--color-stone-500);
  margin-bottom: 2rem;
}

.demo-subtitle code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  background: var(--color-stone-200);
  padding: 0.125rem 0.375rem;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.option-card {
  border: 2px solid var(--color-stone-300);
  padding: 1.25rem;
  background: var(--color-surface);
}

.option-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-ink);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-stone-200);
}

/* Mockups */
.mockup {
  margin-bottom: 1rem;
  background: var(--color-cream, #f5f0e8);
  padding: 0.75rem;
  border: 1px solid var(--color-stone-200);
}

.mock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-stone-200);
  border-bottom: 2px solid var(--color-stone-300);
}

.mock-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mock-brand {
  font-weight: 600;
  font-size: 0.875rem;
}

.mock-recipe-name {
  font-size: 0.8125rem;
  color: var(--color-stone-600);
}

.mock-version {
  font-size: 0.75rem;
  color: var(--color-stone-500);
}

.mock-header-right {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.mock-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-stone-500);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.mock-icon-btn:hover {
  color: var(--color-ink);
}

/* TOC mockup */
.mock-toc {
  width: 200px;
  border-left: 2px solid var(--color-stone-300);
  padding-left: 0.75rem;
}

.mock-toc-header {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-stone-500);
  margin-bottom: 0.5rem;
}

.mock-toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mock-toc-item {
  font-size: 0.8125rem;
  color: var(--color-stone-600);
  padding: 0.25rem 0;
  cursor: pointer;
}

.mock-toc-item:hover {
  color: var(--color-ink);
}

.mock-toc-divider {
  border-top: 1px solid var(--color-stone-200);
  margin: 0.375rem 0;
}

.mock-toc-action {
  color: var(--color-stone-500);
}

.mock-toc-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  text-decoration: none;
  color: inherit;
  font-size: 0.8125rem;
}

.mock-toc-link:hover {
  color: var(--color-ink);
}

/* Overflow menu mockup */
.mock-overflow-wrapper {
  position: relative;
}

.mock-overflow-menu {
  position: absolute;
  top: 2.25rem;
  right: 0;
  background: var(--color-surface);
  border: 2px solid var(--color-stone-300);
  min-width: 180px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.mock-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-stone-700);
  text-decoration: none;
  cursor: pointer;
}

.mock-menu-item:hover {
  background: var(--color-stone-100);
  color: var(--color-ink);
}

/* Pros/cons table */
.pros-cons {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.pros-cons tr {
  border-bottom: 1px solid var(--color-stone-200);
}

.pros-cons tr:last-child {
  border-bottom: none;
}

.pros-cons td {
  padding: 0.375rem 0.5rem;
  vertical-align: top;
}

.pros-cons td:first-child {
  font-weight: 600;
  white-space: nowrap;
  width: 1%;
}

.pro {
  color: #2d6a4f;
}

.con {
  color: var(--color-accent);
}

/* Recommendation */
.recommendation {
  border: 2px solid var(--color-ink);
  padding: 1rem 1.25rem;
  background: var(--color-cream, #f5f0e8);
}

.recommendation h2 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.recommendation p {
  font-size: 0.8125rem;
  color: var(--color-stone-700);
  margin: 0;
}
</style>
