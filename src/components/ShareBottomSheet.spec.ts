import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ShareBottomSheet from './ShareBottomSheet.vue'
import type { BakeAggregates } from '@/composables/useBakeAggregates'

const copyMock = vi.fn(async () => true)
vi.mock('@/composables/useClipboard', () => ({
  copyToClipboard: (text: string) => copyMock(text),
}))

const aggregates: BakeAggregates = {
  daysBaked: 47,
  totalDays: 392,
  percent: 12,
  totalBakes: 32,
  totalCalories: 421000,
  typeCounts: [
    { label: 'Sourdough Breads', count: 22, icon: '\u{1F35E}' },
    { label: 'Buns & Rolls', count: 10, icon: '\u{1F9C1}' },
  ],
  lifetimeSpend: 284.5,
}

function mountSheet(overrides: Record<string, unknown> = {}) {
  return mount(ShareBottomSheet, {
    props: {
      open: true,
      aggregates,
      recipeBakeCount: 4,
      recipeName: 'Sourdough Jalapeno',
      initialOutcome: null,
      thisCost: 5.66,
      thisCostPerItem: 2.83,
      ...overrides,
    },
    attachTo: document.body,
  })
}

function q(selector: string): HTMLElement | null {
  return document.querySelector(selector)
}

describe('ShareBottomSheet', () => {
  let wrapper: ReturnType<typeof mountSheet>

  beforeEach(() => {
    copyMock.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('opens on rate step when initialOutcome null', () => {
    wrapper = mountSheet()
    expect(q('[data-testid="share-rate-success"]')).toBeTruthy()
    expect(q('[data-testid="share-caption"]')).toBeNull()
  })

  it('opens on preview step when initialOutcome set', () => {
    wrapper = mountSheet({ initialOutcome: 'success' })
    expect(q('[data-testid="share-caption"]')).toBeTruthy()
    expect(q('[data-testid="share-rate-success"]')).toBeNull()
  })

  it('rate pick advances to preview', async () => {
    wrapper = mountSheet()
    ;(q('[data-testid="share-rate-mid"]') as HTMLElement).click()
    await nextTick()
    const caption = q('[data-testid="share-caption"]')
    expect(caption).toBeTruthy()
    expect(caption!.textContent).toContain('Bake #4 of Sourdough Jalapeno – \u{1F610} Mid')
  })

  it('skip advances to preview without outcome', async () => {
    wrapper = mountSheet()
    ;(q('[data-testid="share-skip"]') as HTMLElement).click()
    await nextTick()
    const caption = q('[data-testid="share-caption"]')
    expect(caption!.textContent).toContain('Bake #4 of Sourdough Jalapeno')
    expect(caption!.textContent).not.toContain('–')
    expect(caption!.textContent).not.toContain('Success')
  })

  it('copy invokes copyToClipboard with caption text', async () => {
    wrapper = mountSheet({ initialOutcome: 'success' })
    ;(q('[data-testid="share-copy"]') as HTMLElement).click()
    await nextTick()
    expect(copyMock).toHaveBeenCalledOnce()
    const arg = copyMock.mock.calls[0][0]
    expect(arg).toContain('47 days baked\t(12% of 392 days since first bake)')
    expect(arg).toContain('Bake cost: \u{1F4B0} $5.66 total ($2.83/item)')
    expect(arg).toContain('Bake #4 of Sourdough Jalapeno – ✅ Success')
  })

  it('copy button shows Copied state then resets', async () => {
    wrapper = mountSheet({ initialOutcome: 'mid' })
    ;(q('[data-testid="share-copy"]') as HTMLElement).click()
    await flushPromises()
    expect(q('[data-testid="share-copy"]')!.textContent).toContain('Copied')
    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(q('[data-testid="share-copy"]')!.textContent).toContain('Copy caption')
  })

  it('back button returns to rate step when initialOutcome was null', async () => {
    wrapper = mountSheet()
    ;(q('[data-testid="share-rate-success"]') as HTMLElement).click()
    await nextTick()
    ;(q('[data-testid="share-back"]') as HTMLElement).click()
    await nextTick()
    expect(q('[data-testid="share-rate-success"]')).toBeTruthy()
  })

  it('back button hidden when initialOutcome was pre-set', () => {
    wrapper = mountSheet({ initialOutcome: 'success' })
    expect(q('[data-testid="share-back"]')).toBeNull()
  })

  it('close button emits close', async () => {
    wrapper = mountSheet()
    ;(q('[data-testid="share-close"]') as HTMLElement).click()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('backdrop click emits close', async () => {
    wrapper = mountSheet()
    ;(q('[data-testid="share-backdrop"]') as HTMLElement).click()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not render when closed', () => {
    wrapper = mountSheet({ open: false })
    expect(q('[data-testid="share-sheet"]')).toBeNull()
    expect(q('[data-testid="share-backdrop"]')).toBeNull()
  })

  it('renders empty caption when aggregates null', () => {
    wrapper = mountSheet({ aggregates: null, initialOutcome: 'success' })
    const caption = q('[data-testid="share-caption"]')
    expect(caption).toBeTruthy()
    expect(caption!.textContent).toBe('')
  })
})
