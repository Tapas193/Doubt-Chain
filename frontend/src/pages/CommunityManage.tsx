import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Users,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Bell,
  ShieldAlert
} from 'lucide-react'
import AppShell from '../layouts/AppShell'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { communityService } from '../services/communityService'
import { Community, CommunityMember } from '../types/api'

export default function CommunityManage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>()
  const [community, setCommunity] = useState<Community | null>(null)
  const [requests, setRequests] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Announcement state
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annPriority, setAnnPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL')
  const [annSubmitting, setAnnSubmitting] = useState(false)
  const [annSuccess, setAnnSuccess] = useState(false)

  // Review state
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    if (!idOrSlug) return
    setLoading(true)
    setError(null)
    try {
      const c = await communityService.getCommunity(idOrSlug)
      setCommunity(c)
      if (!c.canManage) {
        setError('Forbidden: Administrator privileges required to manage this college community.')
        return
      }
      const reqs = await communityService.listMembershipRequests(c.id)
      setRequests(reqs || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load community management')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [idOrSlug])

  const handleReview = async (membershipId: string, action: 'APPROVE' | 'REJECT') => {
    if (!community) return
    setReviewingId(membershipId)
    try {
      await communityService.reviewMembershipRequest(community.id, membershipId, {
        action,
        rejectionReason: action === 'REJECT' ? rejectReason || 'Did not meet requirements' : undefined
      })
      setRequests(prev => prev.filter(r => r.id !== membershipId))
      setRejectReason('')
    } catch (err: any) {
      alert(err.message || 'Failed to review request')
    } finally {
      setReviewingId(null)
    }
  }

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!community || !annTitle.trim() || !annContent.trim()) return
    setAnnSubmitting(true)
    setAnnSuccess(false)
    try {
      await communityService.createAnnouncement(community.id, {
        title: annTitle.trim(),
        content: annContent.trim(),
        priority: annPriority
      })
      setAnnTitle('')
      setAnnContent('')
      setAnnSuccess(true)
      setTimeout(() => setAnnSuccess(false), 4000)
    } catch (err: any) {
      alert(err.message || 'Failed to publish announcement')
    } finally {
      setAnnSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <LoadingState message="Loading community administrator dashboard..." />
      </AppShell>
    )
  }

  if (error || !community) {
    const isForbidden =
      error?.toLowerCase().includes('forbidden') ||
      error?.toLowerCase().includes('administrator') ||
      error?.toLowerCase().includes('permission') ||
      (community && !community.canManage)

    if (isForbidden && community) {
      return (
        <AppShell>
          <div className="mx-auto max-w-2xl space-y-6 animate-fade-in py-12">
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-8 text-center space-y-4 shadow-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-dc-text">
                Access Denied: Administrator Privileges Required
              </h2>
              <p className="text-xs text-dc-subtext max-w-md mx-auto leading-relaxed">
                <strong>{community.name}</strong> exists, but management access (approving student membership requests and broadcasting announcements) is restricted strictly to authorized College Administrators.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to={`/community/${community.slug}`}
                  className="dc-btn-primary px-4 py-2 text-xs font-semibold"
                >
                  Go to {community.code} Community
                </Link>
                <Link
                  to="/community/explore"
                  className="rounded-xl border border-dc-border bg-dc-card px-4 py-2 text-xs font-semibold text-dc-text hover:border-dc-blue transition-colors"
                >
                  Explore Other Colleges
                </Link>
              </div>
            </div>
          </div>
        </AppShell>
      )
    }

    return (
      <AppShell>
        <ErrorState message={error || 'College community not found'} onRetry={load} />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in pb-16">
        {/* Back Link & Header */}
        <div className="flex items-center gap-2">
          <Link
            to="/community"
            className="flex items-center gap-1 text-xs font-semibold text-dc-subtext hover:text-dc-blue transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to College Community</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dc-border pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 text-base font-black">
              {community.code.slice(0, 4)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-dc-text">
                {community.name} · Admin Panel
              </h1>
              <p className="text-xs text-dc-subtext">
                Manage student admissions, institutional verification, and announcements.
              </p>
            </div>
          </div>
        </div>

        {/* Pending Requests Section */}
        <div className="rounded-2xl border border-dc-border bg-dc-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-dc-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-dc-blue" />
              <h2 className="text-sm font-bold text-dc-text">
                Pending Membership Requests ({requests.length})
              </h2>
            </div>
            <span className="text-[11px] text-dc-subtext">
              Server-Verified Workflow
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="py-8 text-center text-xs text-dc-subtext">
              No pending student membership requests. All applications have been reviewed.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-dc-border bg-dc-bg2 p-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-dc-text">
                      {req.user?.displayName}{' '}
                      <span className="text-dc-subtext font-normal">
                        ({req.user?.email})
                      </span>
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-dc-subtext">
                      <span>Department: {req.department || 'Not specified'}</span>
                      <span>Cohort: {req.academicYear || '2026-2027'}</span>
                      <span>Requested: {new Date(req.requestedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReview(req.id, 'APPROVE')}
                      disabled={reviewingId === req.id}
                      className="flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReview(req.id, 'REJECT')}
                      disabled={reviewingId === req.id}
                      className="flex items-center gap-1 rounded-xl bg-dc-red/10 border border-dc-red/30 px-3 py-1.5 text-xs font-semibold text-dc-red hover:bg-dc-red/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Community Announcement */}
        <div className="rounded-2xl border border-dc-border bg-dc-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-dc-border pb-3">
            <Bell className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-bold text-dc-text">
              Broadcast Community Announcement
            </h2>
          </div>

          {annSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              Announcement published successfully to all enrolled students!
            </div>
          )}

          <form onSubmit={handlePostAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-dc-subtext mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                value={annTitle}
                onChange={e => setAnnTitle(e.target.value)}
                placeholder="e.g. End-Semester Project Submissions & Hackathon Timelines"
                className="w-full rounded-xl border border-dc-border bg-dc-bg2 px-3 py-2 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dc-subtext mb-1">
                Details & Instructions
              </label>
              <textarea
                rows={3}
                value={annContent}
                onChange={e => setAnnContent(e.target.value)}
                placeholder="Important academic announcements for students in this college..."
                className="w-full rounded-xl border border-dc-border bg-dc-bg2 p-3 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs text-dc-subtext">Priority:</label>
                <select
                  value={annPriority}
                  onChange={e => setAnnPriority(e.target.value as any)}
                  className="rounded-lg border border-dc-border bg-dc-bg2 px-2.5 py-1 text-xs text-dc-text"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent Notice</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={annSubmitting}
                className="dc-btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {annSubmitting ? 'Publishing...' : 'Broadcast Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
