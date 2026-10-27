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
  const [editingDoubt, setEditingDoubt] = useState(false)
  const [doubtDraft, setDoubtDraft] = useState({ title: '', content: '' })
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [answerDraft, setAnswerDraft] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [d, a] = await Promise.all([doubtService.getDoubt(id), doubtService.listAnswers(id)])
      setDoubt(d)
      setAnswers(a)
      setDoubtDraft({ title: d.title, content: d.content })
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

  const accept = async (answerId: string) => {
    if (!id) return
    setActionId(`accept-${answerId}`)
    setAnswerError(null)
    try {
      const updated = await doubtService.acceptAnswer(id, answerId)
      setDoubt(updated)
    } catch (err: any) {
      setAnswerError(err.message)
    } finally {
      setActionId(null)
    }
  }

  const reopen = async () => {
    if (!id) return
    setActionId('reopen')
    setAnswerError(null)
    try {
      const updated = await doubtService.reopenDoubt(id)
      setDoubt(updated)
    } catch (err: any) {
      setAnswerError(err.message)
    } finally {
      setActionId(null)
    }
  }

  const saveDoubt = async () => {
    if (!id || !doubtDraft.title.trim() || !doubtDraft.content.trim()) return
    setActionId('edit-doubt')
    setAnswerError(null)
    try {
      const updated = await doubtService.updateDoubt(id, {
        title: doubtDraft.title.trim(),
        content: doubtDraft.content.trim()
      })
      setDoubt(updated)
      setEditingDoubt(false)
    } catch (err: any) {
      setAnswerError(err.message)
    } finally {
      setActionId(null)
    }
  }

  const saveAnswer = async (answerId: string) => {
    if (!answerDraft.trim()) return
    setActionId(`edit-answer-${answerId}`)
    setAnswerError(null)
    try {
      const updated = await doubtService.updateAnswer(answerId, { content: answerDraft.trim() })
      setAnswers(prev => prev.map(answer => answer.id === answerId ? updated : answer))
      setEditingAnswerId(null)
      setAnswerDraft('')
    } catch (err: any) {
      setAnswerError(err.message)
    } finally {
      setActionId(null)
    }
  }

  const deleteAnswer = async (answerId: string) => {
    setActionId(`delete-${answerId}`)
    setAnswerError(null)
    try {
      await doubtService.deleteAnswer(answerId)
      setPendingDeleteId(null)
      await load()
    } catch (err: any) {
      setAnswerError(err.message)
    } finally {
      setActionId(null)
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

              {editingDoubt ? (
                <div className="space-y-3">
                  <label htmlFor="edit-doubt-title" className="dc-label">Title</label>
                  <input id="edit-doubt-title" value={doubtDraft.title} onChange={e => setDoubtDraft(draft => ({ ...draft, title: e.target.value }))} className="dc-input" />
                  <label htmlFor="edit-doubt-content" className="dc-label">Details</label>
                  <textarea id="edit-doubt-content" rows={6} value={doubtDraft.content} onChange={e => setDoubtDraft(draft => ({ ...draft, content: e.target.value }))} className="dc-input resize-none" />
                  <div className="flex justify-end gap-2">
                    <button type="button" className="dc-btn-secondary text-xs" onClick={() => { setEditingDoubt(false); setDoubtDraft({ title: doubt.title, content: doubt.content }) }}>Cancel</button>
                    <button type="button" className="dc-btn-primary text-xs" disabled={actionId === 'edit-doubt'} onClick={saveDoubt}>{actionId === 'edit-doubt' ? 'Saving…' : 'Save changes'}</button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-dc-text leading-snug">{doubt.title}</h1>
                  <p className="text-sm leading-relaxed text-dc-subtext whitespace-pre-wrap">{doubt.content}</p>
                </>
              )}

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-dc-border pt-4">
                <div className="text-xs text-dc-subtext">
                  Posted by{' '}
                  <span className="font-medium text-dc-text">{doubt.author?.displayName ?? 'User'}</span>
                  {' · '}{formatDate(doubt.createdAt)}
                </div>
                {isOwner && !editingDoubt && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setEditingDoubt(true)} className="dc-btn-secondary text-xs">Edit doubt</button>
                    {doubt.isResolved && <button type="button" onClick={reopen} disabled={actionId === 'reopen'} className="dc-btn-secondary text-xs">{actionId === 'reopen' ? 'Reopening…' : 'Reopen doubt'}</button>}
                  </div>
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
                  const isAnswerOwner = user?.id === a.authorId
                  const isAccepted = doubt.acceptedAnswerId === a.id
                  const isEditing = editingAnswerId === a.id
                  return (
                    <article key={a.id} className={`dc-card p-5 space-y-3 ${isAccepted ? 'border-emerald-400/50 ring-1 ring-emerald-400/20' : ''}`}>
                      <div className="flex items-center justify-between gap-3">
                        {isAccepted ? (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">Accepted answer</span>
                        ) : <span />}
                        {isOwner && !doubt.isResolved && (
                          <button type="button" onClick={() => accept(a.id)} disabled={actionId === `accept-${a.id}`} className="text-xs font-medium text-emerald-300 hover:text-emerald-200 disabled:opacity-50">
                            {actionId === `accept-${a.id}` ? 'Accepting…' : 'Accept as solution'}
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea value={answerDraft} onChange={e => setAnswerDraft(e.target.value)} rows={5} aria-label="Edit answer" className="dc-input resize-none" />
                          <div className="flex justify-end gap-2">
                            <button type="button" className="dc-btn-secondary text-xs" onClick={() => setEditingAnswerId(null)}>Cancel</button>
                            <button type="button" className="dc-btn-primary text-xs" disabled={actionId === `edit-answer-${a.id}`} onClick={() => saveAnswer(a.id)}>{actionId === `edit-answer-${a.id}` ? 'Saving…' : 'Save'}</button>
                          </div>
                        </div>
                      ) : <p className="text-sm leading-relaxed whitespace-pre-wrap text-dc-text">{a.content}</p>}

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
                        {isAnswerOwner && !isEditing && (
                          <button type="button" onClick={() => { setEditingAnswerId(a.id); setAnswerDraft(a.content) }} className="hover:text-dc-blue">Edit</button>
                        )}
                        {isAnswerOwner && !isEditing && (
                          <button type="button" onClick={() => setPendingDeleteId(a.id)} className="text-rose-300 hover:text-rose-200">Delete</button>
                        )}
                      </footer>

                      {pendingDeleteId === a.id && (
                        <div role="alertdialog" aria-label="Confirm answer deletion" className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                          <p>Delete this answer? It will no longer be shown. If it is accepted, the doubt will reopen.</p>
                          <div className="mt-3 flex justify-end gap-2">
                            <button type="button" className="dc-btn-secondary text-xs" onClick={() => setPendingDeleteId(null)}>Cancel</button>
                            <button type="button" className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" disabled={actionId === `delete-${a.id}`} onClick={() => deleteAnswer(a.id)}>{actionId === `delete-${a.id}` ? 'Deleting…' : 'Delete answer'}</button>
                          </div>
                        </div>
                      )}
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
              {user && !doubt.isResolved ? (
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
              ) : doubt.isResolved ? (
                <p className="text-sm text-dc-subtext">This doubt is resolved. The owner can reopen it if another answer is needed.</p>
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
