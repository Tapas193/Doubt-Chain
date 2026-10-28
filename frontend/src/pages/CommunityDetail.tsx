import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  Clock,
  Plus,
  Lock,
  ChevronRight,
  Settings,
  MessageSquare
} from 'lucide-react'
import AppShell from '../layouts/AppShell'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import StatusBadge from '../components/StatusBadge'
import CreateCollegeDiscussionModal from '../components/CreateCollegeDiscussionModal'
import { communityService } from '../services/communityService'
import { Community, Doubt } from '../types/api'

export default function CommunityDetail() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>()
  const [community, setCommunity] = useState<Community | null>(null)
  const [discussions, setDiscussions] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinFeedback, setJoinFeedback] = useState<string | null>(null)

  const load = async () => {
    if (!idOrSlug) return
    setLoading(true)
    setError(null)
    try {
      const c = await communityService.getCommunity(idOrSlug)
      setCommunity(c)
      if (c.isApprovedMember) {
        const d = await communityService.listDiscussions(c.id)
        setDiscussions(d.items || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [idOrSlug])

  const handleJoin = async () => {
    if (!community) return
    setJoining(true)
    setJoinFeedback(null)
    try {
      const res = await communityService.requestJoin(community.id)
      setJoinFeedback(res.message)
      await load()
    } catch (err: any) {
      setJoinFeedback(err.message || 'Failed to join')
    } finally {
      setJoining(false)
    }
  }

  const handleCreateDiscussion = async (input: {
    title: string
    content: string
    subjectId: string
    academicCategory: string
  }) => {
    if (!community) return
    const created = await communityService.createDiscussion(community.id, input)
    setDiscussions(prev => [created, ...prev])
  }

  if (loading) {
    return (
      <AppShell>
        <LoadingState message="Loading community details..." />
      </AppShell>
    )
  }

  if (error || !community) {
    return (
      <AppShell>
        <ErrorState message={error || 'Community not found'} onRetry={load} />
      </AppShell>
    )
  }

  const isApproved = community.isApprovedMember
  const isPending = community.membership?.status === 'PENDING'

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-16">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-dc-border bg-gradient-to-br from-dc-card to-dc-bg2 p-6 lg:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-dc-blue/15 text-dc-blue border border-dc-blue/30 text-2xl font-black">
                {community.code.slice(0, 4)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold tracking-tight text-dc-text">
                    {community.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Institution
                  </span>
                </div>
                <p className="text-xs text-dc-subtext max-w-xl">
                  {community.description || 'Verified academic network for students and faculty.'}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-dc-subtext/70 pt-1">
                  {community.location && <span>📍 {community.location}</span>}
                  <span>👥 {community.memberCount || 0} Members</span>
                  <span>💬 {community.discussionCount || 0} Discussions</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isApproved ? (
                <>
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="dc-btn-primary px-4 py-2 text-xs font-semibold shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    New Question
                  </button>
                  {community.canManage && (
                    <Link
                      to={`/community/${community.slug}/manage`}
                      className="rounded-xl border border-dc-border bg-dc-card px-3 py-2 text-xs font-semibold text-dc-text hover:border-dc-blue"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                  )}
                </>
              ) : isPending ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <span>Request Pending Review</span>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="dc-btn-primary px-5 py-2.5 text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {joining ? 'Requesting...' : 'Request Membership'}
                </button>
              )}
            </div>
          </div>
        </div>

        {joinFeedback && (
          <div className="rounded-xl border border-dc-blue/30 bg-dc-blue/10 p-3 text-xs text-dc-blue">
            {joinFeedback}
          </div>
        )}

        {/* Content depending on membership */}
        {isApproved ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-dc-border pb-2">
              <h2 className="text-sm font-bold text-dc-text">
                College Discussions ({discussions.length})
              </h2>
            </div>

            {discussions.length === 0 ? (
              <div className="rounded-2xl border border-dc-border bg-dc-card p-12 text-center space-y-2">
                <MessageSquare className="mx-auto h-8 w-8 text-dc-subtext/40" />
                <p className="text-xs text-dc-subtext">No discussions posted yet in this college community.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {discussions.map(d => (
                  <div
                    key={d.id}
                    className="rounded-2xl border border-dc-border bg-dc-card p-5 hover:border-dc-blue/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-dc-bg2 px-2 py-0.5 text-[10px] font-bold text-dc-blue border border-dc-border">
                            {d.subject?.code}
                          </span>
                          <StatusBadge status={d.isResolved ? 'resolved' : 'unresolved'} />
                        </div>
                        <Link
                          to={`/doubts/${d.id}`}
                          className="block text-sm font-bold text-dc-text hover:text-dc-blue transition-colors truncate"
                        >
                          {d.title}
                        </Link>
                        <p className="text-xs text-dc-subtext line-clamp-2">
                          {d.content}
                        </p>
                      </div>
                      <Link
                        to={`/doubts/${d.id}`}
                        className="rounded-lg border border-dc-border px-3 py-1.5 text-xs font-medium text-dc-text hover:border-dc-blue hover:text-dc-blue transition-colors flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dc-border bg-dc-card p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-dc-blue/10 text-dc-blue border border-dc-blue/20">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-dc-text">
              Private College Collaboration Hub
            </h2>
            <p className="text-xs text-dc-subtext max-w-md mx-auto leading-relaxed">
              Discussions and questions posted inside {community.name} are accessible exclusively to authorized students and faculty of this institution. Join to participate.
            </p>
            {!isPending && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="dc-btn-primary px-5 py-2 text-xs font-semibold"
              >
                Request Access to {community.code}
              </button>
            )}
          </div>
        )}

        {isApproved && (
          <CreateCollegeDiscussionModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateDiscussion}
            collegeName={community.name}
          />
        )}
      </div>
    </AppShell>
  )
}
