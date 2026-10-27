import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  {
    to: '/',
    end: true,
    label: 'Dashboard',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Search',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
      </svg>
    ),
  },
  {
    to: '/doubts',
    label: 'Discussions',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    to: '/faq',
    label: 'FAQ',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-dc-border bg-dc-bg2 lg:flex">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-dc-border px-5">
        <span className="h-2 w-2 rounded-full bg-dc-red shadow-dc-red" />
        <span className="text-sm font-semibold tracking-widest text-dc-text">DOUBT-CHAIN</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        <div className="space-y-0.5">
          {navLinks.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-dc-blue/10 text-dc-text font-medium'
                    : 'text-dc-subtext hover:bg-white/5 hover:text-dc-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-colors ${isActive ? 'text-dc-blue' : 'text-dc-subtext group-hover:text-dc-text'}`}>
                    {icon}
                  </span>
                  {label}
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-dc-blue" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Ask CTA */}
      <div className="border-t border-dc-border p-4">
        <NavLink
          to="/doubts/new"
          className="dc-btn-primary w-full"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Ask a Doubt
        </NavLink>

        {/* User strip */}
        {user ? (
          <div className="mt-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-dc-text">{user.displayName}</p>
              <p className="truncate text-xs text-dc-subtext">{user.profession?.toLowerCase()}</p>
            </div>
            <button
              onClick={() => logout()}
              className="ml-2 shrink-0 text-xs text-dc-subtext hover:text-dc-red transition-colors"
              aria-label="Logout"
            >
              Sign out
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="mt-3 block text-center text-xs text-dc-blue hover:underline underline-offset-2">
            Sign in
          </NavLink>
        )}
      </div>
    </aside>
  )
}
