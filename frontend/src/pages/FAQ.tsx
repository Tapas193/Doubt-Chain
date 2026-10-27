import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import StatusBadge from '../components/StatusBadge'
import { doubtService } from '../services/doubtService'
import { Doubt, Subject } from '../types/api'

export default function FAQ() {
  const [items, setItems] = useState<Doubt[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    doubtService.listSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  const load = () => {
    setLoading(true)
    setError(null)
    doubtService
      .listFaq({ subjectId: subjectId || undefined, q: q.trim() || undefined, limit: 30 })
      .then(res => setItems(res.items))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [subjectId, q])

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-dc-text">FAQ Archive</h1>
          <p className="mt-0.5 text-sm text-dc-subtext">
            Resolved doubts become permanent, searchable knowledge.
          </p>
        </div>

        {/* Search + filter bar */}
        <div className="dc-card flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dc-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search resolved doubts…"
              aria-label="Search FAQ"
              className="dc-input pl-9"
            />
          </div>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            aria-label="Filter by subject"
            className="dc-input w-auto flex-none"
          >
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState
            title={q.trim() ? 'No matches' : 'No resolved doubts yet'}
            description={q.trim() ? 'Try different keywords.' : 'Resolved doubts appear here automatically.'}
          />
        ) : (
          <div className="space-y-2">
            {items.map(d => (
              <Link
                key={d.id}
                to={`/doubts/${d.id}`}
                className="group flex items-start justify-between gap-4 dc-card p-4 transition-all hover:border-dc-blue/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-dc-text group-hover:text-white truncate">{d.title}</p>
                  <p className="mt-0.5 text-xs text-dc-subtext">
                    {d.subject?.name} · {d.answers?.length ?? 0} answer{(d.answers?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <StatusBadge status="resolved" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
