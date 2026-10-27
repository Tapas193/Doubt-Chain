import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import SubjectCard from '../components/SubjectCard'
import DoubtCard from '../components/DoubtCard'
import EmptyState from '../components/EmptyState'
import LoadingState, { SkeletonCard } from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { doubtService } from '../services/doubtService'
import { Subject, Doubt } from '../types/api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    let mounted = true
    Promise.all([doubtService.listSubjects(), doubtService.listDoubts({ limit: 6 })])
      .then(([s, d]) => { if (mounted) { setSubjects(s); setDoubts(d.items) } })
      .catch(err => { if (mounted) setError(err.message) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }

  useEffect(load, [])

  const resolvedCount = doubts.filter(d => d.isResolved).length

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">

        {/* Hero banner */}
        <section className="relative overflow-hidden rounded-2xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
          {/* Accent stripe */}
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-dc-red" />
          <div className="pl-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-dc-subtext">
              Your Academic Hub
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-dc-text md:text-3xl">
              Doubt-Chain
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-dc-subtext">
              {user
                ? `Welcome back, ${user.displayName}. Search before posting — your question might already be answered.`
                : 'Peer-to-peer academic doubt resolution. Search before posting, help peers, and build a searchable FAQ.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/doubts/new" className="dc-btn-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ask a Doubt
              </Link>
              <Link to="/search" className="dc-btn-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                </svg>
                Search First
              </Link>
              <Link to="/faq" className="dc-btn-ghost">
                Browse FAQ →
              </Link>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && <ErrorState message={error} onRetry={load} />}

        {/* Subjects */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-dc-text">Subjects</h2>
            <span className="text-xs text-dc-subtext">{subjects.length} boards</span>
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : subjects.length === 0 ? (
            <EmptyState
              title="No subjects yet"
              description="Subjects appear once seeded from the backend."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map(s => (
                <SubjectCard key={s.id} name={s.name} code={s.code} description={s.description ?? undefined} />
              ))}
            </div>
          )}
        </section>

        {/* Recent discussions */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-dc-text">Recent Discussions</h2>
            <div className="flex items-center gap-3">
              {!loading && doubts.length > 0 && (
                <span className="text-xs text-dc-subtext">
                  {resolvedCount}/{doubts.length} resolved
                </span>
              )}
              <Link to="/doubts" className="text-xs text-dc-blue hover:underline underline-offset-2">
                View all
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !error && doubts.length === 0 ? (
            <EmptyState
              title="No doubts yet"
              description="Be the first to ask a question."
              action={
                <Link to="/doubts/new" className="dc-btn-primary text-sm">
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
        </section>
      </div>
    </AppShell>
  )
}
