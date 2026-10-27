import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import DoubtCard from '../components/DoubtCard'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { doubtService } from '../services/doubtService'
import { Subject, Doubt } from '../types/api'
import { useAuth } from '../context/AuthContext'

export default function SubjectBoard() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [isResolved, setIsResolved] = useState<'' | 'true' | 'false'>('')
  const [search, setSearch] = useState('')

  // Join modal
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null)

  const load = () => {
    if (!id) return
    setLoading(true)
    setError(null)

    Promise.all([
      doubtService.getSubject(id),
      search.trim()
        ? doubtService.searchDoubts(search.trim(), {
            subjectId: id,
            isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
            limit: 40
          })
        : doubtService.listDoubts({
            subjectId: id,
            isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
            limit: 40
          })
    ])
      .then(([sub, dList]) => {
        setSubject(sub)
        setDoubts(dList.items)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id, isResolved, search])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !joinCode.trim()) return
    setJoining(true)
    setJoinError(null)
    setJoinSuccess(null)
    try {
      const updated = await doubtService.joinSubject(id, joinCode.trim())
      setSubject(updated)
      setJoinSuccess('Successfully joined this subject board!')
      setShowJoinModal(false)
      setJoinCode('')
    } catch (err: any) {
      setJoinError(err.message || 'Invalid join code')
    } finally {
      setJoining(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-dc-subtext">
          <Link to="/" className="hover:text-dc-text">Home</Link>
          <span>/</span>
          <Link to="/subjects" className="hover:text-dc-text">Subjects</Link>
          <span>/</span>
          <span className="text-dc-text font-medium truncate">{subject?.name || 'Board'}</span>
        </div>

        {error && <ErrorState message={error} onRetry={load} />}

        {/* Subject Header Banner */}
        {subject && (
          <header className="relative overflow-hidden rounded-2xl border border-dc-border bg-dc-card p-6 shadow-dc-card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded border border-dc-border bg-dc-bg2 px-2 py-0.5 font-mono text-xs text-dc-subtext">
                    {subject.code}
                  </span>
                  {subject.isMember && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                      ✓ Board Member
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-dc-text">
                  {subject.name}
                </h1>
                {subject.description && (
                  <p className="mt-1 text-sm text-dc-subtext leading-relaxed max-w-2xl">
                    {subject.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-5 text-xs text-dc-subtext">
                  <span>
                    <strong className="text-dc-text">{subject._count?.doubts ?? doubts.length}</strong> Doubts
                  </span>
                  <span>
                    <strong className="text-dc-text">{subject._count?.members ?? 0}</strong> Members
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {!subject.isMember && (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="dc-btn-secondary text-xs"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                    Join Board
                  </button>
                )}

                <Link
                  to={`/doubts/new?subjectId=${subject.id}`}
                  className="dc-btn-primary text-xs"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Ask in this Board
                </Link>
              </div>
            </div>

            {joinSuccess && (
              <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300">
                {joinSuccess}
              </p>
            )}
          </header>
        )}

        {/* Join Code Dialog / Form */}
        {showJoinModal && (
          <div className="rounded-xl border border-dc-blue/40 bg-dc-card p-5 space-y-3 shadow-lg animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-dc-text">Enter Join Code for {subject?.name}</h2>
                <p className="text-xs text-dc-subtext">
                  Enter the course join code (e.g. <code className="text-dc-blue">{subject?.code}</code> or secret key) to gain full board membership.
                </p>
              </div>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-xs text-dc-subtext hover:text-dc-text"
              >
                ✕ Cancel
              </button>
            </div>

            {user ? (
              <form onSubmit={handleJoin} className="flex flex-wrap gap-2">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  placeholder="Enter join code"
                  aria-label="Join code"
                  className="dc-input flex-1 min-w-[200px]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="dc-btn-primary shrink-0"
                >
                  {joining ? 'Verifying…' : 'Join Board'}
                </button>
              </form>
            ) : (
              <p className="text-xs text-amber-300">
                Please <Link to="/login" className="underline font-semibold">sign in</Link> first to join.
              </p>
            )}

            {joinError && (
              <p role="alert" className="text-xs text-rose-400 font-medium">
                {joinError}
              </p>
            )}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsResolved('')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isResolved === ''
                  ? 'bg-dc-blue text-white'
                  : 'bg-dc-card border border-dc-border text-dc-subtext hover:text-dc-text'
              }`}
            >
              All Doubts
            </button>
            <button
              onClick={() => setIsResolved('false')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isResolved === 'false'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-dc-card border border-dc-border text-dc-subtext hover:text-dc-text'
              }`}
            >
              Unresolved
            </button>
            <button
              onClick={() => setIsResolved('true')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isResolved === 'true'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-dc-card border border-dc-border text-dc-subtext hover:text-dc-text'
              }`}
            >
              Resolved
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dc-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search in this board…"
              aria-label="Search doubts in this board"
              className="dc-input pl-8 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Doubts List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : doubts.length === 0 ? (
          <EmptyState
            title="No doubts in this board"
            description={
              search.trim()
                ? 'No doubts match your search filter in this board.'
                : 'Be the first student to post a doubt in this subject.'
            }
            action={
              <Link
                to={`/doubts/new?subjectId=${subject?.id}`}
                className="dc-btn-primary text-xs"
              >
                Ask a Doubt
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {doubts.map(d => (
              <Link key={d.id} to={`/doubts/${d.id}`} className="block">
                <DoubtCard
                  title={d.title}
                  excerpt={d.content.slice(0, 140)}
                  subject={d.subject?.name}
                  status={d.isResolved ? 'resolved' : 'unresolved'}
                  meta={d._count ? `${d._count.answers} answer${d._count.answers !== 1 ? 's' : ''}` : undefined}
                  author={d.author?.displayName}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
