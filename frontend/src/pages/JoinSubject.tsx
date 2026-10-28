import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'
import AppShell from '../layouts/AppShell'
import { doubtService } from '../services/doubtService'
import { useAuth } from '../context/AuthContext'

export default function JoinSubject() {
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) {
      setError('Please enter a course or subject join code.')
      return
    }

    if (!user) {
      setError('Please sign in to join a subject.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const subject = await doubtService.joinSubjectByCode(joinCode.trim().toUpperCase())
      setSuccess(`Successfully joined ${subject.name} (${subject.code})!`)
      setTimeout(() => {
        navigate(`/subjects/${subject.id}`)
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Invalid join code. Please check with your course instructor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6 py-6 animate-fade-in">
        <Link to="/subjects" className="inline-flex items-center gap-1.5 text-xs text-dc-subtext hover:text-dc-text">
          <ArrowLeft className="h-4 w-4" /> All Subjects
        </Link>

        <div className="rounded-2xl border border-dc-border bg-dc-card p-6 sm:p-8 shadow-dc-card">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-dc-blue/10 text-dc-blue">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-dc-blue">
                COURSE ENROLLMENT
              </span>
              <h1 className="text-xl font-bold text-dc-text">Join Subject Board</h1>
            </div>
          </div>

          <p className="mt-3 text-xs text-dc-subtext leading-relaxed">
            Enter the unique 6-character course code provided by your faculty or department coordinator to access subject discussions.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="joinCode" className="block text-xs font-medium text-dc-text mb-1">
                Subject Join Code
              </label>
              <input
                id="joinCode"
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. CS201 or JOIN-101"
                maxLength={20}
                className="dc-input uppercase font-mono tracking-wider"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-dc-red/30 bg-dc-red/10 p-3 text-xs text-dc-red">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="dc-btn-primary w-full"
            >
              {loading ? 'Verifying Join Code...' : 'Join Subject Board'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
