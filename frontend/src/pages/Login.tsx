import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import AuthHeroPanel from '../components/AuthHeroPanel'
import { Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError(t('auth.fieldRequired') || 'Email is required')
      return
    }
    if (!password) {
      setError(t('auth.fieldRequired') || 'Password is required')
      return
    }
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate(from, { replace: true })
    } catch (err: any) {
      if (err.status === 429 || (err.message && err.message.includes('429'))) {
        setError('Too many login attempts. Please wait a moment before trying again.')
      } else {
        setError(err.message || 'Login failed. Check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-dc-bg p-4 sm:p-6 lg:p-8">
      {/* Background Subtle Web Grid & Lighting */}
      <div className="dc-grid-bg" aria-hidden="true" />
      <div className="absolute top-4 right-4 z-30">
        <LanguageSelector />
      </div>

      <div className="relative z-10 flex w-full max-w-5xl gap-8 animate-fade-in items-stretch">
        {/* Left Side: Cinematic Superhero Hero Panel */}
        <AuthHeroPanel
          headline="Every Hero Starts With a Question."
          subtitle="Join the network where students connect, solve doubts, and level up together."
        />

        {/* Right Side: Authentication Card */}
        <div className="flex w-full lg:w-1/2 flex-col justify-center">
          <div className="relative overflow-hidden rounded-3xl border border-dc-border bg-dc-card/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            {/* Top spider accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#E62429] via-[#1677FF] to-[#00E5FF]" />

            {/* Header */}
            <div className="mb-6">
              <div className="mb-3 inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-dc-red shadow-[0_0_8px_#E62429]" />
                <span className="text-[11px] font-bold tracking-[0.25em] text-dc-subtext uppercase">
                  Doubt-Chain Network
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dc-text">
                {t('auth.loginTitle') || 'Welcome Back'}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-dc-subtext">
                {t('auth.loginSubtitle') || 'Sign in to access your doubts and learning circles.'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-dc-red/30 bg-dc-red/10 px-4 py-3 text-xs sm:text-sm text-rose-300 animate-slide-up"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-dc-red" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="dc-label text-xs uppercase tracking-wider font-semibold">
                  {t('auth.emailLabel') || 'Email Address'}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder') || 'hero@doubtchain.edu'}
                  required
                  className={`dc-input text-sm ${error && !email.trim() ? 'dc-input-error' : ''}`}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="dc-label text-xs uppercase tracking-wider font-semibold">
                  {t('auth.passwordLabel') || 'Password'}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder') || '••••••••'}
                    required
                    className="dc-input pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dc-subtext hover:text-dc-text transition-colors"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4 text-dc-subtext" />
                    ) : (
                      <Eye className="h-4 w-4 text-dc-subtext" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Button: Superhero CTA */}
              <button
                type="submit"
                disabled={loading}
                className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#E62429] via-[#D11D22] to-[#B91C1C] py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(230,36,41,0.4)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{t('auth.loggingIn') || 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>ENTER THE NETWORK</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Register Redirect */}
            <div className="mt-6 border-t border-dc-border/60 pt-4 text-center text-xs text-dc-subtext">
              {t('auth.noAccount') || 'New to the academic network?'}{' '}
              <Link
                to="/register"
                className="font-bold text-dc-blue hover:text-dc-blue-hover hover:underline underline-offset-4 ml-1"
              >
                JOIN THE SPIDER-VERSE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
