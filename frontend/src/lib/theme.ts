export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'doubt-chain:theme:preference'

export function getStoredTheme(): ThemePreference {
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY)
    if (val === 'light' || val === 'dark' || val === 'system') {
      return val
    }
  } catch {
    // Local storage unavailable
  }
  return 'dark'
}

export function setStoredTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore error
  }
  applyTheme(theme)
}

export function applyTheme(preference: ThemePreference = 'dark') {
  if (typeof document === 'undefined') return
  const isDark =
    preference === 'dark' ||
    (preference === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  const resolved = isDark ? 'dark' : 'light'
  const root = document.documentElement
  root.dataset.theme = resolved
  root.style.colorScheme = resolved
  root.style.backgroundColor = isDark ? '#080B14' : '#FFFFFF'
  const colorMeta = document.querySelector('meta[name="theme-color"]')
  if (colorMeta) {
    colorMeta.setAttribute('content', isDark ? '#080B14' : '#FFFFFF')
  }
}
