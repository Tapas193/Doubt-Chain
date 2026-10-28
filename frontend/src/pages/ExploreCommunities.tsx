import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Search,
  Clock,
  CheckCircle,
  ChevronRight,
  Globe,
  X
} from 'lucide-react'
import AppShell from '../layouts/AppShell'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { communityService } from '../services/communityService'
import { Community } from '../types/api'

export default function ExploreCommunities() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Join Modal State
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [department, setDepartment] = useState('')
  const [academicYear, setAcademicYear] = useState('2026-2027')
  const [requestNote, setRequestNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [joinFeedback, setJoinFeedback] = useState<{ status: string; message: string } | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await communityService.listCommunities({ q: searchQuery || undefined })
      setCommunities(res.items || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load college communities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      load()
    }, 250)
    return () => clearTimeout(delay)
  }, [searchQuery])

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCommunity) return
    setSubmitting(true)
    setJoinFeedback(null)
    try {
      const res = await communityService.requestJoin(selectedCommunity.id, {
        department: department.trim(),
        academicYear: academicYear.trim(),
        requestNote: requestNote.trim()
      })
      setJoinFeedback({ status: res.status, message: res.message })
      // Update local community membership status
      setCommunities(prev =>
        prev.map(c =>
          c.id === selectedCommunity.id
            ? { ...c, membership: res.membership }
            : c
        )
      )
    } catch (err: any) {
      setJoinFeedback({ status: 'ERROR', message: err.message || 'Failed to submit join request' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 animate-fade-in pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dc-border pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-dc-blue">
              ACADEMIC NETWORK DIRECTORY
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-dc-text">
              Explore College Communities
            </h1>
            <p className="mt-1 text-xs text-dc-subtext">
              Discover verified institutional networks, join your campus cohort, and collaborate across institutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/community"
              className="rounded-xl border border-dc-border bg-dc-card px-3.5 py-2 text-xs font-semibold text-dc-text hover:border-dc-blue transition-colors"
            >
              My Community
            </Link>
            <Link
              to="/wider-network"
              className="dc-btn-primary px-3.5 py-2 text-xs font-semibold"
            >
              <Globe className="h-4 w-4" />
              Wider Network
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-dc-subtext" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by college name, code (e.g. IITB, BITS), or location..."
            className="w-full rounded-2xl border border-dc-border bg-dc-card pl-10 pr-4 py-2.5 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none shadow-sm"
          />
        </div>

        {/* Communities Grid */}
        {loading ? (
          <LoadingState message="Discovering college communities..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : communities.length === 0 ? (
          <div className="rounded-2xl border border-dc-border bg-dc-card p-12 text-center space-y-3">
            <Building2 className="mx-auto h-12 w-12 text-dc-subtext/40" />
            <h3 className="text-base font-bold text-dc-text">
              No matching college communities found
            </h3>
            <p className="text-xs text-dc-subtext">
              Try searching with another abbreviation, keyword, or clear your search filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map(c => {
              const membership = c.membership
              const isApproved = membership?.status === 'APPROVED'
              const isPending = membership?.status === 'PENDING'

              return (
                <div
                  key={c.id}
                  className="flex flex-col justify-between rounded-2xl border border-dc-border bg-dc-card p-5 transition-all hover:border-dc-blue/40 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dc-blue/10 text-dc-blue border border-dc-blue/30 text-sm font-black">
                        {c.code.slice(0, 4)}
                      </div>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3" />
                          Enrolled Member
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          Pending Review
                        </span>
                      ) : (
                        <span className="rounded bg-dc-bg2 px-2 py-0.5 text-[10px] font-bold text-dc-subtext border border-dc-border">
                          {c.code}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-dc-text line-clamp-1">
                        {c.name}
                      </h3>
                      <p className="mt-1 text-xs text-dc-subtext line-clamp-2">
                        {c.description || 'Verified academic network for students and faculty.'}
                      </p>
                    </div>

                    <div className="space-y-1 text-[11px] text-dc-subtext border-t border-dc-border pt-2.5">
                      {c.location && (
                        <p className="truncate">📍 {c.location}</p>
                      )}
                      <div className="flex items-center gap-4 text-dc-subtext/80">
                        <span>👥 {c.memberCount || 0} members</span>
                        <span>💬 {c.discussionCount || 0} questions</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dc-border flex items-center justify-between gap-2">
                    <Link
                      to={`/community/${c.slug}`}
                      className="text-xs font-semibold text-dc-subtext hover:text-dc-blue transition-colors flex items-center gap-1"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>

                    {isApproved ? (
                      <Link
                        to="/community"
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        Enter Community
                      </Link>
                    ) : isPending ? (
                      <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 select-none">
                        Requested
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedCommunity(c)
                          setJoinFeedback(null)
                        }}
                        className="dc-btn-primary px-3 py-1.5 text-xs font-semibold shadow-sm"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Join / Request Membership Modal */}
        {selectedCommunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-dc-border bg-dc-bg2 p-6 shadow-2xl relative">
              <button
                onClick={() => setSelectedCommunity(null)}
                className="absolute right-4 top-4 rounded-lg p-1 text-dc-subtext hover:bg-dc-card hover:text-dc-text transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-dc-blue/15 text-dc-blue font-bold">
                  {selectedCommunity.code.slice(0, 4)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-dc-text">
                    Join {selectedCommunity.name}
                  </h2>
                  <p className="text-xs text-dc-subtext">
                    Institutional Verification & Membership
                  </p>
                </div>
              </div>

              {joinFeedback && (
                <div
                  className={`mt-4 rounded-xl p-3 text-xs border ${
                    joinFeedback.status === 'APPROVED'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : joinFeedback.status === 'ERROR'
                      ? 'border-dc-red/30 bg-dc-red/10 text-dc-red'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {joinFeedback.message}
                </div>
              )}

              {joinFeedback?.status === 'APPROVED' ? (
                <div className="mt-5 flex justify-end">
                  <Link
                    to="/community"
                    className="dc-btn-primary px-4 py-2 text-xs font-semibold"
                  >
                    Go to My Community
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleJoinSubmit} className="mt-4 space-y-3.5">
                  <div className="rounded-xl border border-dc-border bg-dc-card p-3 text-xs text-dc-subtext leading-relaxed">
                    Students must not automatically gain access merely by selecting a college name. If your registered email ends with <code className="text-dc-blue">@{selectedCommunity.emailDomain || selectedCommunity.code.toLowerCase()}</code>, your membership will be automatically verified; otherwise a college administrator will review your application.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dc-subtext mb-1">
                      Academic Department / Major
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full rounded-xl border border-dc-border bg-dc-card px-3 py-2 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dc-subtext mb-1">
                      Cohort / Academic Year
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                      placeholder="e.g. 2026-2027 or 3rd Year"
                      className="w-full rounded-xl border border-dc-border bg-dc-card px-3 py-2 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dc-subtext mb-1">
                      Verification Note (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={requestNote}
                      onChange={e => setRequestNote(e.target.value)}
                      placeholder="Brief note for college administrators..."
                      className="w-full rounded-xl border border-dc-border bg-dc-card p-2.5 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCommunity(null)}
                      className="rounded-xl border border-dc-border px-4 py-2 text-xs font-medium text-dc-subtext hover:bg-dc-card"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="dc-btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Join Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
