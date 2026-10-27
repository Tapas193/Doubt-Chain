type AnswerCardProps = {
  content: string
  author?: string
  date?: string
  upvotes?: number
}

export default function AnswerCard({ content, author, date, upvotes }: AnswerCardProps) {
  return (
    <article className="dc-card p-5 space-y-3">
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-dc-text">{content}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dc-border pt-3 text-xs text-dc-subtext">
        <span>
          <span className="font-medium text-dc-text">{author ?? 'Peer'}</span>
          {date && <span> · {date}</span>}
        </span>
        {typeof upvotes === 'number' && (
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
            {upvotes}
          </span>
        )}
      </div>
    </article>
  )
}
