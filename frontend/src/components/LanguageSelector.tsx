import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { SupportedLanguage } from '../i18n/types'

interface LanguageSelectorProps {
  className?: string
  compact?: boolean
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '', compact = false }) => {
  const { language, setLanguage, languages } = useLanguage()

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label htmlFor="language-select" className="sr-only">
        Select Language (भाषा चुनें)
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-2.5 text-dc-subtext">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
        </span>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          aria-label="Select interface language"
          className={`appearance-none rounded-lg border border-dc-border bg-dc-bg2 text-dc-text py-1.5 pl-8 pr-7 text-xs font-medium transition-colors hover:border-dc-blue/60 focus:border-dc-blue focus:outline-none focus:ring-1 focus:ring-dc-blue cursor-pointer ${
            compact ? 'max-w-[110px]' : 'max-w-[130px]'
          }`}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-dc-bg text-dc-text">
              {lang.nativeName}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 text-dc-subtext">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </div>
  )
}

export default LanguageSelector
