import React, { useState } from 'react'
import { api } from '../lib/apiClient'
import { useLanguage } from '../i18n/LanguageContext'
import { SupportedLanguage } from '../i18n/types'
import { extractCleanText } from '../utils/cleanText'

interface ContentTranslationControlProps {
  originalText: string
  className?: string
  inline?: boolean
  label?: string
}

export const ContentTranslationControl: React.FC<ContentTranslationControlProps> = ({
  originalText,
  className = '',
  label
}) => {
  const { t } = useLanguage()
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [activeTargetLang, setActiveTargetLang] = useState<SupportedLanguage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [cache, setCache] = useState<Record<string, string>>({})

  // If text is empty or very short, do not show translation control
  if (!originalText || originalText.trim().length < 3) {
    return null
  }

  const handleTranslate = async (targetLang: SupportedLanguage) => {
    // If clicking same target that is already showing, toggle original
    if (activeTargetLang === targetLang && !showOriginal && translatedText) {
      setShowOriginal(true)
      return
    }

    setShowOriginal(false)
    setActiveTargetLang(targetLang)

    // Check memory cache first
    if (cache[targetLang]) {
      setTranslatedText(cache[targetLang])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post<{
        translatedText: string
        targetLang: string
        sourceLang: string
        fromCache: boolean
      }>('/ai/translate', {
        text: originalText,
        targetLang
      })

      if (response && response.translatedText) {
        const cleanResult = extractCleanText(response.translatedText)
        setTranslatedText(cleanResult)
        setCache((prev) => ({ ...prev, [targetLang]: cleanResult }))
      } else {
        setError('Translation returned empty result')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Translation failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const getTargetLangLabel = (code: SupportedLanguage) => {
    switch (code) {
      case 'hi':
        return 'हिन्दी'
      case 'hinglish':
        return 'Hinglish'
      case 'en':
      default:
        return 'English'
    }
  }

  return (
    <div className={`mt-2 ${className}`}>
      {/* Translation Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-dc-subtext">
        <span className="font-medium text-dc-subtext/80">{label || t('common.translate')}:</span>
        <button
          type="button"
          onClick={() => handleTranslate('en')}
          disabled={loading}
          className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
            activeTargetLang === 'en' && !showOriginal
              ? 'border-dc-blue bg-dc-blue/10 text-dc-blue'
              : 'border-dc-border bg-dc-bg hover:border-dc-border2 hover:text-dc-text'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => handleTranslate('hi')}
          disabled={loading}
          className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
            activeTargetLang === 'hi' && !showOriginal
              ? 'border-dc-blue bg-dc-blue/10 text-dc-blue'
              : 'border-dc-border bg-dc-bg hover:border-dc-border2 hover:text-dc-text'
          }`}
        >
          हिन्दी
        </button>
        <button
          type="button"
          onClick={() => handleTranslate('hinglish')}
          disabled={loading}
          className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
            activeTargetLang === 'hinglish' && !showOriginal
              ? 'border-dc-blue bg-dc-blue/10 text-dc-blue'
              : 'border-dc-border bg-dc-bg hover:border-dc-border2 hover:text-dc-text'
          }`}
        >
          Hinglish
        </button>

        {translatedText && (
          <button
            type="button"
            onClick={() => setShowOriginal(!showOriginal)}
            className="ml-auto text-xs text-dc-blue underline hover:text-dc-blue/80"
          >
            {showOriginal ? t('common.showTranslation') : t('common.viewOriginal')}
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-2 flex items-center gap-2 text-xs text-dc-subtext animate-pulse">
          <svg className="h-3.5 w-3.5 animate-spin text-dc-blue" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>{t('common.translating')}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-1.5 text-xs text-dc-red flex items-center gap-1">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Translated Box Display (Only if not viewing original) */}
      {translatedText && !showOriginal && !loading && (
        <div className="mt-2.5 rounded-lg border border-dc-blue/20 bg-dc-blue/5 p-3 text-sm text-dc-text">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded bg-dc-blue/20 px-1.5 py-0.5 text-[10px] font-semibold text-dc-blue uppercase tracking-wider">
              ✦ {t('common.aiTranslatedBadge')} ({activeTargetLang ? getTargetLangLabel(activeTargetLang) : ''})
            </span>
            <span className="text-[11px] text-dc-subtext">Original text preserved</span>
          </div>
          <div className="whitespace-pre-wrap font-sans leading-relaxed">{translatedText}</div>
        </div>
      )}
    </div>
  )
}

export default ContentTranslationControl
