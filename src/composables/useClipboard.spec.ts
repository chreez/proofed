import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { copyToClipboard } from './useClipboard'

describe('copyToClipboard', () => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses navigator.clipboard in secure context', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } })

    await copyToClipboard('hello')

    expect(writeTextMock).toHaveBeenCalledWith('hello')
  })

  it('falls back to execCommand in non-secure context', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true })

    // jsdom doesn't define execCommand — stub it before spying
    document.execCommand = vi.fn().mockReturnValue(true)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    await copyToClipboard('fallback text')

    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    // Verify textarea value was set
    const textarea = appendChildSpy.mock.calls[0][0] as HTMLTextAreaElement
    expect(textarea.value).toBe('fallback text')

    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('falls back when navigator.clipboard is undefined', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
    const saved = navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })

    document.execCommand = vi.fn().mockReturnValue(true)

    await copyToClipboard('no clipboard api')

    expect(document.execCommand).toHaveBeenCalledWith('copy')

    Object.defineProperty(navigator, 'clipboard', { value: saved, configurable: true })
  })
})
