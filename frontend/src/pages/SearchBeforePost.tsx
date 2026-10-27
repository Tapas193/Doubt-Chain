import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import StatusBadge from '../components/StatusBadge'
import { doubtService } from '../services/doubtService'
import { Doubt, Subject, SmartDuplicateMatch } from '../types/api'
import { useLanguage } from '../i18n/LanguageContext'

export default function SearchBeforePost() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [resolutionFilter, setResolutionFilter] = useState<'all' | 'resolved' | 'unresolved'>('all')
  const [results, setResults] = useState<Doubt[]>([])
  const [searchMode, setSearchMode] = useState<string>('hybrid')
  const [smartMatches, setSmartMatches] = useState<SmartDuplicateMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [smartLoading, setSmartLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answeredDoubtId, setAnsweredDoubtId] = useState<string | null>(null)
  const [feedbackSending, setFeedbackSending] = useState(false)

  useEffect(() => {
    doubtService.listSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setSmartMatches([])
      setError(null)
      return
    }

    let active = true
    setLoading(true)
    setSmartLoading(true)
    setError(null)

    const timer = setTimeout(() => {
      const isResolved =
        resolutionFilter === 'resolved' ? true : resolutionFilter === 'unresolved' ? false : undefined

      // 1. Smart Search 2.0: Hybrid search with relevance ranking & snippets
      doubtService
        .searchDoubts(trimmed, {
          subjectId: subjectId || undefined,
          isResolved
        })
        .then(res => {
          if (active) {
            setResults(res.items || [])
            setSearchMode(res.searchMode || 'hybrid')
            setError(null)
          }
        })
        .catch(err => {
          if (active) {
            setError(err.message || 'Search request failed. Please check your connection.')
            setResults([])
          }
        })
        .finally(() => {
          if (active) setLoading(false)
        })

      // 2. Semantic Smart Duplicate Search (Step 2)
      doubtService
        .findSmartDuplicates(trimmed, { subjectId: subjectId || undefined })
        .then(matches => {
          if (active) setSmartMatches(matches || [])
        })
        .catch(() => {
          if (active) setSmartMatches([])
        })
        .finally(() => {
          if (active) setSmartLoading(false)
        })
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, subjectId, resolutionFilter])

  const hasQuery = query.trim().length > 0

  const handleAnsweredClick = async (doubtId: string) => {
    setFeedbackSending(true)
    try {
      await doubtService.recordSearchFeedback({
        doubtId,
        action: 'ANSWERED_MY_DOUBT',
        query: query.trim()
      })
      setAnsweredDoubtId(doubtId)
    } catch (err) {
      console.warn('Feedback recording error:', err)
      setAnsweredDoubtId(doubtId)
    } finally {
      setFeedbackSending(false)
    }
  }

  const handleNoneHelpedClick = async () => {
    try {
      await doubtService.recordSearchFeedback({
        action: 'NONE_HELPED_POSTED',
        query: query.trim()
      })
    } catch (err) {
      console.warn('Feedback recording error:', err)
    }
    const params = new URLSearchParams()
    if (query.trim()) params.set('title', query.trim())
    if (subjectId) params.set('subjectId', subjectId)
    navigate(`/doubts/new?${params.toString()}`)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-dc-text">{t('search.title')}</h1>
          <p className="mt-0.5 text-sm text-dc-subtext">
            {t('search.subtitle')}
          </p>
        </div>

        {/* Search bar & Filters */}
        <div className="dc-card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dc-subtext"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
              <input
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setAnsweredDoubtId(null)
                }}
                placeholder={t('search.inputPlaceholder')}
                aria-label={t('search.title')}
                className="dc-input pl-9"
                autoFocus
              />
              {(loading || smartLoading) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 animate-spin text-dc-blue" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Subject Filter */}
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              aria-label="Filter by subject"
              className="dc-input w-auto flex-none text-xs"
            >
              <option value="">{t('common.all')} ({t('nav.subjects')})</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Resolution Filter */}
            <select
              value={resolutionFilter}
              onChange={e => setResolutionFilter(e.target.value as any)}
              aria-label="Filter by resolution status"
              className="dc-input w-auto flex-none text-xs"
            >
              <option value="all">{t('doubts.filterAll')}</option>
              <option value="resolved">{t('doubts.filterResolved')}</option>
              <option value="unresolved">{t('doubts.filterUnresolved')}</option>
            </select>
          </div>

          {/* Search Mode & Metadata indicators */}
          {hasQuery && (
            <div className="flex flex-wrap items-center justify-between text-[11px] text-dc-subtext pt-1 border-t border-dc-border/50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-dc-blue">
                  {searchMode === 'hybrid' ? '⚡ Hybrid Search (Keyword + Semantic Embeddings)' : '🔍 Keyword Match'}
                </span>
                <span>•</span>
                <span>Cross-language: English, हिन्दी, Hinglish</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Programming-language filter: not yet tagged
              </span>
            </div>
          )}
        </div>

        {/* Feature 1: Similar Doubts (Semantic Duplicate Detection) */}
        {hasQuery && smartMatches.length > 0 && (
          <div className="rounded-xl border border-dc-blue/40 bg-gradient-to-br from-dc-blue/10 via-dc-card to-dc-card p-5 shadow-lg space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dc-blue/20 text-dc-blue text-sm">
                  ✨
                </span>
                <div>
                  <h2 className="text-base font-semibold text-dc-text">
                    {t('search.smartMatches')}
                  </h2>
                  <p className="text-xs text-dc-subtext">
                    {t('search.crossLanguageNotice')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {smartMatches.map(match => (
                <div
                  key={match.id}
                  className="rounded-lg border border-dc-border bg-dc-bg/80 p-4 transition-all hover:border-dc-blue/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={match.discussionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-dc-text hover:text-dc-blue transition-colors line-clamp-1"
                        >
                          {match.title}
                        </Link>
                        <span className="shrink-0 text-xs text-dc-blue hover:underline">
                          ↗
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-dc-subtext line-clamp-2">
                        {match.contentSnippet}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {match.subject && (
                        <span className="rounded bg-dc-border/60 px-2 py-0.5 text-[11px] font-medium text-dc-subtext">
                          {match.subject.code}
                        </span>
                      )}
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        {match.similarityPercent}% {t('search.matchScore')}
                      </span>
                    </div>
                  </div>

                  {/* Accepted Answer Preview */}
                  {match.acceptedAnswer && (
                    <div className="mt-3 rounded-md bg-dc-card/90 p-2.5 border-l-2 border-emerald-400 text-xs">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 mb-1">
                        <span>✓ {t('detail.acceptedSolution')}</span>
                        {match.acceptedAnswer.author && (
                          <span className="text-dc-subtext">({match.acceptedAnswer.author.displayName})</span>
                        )}
                      </div>
                      <p className="text-dc-text/90 line-clamp-2 italic">
                        "{match.acceptedAnswer.content}"
                      </p>
                    </div>
                  )}

                  {/* Action 1: "This Answered My Doubt" */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-dc-border/40">
                    {answeredDoubtId === match.id ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <span>✓</span>
                        <span>{t('common.success')}! Resolved.</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAnsweredClick(match.id)}
                        disabled={feedbackSending}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                      >
                        <span>💡</span>
                        <span>{t('detail.acceptedBadge')}</span>
                      </button>
                    )}

                    <Link
                      to={match.discussionUrl}
                      className="text-xs text-dc-blue hover:underline"
                    >
                      {t('search.viewDiscussion')} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Action 2: "None of These Help — Post My Doubt" */}
            <div className="pt-2 flex items-center justify-between border-t border-dc-blue/20">
              <p className="text-xs text-dc-subtext">
                {t('doubts.searchBeforePostNotice')}
              </p>
              <button
                type="button"
                onClick={handleNoneHelpedClick}
                className="inline-flex items-center gap-2 rounded-lg bg-dc-blue px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-dc-blue/90 shadow transition-colors"
              >
                <span>{t('doubts.askButton')}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Results area */}
        <div className="dc-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-dc-text">
              {hasQuery ? `${t('search.resultsCount')}: ${results.length}` : t('search.title')}
            </h2>
            <Link to="/doubts/new" className="dc-btn-primary text-sm">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t('doubts.askButton')}
            </Link>
          </div>

          {error && <ErrorState message={error} />}

          {loading && (
            <div className="py-8 text-center text-xs text-dc-subtext flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin text-dc-blue" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{t('search.searching')}</span>
            </div>
          )}

          {!hasQuery && !error && !loading && (
            <EmptyState
              title={t('search.title')}
              description={t('search.subtitle')}
            />
          )}

          {hasQuery && !loading && !smartLoading && !error && results.length === 0 && smartMatches.length === 0 && (
            <EmptyState
              title={t('search.noResults')}
              description={t('doubts.searchBeforePostNotice')}
              action={
                <Link
                  to={`/doubts/new?title=${encodeURIComponent(query)}&subjectId=${subjectId}`}
                  className="dc-btn-primary text-sm"
                >
                  {t('doubts.askButton')}
                </Link>
              }
            />
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {results.map(d => (
                <Link
                  key={d.id}
                  to={`/doubts/${d.id}`}
                  className="group block rounded-xl border border-dc-border bg-dc-card/60 p-4 transition-all hover:border-dc-blue/50 hover:bg-dc-card hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {d.subject && (
                          <span className="rounded bg-dc-border/80 px-2 py-0.5 text-[10px] font-semibold text-dc-subtext">
                            {d.subject.code || d.subject.name}
                          </span>
                        )}
                        <StatusBadge status={d.isResolved ? 'resolved' : 'unresolved'} />
                        {d.matchType === 'hybrid' && (
                          <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                            Hybrid Match ✨
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-dc-text group-hover:text-dc-blue transition-colors">
                        {d.title}
                      </h3>

                      {/* Description Context Snippet */}
                      <p className="text-xs text-dc-subtext line-clamp-2">
                        {d.contentSnippet || d.content.slice(0, 160)}
                      </p>

                      {/* Verified Human Solution Snippet */}
                      {d.acceptedAnswerSnippet && (
                        <div className="mt-2 rounded bg-emerald-500/5 border-l-2 border-emerald-400 p-2 text-xs text-slate-300">
                          <span className="font-semibold text-emerald-400 not-italic">
                            ✓ Verified Solution (Human):{' '}
                          </span>
                          <span className="italic">"{d.acceptedAnswerSnippet}"</span>
                        </div>
                      )}

                      {/* AI FAQ Summary Snippet */}
                      {d.faqSnippet && (
                        <div className="mt-1.5 rounded bg-blue-500/5 border-l-2 border-blue-400 p-2 text-xs text-slate-300">
                          <span className="font-semibold text-blue-400 not-italic">
                            ✦ AI FAQ Summary:{' '}
                          </span>
                          <span>"{d.faqSnippet}"</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {typeof d.relevanceScore === 'number' && d.relevanceScore > 0 && (
                        <span className="inline-block rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-300">
                          {Math.round(d.relevanceScore * 100)}% Match
                        </span>
                      )}
                      <p className="mt-1 text-[11px] text-dc-subtext">
                        {d._count?.answers ?? 0} {t('detail.replies')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
