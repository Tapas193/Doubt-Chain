import StatusBadge from './StatusBadge'

type DoubtCardProps = {
  title: string
  excerpt?: string
  subject?: string
  status?: 'resolved' | 'unresolved'
  meta?: string
  author?: string
}

export default function DoubtCard({ title, excerpt, subject, status = 'unresolved', meta, author }: DoubtCardProps) {
  return (
    <article className="group dc-card p-5 transition-all duration-150 hover:border-dc-blue/40 hover:-translate-y-px">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Subject + Status row */}
          <div className="flex flex-wrap items-center gap-2">
            {subject && (
              <span className="rounded-full border border-dc-border px-2 py-0.5 text-xs text-dc-subtext">
                {subject}
              </span>
            )}
            <StatusBadge status={status} />
          </div>

          <h3 className="truncate text-base font-semibold text-dc-text group-hover:text-white transition-colors">
            {title}
          </h3>

          {excerpt && (
            <p className="line-clamp-2 text-sm leading-relaxed text-dc-subtext">{excerpt}</p>
          )}
        </div>

        {/* Arrow icon */}
        <span className="mt-1 shrink-0 text-dc-muted transition-colors group-hover:text-dc-blue">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>

      {/* Footer */}
      {(meta || author) && (
        <div className="mt-4 flex items-center justify-between border-t border-dc-border pt-3">
          {meta && <span className="text-xs text-dc-subtext">{meta}</span>}
          {author && <span className="text-xs text-dc-subtext">by {author}</span>}
        </div>
      )}
    </article>
  )
}
