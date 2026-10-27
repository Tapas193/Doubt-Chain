import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { doubtService } from '../services/doubtService'
import { Doubt, Subject } from '../types/api'
import { useLanguage } from '../i18n/LanguageContext'
import ContentTranslationControl from '../components/ContentTranslationControl'

function formatDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export default function FAQ() {
  const { t } = useLanguage()
  const [items, setItems] = useState<Doubt[]>([])

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [q, setQ] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    doubtService.listSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  const load = () => {
    setLoading(true)
    setError(null)
    doubtService
      .listFaq({
        subjectId: subjectId || undefined,
        q: q.trim() || undefined,
        sortBy,
        page,
        limit: 12
      })
      .then(res => {
        setItems(res.items)
        setTotalPages(res.totalPages || 1)
        setTotalCount(res.total || 0)
      })
      .catch(err => setError(err.message || 'Failed to load FAQ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(() => {
      load()
    }, 250)
    return () => clearTimeout(t)
  }, [subjectId, q, sortBy, page])

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              {t('faq.verifiedSolutions')}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-dc-text">
            {t('faq.title')}
          </h1>
          <p className="mt-1 text-sm text-dc-subtext">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* Search, Filter, and Sort Toolbar */}
        <div className="dc-card flex flex-wrap items-center gap-3 p-4 shadow-dc-card">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
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
              value={q}
              onChange={e => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder={t('faq.searchPlaceholder')}
              aria-label={t('faq.searchPlaceholder')}
              className="dc-input pl-9 text-xs"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dc-subtext hover:text-dc-text"
              >
                ✕
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <select
            value={subjectId}
            onChange={e => {
              setSubjectId(e.target.value)
              setPage(1)
            }}
            aria-label={t('doubts.subjectLabel')}
            className="dc-input w-auto flex-none text-xs"
          >
            <option value="">{t('common.all')} ({t('nav.subjects')})</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value as 'recent' | 'popular')
              setPage(1)
            }}
            aria-label="Sort FAQ"
            className="dc-input w-auto flex-none text-xs"
          >
            <option value="recent">{t('doubts.sortByNewest')}</option>
            <option value="popular">{t('doubts.sortByUpvotes')}</option>
          </select>
        </div>


        {/* Counter */}
        {!loading && (
          <div className="flex items-center justify-between text-xs text-dc-subtext">
            <span>
              Showing <strong className="text-dc-text">{items.length}</strong> of{' '}
              <strong className="text-dc-text">{totalCount}</strong> verified FAQ solutions
            </span>
          </div>
        )}

        {/* Error */}
        {error && <ErrorState message={error} onRetry={load} />}

        {/* FAQ Cards */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={q.trim() || subjectId ? 'No matching FAQ records' : 'No resolved doubts yet'}
            description={
              q.trim() || subjectId
                ? 'Try searching with broader terms or clear your subject filter.'
                : 'When students accept solutions to their doubts, they automatically appear here as verified FAQs.'
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map(d => (
              <article
                key={d.id}
                className="dc-card overflow-hidden rounded-xl p-5 shadow-dc-card transition-all hover:border-dc-blue/50 space-y-4"
              >
                {/* Header: Title, Subject, Date */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {d.subject && (
                        <span className="rounded-full border border-dc-border bg-dc-bg2 px-2.5 py-0.5 text-[11px] font-mono text-dc-subtext">
                          {d.subject.code} · {d.subject.name}
                        </span>
                      )}
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        ✓ Verified Solution
                      </span>
                      {d.aiQuestion && (
                        <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 flex items-center gap-1">
                          <span>✨</span> AI Verified FAQ
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/doubts/${d.id}`}
                      className="text-base font-bold text-dc-text hover:text-dc-blue transition-colors leading-snug line-clamp-2"
                    >
                      {d.title}
                    </Link>
                  </div>

                  <span className="text-xs text-dc-subtext shrink-0">
                    Resolved {formatDate(d.resolvedAt || d.updatedAt)}
                  </span>
                </div>

                {/* AI Synthesized Q&A Entry (Feature 4) */}
                {d.aiQuestion && d.aiAnswer ? (
                  <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                        <span>✨</span> {t('faq.aiGeneratedNotice')}:
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-dc-text">
                        {d.aiQuestion}
                      </p>
                      <p className="text-xs leading-relaxed text-dc-subtext line-clamp-3">
                        {d.aiAnswer}
                      </p>
                      <ContentTranslationControl
                        originalText={`${d.aiQuestion}\n\n${d.aiAnswer}`}
                        label={t('faq.translateFaq')}
                      />
                    </div>
                    {d.aiTags && d.aiTags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {d.aiTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Question summary snippet fallback */
                  <p className="text-xs text-dc-subtext line-clamp-2 leading-relaxed">
                    {d.content}
                  </p>
                )}

                {/* Accepted Best Answer Preview Card */}
                {d.acceptedAnswer && (
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('detail.acceptedSolution')}:
                      </span>
                      {d.acceptedAnswer.author && (
                        <span className="text-dc-subtext text-[11px]">
                          By {d.acceptedAnswer.author.displayName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-dc-text line-clamp-3 whitespace-pre-wrap">
                      {d.acceptedAnswer.content}
                    </p>
                    <ContentTranslationControl
                      originalText={d.acceptedAnswer.content}
                      label={t('detail.translateAnswer')}
                    />
                  </div>
                )}

                {/* Card Footer */}
                <div className="flex items-center justify-between border-t border-dc-border/60 pt-3 text-xs text-dc-subtext">
                  <span>
                    {t('detail.askedBy')} <strong className="text-dc-text">{d.author?.displayName ?? 'Student'}</strong>
                  </span>
                  <Link
                    to={`/doubts/${d.id}`}
                    className="font-medium text-dc-blue hover:underline underline-offset-2"
                  >
                    {t('faq.readFullDiscussion')} →
                  </Link>
                </div>

              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="dc-btn-secondary text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 text-xs text-dc-subtext">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="dc-btn-secondary text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
