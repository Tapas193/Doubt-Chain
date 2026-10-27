import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import EmptyState from '../components/EmptyState'
import LoadingState, { SkeletonCard } from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import StatusBadge from '../components/StatusBadge'
import { doubtService } from '../services/doubtService'
import { Doubt, Subject } from '../types/api'

export default function SearchBeforePost() {
  const [query, setQuery] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [results, setResults] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    doubtService.listSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setError(null); return }
    let active = true
    setLoading(true)
    setError(null)
    const t = setTimeout(() => {
      doubtService
        .searchDoubts(query.trim(), subjectId ? { subjectId } : undefined)
        .then(res => { if (active) setResults(res.items) })
        .catch(err => { if (active) setError(err.message) })
        .finally(() => { if (active) setLoading(false) })
    }, 300)
    return () => { active = false; clearTimeout(t) }
  }, [query, subjectId])

  const hasQuery = query.trim().length > 0

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-dc-text">Search Before Posting</h1>
          <p className="mt-0.5 text-sm text-dc-subtext">
            Check if your question already has an answer before creating a new doubt.
          </p>
        </div>

        {/* Search bar */}
        <div className="dc-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dc-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type your question to search…"
                aria-label="Search existing doubts"
                className="dc-input pl-9"
                autoFocus
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 animate-spin text-dc-blue" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
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
        </div>

        {/* Results area */}
        <div className="dc-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-dc-text">
              {hasQuery ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Results'}
            </h2>
            <Link to="/doubts/new" className="dc-btn-primary text-sm">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Post New Doubt
            </Link>
          </div>

          {error && <ErrorState message={error} />}

          {!hasQuery && !error && (
            <EmptyState
              title="Start typing above"
              description="We'll scan existing doubts as you type and show matches here."
            />
          )}

          {hasQuery && !loading && !error && results.length === 0 && (
            <EmptyState
              title="No matches found"
              description="No existing doubt matches your query. You can post it as a new doubt."
              action={
                <Link to="/doubts/new" className="dc-btn-primary text-sm">
                  Post a new doubt
                </Link>
              }
            />
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map(d => (
                <Link
                  key={d.id}
                  to={`/doubts/${d.id}`}
                  className="group flex items-start justify-between gap-4 rounded-lg border border-dc-border p-3.5 transition-colors hover:border-dc-blue/40 hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dc-text group-hover:text-white truncate">{d.title}</p>
                    <p className="mt-0.5 text-xs text-dc-subtext truncate">{d.subject?.name}</p>
                  </div>
                  <StatusBadge status={d.isResolved ? 'resolved' : 'unresolved'} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
