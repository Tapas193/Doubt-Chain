import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'doubt-chain:theme:preference'

type ThemeContextType = {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (pref: ThemePreference) => void
  toggleTheme: () => void
  isWebShooting: boolean
  webShootDirection: 'to-dark' | 'to-light' | null
  completeWebShoot: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getInitialPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // Local storage unavailable
  }
  return 'dark' // default to dark theme
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

function applyThemeToDOM(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const isDark = resolved === 'dark'
  const root = document.documentElement
  root.dataset.theme = resolved
  root.style.colorScheme = resolved
  root.style.backgroundColor = isDark ? '#080B14' : '#FFFFFF'
  if (document.body) {
    document.body.style.backgroundColor = isDark ? '#080B14' : '#FFFFFF'
  }
  const metaColor = document.querySelector('meta[name="theme-color"]')
  if (metaColor) {
    metaColor.setAttribute('content', isDark ? '#080B14' : '#FFFFFF')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(getInitialPreference)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const pref = getInitialPreference()
    return pref === 'system' ? getSystemTheme() : pref
  })
  const [isWebShooting, setIsWebShooting] = useState(false)
  const [webShootDirection, setWebShootDirection] = useState<'to-dark' | 'to-light' | null>(null)

  // Immediate DOM sync
  const updateResolvedTheme = useCallback((newResolved: ResolvedTheme, triggerAnimation = false) => {
    setResolvedTheme(prev => {
      if (prev !== newResolved && triggerAnimation) {
        // Trigger web shoot transition
        const direction = newResolved === 'dark' ? 'to-dark' : 'to-light'
        setWebShootDirection(direction)
        setIsWebShooting(true)
      }
      return newResolved
    })
    applyThemeToDOM(newResolved)
  }, [])

  // Listen for preference changes
  const setTheme = useCallback((newPref: ThemePreference) => {
    setThemeState(newPref)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newPref)
    } catch {
      // ignore
    }

    const nextResolved = newPref === 'system' ? getSystemTheme() : newPref
    updateResolvedTheme(nextResolved, true)
  }, [updateResolvedTheme])

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const nextPref: ThemePreference = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextPref)
  }, [resolvedTheme, setTheme])

  const completeWebShoot = useCallback(() => {
    setIsWebShooting(false)
    setWebShootDirection(null)
  }, [])

  // System listener: only active when theme === 'system'
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const nextResolved = e.matches ? 'dark' : 'light'
      updateResolvedTheme(nextResolved, true)
    }

    mediaQuery.addEventListener?.('change', handleChange)
    return () => mediaQuery.removeEventListener?.('change', handleChange)
  }, [theme, updateResolvedTheme])

  // Initial startup sync
  useEffect(() => {
    const currentResolved = theme === 'system' ? getSystemTheme() : theme
    updateResolvedTheme(currentResolved, false)
  }, [theme, updateResolvedTheme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        isWebShooting,
        webShootDirection,
        completeWebShoot
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
