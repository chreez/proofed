// jsdom does not set isSecureContext = true by default.
// Most component tests mock navigator.clipboard, which requires the
// secure-context path in copyToClipboard. Setting this globally ensures
// the clipboard API path is taken in tests (matching real browser behavior).
Object.defineProperty(window, 'isSecureContext', { value: true, writable: true, configurable: true })
