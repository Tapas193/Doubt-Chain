import { describe, it, expect } from 'vitest'
import { en } from '../src/i18n/translations/en'
import { hi } from '../src/i18n/translations/hi'
import { hinglish } from '../src/i18n/translations/hinglish'
import { SupportedLanguage, TranslationDictionary } from '../src/i18n/types'

describe('Internationalization (i18n) Test Suite', () => {
  const dictionaries: Record<SupportedLanguage, TranslationDictionary> = {
    en,
    hi,
    hinglish
  }

  it('all supported languages implement the complete TranslationDictionary structure', () => {
    const requiredSections: (keyof TranslationDictionary)[] = [
      'nav',
      'common',
      'auth',
      'dashboard',
      'subjects',
      'doubts',
      'detail',
      'search',
      'faq',
      'ai',
      'ocrVoice'
    ]

    for (const [lang, dict] of Object.entries(dictionaries)) {
      for (const section of requiredSections) {
        expect(dict[section], `Language "${lang}" is missing section "${section}"`).toBeDefined()
        expect(typeof dict[section], `Section "${section}" in "${lang}" should be an object`).toBe('object')
      }
    }
  })

  it('every English key exists with a non-empty string in Hindi and Hinglish', () => {
    const checkNestedKeys = (baseObj: any, targetObj: any, path = '', lang: string) => {
      for (const key of Object.keys(baseObj)) {
        const currentPath = path ? `${path}.${key}` : key
        expect(targetObj[key], `Missing translation key "${currentPath}" in language "${lang}"`).toBeDefined()
        if (typeof baseObj[key] === 'object' && baseObj[key] !== null) {
          checkNestedKeys(baseObj[key], targetObj[key], currentPath, lang)
        } else {
          expect(typeof targetObj[key]).toBe('string')
          expect(targetObj[key].trim().length, `Key "${currentPath}" in "${lang}" must not be empty`).toBeGreaterThan(0)
        }
      }
    }

    checkNestedKeys(en, hi, '', 'hi')
    checkNestedKeys(en, hinglish, '', 'hinglish')
  })

  it('Hindi translations use natural Devanagari script for academic concepts', () => {
    // Hindi should use Devanagari characters (Unicode range \u0900-\u097F)
    const devanagariRegex = /[\u0900-\u097F]/
    expect(devanagariRegex.test(hi.nav.askDoubt)).toBe(true)
    expect(devanagariRegex.test(hi.doubts.title)).toBe(true)
    expect(devanagariRegex.test(hi.dashboard.quickStats)).toBe(true)
    expect(devanagariRegex.test(hi.faq.verifiedSolutions)).toBe(true)
  })

  it('Hinglish translations preserve core technical terminology while providing natural phrasing', () => {
    // Should preserve technical keywords like 'Doubt', 'Code', 'API', 'Search', 'Solution'
    expect(hinglish.nav.askDoubt).toContain('Doubt')
    expect(hinglish.common.aiTranslatedBadge).toContain('AI')
    expect(hinglish.ai.modeHinglish).toContain('Hinglish')
    expect(hinglish.doubts.contentPlaceholder.toLowerCase()).toContain('code')
  })

  it('supports fallback lookup when a key path is queried', () => {
    const getNestedTranslation = (dict: TranslationDictionary, fallback: TranslationDictionary, path: string): string => {
      const keys = path.split('.')
      let val: any = dict
      for (const k of keys) {
        val = val?.[k]
      }
      if (typeof val === 'string' && val.length > 0) return val

      let fallbackVal: any = fallback
      for (const k of keys) {
        fallbackVal = fallbackVal?.[k]
      }
      return typeof fallbackVal === 'string' ? fallbackVal : path
    }

    expect(getNestedTranslation(hi, en, 'nav.askDoubt')).toBe(hi.nav.askDoubt)
    expect(getNestedTranslation(hinglish, en, 'dashboard.totalDoubts')).toBe(hinglish.dashboard.totalDoubts)
    // Non-existent key falls back to key name safely
    expect(getNestedTranslation(hi, en, 'non.existent.key')).toBe('non.existent.key')
  })
})
