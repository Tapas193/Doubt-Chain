import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getStoredTheme, setStoredTheme, applyTheme } from '../src/lib/theme'

describe('Theme and Navigation Integration', () => {
  let storage: Record<string, string> = {}

  beforeEach(() => {
    storage = {}
    // Mock localStorage
    const mockLocalStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, val: string) => { storage[key] = val },
      clear: () => { storage = {} },
      removeItem: (key: string) => { delete storage[key] }
    }
    vi.stubGlobal('localStorage', mockLocalStorage)

    // Mock document
    const mockElement = {
      dataset: {} as Record<string, string>,
      style: {} as Record<string, string>,
      setAttribute: vi.fn()
    }
    vi.stubGlobal('document', {
      documentElement: mockElement,
      querySelector: vi.fn().mockReturnValue(mockElement)
    })
  })

  it('defaults stored theme to dark when unset', () => {
    expect(getStoredTheme()).toBe('dark')
  })

  it('persists and applies selected theme preference', () => {
    setStoredTheme('light')
    expect(getStoredTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')

    setStoredTheme('dark')
    expect(getStoredTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('handles system preference gracefully without error', () => {
    expect(() => applyTheme('system')).not.toThrow()
  })
})
