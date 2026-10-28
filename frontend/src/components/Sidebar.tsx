import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileQuestion,
  GitFork,
  Users,
  Settings as SettingsIcon,
  User as UserIcon,
  Plus,
  LogOut,
  LogIn,
  BarChart3,
  Globe,
  Building2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  const navGroups = [
    {
      label: 'WORKSPACE',
      links: [
        { to: '/', end: true, label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/analytics', label: 'Doubt Analytics', icon: BarChart3, badge: 'FACULTY' },
        { to: '/explore', label: 'Explore Doubts', icon: Compass },
        { to: '/search', label: 'Smart Search 2.0', icon: Sparkles },
        { to: '/ai-assistant', label: 'AI Study Assistant', icon: HelpCircle },
        { to: '/faq', label: t('nav.faq'), icon: BookOpen },
        { to: '/my-doubts', label: 'My Doubts', icon: UserIcon },
        { to: '/requests', label: 'Unanswered', icon: FileQuestion },
      ]
    },
    {
      label: 'PEER NETWORK',
      links: [
        { to: '/community', label: 'College Community', icon: Users },
        { to: '/community/explore', label: 'Explore Colleges', icon: Building2 },
        { to: '/wider-network', label: 'Wider Network', icon: Globe },
      ]
    },
    {
      label: 'CURRICULUM',
      links: [
        { to: '/subjects', label: t('nav.subjects'), icon: GitFork },
        { to: '/resources', label: 'Curriculum Resources', icon: BookOpen },
      ]
    },
    {
      label: 'ACCOUNT',
      links: [
        { to: '/settings', label: 'Settings', icon: SettingsIcon },
        { to: '/profile', label: 'Academic Profile', icon: UserIcon },
      ]
    }
  ]

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-dc-border bg-dc-bg2 lg:flex">
      {/* Brand Header */}
      <div className="flex h-14 items-center gap-2.5 border-b border-dc-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-dc-red/10 border border-dc-red/30 shadow-[0_0_8px_rgba(230,36,41,0.25)]">
            <span className="text-xs select-none">🕷️</span>
          </div>
          <span className="text-xs font-black tracking-widest text-dc-text">
            DOUBT-CHAIN
          </span>
        </div>
        <span className="ml-auto rounded border border-dc-red/40 bg-dc-red/10 px-1.5 py-0.5 text-[9px] font-bold text-dc-red uppercase tracking-wider">
          VERSE
        </span>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Primary navigation">
        {navGroups.map(group => (
          <div key={group.label} className="space-y-1">
            <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-dc-subtext/70">
              {group.label}
            </span>
            <div className="space-y-0.5 pt-1">
              {group.links.map(({ to, end, label, icon: Icon, ...rest }) => {
                const badge = (rest as { badge?: string }).badge
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-dc-blue/15 text-dc-text font-semibold shadow-sm'
                          : 'text-dc-subtext hover:bg-dc-card hover:text-dc-text'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? 'text-dc-blue' : 'text-dc-subtext group-hover:text-dc-text'
                          }`}
                        />
                        <span className="truncate">{label}</span>
                        {badge && (
                          <span className="ml-auto rounded border border-dc-red/30 bg-dc-red/10 px-1.5 py-0.5 text-[9px] font-bold text-dc-red uppercase tracking-wider">
                            {badge}
                          </span>
                        )}
                        {isActive && !badge && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-dc-blue" />
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* CTA & User footer */}
      <div className="border-t border-dc-border p-3 space-y-3">
        <NavLink to="/doubts/new" className="dc-btn-primary w-full text-xs py-2 shadow-sm">
          <Plus className="h-3.5 w-3.5" />
          {t('nav.askDoubt')}
        </NavLink>

        {user ? (
          <div className="flex items-center justify-between rounded-xl border border-dc-border bg-dc-card p-2.5">
            <div className="min-w-0 pr-2">
              <p className="truncate text-xs font-semibold text-dc-text">
                {user.displayName}
              </p>
              <p className="truncate text-[10px] text-dc-subtext capitalize">
                {user.profession?.toLowerCase() || 'Student'}
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-lg p-1 text-dc-subtext hover:bg-dc-red/10 hover:text-dc-red transition-colors"
              title={t('nav.signOut')}
              aria-label={t('nav.signOut')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-dc-border bg-dc-bg px-3 py-2 text-xs font-medium text-dc-text hover:border-dc-blue/40"
          >
            <LogIn className="h-3.5 w-3.5 text-dc-blue" />
            {t('nav.signIn')}
          </NavLink>
        )}
      </div>
    </aside>
  )
}