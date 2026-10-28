import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Plus } from 'lucide-react'
import AppShell from '../layouts/AppShell'
import DoubtCard from '../components/DoubtCard'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/LoadingState'
import { useAuth } from '../context/AuthContext'
import { doubtService } from '../services/doubtService'
import { Doubt } from '../types/api'

export default function Profile() {
  const { user } = useAuth()
  const [myDoubts, setMyDoubts] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    doubtService
      .listDoubts({ authorId: user.id, limit: 20 })
      .then(res => setMyDoubts(res.items))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-12 text-center animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-dc-blue/10 text-dc-blue">
            <User className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-dc-text">Academic Profile</h1>
          <p className="mt-2 text-sm text-dc-subtext">
            Sign in with your university credentials to view your personal questions, answers, and academic contributions.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login" className="dc-btn-primary">
              Sign In
            </Link>
            <Link to="/register" className="dc-btn-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  const resolvedCount = myDoubts.filter(d => d.isResolved).length

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-2xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-dc-blue/10 text-xl font-bold text-dc-blue">
                {user.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-dc-text">{user.displayName}</h1>
                  <span className="rounded bg-dc-blue/10 px-2 py-0.5 text-[10px] font-semibold text-dc-blue">
                    {user.profession || 'STUDENT'}
                  </span>
                </div>
                <p className="text-xs text-dc-subtext">{user.email}</p>
                {user.identificationNumber && (
                  <p className="mt-0.5 text-xs text-dc-subtext">ID: {user.identificationNumber}</p>
                )}
              </div>
            </div>

            <Link to="/settings" className="dc-btn-secondary text-xs">
              Edit Preferences
            </Link>
          </div>

          {/* Real Metrics */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-dc-border pt-4">
            <div className="rounded-xl bg-dc-bg2/60 p-3 text-center">
              <span className="text-xl font-bold text-dc-text">{myDoubts.length}</span>
              <p className="text-[11px] text-dc-subtext">Questions Asked</p>
            </div>
            <div className="rounded-xl bg-dc-bg2/60 p-3 text-center">
              <span className="text-xl font-bold text-emerald-400">{resolvedCount}</span>
              <p className="text-[11px] text-dc-subtext">Resolved Doubts</p>
            </div>
            <div className="rounded-xl bg-dc-bg2/60 p-3 text-center">
              <span className="text-xl font-bold text-dc-blue">Active</span>
              <p className="text-[11px] text-dc-subtext">Verified Scholar</p>
            </div>
          </div>
        </div>

        {/* User's Doubts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-dc-text">Questions Asked</h2>
            <Link to="/doubts/new" className="dc-btn-primary px-3 py-1.5 text-xs">
              <Plus className="mr-1 h-3.5 w-3.5 inline" /> Ask Question
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-dc-red/30 bg-dc-red/10 p-4 text-xs text-dc-red">
              {error}
            </div>
          ) : myDoubts.length === 0 ? (
            <EmptyState
              title="No questions asked yet"
              description="Your asked questions and their peer solutions will be displayed here."
              action={
                <Link to="/doubts/new" className="dc-btn-primary text-xs">
                  Ask Your First Doubt
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {myDoubts.map(d => (
                <Link key={d.id} to={`/doubts/${d.id}`} className="block">
                  <DoubtCard
                    title={d.title}
                    excerpt={d.content.slice(0, 140)}
                    subject={d.subject?.name}
                    status={d.isResolved ? 'resolved' : 'unresolved'}
                    meta={d._count ? `${d._count.answers} replies` : undefined}
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
