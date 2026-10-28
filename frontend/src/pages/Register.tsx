import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import AuthHeroPanel from '../components/AuthHeroPanel'
import { Eye, EyeOff, ShieldAlert, ArrowRight, UserPlus } from 'lucide-react'

type FieldErrors = Partial<Record<'fullName' | 'profession' | 'identificationNumber' | 'email' | 'password' | 'confirmPassword', string>>

function defaultForm() {
  return { fullName: '', profession: '', identificationNumber: '', email: '', password: '', confirmPassword: '' }
}

interface FieldProps {
  id: string
  label: string
  sub?: string
  error?: string
  children: React.ReactNode
}

function Field({ id, label, sub, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="dc-label text-xs uppercase tracking-wider font-semibold">
        {label}
      </label>
      {sub && <p className="mb-1 text-[11px] text-dc-subtext">{sub}</p>}
      {children}
      {error && <p role="alert" className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultForm)
  const [showPw, setShowPw] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const professions = [
    { value: 'STUDENT', label: t('auth.professionStudent') || 'Student' },
    { value: 'PROFESSOR', label: t('auth.professionProfessor') || 'Professor / Teacher' },
    { value: 'CORPORATE_WORKER', label: t('auth.professionCorporate') || 'Industry Professional' },
  ]

  const idLabelText = (prof: string) => {
    if (prof === 'PROFESSOR') return 'Faculty ID'
    if (prof === 'CORPORATE_WORKER') return 'Employee ID'
    return t('auth.idLabel') || 'Student Roll Number / College ID'
  }

  const validateForm = (): FieldErrors => {
    const errs: FieldErrors = {}
    if (!form.fullName.trim()) errs.fullName = t('auth.fieldRequired') || 'Full name is required'
    if (!form.profession) errs.profession = t('auth.fieldRequired') || 'Select your role'
    if (!form.identificationNumber.trim()) errs.identificationNumber = t('auth.fieldRequired') || 'Identification is required'
    else if (!/^[A-Za-z0-9\-_]+$/.test(form.identificationNumber.trim())) {
      errs.identificationNumber = 'Only letters, numbers, hyphens, and underscores.'
    }
    if (!form.email.trim()) errs.email = t('auth.fieldRequired') || 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address.'
    }
    if (form.password.length < 6) errs.password = t('auth.minPasswordLength') || 'Password must be at least 6 characters'
    if (form.confirmPassword !== form.password) errs.confirmPassword = t('auth.passwordMismatch') || 'Passwords do not match'
    return errs
  }

  const set = (k: keyof ReturnType<typeof defaultForm>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (fieldErrors[k]) setFieldErrors(fe => ({ ...fe, [k]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    const errs = validateForm()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }
    setLoading(true)
    try {
      await register({
        fullName: form.fullName.trim(),
        profession: form.profession,
        identificationNumber: form.identificationNumber.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      })
      navigate('/')
    } catch (err: any) {
      if (err.status === 429 || (err.message && err.message.includes('429'))) {
        setSubmitError('Too many registration attempts. Please wait a moment before trying again.')
      } else {
        setSubmitError(err.message || 'Registration failed. Please try again.')
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
          headline="Unleash Your Academic Potential."
          subtitle="Join students and mentors across disciplines. Ask questions, clarify concepts, and master tough subjects together."
        />

        {/* Right Side: Registration Form Card */}
        <div className="flex w-full lg:w-1/2 flex-col justify-center">
          <div className="relative overflow-hidden rounded-3xl border border-dc-border bg-dc-card/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            {/* Top spider accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#1677FF] via-[#E62429] to-[#00E5FF]" />

            {/* Header */}
            <div className="mb-6">
              <div className="mb-3 inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-dc-red shadow-[0_0_8px_#E62429]" />
                <span className="text-[11px] font-bold tracking-[0.25em] text-dc-subtext uppercase">
                  Doubt-Chain Network
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dc-text">
                {t('auth.registerTitle') || 'Create Your Account'}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-dc-subtext">
                {t('auth.registerSubtitle') || 'Step into the collaborative learning network.'}
              </p>
            </div>

            {/* Global Error Banner */}
            {submitError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-dc-red/30 bg-dc-red/10 px-4 py-3 text-xs sm:text-sm text-rose-300 animate-slide-up"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-dc-red" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name */}
              <Field id="fullName" label={t('auth.fullNameLabel') || 'Full Name'} error={fieldErrors.fullName}>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={set('fullName')}
                  placeholder={t('auth.fullNamePlaceholder') || 'Peter Parker'}
                  required
                  className={`dc-input text-sm ${fieldErrors.fullName ? 'dc-input-error' : ''}`}
                />
              </Field>

              {/* Profession & ID in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field id="profession" label={t('auth.professionLabel') || 'Role'} error={fieldErrors.profession}>
                  <select
                    id="profession"
                    value={form.profession}
                    onChange={set('profession')}
                    required
                    className={`dc-input text-sm ${fieldErrors.profession ? 'dc-input-error' : ''}`}
                  >
                    <option value="" disabled>
                      {t('auth.selectProfession') || 'Select Role'}
                    </option>
                    {professions.map(p => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  id="identificationNumber"
                  label={idLabelText(form.profession)}
                  error={fieldErrors.identificationNumber}
                >
                  <input
                    id="identificationNumber"
                    type="text"
                    value={form.identificationNumber}
                    onChange={set('identificationNumber')}
                    placeholder="e.g. STU-2024-001"
                    required
                    className={`dc-input text-sm ${fieldErrors.identificationNumber ? 'dc-input-error' : ''}`}
                  />
                </Field>
              </div>

              {/* Email */}
              <Field id="email" label={t('auth.emailLabel') || 'Email Address'} error={fieldErrors.email}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="hero@doubtchain.edu"
                  required
                  className={`dc-input text-sm ${fieldErrors.email ? 'dc-input-error' : ''}`}
                />
              </Field>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field id="password" label={t('auth.passwordLabel') || 'Password'} error={fieldErrors.password}>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={set('password')}
                      placeholder="••••••••"
                      required
                      className="dc-input pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dc-subtext hover:text-dc-text transition-colors"
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <Field
                  id="confirmPassword"
                  label={t('auth.confirmPasswordLabel') || 'Confirm Password'}
                  error={fieldErrors.confirmPassword}
                >
                  <input
                    id="confirmPassword"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder="••••••••"
                    required
                    className="dc-input text-sm"
                  />
                </Field>
              </div>

              {/* Superhero Action Submit Button */}
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
                    <span>{t('auth.submitting') || 'Joining...'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>JOIN THE SPIDER-VERSE</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Sign In Redirect */}
            <div className="mt-6 border-t border-dc-border/60 pt-4 text-center text-xs text-dc-subtext">
              {t('auth.haveAccount') || 'Already part of the network?'}{' '}
              <Link
                to="/login"
                className="font-bold text-dc-blue hover:text-dc-blue-hover hover:underline underline-offset-4 ml-1"
              >
                {t('nav.signIn') || 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
