import { useState, useEffect, useMemo, useCallback } from 'react'
import AppShell from '../layouts/AppShell'
import { doubtService } from '../services/doubtService'
import {
  AnalyticsSummary,
  TopicAnalyticsItem,
  TrendDataPoint,
  SubjectAnalyticsItem,
  SimilarDoubtClusterItem,
  ActionableInsight,
  Subject
} from '../types/api'
import { useAuth } from '../context/AuthContext'
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Layers,
  Repeat,
  CheckCircle2,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  Lightbulb,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen
} from 'lucide-react'

type DatePreset = '7d' | '30d' | '90d' | 'all' | 'custom'

export default function DoubtAnalytics() {
  const { user } = useAuth()

  // Filters State
  const [datePreset, setDatePreset] = useState<DatePreset>('30d')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [subjectsList, setSubjectsList] = useState<Subject[]>([])

  // Analytics Data State
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [topics, setTopics] = useState<TopicAnalyticsItem[]>([])
  const [trends, setTrends] = useState<TrendDataPoint[]>([])
  const [subjectsData, setSubjectsData] = useState<SubjectAnalyticsItem[]>([])
  const [clusters, setClusters] = useState<SimilarDoubtClusterItem[]>([])
  const [insights, setInsights] = useState<ActionableInsight[]>([])

  // UI State
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isForbidden, setIsForbidden] = useState<boolean>(false)
  const [selectedTopic, setSelectedTopic] = useState<TopicAnalyticsItem | null>(null)
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null)
  const [trendGranularity, setTrendGranularity] = useState<'day' | 'week'>('day')

  // Calculate actual ISO strings from presets
  const computedDateRange = useMemo(() => {
    const now = new Date()
    if (datePreset === 'all') {
      return { start: undefined, end: undefined }
    }
    if (datePreset === 'custom') {
      return {
        start: startDate ? new Date(startDate).toISOString() : undefined,
        end: endDate ? new Date(endDate).toISOString() : undefined
      }
    }
    const days = datePreset === '7d' ? 7 : datePreset === '90d' ? 90 : 30
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return {
      start: start.toISOString(),
      end: now.toISOString()
    }
  }, [datePreset, startDate, endDate])

  // Load subject list on mount
  useEffect(() => {
    doubtService.listSubjects()
      .then(res => setSubjectsList(res))
      .catch(() => {})
  }, [])

  // Main data fetching logic
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsForbidden(false)

    const params: { startDate?: string; endDate?: string; subjectId?: string } = {}
    if (computedDateRange.start) params.startDate = computedDateRange.start
    if (computedDateRange.end) params.endDate = computedDateRange.end
    if (selectedSubjectId) params.subjectId = selectedSubjectId

    try {
      const [
        summaryRes,
        topicsRes,
        trendsRes,
        subjectsRes,
        clustersRes,
        insightsRes
      ] = await Promise.all([
        doubtService.getAnalyticsSummary(params),
        doubtService.getMostAskedTopics({ ...params, limit: 10 }),
        doubtService.getDoubtTrends({ ...params, granularity: trendGranularity }),
        doubtService.getSubjectWiseStats({ startDate: params.startDate, endDate: params.endDate }),
        doubtService.getSimilarClusters({ ...params, limit: 8 }),
        doubtService.getActionableInsights(params)
      ])

      setSummary(summaryRes)
      const safeTopics = Array.isArray(topicsRes) ? topicsRes : (topicsRes as any)?.topics || []
      setTopics(safeTopics)
      setTrends(Array.isArray(trendsRes?.trends) ? trendsRes.trends : Array.isArray(trendsRes) ? (trendsRes as any) : [])
      setSubjectsData(Array.isArray(subjectsRes) ? subjectsRes : [])
      setClusters(Array.isArray(clustersRes) ? clustersRes : (clustersRes as any)?.clusters || [])
      setInsights(Array.isArray(insightsRes) ? insightsRes : (insightsRes as any)?.insights || [])
      if (safeTopics.length > 0 && !selectedTopic) {
        setSelectedTopic(safeTopics[0])
      }
    } catch (err: any) {
      if (err?.status === 403 || err?.statusCode === 403 || err?.message?.toLowerCase().includes('forbidden')) {
        setIsForbidden(true)
      } else {
        setError(err?.message || 'Failed to fetch analytics data')
      }
    } finally {
      setLoading(false)
    }
  }, [computedDateRange, selectedSubjectId, trendGranularity, selectedTopic])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Highest volume in topics for bar scaling
  const maxTopicCount = useMemo(() => {
    if (!topics.length) return 1
    return Math.max(...topics.map(t => t.doubtCount), 1)
  }, [topics])

  // Highest volume in trends for line chart scaling
  const maxTrendCount = useMemo(() => {
    if (!trends.length) return 1
    return Math.max(...trends.map(t => t.count), 1)
  }, [trends])

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 animate-fade-in pb-12">
        {/* ── Header & Academic Intelligence Title ── */}
        <div className="relative overflow-hidden rounded-3xl border border-dc-border bg-dc-card p-6 sm:p-8 shadow-dc-card">
          <div className="absolute top-0 right-0 pointer-events-none opacity-20 sm:opacity-30">
            <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
              <path d="M220 0 L220 220 L0 0 Z" fill="rgba(230,36,41,0.04)" />
              <line x1="220" y1="0" x2="0" y2="220" stroke="var(--dc-red)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="220" y1="0" x2="80" y2="220" stroke="var(--dc-blue)" strokeWidth="0.8" />
              <line x1="220" y1="0" x2="220" y2="140" stroke="var(--dc-text)" strokeWidth="0.8" opacity="0.4" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-dc-red/30 bg-dc-red/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-dc-red">
                  <BarChart3 className="h-3 w-3" />
                  FACULTY & CURRICULUM INTEL
                </span>
                <span className="rounded border border-dc-blue/30 bg-dc-blue/10 px-2 py-0.5 text-[10px] font-semibold text-dc-blue">
                  Spider-Verse v2.0
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-dc-text sm:text-3xl">
                Student Doubt Analytics
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm text-dc-subtext">
                Continuous semantic topic clustering, curriculum friction tracking, and pedagogical insights extracted directly from peer doubts.
              </p>
            </div>

            <button
              onClick={() => fetchAnalyticsData()}
              disabled={loading}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-dc-border bg-dc-bg2 px-3.5 py-2 text-xs font-semibold text-dc-text transition-all hover:border-dc-blue/50 hover:bg-dc-blue/10 disabled:opacity-50 sm:self-center"
              title="Refresh Analytics"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-dc-blue' : 'text-dc-subtext'}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* ── Filters & Controls Toolbar ── */}
          <div className="relative z-10 mt-6 pt-5 border-t border-dc-border/60 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Date Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-dc-subtext uppercase tracking-wider mr-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-dc-subtext" /> Range:
              </span>
              {(['7d', '30d', '90d', 'all'] as DatePreset[]).map(preset => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    datePreset === preset
                      ? 'bg-dc-red text-white shadow-sm ring-2 ring-dc-red/30'
                      : 'border border-dc-border bg-dc-bg2 text-dc-subtext hover:border-dc-border-strong hover:text-dc-text'
                  }`}
                >
                  {preset === '7d' ? '7 Days' : preset === '30d' ? '30 Days' : preset === '90d' ? '90 Days' : 'All Time'}
                </button>
              ))}
              <button
                onClick={() => setDatePreset('custom')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  datePreset === 'custom'
                    ? 'bg-dc-blue text-white shadow-sm ring-2 ring-dc-blue/30'
                    : 'border border-dc-border bg-dc-bg2 text-dc-subtext hover:border-dc-border-strong hover:text-dc-text'
                }`}
              >
                Custom Date
              </button>
            </div>

            {/* Custom Date Pickers (if custom selected) */}
            {datePreset === 'custom' && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="rounded-lg border border-dc-border bg-dc-bg2 px-2.5 py-1 text-xs text-dc-text focus:outline-none focus:border-dc-blue"
                />
                <span className="text-xs text-dc-subtext">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="rounded-lg border border-dc-border bg-dc-bg2 px-2.5 py-1 text-xs text-dc-text focus:outline-none focus:border-dc-blue"
                />
              </div>
            )}

            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-dc-subtext uppercase tracking-wider flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Subject:
              </span>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="rounded-xl border border-dc-border bg-dc-bg2 px-3 py-1.5 text-xs font-medium text-dc-text focus:border-dc-blue focus:outline-none"
              >
                <option value="">All Subjects & Courses</option>
                {subjectsList.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Access Denied for Non-Faculty / Students ── */}
        {isForbidden && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-200">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-500/20 p-2.5">
                <ShieldAlert className="h-6 w-6 text-amber-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-amber-300">
                  Faculty Access Required
                </h3>
                <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                  Institutional Student Doubt Analytics are protected and restricted to authorized faculty members and college administrators. If you are a professor or teaching assistant, please ensure your account is registered with the faculty role or contact your institution administrator.
                </p>
                <div className="pt-2 text-xs text-amber-400 font-semibold">
                  Current Session: {user?.email || 'Authenticated User'} ({user?.role || user?.profession || 'STUDENT'})
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Error Banner ── */}
        {error && !isForbidden && (
          <div className="rounded-2xl border border-dc-red/30 bg-dc-red/10 p-4 text-dc-text flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-dc-red shrink-0" />
            <p className="text-xs sm:text-sm text-dc-red">{error}</p>
          </div>
        )}

        {/* ── SECTION A: Summary Statistics Cards ── */}
        {!isForbidden && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Doubts */}
            <div className="relative overflow-hidden rounded-2xl border border-dc-border bg-dc-card p-4 transition-all hover:border-dc-blue/40 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-dc-subtext">Total Doubts</span>
                <span className="rounded-lg bg-dc-blue/10 p-2 text-dc-blue">
                  <HelpCircle className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-dc-text">
                  {loading ? '...' : (summary?.totalDoubts ?? 0)}
                </span>
                <p className="text-[10px] text-dc-subtext mt-1">Recorded in chosen interval</p>
              </div>
            </div>

            {/* Card 2: Distinct Topics */}
            <div className="relative overflow-hidden rounded-2xl border border-dc-border bg-dc-card p-4 transition-all hover:border-dc-red/40 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-dc-subtext">Distinct Topics</span>
                <span className="rounded-lg bg-dc-red/10 p-2 text-dc-red">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-dc-text">
                  {loading ? '...' : (summary?.distinctTopics ?? 0)}
                </span>
                <p className="text-[10px] text-dc-subtext mt-1">Vector clustered concepts</p>
              </div>
            </div>

            {/* Card 3: Top Topic */}
            <div className="relative overflow-hidden rounded-2xl border border-dc-border bg-dc-card p-4 transition-all hover:border-amber-400/40 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-dc-subtext">Most Asked</span>
                <span className="rounded-lg bg-amber-400/10 p-2 text-amber-400">
                  <Layers className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-sm font-bold text-dc-text truncate block" title={summary?.topTopic || 'None'}>
                  {loading ? '...' : (summary?.topTopic && summary.topTopic !== 'None' ? summary.topTopic : 'No Topics Yet')}
                </span>
                <p className="text-[10px] text-dc-subtext mt-1">
                  {loading ? '...' : `${summary?.topTopicCount ?? 0} doubts logged`}
                </p>
              </div>
            </div>

            {/* Card 4: Repeated Doubts */}
            <div className="relative overflow-hidden rounded-2xl border border-dc-border bg-dc-card p-4 transition-all hover:border-purple-400/40 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-dc-subtext">Repeated Doubts</span>
                <span className="rounded-lg bg-purple-400/10 p-2 text-purple-400">
                  <Repeat className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-dc-text">
                  {loading ? '...' : (summary?.repeatedDoubtsCount ?? 0)}
                </span>
                <p className="text-[10px] text-dc-subtext mt-1">Semantic overlap &gt; 0.78</p>
              </div>
            </div>

            {/* Card 5: Answer Helpfulness */}
            <div className="relative overflow-hidden rounded-2xl border border-dc-border bg-dc-card p-4 transition-all hover:border-emerald-400/40 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-dc-subtext">Helpfulness Rate</span>
                <span className="rounded-lg bg-emerald-400/10 p-2 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-dc-text">
                  {loading ? '...' : `${summary?.helpfulnessRate ?? 0}%`}
                </span>
                <p className="text-[10px] text-dc-subtext mt-1">Accepted or upvoted answers</p>
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION B & SECTION C: Ranked Topics Bar Chart & Time Trends Line Chart ── */}
        {!isForbidden && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SECTION B: Most Frequently Asked Topics (Ranked Horizontal Bars) */}
            <div className="rounded-3xl border border-dc-border bg-dc-card p-6 shadow-dc-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-dc-text flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-dc-red" />
                      Most Asked Academic Topics
                    </h2>
                    <p className="text-xs text-dc-subtext">
                      Frequency ranking from semantic clusters
                    </p>
                  </div>
                  <span className="rounded-full bg-dc-bg2 px-2.5 py-1 text-[10px] font-bold text-dc-subtext border border-dc-border">
                    {topics.length} Topics
                  </span>
                </div>

                {loading ? (
                  <div className="space-y-3 py-6">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-8 rounded-lg bg-dc-bg2 animate-pulse" />
                    ))}
                  </div>
                ) : topics.length === 0 ? (
                  <div className="py-12 text-center text-dc-subtext text-xs">
                    No topic clusters found for this filter criteria.
                  </div>
                ) : (
                  <div className="space-y-3.5 mt-2">
                    {topics.map((t, idx) => {
                      const widthPercent = Math.max(Math.round((t.doubtCount / maxTopicCount) * 100), 6)
                      const isSelected = selectedTopic?.id === t.id
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTopic(t)}
                          className={`group cursor-pointer rounded-xl p-2.5 transition-all ${
                            isSelected
                              ? 'bg-dc-blue/15 border border-dc-blue/40 shadow-sm'
                              : 'hover:bg-dc-bg2 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dc-bg2 text-[10px] font-bold text-dc-subtext">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-dc-text truncate" title={t.name}>
                                {t.name}
                              </span>
                              {t.subject && (
                                <span className="shrink-0 rounded border border-dc-border bg-dc-bg2 px-1.5 py-0.2 text-[9px] font-mono text-dc-subtext">
                                  {t.subject.code}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-black text-dc-text text-xs">
                                {t.doubtCount} doubts
                              </span>
                              <span className="text-[10px] text-dc-subtext">
                                ({t.percentageOfTotal}%)
                              </span>
                            </div>
                          </div>

                          {/* Bar Graphic */}
                          <div className="h-2 w-full rounded-full bg-dc-bg2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                idx === 0
                                  ? 'bg-gradient-to-r from-dc-red to-dc-red-hover'
                                  : idx === 1
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                  : 'bg-gradient-to-r from-dc-blue to-cyan-400'
                              }`}
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Selected Topic Aggregated Detail */}
              {selectedTopic && (
                <div className="mt-4 pt-4 border-t border-dc-border/60 rounded-xl bg-dc-bg2/60 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-dc-text">Inspected Topic: {selectedTopic.name}</span>
                    <span className="font-semibold text-dc-blue">{selectedTopic.doubtCount} Doubts Logged</span>
                  </div>
                  {selectedTopic.representativeQuestion && (
                    <p className="text-[11px] text-dc-subtext italic">
                      &quot;{selectedTopic.representativeQuestion}&quot;
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* SECTION C: Doubt Trends Over Time (Interactive Line Chart) */}
            <div className="rounded-3xl border border-dc-border bg-dc-card p-6 shadow-dc-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-dc-text flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-dc-blue" />
                      Doubt Volume Trends Over Time
                    </h2>
                    <p className="text-xs text-dc-subtext">
                      Timeline activity tracking student engagement
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-dc-bg2 p-1 rounded-xl border border-dc-border text-[10px]">
                    <button
                      onClick={() => setTrendGranularity('day')}
                      className={`px-2 py-0.5 rounded-lg font-semibold ${
                        trendGranularity === 'day' ? 'bg-dc-blue text-white' : 'text-dc-subtext'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setTrendGranularity('week')}
                      className={`px-2 py-0.5 rounded-lg font-semibold ${
                        trendGranularity === 'week' ? 'bg-dc-blue text-white' : 'text-dc-subtext'
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="h-60 rounded-xl bg-dc-bg2 animate-pulse flex items-center justify-center">
                    <span className="text-xs text-dc-subtext">Rendering timeline chart...</span>
                  </div>
                ) : trends.length === 0 ? (
                  <div className="h-60 flex items-center justify-center text-center text-dc-subtext text-xs">
                    No activity recorded in this period.
                  </div>
                ) : (
                  <div className="mt-4">
                    {/* SVG Line Chart */}
                    <div className="h-52 w-full relative">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox={`0 0 ${Math.max(trends.length * 50, 300)} 160`}
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--dc-blue)" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="var(--dc-blue)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        {[0, 40, 80, 120, 160].map(y => (
                          <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2={Math.max(trends.length * 50, 300)}
                            y2={y}
                            stroke="rgba(148, 163, 184, 0.12)"
                            strokeDasharray="3 3"
                          />
                        ))}

                        {/* Area Polygon */}
                        {(() => {
                          const width = Math.max(trends.length * 50, 300)
                          const step = width / Math.max(trends.length - 1, 1)
                          const points = trends.map((t, i) => {
                            const x = i * step
                            const y = 140 - (t.count / maxTrendCount) * 120
                            return `${x},${y}`
                          })
                          const areaPoints = `0,160 ${points.join(' ')} ${width},160`
                          return (
                            <>
                              <polygon points={areaPoints} fill="url(#trendAreaGradient)" />
                              <polyline
                                fill="none"
                                stroke="var(--dc-blue)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={points.join(' ')}
                              />
                              {trends.map((t, i) => {
                                const cx = i * step
                                const cy = 140 - (t.count / maxTrendCount) * 120
                                return (
                                  <g key={t.date} className="group/point">
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r="4"
                                      fill="var(--dc-card)"
                                      stroke="var(--dc-blue)"
                                      strokeWidth="2.5"
                                      className="transition-transform group-hover/point:scale-150"
                                    />
                                  </g>
                                )
                              })}
                            </>
                          )
                        })()}
                      </svg>
                    </div>

                    {/* Timeline X-Axis Dates */}
                    <div className="flex justify-between items-center text-[10px] text-dc-subtext mt-2 font-mono">
                      <span>{trends[0]?.date}</span>
                      <span>{trends[Math.floor(trends.length / 2)]?.date}</span>
                      <span>{trends[trends.length - 1]?.date}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Academic Disclaimers */}
              <div className="mt-4 rounded-xl border border-dc-blue/20 bg-dc-blue/5 p-3 text-[11px] text-dc-subtext leading-relaxed">
                <span className="font-bold text-dc-blue mr-1">Academic Note:</span>
                An increase in questions reflects active course engagement and study pace; it should not be construed as automatic proof of student incomprehension.
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION D: Subject-Wise Analytics Table ── */}
        {!isForbidden && (
          <section className="rounded-3xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-dc-text flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  Subject-Wise Doubt Breakdown & Period Comparison
                </h2>
                <p className="text-xs text-dc-subtext">
                  Curriculum distribution and delta vs previous equivalent period
                </p>
              </div>
            </div>

            {loading ? (
              <div className="h-32 rounded-xl bg-dc-bg2 animate-pulse" />
            ) : subjectsData.length === 0 ? (
              <div className="py-8 text-center text-dc-subtext text-xs">
                No subject metrics available for the current filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dc-border text-[11px] font-bold uppercase tracking-wider text-dc-subtext">
                      <th className="py-3 px-3">Subject / Course</th>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-3 text-right">Active Doubts</th>
                      <th className="py-3 px-3 text-right">Distinct Topics</th>
                      <th className="py-3 px-3 text-right">Prior Period</th>
                      <th className="py-3 px-3 text-right">Period Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dc-border/50 text-xs">
                    {subjectsData.map(sub => {
                      const isUp = typeof sub.percentageChange === 'number' && sub.percentageChange > 0
                      const isDown = typeof sub.percentageChange === 'number' && sub.percentageChange < 0
                      return (
                        <tr key={sub.subjectId} className="hover:bg-dc-bg2/60 transition-colors">
                          <td className="py-3 px-3 font-semibold text-dc-text">
                            {sub.name}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-dc-subtext">
                            {sub.code}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-dc-text">
                            {sub.currentCount}
                          </td>
                          <td className="py-3 px-3 text-right text-dc-subtext">
                            {sub.topicsCount}
                          </td>
                          <td className="py-3 px-3 text-right text-dc-subtext font-mono">
                            {sub.previousCount}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {sub.percentageChange === null ? (
                              <span className="text-[10px] text-dc-subtext font-mono">N/A</span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  isUp
                                    ? 'bg-amber-500/15 text-amber-400'
                                    : isDown
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-dc-bg2 text-dc-subtext'
                                }`}
                              >
                                {isUp && <ArrowUpRight className="h-3 w-3" />}
                                {isDown && <ArrowDownRight className="h-3 w-3" />}
                                {sub.percentageChange > 0 ? `+${sub.percentageChange}%` : `${sub.percentageChange}%`}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── SECTION E: Similar Doubt Groups (Zero Student PII) ── */}
        {!isForbidden && (
          <section className="rounded-3xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-dc-text flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-purple-400" />
                  Semantically Similar Doubt Clusters
                </h2>
                <p className="text-xs text-dc-subtext">
                  Vector grouped questions across English, Hindi, and Hinglish (Strict zero student PII)
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-28 rounded-2xl bg-dc-bg2 animate-pulse" />
                ))}
              </div>
            ) : clusters.length === 0 ? (
              <div className="py-8 text-center text-dc-subtext text-xs">
                No duplicate question clusters identified in this filter range.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusters.map(c => {
                  const isExpanded = expandedClusterId === c.id
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-dc-border bg-dc-bg2/40 p-4 transition-all hover:border-purple-400/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-dc-text truncate">
                              {c.topicName}
                            </span>
                            {c.subject && (
                              <span className="rounded border border-dc-border bg-dc-card px-1.5 py-0.2 text-[9px] font-mono text-dc-subtext">
                                {c.subject.code}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-dc-subtext line-clamp-2 italic">
                            &quot;{c.representativeQuestion}&quot;
                          </p>
                        </div>
                        <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 text-[10px] font-black text-purple-400 shrink-0">
                          {c.doubtCount} doubts
                        </span>
                      </div>

                      {/* Expand Button */}
                      {c.sampleDoubts && c.sampleDoubts.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dc-border/50">
                          <button
                            onClick={() => setExpandedClusterId(isExpanded ? null : c.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-dc-blue hover:underline"
                          >
                            <span>{isExpanded ? 'Hide related questions' : `View ${c.sampleDoubts.length} sanitized doubts`}</span>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>

                          {isExpanded && (
                            <ul className="mt-2 space-y-1.5 pl-2 text-[11px] text-dc-subtext">
                              {c.sampleDoubts.map(sample => (
                                <li key={sample.id} className="flex items-center justify-between gap-2 bg-dc-card/60 p-1.5 rounded-lg border border-dc-border/40">
                                  <span className="truncate text-dc-text">{sample.title}</span>
                                  <span className="text-[9px] font-mono shrink-0 text-dc-subtext">
                                    {new Date(sample.createdAt).toLocaleDateString()}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ── SECTION F: Actionable Academic Insights ── */}
        {!isForbidden && (
          <section className="rounded-3xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-dc-text flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  Actionable Academic & Curriculum Insights
                </h2>
                <p className="text-xs text-dc-subtext">
                  Deterministic pedagogical guidelines derived strictly from aggregate patterns
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-dc-bg2 animate-pulse" />
                ))}
              </div>
            ) : insights.length === 0 ? (
              <div className="py-8 text-center text-dc-subtext text-xs">
                Insufficient data to generate actionable insights for this range. Insights appear as doubts accumulate.
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map(item => {
                  const isHigh = item.severity === 'high'
                  const isMedium = item.severity === 'medium'
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4.5 transition-all ${
                        isHigh
                          ? 'border-dc-red/40 bg-dc-red/5'
                          : isMedium
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-dc-blue/40 bg-dc-blue/5'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                isHigh
                                  ? 'bg-dc-red/20 text-dc-red'
                                  : isMedium
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-dc-blue/20 text-dc-blue'
                              }`}
                            >
                              {item.type}
                            </span>
                            <h3 className="text-xs sm:text-sm font-bold text-dc-text">
                              {item.title}
                            </h3>
                          </div>

                          {/* Observed Data vs Recommended Action */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                            <div className="rounded-xl bg-dc-card/70 p-3 border border-dc-border/60 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-dc-subtext">
                                Observed Data (Ground Truth)
                              </span>
                              <p className="text-dc-text leading-relaxed">
                                {item.observation}
                              </p>
                            </div>

                            <div className="rounded-xl bg-dc-card/70 p-3 border border-dc-border/60 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-dc-blue">
                                Recommended Academic Action
                              </span>
                              <p className="text-dc-text leading-relaxed font-medium">
                                {item.actionSuggestion}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  )
}
