import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import ProtectedRoute from '../components/ProtectedRoute'
import ErrorState from '../components/ErrorState'
import StatusBadge from '../components/StatusBadge'
import { doubtService } from '../services/doubtService'
import { Subject, Doubt } from '../types/api'

function NewDoubtForm() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState({ title: '', content: '', subjectId: '' })
  const [matches, setMatches] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'title' | 'content' | 'subjectId', string>>>({})

  useEffect(() => {
    doubtService.listSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  // Debounced search interceptor
  useEffect(() => {
    if (!form.title.trim()) { setMatches([]); return }
    let active = true
    setSearching(true)
    const t = setTimeout(() => {
      doubtService
        .searchDoubts(form.title.trim())
        .then(res => { if (active) setMatches(res.items.slice(0, 5)) })
        .catch(() => { if (active) setMatches([]) })
        .finally(() => { if (active) setSearching(false) })
    }, 300)
    return () => { active = false; clearTimeout(t) }
  }, [form.title])

  const validate = () => {
    const errs: typeof fieldErrors = {}
    if (!form.subjectId) errs.subjectId = 'Select a subject.'
    if (form.title.trim().length < 3) errs.title = 'Title must be at least 3 characters.'
    if (!form.content.trim()) errs.content = 'Content is required.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setError(null)
    setLoading(true)
    try {
      const created = await doubtService.createDoubt(form)
      navigate(`/doubts/${created.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (fieldErrors[k]) setFieldErrors(fe => ({ ...fe, [k]: undefined }))
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-dc-text">Post a New Doubt</h1>
          <p className="mt-0.5 text-sm text-dc-subtext">Similar doubts are checked as you type the title.</p>
        </div>

        {error && <ErrorState message={error} />}

        <form onSubmit={handleSubmit} noValidate className="dc-card p-6 space-y-5">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="dc-label">Subject</label>
            <select
              id="subject"
              value={form.subjectId}
              onChange={set('subjectId')}
              className={`dc-input ${fieldErrors.subjectId ? 'dc-input-error' : ''}`}
            >
              <option value="">Select a subject board</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
            {fieldErrors.subjectId && <p role="alert" className="mt-1.5 text-xs text-rose-400">{fieldErrors.subjectId}</p>}
          </div>

          {/* Title + live search */}
          <div>
            <label htmlFor="title" className="dc-label">Title</label>
            <div className="relative">
              <input
                id="title"
                value={form.title}
                onChange={set('title')}
                required
                minLength={3}
                placeholder="What is your doubt about?"
                className={`dc-input ${fieldErrors.title ? 'dc-input-error' : ''}`}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 animate-spin text-dc-blue/70" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
            </div>
            {fieldErrors.title && <p role="alert" className="mt-1.5 text-xs text-rose-400">{fieldErrors.title}</p>}

            {/* Similar doubts interceptor */}
            {matches.length > 0 && (
              <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-500/5 p-3 space-y-2">
                <p className="text-xs font-medium text-amber-300">
                  Similar doubts found — check if your question is already answered:
                </p>
                {matches.map(m => (
                  <Link
                    key={m.id}
                    to={`/doubts/${m.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded border border-dc-border p-2 hover:border-dc-blue/40"
                  >
                    <span className="truncate text-xs text-dc-text">{m.title}</span>
                    <StatusBadge status={m.isResolved ? 'resolved' : 'unresolved'} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="dc-label">Details</label>
            <textarea
              id="content"
              value={form.content}
              onChange={set('content')}
              required
              rows={6}
              placeholder="Explain your doubt in detail. Include any relevant code, formula, or concept."
              className={`dc-input resize-none ${fieldErrors.content ? 'dc-input-error' : ''}`}
            />
            {fieldErrors.content && <p role="alert" className="mt-1.5 text-xs text-rose-400">{fieldErrors.content}</p>}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link to="/doubts" className="dc-btn-secondary">Cancel</Link>
            <button type="submit" disabled={loading} className="dc-btn-primary">
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Posting…
                </>
              ) : 'Post Doubt'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

export default function NewDoubt() {
  return (
    <ProtectedRoute>
      <NewDoubtForm />
    </ProtectedRoute>
  )
}
