import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import DoubtCard from '../components/DoubtCard'
import EmptyState from '../components/EmptyState'
import LoadingState, { SkeletonCard } from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { doubtService } from '../services/doubtService'
import { Doubt, Subject } from '../types/api'

export default function Discussions() {
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [isResolved, setIsResolved] = useState<'' | 'true' | 'false'>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    doubtService
      .listDoubts({
        limit: 30,
        subjectId: subjectId || undefined,
        isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
      })
      .then(res => setDoubts(res.items))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    doubtService.listSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  useEffect(() => { load() }, [subjectId, isResolved])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        {/* Header + filters */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-dc-text">Discussions</h1>
            <p className="mt-0.5 text-sm text-dc-subtext">Active doubts across all subject boards.</p>
          </div>
          <Link to="/doubts/new" className="dc-btn-primary shrink-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ask a Doubt
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            aria-label="Filter by subject"
            className="dc-input w-auto flex-none"
          >
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            value={isResolved}
            onChange={e => setIsResolved(e.target.value as typeof isResolved)}
            aria-label="Filter by status"
            className="dc-input w-auto flex-none"
          >
            <option value="">All statuses</option>
            <option value="false">Open</option>
            <option value="true">Resolved</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : doubts.length === 0 ? (
          <EmptyState
            title="No doubts found"
            description="Try a different filter or be the first to post."
            action={<Link to="/doubts/new" className="dc-btn-primary text-sm">Ask a Doubt</Link>}
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
