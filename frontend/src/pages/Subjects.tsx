import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import SubjectCard from '../components/SubjectCard'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { doubtService } from '../services/doubtService'
import { Subject } from '../types/api'
import { useAuth } from '../context/AuthContext'

export default function Subjects() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null)
  const [showCodeDialog, setShowCodeDialog] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    doubtService
      .listSubjects({ q: search.trim() || undefined })
      .then(setSubjects)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(() => {
      load()
    }, 250)
    return () => clearTimeout(t)
  }, [search])

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true)
    setJoinError(null)
    setJoinSuccess(null)
    try {
      const res = await doubtService.joinSubjectByCode(joinCode.trim())
      setJoinSuccess(`Successfully joined ${res.name} (${res.code})!`)
      setJoinCode('')
      load()
    } catch (err: any) {
      setJoinError(err.message || 'Invalid or expired join code')
    } finally {
      setJoining(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-dc-text">Subject Boards</h1>
            <p className="mt-1 text-sm text-dc-subtext">
              Browse subject boards, join with a code, and view doubts specific to your courses.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowCodeDialog(open => !open)}
              className="dc-btn-secondary text-xs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              Join Using Code
            </button>
            <Link to="/doubts/new" className="dc-btn-primary text-xs">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ask a Doubt
            </Link>
          </div>
        </div>

        {/* Join Code Dialog / Card */}
        {showCodeDialog && (
          <div className="rounded-xl border border-dc-blue/40 bg-dc-card p-5 shadow-lg space-y-3 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-dc-text">Join a Board Using Secret Code</h2>
                <p className="text-xs text-dc-subtext">
                  Enter the course join code (e.g., <code className="text-dc-blue">DS-201</code>, <code className="text-dc-blue">OOP-202</code>, or course code) provided by your professor or peer.
                </p>
              </div>
              <button
                onClick={() => setShowCodeDialog(false)}
                className="text-xs text-dc-subtext hover:text-dc-text"
              >
                ✕ Close
              </button>
            </div>

            {user ? (
              <form onSubmit={handleJoinByCode} className="flex flex-wrap gap-2">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  placeholder="Enter join code (e.g. DS-201)"
                  aria-label="Subject join code"
                  className="dc-input flex-1 min-w-[200px]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="dc-btn-primary shrink-0"
                >
                  {joining ? 'Joining…' : 'Join Board'}
                </button>
              </form>
            ) : (
              <p className="text-xs text-amber-300">
                Please <Link to="/login" className="underline font-semibold">sign in</Link> first to join subject boards.
              </p>
            )}

            {joinError && (
              <p role="alert" className="text-xs text-rose-400 font-medium">
                {joinError}
              </p>
            )}
            {joinSuccess && (
              <p role="status" className="text-xs text-emerald-400 font-medium">
                {joinSuccess}
              </p>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dc-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subjects by name, course code, or description…"
            aria-label="Search subjects"
            className="dc-input pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dc-subtext hover:text-dc-text"
            >
              Clear
            </button>
          )}
        </div>

        {/* Error */}
        {error && <ErrorState message={error} onRetry={load} />}

        {/* Grid of Subject Cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No subjects match your query"
            description="Try searching with different terms or join using a specific code."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map(s => (
              <SubjectCard
                key={s.id}
                id={s.id}
                name={s.name}
                code={s.code}
                description={s.description ?? undefined}
                doubtsCount={s._count?.doubts}
                membersCount={s._count?.members}
                isMember={s.isMember}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
