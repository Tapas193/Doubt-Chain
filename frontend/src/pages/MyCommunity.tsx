import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Globe,
  Plus,
  ShieldCheck,
  Clock,
  Compass,
  MessageSquare,
  Search,
  ChevronRight,
  Settings,
  Bell,
  Lock
} from 'lucide-react'
import AppShell from '../layouts/AppShell'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import StatusBadge from '../components/StatusBadge'
import AskWiderNetworkModal from '../components/AskWiderNetworkModal'
import CreateCollegeDiscussionModal from '../components/CreateCollegeDiscussionModal'
import { communityService } from '../services/communityService'
import { MyCommunityResponse, Doubt, CommunityMember } from '../types/api'
import { useAuth } from '../context/AuthContext'

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Discussions' },
  { id: 'DSA', label: 'DSA & Algorithms' },
  { id: 'PROGRAMMING', label: 'Programming & Debugging' },
  { id: 'PROJECTS', label: 'Projects & Hackathons' },
  { id: 'INTERVIEWS', label: 'Interview Prep' },
  { id: 'RESOURCES', label: 'Study Resources' },
  { id: 'EVENTS', label: 'Academic Events' }
]

export default function MyCommunity() {
  const { user } = useAuth()
  const [data, setData] = useState<MyCommunityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Discussions state
  const [discussions, setDiscussions] = useState<Doubt[]>([])
  const [discussionsLoading, setDiscussionsLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Members tab state
  const [activeTab, setActiveTab] = useState<'discussions' | 'members'>('discussions')
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [shareDoubt, setShareDoubt] = useState<Doubt | null>(null)

  const loadMyCommunity = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await communityService.getMyCommunity()
      setData(res)
      if (res?.community?.id && res.membership.status === 'APPROVED') {
        loadDiscussions(res.community.id, activeCategory)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load your college community')
    } finally {
      setLoading(false)
    }
  }

  const loadDiscussions = async (communityId: string, category: string) => {
    setDiscussionsLoading(true)
    try {
      const res = await communityService.listDiscussions(communityId, {
        category,
        search: searchQuery || undefined
      })
      setDiscussions(res.items || [])
    } catch (err: any) {
      console.error(err)
    } finally {
      setDiscussionsLoading(false)
    }
  }

  const loadMembers = async (communityId: string) => {
    setMembersLoading(true)
    try {
      const res = await communityService.listMembers(communityId)
      setMembers(res.items || [])
    } catch (err: any) {
      console.error(err)
    } finally {
      setMembersLoading(false)
    }
  }

  useEffect(() => {
    loadMyCommunity()
  }, [])

  useEffect(() => {
    if (data?.community?.id && data.membership.status === 'APPROVED') {
      loadDiscussions(data.community.id, activeCategory)
    }
  }, [activeCategory, searchQuery])

  useEffect(() => {
    if (activeTab === 'members' && data?.community?.id && data.membership.status === 'APPROVED') {
      loadMembers(data.community.id)
    }
  }, [activeTab])

  const handleCreateDiscussion = async (input: {
    title: string
    content: string
    subjectId: string
    academicCategory: string
  }) => {
    if (!data?.community?.id) return
    const created = await communityService.createDiscussion(data.community.id, input)
    setDiscussions(prev => [created, ...prev])
  }

  const handleShareWithWiderNetwork = async () => {
    if (!shareDoubt || !data?.community?.id) return
    const updated = await communityService.shareDiscussion(data.community.id, shareDoubt.id)
    setDiscussions(prev =>
      prev.map(d => (d.id === updated.id ? { ...d, isSharedWithWiderNetwork: true } : d))
    )
    setShareDoubt(null)
  }

  if (loading) {
    return (
      <AppShell>
        <LoadingState message="Loading your academic college community..." />
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <ErrorState message={error} onRetry={loadMyCommunity} />
      </AppShell>
    )
  }

  // State 1: Student not enrolled in any community yet
  if (!data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-8 animate-fade-in py-8">
          <div className="relative overflow-hidden rounded-3xl border border-dc-border bg-gradient-to-br from-dc-card to-dc-bg2 p-8 shadow-2xl">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
              <Building2 className="h-96 w-96 text-dc-blue" />
            </div>
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-dc-blue/30 bg-dc-blue/10 px-3 py-1 text-xs font-semibold text-dc-blue">
                <Globe className="h-3.5 w-3.5" />
                Community of Communities
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-dc-text">
                Join Your College Academic Community
              </h1>
              <p className="text-sm text-dc-subtext leading-relaxed">
                Connect directly with course peers, professors, and academic mentors from your institution. Post college-only questions, access course resources, and collaborate seamlessly.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/community/explore"
                  className="dc-btn-primary px-5 py-2.5 text-xs font-semibold shadow-lg shadow-dc-red/20"
                >
                  <Compass className="h-4 w-4" />
                  Explore College Communities
                </Link>
                <Link
                  to="/wider-network"
                  className="flex items-center gap-2 rounded-xl border border-dc-border bg-dc-card px-4 py-2.5 text-xs font-semibold text-dc-text hover:border-dc-blue/40 transition-colors"
                >
                  <Globe className="h-4 w-4 text-dc-blue" />
                  Browse Wider Network
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  // State 2: Membership Pending Review
  if (data.membership.status === 'PENDING') {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6 animate-fade-in py-12">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-4 shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="h-7 w-7 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-dc-text">
              Membership Request Pending Review
            </h2>
            <p className="text-xs text-dc-subtext max-w-lg mx-auto leading-relaxed">
              Your application to join{' '}
              <strong className="text-dc-text">{data.community.name}</strong> has been received and is awaiting approval by an authorized college administrator.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                to="/community/explore"
                className="rounded-xl border border-dc-border bg-dc-card px-4 py-2 text-xs font-semibold text-dc-text hover:border-dc-blue transition-colors"
              >
                Explore Other Communities
              </Link>
              <Link
                to="/wider-network"
                className="dc-btn-primary px-4 py-2 text-xs font-semibold"
              >
                Browse Wider Network
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  const { community, membership, canManage } = data

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
        {/* College Community Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-dc-border bg-gradient-to-r from-dc-card via-dc-bg2 to-dc-card p-6 lg:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-dc-blue/15 text-dc-blue border border-dc-blue/30 text-2xl font-black shadow-md">
                {community.code.slice(0, 4)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold tracking-tight text-dc-text">
                    {community.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Institution
                  </span>
                </div>
                <p className="text-xs text-dc-subtext max-w-2xl">
                  {community.description || 'Official college academic collaboration hub.'}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-dc-subtext/70">
                  {community.location && <span>📍 {community.location}</span>}
                  <span>👥 {community.memberCount || 0} Members</span>
                  <span>💬 {community.discussionCount || 0} Discussions</span>
                  <span className="capitalize">
                    🛡️ Role: {membership.role.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="dc-btn-primary px-4 py-2 text-xs font-semibold shadow-md"
              >
                <Plus className="h-4 w-4" />
                Ask in College
              </button>
              {canManage && (
                <Link
                  to={`/community/${community.slug}/manage`}
                  className="flex items-center gap-1.5 rounded-xl border border-dc-border bg-dc-card px-3.5 py-2 text-xs font-semibold text-dc-text hover:border-dc-blue hover:text-dc-blue transition-colors"
                  title="Manage Community & Requests"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Announcements Banner if present */}
        {community.announcements && community.announcements.length > 0 && (
          <div className="rounded-2xl border border-dc-blue/30 bg-dc-blue/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-dc-blue uppercase tracking-wider">
              <Bell className="h-3.5 w-3.5" />
              <span>College Announcement</span>
            </div>
            <p className="text-xs font-semibold text-dc-text">
              {community.announcements[0].title}
            </p>
            <p className="text-xs text-dc-subtext leading-relaxed">
              {community.announcements[0].content}
            </p>
          </div>
        )}

        {/* Navigation Tabs (Discussions vs Members) */}
        <div className="flex items-center justify-between border-b border-dc-border pb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('discussions')}
              className={`text-xs font-bold transition-colors pb-2 -mb-2 border-b-2 ${
                activeTab === 'discussions'
                  ? 'border-dc-blue text-dc-text'
                  : 'border-transparent text-dc-subtext hover:text-dc-text'
              }`}
            >
              Academic Discussions ({discussions.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`text-xs font-bold transition-colors pb-2 -mb-2 border-b-2 ${
                activeTab === 'members'
                  ? 'border-dc-blue text-dc-text'
                  : 'border-transparent text-dc-subtext hover:text-dc-text'
              }`}
            >
              Members Directory
            </button>
          </div>

          <Link
            to="/wider-network"
            className="flex items-center gap-1.5 text-xs font-medium text-dc-blue hover:underline"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Wider Academic Network</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeTab === 'discussions' && (
          <div className="space-y-4">
            {/* Filter pills & search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                {CATEGORY_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      activeCategory === tab.id
                        ? 'bg-dc-blue text-white shadow-sm font-semibold'
                        : 'bg-dc-card text-dc-subtext border border-dc-border hover:text-dc-text hover:border-dc-blue/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-dc-subtext" />
                <input
                  type="text"
                  placeholder="Filter questions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-dc-border bg-dc-card pl-9 pr-3 py-1.5 text-xs text-dc-text placeholder:text-dc-subtext/50 focus:border-dc-blue focus:outline-none"
                />
              </div>
            </div>

            {/* Discussions Feed */}
            {discussionsLoading ? (
              <LoadingState message="Loading discussions..." />
            ) : discussions.length === 0 ? (
              <div className="rounded-2xl border border-dc-border bg-dc-card p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-dc-blue/10 text-dc-blue">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-dc-text">
                  No discussions found in this category
                </h3>
                <p className="text-xs text-dc-subtext max-w-md mx-auto">
                  Be the first to post a course doubt or discussion topic in {community.name}.
                </p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="dc-btn-primary px-4 py-2 text-xs font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Ask First Question
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {discussions.map(d => {
                  const isAuthor = d.authorId === user?.id
                  return (
                    <div
                      key={d.id}
                      className="group rounded-2xl border border-dc-border bg-dc-card p-5 transition-all hover:border-dc-blue/40 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-dc-bg2 px-2 py-0.5 text-[10px] font-bold text-dc-blue border border-dc-border">
                              {d.subject?.code}
                            </span>
                            {d.academicCategory && (
                              <span className="rounded bg-dc-bg2 px-2 py-0.5 text-[10px] font-semibold text-dc-subtext border border-dc-border">
                                {d.academicCategory.replace('_', ' ')}
                              </span>
                            )}
                            {d.isSharedWithWiderNetwork ? (
                              <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                                <Globe className="h-3 w-3" />
                                Shared with Wider Network
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-dc-bg2 px-2 py-0.5 text-[10px] font-semibold text-dc-subtext border border-dc-border">
                                <Lock className="h-3 w-3" />
                                College Only
                              </span>
                            )}
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

                          <div className="flex items-center gap-4 text-[11px] text-dc-subtext/70 pt-1">
                            <span>By {d.author?.displayName}</span>
                            <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                            <span>💬 {d._count?.answers || 0} answers</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {isAuthor && !d.isSharedWithWiderNetwork && (
                            <button
                              onClick={() => setShareDoubt(d)}
                              className="flex items-center gap-1.5 rounded-xl border border-dc-blue/40 bg-dc-blue/10 px-3 py-1.5 text-xs font-semibold text-dc-blue hover:bg-dc-blue hover:text-white transition-all shadow-sm"
                              title="Ask the Wider Network across other colleges"
                            >
                              <Globe className="h-3.5 w-3.5" />
                              <span>Ask Wider Network</span>
                            </button>
                          )}
                          <Link
                            to={`/doubts/${d.id}`}
                            className="flex items-center gap-1 rounded-lg border border-dc-border px-3 py-1.5 text-xs font-medium text-dc-text hover:border-dc-blue hover:text-dc-blue transition-colors"
                          >
                            <span>Open Thread</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Members Directory Tab */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {membersLoading ? (
              <LoadingState message="Loading community members..." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl border border-dc-border bg-dc-card p-4 shadow-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-dc-blue/10 text-dc-blue font-bold text-sm">
                      {m.user?.displayName?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-dc-text truncate">
                        {m.user?.displayName}
                      </p>
                      <p className="text-[10px] text-dc-subtext capitalize">
                        {m.role.toLowerCase().replace('_', ' ')} · {m.department || 'Enrolled'}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                        m.role === 'COLLEGE_ADMIN'
                          ? 'bg-purple-500/10 text-purple-400'
                          : m.role === 'MODERATOR'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-dc-bg2 text-dc-subtext'
                      }`}
                    >
                      {m.role === 'COLLEGE_ADMIN' ? 'Admin' : m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <CreateCollegeDiscussionModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateDiscussion}
          collegeName={community.name}
        />

        <AskWiderNetworkModal
          isOpen={Boolean(shareDoubt)}
          onClose={() => setShareDoubt(null)}
          onConfirm={handleShareWithWiderNetwork}
          discussionTitle={shareDoubt?.title || ''}
          collegeName={community.name}
        />
      </div>
    </AppShell>
  )
}
