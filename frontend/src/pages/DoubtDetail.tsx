import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import StatusBadge from '../components/StatusBadge'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { doubtService } from '../services/doubtService'
import { Doubt, Answer } from '../types/api'
import { useAuth } from '../context/AuthContext'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DoubtDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [doubt, setDoubt] = useState<Doubt | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [upvoteLoading, setUpvoteLoading] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [d, a] = await Promise.all([doubtService.getDoubt(id), doubtService.listAnswers(id)])
      setDoubt(d)
      setAnswers(a)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !content.trim()) return
    setSubmitting(true)
    setAnswerError(null)
    try {
      const ans = await doubtService.createAnswer(id, { content: content.trim() })
      setAnswers(prev => [...prev, ans])
      setContent('')
    } catch (err: any) {
      setAnswerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpvote = async (answerId: string, hasUpvoted: boolean) => {
    setUpvoteLoading(answerId)
    try {
      const updated = hasUpvoted
        ? await doubtService.removeUpvote(answerId)
        : await doubtService.upvoteAnswer(answerId)
      setAnswers(prev => prev.map(a => a.id === answerId ? updated : a))
    } catch (err: any) {
      // Surface upvote error inline (non-fatal)
      setAnswerError(err.message)
    } finally {
      setUpvoteLoading(null)
    }
  }

  const resolve = async () => {
    if (!id) return
    setError(null)
    try {
      const updated = await doubtService.resolveDoubt(id)
      setDoubt(updated)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const isOwner = user && doubt && user.id === doubt.authorId

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        {/* Back */}
        <Link
          to="/doubts"
          className="inline-flex items-center gap-1.5 text-sm text-dc-subtext hover:text-dc-text transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Discussions
        </Link>

        {loading && <LoadingState message="Loading doubt…" />}
        {error && <ErrorState message={error} onRetry={load} />}

        {!loading && doubt && (
          <>
            {/* Question card */}
            <article className="dc-card p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {doubt.subject && (
                  <span className="rounded-full border border-dc-border px-2.5 py-0.5 text-xs text-dc-subtext">
                    {doubt.subject.name}
                  </span>
                )}
                <StatusBadge status={doubt.isResolved ? 'resolved' : 'unresolved'} />
              </div>

              <h1 className="text-xl font-bold text-dc-text leading-snug">{doubt.title}</h1>
              <p className="text-sm leading-relaxed text-dc-subtext whitespace-pre-wrap">{doubt.content}</p>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-dc-border pt-4">
                <div className="text-xs text-dc-subtext">
                  Posted by{' '}
                  <span className="font-medium text-dc-text">{doubt.author?.displayName ?? 'User'}</span>
                  {' · '}{formatDate(doubt.createdAt)}
                </div>
                {isOwner && !doubt.isResolved && (
                  <button
                    onClick={resolve}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Mark as Resolved
                  </button>
                )}
              </footer>
            </article>

            {/* Answers */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-dc-text">
                {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
              </h2>

              {answers.length === 0 && (
                <div className="dc-card px-5 py-10 text-center text-sm text-dc-subtext">
                  No answers yet. Be the first to help.
                </div>
              )}

              <div className="space-y-3">
                {answers.map(a => {
                  const upvotes = a._count?.upvotes ?? 0
                  const isLoadingThis = upvoteLoading === a.id
                  return (
                    <article key={a.id} className="dc-card p-5 space-y-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-dc-text">{a.content}</p>

                      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-dc-border pt-3 text-xs text-dc-subtext">
                        <span>
                          <span className="font-medium text-dc-text">{a.author?.displayName ?? 'Peer'}</span>
                          {' · '}{formatDate(a.createdAt)}
                        </span>

                        {/* Upvote control */}
                        {user ? (
                          <button
                            onClick={() => handleUpvote(a.id, false)}
                            disabled={isLoadingThis}
                            aria-label={`Upvote this answer (${upvotes})`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-dc-border px-2.5 py-1 text-xs transition-colors hover:border-dc-blue/50 hover:text-dc-blue disabled:opacity-50"
                          >
                            {isLoadingThis ? (
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                              </svg>
                            )}
                            {upvotes}
                          </button>
                        ) : (
                          <span className="text-xs text-dc-subtext">
                            <svg className="mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                            {upvotes}
                          </span>
                        )}
                      </footer>
                    </article>
                  )
                })}
              </div>
            </section>

            {/* Answer error */}
            {answerError && (
              <ErrorState message={answerError} onRetry={() => setAnswerError(null)} />
            )}

            {/* Post answer */}
            <section className="dc-card p-5">
              <h3 className="mb-4 text-sm font-semibold text-dc-text">Post an Answer</h3>
              {user ? (
                <form onSubmit={submitAnswer} className="space-y-3">
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                    rows={5}
                    placeholder="Write a clear, helpful answer…"
                    className="dc-input resize-none"
                    aria-label="Your answer"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !content.trim()}
                      className="dc-btn-primary"
                    >
                      {submitting ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Posting…
                        </>
                      ) : 'Post Answer'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-dc-subtext">
                  <Link to="/login" className="text-dc-blue hover:underline underline-offset-2">Sign in</Link>{' '}
                  to post an answer.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
