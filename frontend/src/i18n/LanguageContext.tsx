import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { SupportedLanguage, TranslationDictionary } from './types'
import { en } from './translations/en'
import { hi } from './translations/hi'
import { hinglish } from './translations/hinglish'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/apiClient'

const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  hi,
  hinglish
}

const STORAGE_KEY = 'doubtchain_lang'

interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: (path: string, params?: Record<string, string | number>) => string
  languages: Array<{ code: SupportedLanguage; label: string; nativeName: string }>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const AVAILABLE_LANGUAGES: Array<{ code: SupportedLanguage; label: string; nativeName: string }> = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'hinglish', label: 'Hinglish', nativeName: 'Hinglish' }
]

function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'hinglish')) {
      return saved
    }
  } catch {
    // ignore localStorage errors
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage)
  const { user } = useAuth()

  // Sync from user account preferences once loaded
  useEffect(() => {
    if (user?.preferredLanguage) {
      const userLang = user.preferredLanguage as SupportedLanguage
      if (['en', 'hi', 'hinglish'].includes(userLang) && userLang !== language) {
        setLanguageState(userLang)
        try {
          localStorage.setItem(STORAGE_KEY, userLang)
        } catch {
          // ignore
        }
      }
    }
  }, [user?.preferredLanguage])

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
    } catch {
      // ignore
    }

    // Sync with backend account if logged in
    if (user) {
      api.patch('/auth/preferences', { preferredLanguage: newLang }).catch(() => {
        // silently ignore background sync network errors
      })
    }
  }, [user])

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const parts = path.split('.')
      
      // 1. Try selected language
      let current: any = translations[language]
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part]
        } else {
          current = undefined
          break
        }
      }

      // 2. Fallback to English if missing or not string
      if (typeof current !== 'string') {
        let fallback: any = translations.en
        for (const part of parts) {
          if (fallback && typeof fallback === 'object' && part in fallback) {
            fallback = fallback[part]
          } else {
            fallback = undefined
            break
          }
        }
        current = typeof fallback === 'string' ? fallback : parts[parts.length - 1]
      }

      // 3. String interpolation
      if (params && typeof current === 'string') {
        let interpolated = current
        for (const [key, value] of Object.entries(params)) {
          interpolated = interpolated.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
        }
        return interpolated
      }

      return typeof current === 'string' ? current : path
    },
    [language]
  )

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: AVAILABLE_LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
