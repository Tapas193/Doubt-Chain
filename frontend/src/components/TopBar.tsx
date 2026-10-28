import { useLocation, Link } from 'react-router-dom'
import { Search, Sun, Moon, Plus, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSelector from './LanguageSelector'
import { useTheme } from '../context/ThemeContext'
import NotificationBell from './NotificationBell'

type TopBarProps = {
  onOpenPalette?: () => void
}

export default function TopBar({ onOpenPalette }: TopBarProps) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const { resolvedTheme, toggleTheme } = useTheme()

  const getPageTitle = () => {
    const p = location.pathname
    if (p === '/') return t('nav.dashboard')
    if (p === '/subjects') return t('nav.subjects')
    if (p.startsWith('/subjects/')) return t('subjects.title')
    if (p === '/search') return 'Smart Search 2.0'
    if (p === '/doubts' || p === '/explore') return t('nav.discussions')
    if (p === '/doubts/new' || p === '/ask') return t('doubts.askButton')
    if (p.startsWith('/doubts/')) return t('detail.doubtDetails')
    if (p === '/faq') return t('nav.faq')
    if (p === '/ai-assistant' || p === '/assistant' || p === '/ai') return 'AI Study Assistant 2.0'
    if (p === '/my-doubts') return 'My Doubts'
    if (p === '/saved') return 'Saved Doubts'
    if (p === '/requests') return 'Unanswered Questions'
    if (p.startsWith('/resources')) return 'Curriculum Resources'
    if (p === '/community' || p === '/community/my') return 'My College Community'
    if (p === '/community/explore' || p === '/communities') return 'Explore Communities'
    if (p === '/wider-network' || p === '/network') return 'Wider Academic Network'
    if (p.includes('/manage')) return 'Community Management'
    if (p.startsWith('/community/')) return 'College Community'
    if (p === '/settings') return 'Settings'
    if (p === '/profile') return 'Academic Profile'
    if (p.startsWith('/policy')) return 'Academic Policy'
    if (p === '/welcome') return 'Welcome to Doubt-Chain'
    return 'Doubt-Chain'
  }

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-dc-border bg-dc-bg2 px-4 lg:px-6">
      {/* Page Title & Mobile brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="h-2 w-2 rounded-full bg-dc-red" />
          <span className="text-sm font-bold tracking-widest text-dc-text">DOUBT-CHAIN</span>
        </div>
        <span className="hidden text-sm font-semibold text-dc-text lg:block">{getPageTitle()}</span>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex items-center gap-2 rounded-xl border border-dc-border bg-dc-card px-3 py-1.5 text-xs text-dc-subtext transition-all hover:border-dc-blue/40 hover:text-dc-text"
          title="Open Search & Command Palette"
        >
          <Search className="h-3.5 w-3.5 text-dc-blue" />
          <span className="hidden sm:inline">Search questions...</span>
          <kbd className="hidden rounded bg-dc-bg2 px-1.5 py-0.5 font-mono text-[10px] text-dc-subtext border border-dc-border sm:inline-block">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>

        {/* Language selector */}
        <LanguageSelector compact />

        {/* Notification Bell */}
        <NotificationBell />

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-dc-border bg-dc-card text-dc-subtext transition-colors hover:border-dc-blue/40 hover:text-dc-text"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-dc-blue" />
          )}
        </button>

        {/* Ask Question CTA */}
        <Link
          to="/doubts/new"
          className="dc-btn-primary px-3 py-1.5 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('nav.askDoubt')}</span>
        </Link>

        {/* User profile / auth */}
        {user ? (
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 rounded-xl border border-dc-border bg-dc-card px-3 py-1.5 text-xs text-dc-subtext transition-colors hover:border-dc-red/40 hover:text-dc-red"
            title={t('nav.signOut')}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('nav.signOut')}</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-xl border border-dc-border bg-dc-card px-3 py-1.5 text-xs text-dc-subtext transition-colors hover:border-dc-blue/40 hover:text-dc-text"
          >
            <LogIn className="h-3.5 w-3.5 text-dc-blue" />
            <span className="hidden sm:inline">{t('nav.signIn')}</span>
          </Link>
        )}
      </div>
    </header>
  )
}
