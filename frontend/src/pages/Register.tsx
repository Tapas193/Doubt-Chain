import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PROFESSIONS = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'CORPORATE_WORKER', label: 'Corporate Worker' },
]

function idLabel(prof: string) {
  if (prof === 'PROFESSOR') return 'Faculty ID'
  if (prof === 'CORPORATE_WORKER') return 'Employee ID'
  return 'Student ID'
}

function idPlaceholder(prof: string) {
  if (prof === 'PROFESSOR') return 'e.g. FAC-2024'
  if (prof === 'CORPORATE_WORKER') return 'e.g. EMP-9900'
  return 'e.g. STU-12345'
}

type FieldErrors = Partial<Record<'fullName' | 'profession' | 'identificationNumber' | 'email' | 'password' | 'confirmPassword', string>>

function validate(form: ReturnType<typeof defaultForm>): FieldErrors {
  const errs: FieldErrors = {}
  if (!form.fullName.trim()) errs.fullName = 'Full name is required.'
  if (!form.profession) errs.profession = 'Select your profession.'
  if (!form.identificationNumber.trim()) errs.identificationNumber = `${idLabel(form.profession)} is required.`
  else if (!/^[A-Za-z0-9\-_]+$/.test(form.identificationNumber.trim())) errs.identificationNumber = 'Only letters, numbers, hyphens, and underscores.'
  if (!form.email.trim()) errs.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.'
  if (form.password.length < 6) errs.password = 'At least 6 characters.'
  if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match.'
  return errs
}

function defaultForm() {
  return { fullName: '', profession: '', identificationNumber: '', email: '', password: '', confirmPassword: '' }
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultForm)
  const [showPw, setShowPw] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof ReturnType<typeof defaultForm>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (fieldErrors[k]) setFieldErrors(fe => ({ ...fe, [k]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    const errs = validate(form)
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
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
      setSubmitError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ id, label, sub, error, children }: { id: string; label: string; sub?: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="dc-label">{label}</label>
      {sub && <p className="mb-1.5 text-xs text-dc-subtext">{sub}</p>}
      {children}
      {error && <p role="alert" className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  )

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="dc-grid-bg" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[440px] animate-slide-up">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-dc-red shadow-dc-red" />
            <span className="text-xs font-semibold tracking-[0.2em] text-dc-subtext uppercase">Doubt-Chain</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-dc-text">Create your account</h1>
          <p className="mt-1.5 text-sm text-dc-subtext">Use your organizational email to join your institution's network.</p>
        </div>

        <div className="dc-card p-6">
          {/* Global error */}
          {submitError && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-dc-red/30 bg-dc-red/10 px-4 py-3 text-sm text-rose-300">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field id="fullName" label="Full Name" error={fieldErrors.fullName}>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Jane Doe"
                className={`dc-input ${fieldErrors.fullName ? 'dc-input-error' : ''}`}
              />
            </Field>

            <Field id="profession" label="Profession" error={fieldErrors.profession}>
              <select
                id="profession"
                value={form.profession}
                onChange={set('profession')}
                className={`dc-input ${fieldErrors.profession ? 'dc-input-error' : ''}`}
              >
                <option value="">Select your profession</option>
                {PROFESSIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>

            <Field id="idnum" label={idLabel(form.profession)} error={fieldErrors.identificationNumber}>
              <input
                id="idnum"
                type="text"
                value={form.identificationNumber}
                onChange={set('identificationNumber')}
                placeholder={idPlaceholder(form.profession)}
                className={`dc-input ${fieldErrors.identificationNumber ? 'dc-input-error' : ''}`}
              />
            </Field>

            <Field
              id="email"
              label="Organizational Email"
              sub="College, university, or company email. Not verified by default."
              error={fieldErrors.email}
            >
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@university.edu"
                className={`dc-input ${fieldErrors.email ? 'dc-input-error' : ''}`}
              />
            </Field>

            <Field id="password" label="Create Password" error={fieldErrors.password}>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 6 characters"
                  className={`dc-input pr-10 ${fieldErrors.password ? 'dc-input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dc-subtext hover:text-dc-text transition-colors"
                >
                  {showPw ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            <Field id="confirm" label="Confirm Password" error={fieldErrors.confirmPassword}>
              <input
                id="confirm"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="Re-enter password"
                className={`dc-input ${fieldErrors.confirmPassword ? 'dc-input-error' : ''}`}
              />
            </Field>

            <button type="submit" disabled={loading} className="dc-btn-primary w-full mt-1">
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-dc-subtext">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-dc-blue hover:underline underline-offset-2">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
