import { VoteSummary } from '../types/api'

type VoteButtonProps = {
  summary?: VoteSummary
  disabled?: boolean
  onVote: (value: 1 | -1) => void
}

export default function VoteButton({ summary, disabled = false, onVote }: VoteButtonProps) {
  const votes = summary ?? { upvotes: 0, downvotes: 0, viewerVote: 0 }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-dc-border p-0.5" aria-label="Answer votes">
      <button
        type="button"
        disabled={disabled}
        aria-label={`Upvote this answer (${votes.upvotes})`}
        aria-pressed={votes.viewerVote === 1}
        onClick={() => onVote(1)}
        className={`rounded px-2 py-1 transition disabled:opacity-50 ${votes.viewerVote === 1 ? 'bg-dc-blue/20 text-dc-blue' : 'hover:text-dc-blue'}`}
      >
        ▲ {votes.upvotes}
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Downvote this answer (${votes.downvotes})`}
        aria-pressed={votes.viewerVote === -1}
        onClick={() => onVote(-1)}
        className={`rounded px-2 py-1 transition disabled:opacity-50 ${votes.viewerVote === -1 ? 'bg-rose-500/15 text-rose-300' : 'hover:text-rose-300'}`}
      >
        ▼ {votes.downvotes}
      </button>
    </div>
  )
}
