import { FormEvent, useCallback, useEffect, useState } from 'react'
import { AnswerComment, User } from '../types/api'
import { doubtService } from '../services/doubtService'
import ErrorState from './ErrorState'

type CommentThreadProps = {
  answerId: string
  user: User | null
}

export default function CommentThread({ answerId, user }: CommentThreadProps) {
  const [comments, setComments] = useState<AnswerComment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setComments(await doubtService.listComments(answerId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load comments.')
    } finally {
      setLoading(false)
    }
  }, [answerId])

  useEffect(() => { void load() }, [load])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const comment = await doubtService.createComment(answerId, content.trim())
      setComments(previous => [...previous, comment])
      setContent('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to post your comment.')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (commentId: string) => {
    setError(null)
    try {
      await doubtService.deleteComment(answerId, commentId)
      setComments(previous => previous.filter(comment => comment.id !== commentId))
      setPendingDeleteId(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to delete this comment.')
    }
  }

  return (
    <section className="border-t border-dc-border pt-3" aria-label="Comments">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-dc-subtext">Comments</h3>
      {loading ? <p className="mt-2 text-xs text-dc-subtext">Loading comments…</p> : null}
      {error ? <div className="mt-2"><ErrorState message={error} onRetry={() => void load()} /></div> : null}
      {!loading && !error && comments.length === 0 ? <p className="mt-2 text-xs text-dc-subtext">No comments yet.</p> : null}

      <ul className="mt-2 space-y-2">
        {comments.map(comment => (
          <li key={comment.id} className="rounded-lg border border-dc-border bg-dc-bg2/30 px-3 py-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap text-dc-text"><span className="font-medium">{comment.author?.displayName ?? 'Peer'}</span>{' · '}{comment.content}</p>
              {user?.id === comment.authorId && <button type="button" className="shrink-0 text-rose-300 hover:text-rose-200" onClick={() => setPendingDeleteId(comment.id)}>Delete</button>}
            </div>
            {pendingDeleteId === comment.id && <div role="alertdialog" aria-label="Confirm comment deletion" className="mt-2 flex items-center justify-between gap-2 rounded bg-rose-500/10 px-2 py-1.5 text-rose-100"><span>Delete this comment?</span><span className="flex gap-2"><button type="button" onClick={() => setPendingDeleteId(null)}>Cancel</button><button type="button" className="font-medium" onClick={() => void remove(comment.id)}>Delete</button></span></div>}
          </li>
        ))}
      </ul>

      {user ? (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor={`comment-${answerId}`}>Add a comment</label>
          <input id={`comment-${answerId}`} value={content} onChange={event => setContent(event.target.value)} maxLength={2000} placeholder="Add a comment…" className="dc-input min-w-0 flex-1 py-2 text-xs" />
          <button type="submit" disabled={submitting || !content.trim()} className="dc-btn-secondary shrink-0 text-xs">{submitting ? 'Posting…' : 'Comment'}</button>
        </form>
      ) : <p className="mt-3 text-xs text-dc-subtext">Sign in to join the discussion.</p>}
    </section>
  )
}
