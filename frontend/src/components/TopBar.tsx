import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSelector from './LanguageSelector'

export default function TopBar() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  const getPageTitle = () => {
    if (location.pathname === '/') return t('nav.dashboard')
    if (location.pathname === '/subjects') return t('nav.subjects')
    if (location.pathname.startsWith('/subjects/')) return t('subjects.title')
    if (location.pathname === '/search') return t('search.title')
    if (location.pathname === '/doubts') return t('nav.discussions')
    if (location.pathname === '/doubts/new') return t('doubts.askButton')
    if (location.pathname.startsWith('/doubts/')) return t('detail.doubtDetails')
    if (location.pathname === '/faq') return t('nav.faq')
    if (location.pathname === '/ai-assistant') return t('nav.aiAssistant')
    return 'Doubt-Chain'
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-dc-border bg-dc-bg2 px-4 lg:px-5">
      {/* Mobile brand / Desktop page title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="h-2 w-2 rounded-full bg-dc-red" />
          <span className="text-sm font-semibold tracking-widest">DOUBT-CHAIN</span>
        </div>
        <span className="hidden text-sm font-medium text-dc-subtext lg:block">{getPageTitle()}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <LanguageSelector compact />

        <Link
          to="/search"
          aria-label={t('nav.search')}
          className="flex items-center gap-2 rounded-lg border border-dc-border px-3 py-1.5 text-sm text-dc-subtext transition-colors hover:border-dc-blue/50 hover:text-dc-text"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <span className="hidden sm:inline">{t('nav.search')}</span>
        </Link>

        <Link
          to="/doubts/new"
          className="dc-btn-primary px-3 py-1.5 text-sm"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">{t('nav.askDoubt')}</span>
        </Link>

        {user ? (
          <button
            onClick={() => logout()}
            className="rounded-lg border border-dc-border px-3 py-1.5 text-sm text-dc-subtext transition-colors hover:border-dc-red/40 hover:text-dc-text"
            title={t('nav.signOut')}
          >
            <span className="hidden sm:inline">{t('nav.signOut')}</span>
            <svg className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        ) : (
          <Link to="/login" className="rounded-lg border border-dc-border px-3 py-1.5 text-sm text-dc-subtext transition-colors hover:text-dc-text">
            {t('nav.signIn')}
          </Link>
        )}
      </div>
    </header>
  )
}

