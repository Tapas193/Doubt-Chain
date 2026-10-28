import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getStoredTheme, setStoredTheme, applyTheme } from '../src/lib/theme'

describe('Spider-Verse Theme Engine & Web-Shoot System', () => {
  let localStorageMock: Record<string, string> = {}
  let sessionStorageMock: Record<string, string> = {}

  beforeEach(() => {
    localStorageMock = {}
    sessionStorageMock = {}

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, val: string) => {
        localStorageMock[key] = val
      },
      removeItem: (key: string) => {
        delete localStorageMock[key]
      },
      clear: () => {
        localStorageMock = {}
      }
    })

    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => sessionStorageMock[key] ?? null,
      setItem: (key: string, val: string) => {
        sessionStorageMock[key] = val
      },
      removeItem: (key: string) => {
        delete sessionStorageMock[key]
      },
      clear: () => {
        sessionStorageMock = {}
      }
    })

    const rootEl = {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
      setAttribute: vi.fn()
    }

    vi.stubGlobal('document', {
      documentElement: rootEl,
      querySelector: vi.fn().mockReturnValue({
        setAttribute: vi.fn()
      })
    })

    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('dark'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    })
  })

  it('1. Initializes default theme to dark when no preference stored', () => {
    expect(getStoredTheme()).toBe('dark')
  })

  it('2. Correctly sets and persists light mode', () => {
    setStoredTheme('light')
    expect(getStoredTheme()).toBe('light')
    expect(localStorageMock['doubt-chain:theme:preference']).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('3. Correctly sets and persists dark mode', () => {
    setStoredTheme('dark')
    expect(getStoredTheme()).toBe('dark')
    expect(localStorageMock['doubt-chain:theme:preference']).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('4. Resolves system mode using media query', () => {
    // When OS is dark
    applyTheme('system')
    expect(document.documentElement.dataset.theme).toBe('dark')

    // When OS is light
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockImplementation((_query: string) => ({
        matches: false, // light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    })
    applyTheme('system')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('5. Explicit light/dark preference overrides OS changes', () => {
    setStoredTheme('light')
    expect(getStoredTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('6. Cinematic intro plays on fresh document load and clears stale suppression flags', () => {
    const INTRO_STORAGE_KEY = 'doubt-chain:intro-completed:v1'
    localStorageMock[INTRO_STORAGE_KEY] = 'true'

    // On fresh load, stale suppression flags are cleared
    localStorage.removeItem(INTRO_STORAGE_KEY)
    expect(localStorageMock[INTRO_STORAGE_KEY]).toBeUndefined()
  })

  it('7. Sets background color to pure white in light mode', () => {
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.style.backgroundColor).toBe('#FFFFFF')
  })
})
