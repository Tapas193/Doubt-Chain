import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe,
  Search,
  Building2,
  ChevronRight
} from 'lucide-react'
import AppShell from '../layouts/AppShell'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import StatusBadge from '../components/StatusBadge'
import { communityService } from '../services/communityService'
import { doubtService } from '../services/doubtService'
import { Doubt, Subject } from '../types/api'

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'DSA', label: 'DSA & Algorithms' },
  { id: 'PROGRAMMING', label: 'Programming & Debugging' },
  { id: 'PROJECTS', label: 'Projects & Systems' },
  { id: 'INTERVIEWS', label: 'Interview Prep' },
  { id: 'RESOURCES', label: 'Study Resources' }
]

export default function WiderNetwork() {
  const [discussions, setDiscussions] = useState<Doubt[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [sortBy, setSortBy] = useState<'recent' | 'discussed' | 'resolved'>('recent')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [feed, subs] = await Promise.all([
        communityService.listWiderNetwork({
          q: searchQuery || undefined,
          subjectId: selectedSubject || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          sortBy
        }),
        doubtService.listSubjects()
      ])
      setDiscussions(feed.items || [])
      setSubjects(subs || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load Wider Academic Network feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      load()
    }, 250)
    return () => clearTimeout(delay)
  }, [searchQuery, selectedSubject, selectedCategory, sortBy])

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 animate-fade-in pb-16">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-dc-border bg-gradient-to-r from-dc-blue/10 via-dc-card to-purple-500/10 p-6 lg:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-dc-blue/30 bg-dc-blue/15 px-3 py-1 text-xs font-bold text-dc-blue uppercase tracking-wider">
                <Globe className="h-3.5 w-3.5" />
                Cross-College Collaboration
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-dc-text">
                The Wider Academic Network
              </h1>
              <p className="text-xs text-dc-subtext max-w-2xl leading-relaxed">
                Academic doubts and engineering questions explicitly shared across institutions. Students and faculty from across colleges collaborate and exchange peer solutions here.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/community"
                className="rounded-xl border border-dc-border bg-dc-card px-4 py-2.5 text-xs font-semibold text-dc-text hover:border-dc-blue transition-colors shadow-sm"
              >
                Go to My College
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-dc-border pb-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-dc-subtext" />
            <input
              type="text"
              placeholder="Search shared questions across all colleges..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-dc-border bg-dc-card pl-10 pr-4 py-2 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject filter */}
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="rounded-xl border border-dc-border bg-dc-card px-3 py-2 text-xs text-dc-text focus:border-dc-blue focus:outline-none"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-dc-border bg-dc-card px-3 py-2 text-xs text-dc-text focus:border-dc-blue focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Sort order */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="rounded-xl border border-dc-border bg-dc-card px-3 py-2 text-xs text-dc-text focus:border-dc-blue focus:outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="discussed">Most Discussed</option>
              <option value="resolved">Resolved Solutions</option>
            </select>
          </div>
        </div>

        {/* Discussions List */}
        {loading ? (
          <LoadingState message="Loading shared academic network discussions..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : discussions.length === 0 ? (
          <div className="rounded-2xl border border-dc-border bg-dc-card p-12 text-center space-y-3">
            <Globe className="mx-auto h-12 w-12 text-dc-subtext/40" />
            <h3 className="text-base font-bold text-dc-text">
              No discussions currently shared in the wider network
            </h3>
            <p className="text-xs text-dc-subtext max-w-md mx-auto">
              When students or faculty explicitly choose &ldquo;Ask the Wider Network&rdquo; on eligible college doubts, they will appear here for cross-institutional answers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map(d => (
              <div
                key={d.id}
                className="group rounded-2xl border border-dc-border bg-dc-card p-5 transition-all hover:border-dc-blue/40 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {d.community && (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                          <Building2 className="h-3 w-3" />
                          {d.community.name} [{d.community.code}]
                        </span>
                      )}
                      <span className="rounded bg-dc-bg2 px-2 py-0.5 text-[10px] font-bold text-dc-blue border border-dc-border">
                        {d.subject?.code}
                      </span>
                      {d.academicCategory && (
                        <span className="rounded bg-dc-bg2 px-2 py-0.5 text-[10px] font-semibold text-dc-subtext border border-dc-border">
                          {d.academicCategory.replace('_', ' ')}
                        </span>
                      )}
                      <StatusBadge status={d.isResolved ? 'resolved' : 'unresolved'} />
                    </div>

                    <Link
                      to={`/doubts/${d.id}`}
                      className="block text-sm sm:text-base font-bold text-dc-text hover:text-dc-blue transition-colors line-clamp-1"
                    >
                      {d.title}
                    </Link>

                    <p className="text-xs text-dc-subtext line-clamp-2 leading-relaxed">
                      {d.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-dc-subtext/70 pt-1">
                      <span>Shared by {d.author?.displayName}</span>
                      <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                      <span>💬 {d._count?.answers || 0} peer answers</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 md:self-center">
                    <Link
                      to={`/doubts/${d.id}`}
                      className="dc-btn-primary px-4 py-2 text-xs font-semibold shadow-sm"
                    >
                      <span>Answer & Discuss</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
