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
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function DoubtDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [doubt, setDoubt] = useState<Doubt | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Primary answer form
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answerError, setAnswerError] = useState<string | null>(null)

  // Reply state (Feature 3: Nested replies)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)

  // Upvote pending indicator (Feature 5)
  const [upvoteLoadingId, setUpvoteLoadingId] = useState<string | null>(null)

  // Editing state
  const [editingDoubt, setEditingDoubt] = useState(false)
  const [doubtDraft, setDoubtDraft] = useState({ title: '', content: '' })
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [answerDraft, setAnswerDraft] = useState('')

  // Action / deletion states
  const [actionId, setActionId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [d, a] = await Promise.all([
        doubtService.getDoubt(id),
        doubtService.listAnswers(id)
      ])
      setDoubt(d)
      setAnswers(a)
      setDoubtDraft({ title: d.title, content: d.content })
    } catch (err: any) {
      setError(err.message || 'Failed to load doubt details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  // Submit top-level answer
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
      setAnswerError(err.message || 'Failed to post answer')
    } finally {
      setSubmitting(false)
    }
  }

  // Feature 3: Submit nested reply
  const submitReply = async (parentAnswerId: string) => {
    if (!id || !replyContent.trim()) return
    setReplySubmitting(true)
    setAnswerError(null)
    try {
      await doubtService.createAnswer(id, {
        content: replyContent.trim(),
        parentAnswerId
      })
      setReplyContent('')
      setReplyingToId(null)
      // Reload answers to preserve proper reply hierarchy and ordering
      const refreshed = await doubtService.listAnswers(id)
      setAnswers(refreshed)
    } catch (err: any) {
      setAnswerError(err.message || 'Failed to post reply')
    } finally {
      setReplySubmitting(false)
    }
  }

  // Feature 5: Toggle upvote (1 vote per user)
  const handleVoteToggle = async (answerId: string, currentVoted: boolean) => {
    if (!user) {
      setAnswerError('Please sign in to upvote answers.')
      return
    }
    setUpvoteLoadingId(answerId)
    setAnswerError(null)
    try {
      if (currentVoted) {
        await doubtService.removeUpvote(answerId)
      } else {
        await doubtService.upvoteAnswer(answerId)
      }
      // Re-fetch answers to ensure authoritative counts & deterministic sorting
      if (id) {
        const refreshed = await doubtService.listAnswers(id)
        setAnswers(refreshed)
      }
    } catch (err: any) {
      setAnswerError(err.message || 'Failed to update vote')
    } finally {
      setUpvoteLoadingId(null)
    }
  }

  // Feature 3: Accept as Best Answer
  const acceptBestAnswer = async (answerId: string) => {
    if (!id) return
    setActionId(`accept-${answerId}`)
    setAnswerError(null)
    try {
      const updated = await doubtService.acceptAnswer(id, answerId)
      setDoubt(updated)
      // Refresh answers so the accepted answer moves to top
      const refreshed = await doubtService.listAnswers(id)
      setAnswers(refreshed)
    } catch (err: any) {
      setAnswerError(err.message || 'Failed to mark as best answer')
    } finally {
      setActionId(null)
    }
  }

  // Reopen doubt
  const reopenDoubt = async () => {
    if (!id) return
    setActionId('reopen')
    setAnswerError(null)
    try {
      const updated = await doubtService.reopenDoubt(id)
      setDoubt(updated)
      const refreshed = await doubtService.listAnswers(id)
      setAnswers(refreshed)
    } catch (err: any) {
      setAnswerError(err.message || 'Failed to reopen doubt')
    } finally {
      setActionId(null)
    }
  }

  // Save edited doubt
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
      setAnswerError(err.message || 'Failed to update doubt')
    } finally {
      setActionId(null)
    }
  }

  // Save edited answer
  const saveAnswer = async (answerId: string) => {
    if (!answerDraft.trim()) return
    setActionId(`edit-answer-${answerId}`)
    setAnswerError(null)
    try {
      await doubtService.updateAnswer(answerId, { content: answerDraft.trim() })
      setEditingAnswerId(null)
      setAnswerDraft('')
      if (id) {
        const refreshed = await doubtService.listAnswers(id)
        setAnswers(refreshed)
      }
    } catch (err: any) {
      setAnswerError(err.message || 'Failed to update answer')
    } finally {
      setActionId(null)
    }
  }

  // Delete answer
  const deleteAnswer = async (answerId: string) => {
    setActionId(`delete-${answerId}`)
    setAnswerError(null)
    try {
      await doubtService.deleteAnswer(answerId)
      setPendingDeleteId(null)
      await load()
    } catch (err: any) {
      setAnswerError(err.message || 'Failed to delete answer')
    } finally {
      setActionId(null)
    }
  }

  const isOwner = Boolean(user && doubt && user.id === doubt.authorId)

  // Render individual answer or reply
  const renderAnswerItem = (ans: Answer, isReply = false) => {
    const isAccepted = Boolean(ans.isAccepted || doubt?.acceptedAnswerId === ans.id)
    const isAnswerOwner = Boolean(user?.id === ans.authorId)
    const isEditing = editingAnswerId === ans.id
    const upvotesCount = ans.voteSummary?.upvotes ?? ans._count?.upvotes ?? 0
    const hasVoted = Boolean(ans.isUpvotedByMe || ans.voteSummary?.viewerVote === 1)
    const isPendingVote = upvoteLoadingId === ans.id

    return (
      <article
        key={ans.id}
        className={`rounded-xl border p-5 transition-colors space-y-3 ${
          isAccepted
            ? 'border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/30'
            : isReply
              ? 'border-dc-border/80 bg-dc-bg2/40 ml-4 sm:ml-8'
              : 'border-dc-border bg-dc-card shadow-dc-card'
        }`}
      >
        {/* Answer Header: Best Answer badge & Accept Solution button */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isAccepted ? (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-300">
              <span>✓</span>
              <span>Best Answer / Accepted Solution</span>
            </div>
          ) : isOwner && !doubt?.isResolved && !isReply ? (
            <button
              type="button"
              onClick={() => acceptBestAnswer(ans.id)}
              disabled={actionId === `accept-${ans.id}`}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
            >
              {actionId === `accept-${ans.id}` ? 'Marking…' : '★ Mark as Best Answer'}
            </button>
          ) : <span />}

          <span className="text-[11px] text-dc-subtext">
            {formatDate(ans.createdAt)}
          </span>
        </div>

        {/* Content or Edit Form */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={answerDraft}
              onChange={e => setAnswerDraft(e.target.value)}
              rows={4}
              className="dc-input resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="dc-btn-secondary text-xs"
                onClick={() => setEditingAnswerId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dc-btn-primary text-xs"
                disabled={actionId === `edit-answer-${ans.id}`}
                onClick={() => saveAnswer(ans.id)}
              >
                {actionId === `edit-answer-${ans.id}` ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-dc-text">
            {ans.content}
          </p>
        )}

        {/* Footer controls: Author, Upvote, Reply, Edit, Delete */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-dc-border/60 pt-3 text-xs text-dc-subtext">
          <div className="flex items-center gap-2">
            <span className="font-medium text-dc-text">
              {ans.author?.displayName ?? 'Peer'}
            </span>
            <span className="text-dc-subtext">(@{ans.author?.username ?? 'user'})</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Feature 5 Upvoting: Shows ONLY upvote OR remove button, NEVER both! */}
            {user ? (
              <button
                type="button"
                onClick={() => handleVoteToggle(ans.id, hasVoted)}
                disabled={isPendingVote}
                aria-label={hasVoted ? `Remove upvote (${upvotesCount})` : `Upvote this answer (${upvotesCount})`}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                  hasVoted
                    ? 'border-dc-blue bg-dc-blue/20 text-dc-blue shadow-sm'
                    : 'border-dc-border bg-dc-bg2 text-dc-subtext hover:border-dc-blue/60 hover:text-dc-blue'
                } disabled:opacity-50`}
              >
                {isPendingVote ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill={hasVoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                )}
                <span>{hasVoted ? 'Upvoted' : 'Upvote'}</span>
                <span className="font-bold">{upvotesCount}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-dc-subtext">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
                {upvotesCount} upvotes
              </span>
            )}

            {/* Feature 3: Reply Action for top-level answers */}
            {!isReply && user && !doubt?.isResolved && (
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(replyingToId === ans.id ? null : ans.id)
                  setReplyContent('')
                }}
                className="text-dc-subtext hover:text-dc-text font-medium text-xs transition-colors"
              >
                {replyingToId === ans.id ? 'Cancel Reply' : '↳ Reply'}
              </button>
            )}

            {/* Author Actions */}
            {isAnswerOwner && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnswerId(ans.id)
                    setAnswerDraft(ans.content)
                  }}
                  className="hover:text-dc-blue"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(ans.id)}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </footer>

        {/* Delete Confirmation Alert */}
        {pendingDeleteId === ans.id && (
          <div role="alertdialog" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-100 space-y-2">
            <p>Delete this answer? If it is currently accepted as the best answer, the doubt will automatically reopen.</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="dc-btn-secondary text-xs" onClick={() => setPendingDeleteId(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={actionId === `delete-${ans.id}`}
                onClick={() => deleteAnswer(ans.id)}
                className="rounded bg-rose-600 px-3 py-1 font-medium text-white hover:bg-rose-500 text-xs"
              >
                {actionId === `delete-${ans.id}` ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Feature 3: Nested Inline Reply Box */}
        {replyingToId === ans.id && (
          <div className="mt-3 rounded-lg border border-dc-border bg-dc-bg p-3 space-y-2 animate-fade-in">
            <label htmlFor={`reply-input-${ans.id}`} className="text-xs font-medium text-dc-text">
              Reply to {ans.author?.displayName ?? 'answer'}:
            </label>
            <textarea
              id={`reply-input-${ans.id}`}
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Write a clear follow-up or reply…"
              rows={3}
              className="dc-input resize-none text-xs"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyingToId(null)}
                className="dc-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={replySubmitting || !replyContent.trim()}
                onClick={() => submitReply(ans.id)}
                className="dc-btn-primary text-xs"
              >
                {replySubmitting ? 'Posting…' : 'Post Reply'}
              </button>
            </div>
          </div>
        )}

        {/* Feature 3: Render nested replies under this answer */}
        {ans.replies && ans.replies.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-dc-subtext ml-4 sm:ml-8">
              Replies ({ans.replies.length}):
            </p>
            {ans.replies.map(r => renderAnswerItem(r, true))}
          </div>
        )}
      </article>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-dc-subtext">
          <Link to="/" className="hover:text-dc-text">Home</Link>
          <span>/</span>
          {doubt?.subject ? (
            <Link to={`/subjects/${doubt.subject.id}`} className="hover:text-dc-text">
              {doubt.subject.name}
            </Link>
          ) : (
            <Link to="/doubts" className="hover:text-dc-text">Doubts</Link>
          )}
          <span>/</span>
          <span className="text-dc-text font-medium truncate max-w-[200px]">
            {doubt?.title || 'Detail'}
          </span>
        </div>

        {loading && <LoadingState message="Loading doubt discussion…" />}
        {error && <ErrorState message={error} onRetry={load} />}

        {!loading && doubt && (
          <>
            {/* Question Card */}
            <article className="dc-card p-6 space-y-4 shadow-dc-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {doubt.subject && (
                    <Link
                      to={`/subjects/${doubt.subject.id}`}
                      className="rounded-full border border-dc-border bg-dc-bg2 px-2.5 py-0.5 text-xs text-dc-subtext hover:border-dc-blue"
                    >
                      {doubt.subject.name} ({doubt.subject.code})
                    </Link>
                  )}
                  <StatusBadge status={doubt.isResolved ? 'resolved' : 'unresolved'} />
                </div>
              </div>

              {editingDoubt ? (
                <div className="space-y-3">
                  <label htmlFor="edit-doubt-title" className="dc-label">Title</label>
                  <input
                    id="edit-doubt-title"
                    value={doubtDraft.title}
                    onChange={e => setDoubtDraft(d => ({ ...d, title: e.target.value }))}
                    className="dc-input"
                  />
                  <label htmlFor="edit-doubt-content" className="dc-label">Details</label>
                  <textarea
                    id="edit-doubt-content"
                    rows={6}
                    value={doubtDraft.content}
                    onChange={e => setDoubtDraft(d => ({ ...d, content: e.target.value }))}
                    className="dc-input resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="dc-btn-secondary text-xs"
                      onClick={() => setEditingDoubt(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="dc-btn-primary text-xs"
                      disabled={actionId === 'edit-doubt'}
                      onClick={saveDoubt}
                    >
                      {actionId === 'edit-doubt' ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-dc-text leading-snug">
                    {doubt.title}
                  </h1>
                  <p className="text-sm leading-relaxed text-dc-subtext whitespace-pre-wrap">
                    {doubt.content}
                  </p>
                </>
              )}

              {/* Feature 2: Display Image Attachments */}
              {doubt.attachments && doubt.attachments.filter(a => a.fileType === 'IMAGE').length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-dc-text">Attached Photos:</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {doubt.attachments
                      .filter(a => a.fileType === 'IMAGE')
                      .map((att, i) => (
                        <div key={i} className="rounded-lg border border-dc-border bg-dc-bg2/40 overflow-hidden shadow-sm">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block overflow-hidden"
                          >
                            <img
                              src={att.url}
                              alt={att.filename}
                              className="h-44 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1.5 text-[10px] text-white truncate flex items-center justify-between">
                              <span className="truncate">{att.filename}</span>
                              <span className="shrink-0 text-cyan-300 font-mono">↗ View</span>
                            </div>
                          </a>
                          {att.extractedText && (
                            <div className="p-3 border-t border-dc-border bg-dc-card/90 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                                  <span>🔍</span> Extracted OCR Text:
                                </span>
                                <span className="text-[10px] text-dc-subtext font-mono bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                  Searchable
                                </span>
                              </div>
                              <p className="text-[11px] text-dc-subtext font-mono whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto bg-dc-bg/80 p-2 rounded border border-dc-border/50">
                                {att.extractedText}
                              </p>
                            </div>
                          )}
                          {!att.extractedText && att.processingStatus === 'PROCESSING' && (
                            <div className="p-2 border-t border-dc-border text-[11px] text-cyan-400 flex items-center gap-1.5 bg-cyan-500/5">
                              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                              Extracting text via OCR...
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Legacy fallback image */}
              {!doubt.attachments?.length && doubt.mediaUrl && doubt.mediaType === 'IMAGE' && (
                <div className="pt-2">
                  <img
                    src={doubt.mediaUrl}
                    alt="Attached reference"
                    className="max-h-72 rounded-lg border border-dc-border object-contain"
                  />
                </div>
              )}

              {/* Feature 2 & 3: Display Voice Note Audio Player & Transcription */}
              {doubt.attachments && doubt.attachments.filter(a => a.fileType === 'AUDIO').length > 0 && (
                <div className="space-y-3 rounded-xl border border-dc-border bg-dc-bg2/40 p-4">
                  <p className="text-xs font-semibold text-dc-text flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-dc-red" />
                    Recorded Voice Note:
                  </p>
                  {doubt.attachments
                    .filter(a => a.fileType === 'AUDIO')
                    .map((att, i) => (
                      <div key={i} className="space-y-2">
                        <audio controls src={att.url} className="w-full h-9" />
                        {att.extractedText ? (
                          <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                              <span className="flex items-center gap-1.5">
                                <span>🎙️</span> AI Voice Transcription:
                              </span>
                              <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-mono text-purple-200 border border-purple-500/30">
                                Searchable
                              </span>
                            </div>
                            <p className="text-xs italic text-dc-text/90 leading-relaxed whitespace-pre-wrap">
                              "{att.extractedText}"
                            </p>
                          </div>
                        ) : att.processingStatus === 'PROCESSING' ? (
                          <div className="text-[11px] text-purple-300 italic flex items-center gap-1.5 pt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                            Transcribing voice note with AI speech-to-text...
                          </div>
                        ) : null}
                      </div>
                    ))}
                </div>
              )}

              {/* Legacy fallback audio */}
              {!doubt.attachments?.length && doubt.mediaUrl && doubt.mediaType === 'AUDIO' && (
                <div className="rounded-xl border border-dc-border bg-dc-bg2/40 p-4 space-y-1">
                  <p className="text-xs font-semibold text-dc-text">Recorded Voice Note:</p>
                  <audio controls src={doubt.mediaUrl} className="w-full h-9" />
                </div>
              )}

              {/* Question Footer */}
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-dc-border pt-4">
                <div className="text-xs text-dc-subtext">
                  Asked by{' '}
                  <span className="font-medium text-dc-text">
                    {doubt.author?.displayName ?? 'Student'}
                  </span>
                  {' · '}{formatDate(doubt.createdAt)}
                </div>

                {isOwner && !editingDoubt && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingDoubt(true)}
                      className="dc-btn-secondary text-xs"
                    >
                      Edit Doubt
                    </button>
                    {doubt.isResolved && (
                      <button
                        type="button"
                        onClick={reopenDoubt}
                        disabled={actionId === 'reopen'}
                        className="dc-btn-secondary text-xs"
                      >
                        {actionId === 'reopen' ? 'Reopening…' : 'Reopen Doubt'}
                      </button>
                    )}
                  </div>
                )}
              </footer>
            </article>

            {/* AI-Verified Knowledge Summary (Feature 4) */}
            {doubt.aiQuestion && doubt.aiAnswer && (
              <aside
                aria-label="AI-verified knowledge summary"
                className="rounded-xl border border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 space-y-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <span>✨</span>
                      <span>AI-Verified Knowledge Summary</span>
                    </span>
                    <span className="text-[11px] text-dc-subtext">Synthesized from Accepted Solution</span>
                  </div>
                  {doubt.aiGeneratedAt && (
                    <span className="text-[11px] text-dc-subtext font-mono">
                      Generated {formatDate(doubt.aiGeneratedAt)}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-dc-subtext uppercase tracking-wider">
                    Synthesized Q&A
                  </p>
                  <h3 className="text-sm font-bold text-dc-text">{doubt.aiQuestion}</h3>
                  <p className="text-xs leading-relaxed text-dc-text/90 whitespace-pre-wrap bg-dc-bg/60 rounded-lg p-3 border border-dc-border/60">
                    {doubt.aiAnswer}
                  </p>
                </div>

                {doubt.aiTags && doubt.aiTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-dc-subtext">Tags:</span>
                    {doubt.aiTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-mono text-indigo-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </aside>
            )}

            {/* Error notifications */}
            {answerError && (
              <ErrorState message={answerError} onRetry={() => setAnswerError(null)} />
            )}

            {/* Answers List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-dc-text">
                  Answers ({answers.length})
                </h2>
                {doubt.isResolved && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                    Resolved by accepted answer
                  </span>
                )}
              </div>

              {answers.length === 0 ? (
                <div className="dc-card px-5 py-10 text-center text-sm text-dc-subtext shadow-dc-card">
                  No answers yet. Be the first to help your peer!
                </div>
              ) : (
                <div className="space-y-4">
                  {answers.map(ans => renderAnswerItem(ans))}
                </div>
              )}
            </section>

            {/* Post Answer Form */}
            <section className="dc-card p-6 shadow-dc-card">
              <h3 className="mb-3 text-sm font-semibold text-dc-text">Post Your Answer</h3>
              {user && !doubt.isResolved ? (
                <form onSubmit={submitAnswer} className="space-y-3">
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                    rows={5}
                    placeholder="Provide a clear, detailed, step-by-step solution or explanation…"
                    className="dc-input resize-none"
                    aria-label="Your answer"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !content.trim()}
                      className="dc-btn-primary"
                    >
                      {submitting ? 'Posting Answer…' : 'Submit Answer'}
                    </button>
                  </div>
                </form>
              ) : doubt.isResolved ? (
                <p className="text-xs text-dc-subtext">
                  This doubt has been marked as resolved with an accepted answer. The author can reopen it if further questions arise.
                </p>
              ) : (
                <p className="text-xs text-dc-subtext">
                  Please{' '}
                  <Link to="/login" className="text-dc-blue hover:underline">
                    sign in
                  </Link>{' '}
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
