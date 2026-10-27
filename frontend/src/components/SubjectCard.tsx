type SubjectCardProps = {
  name: string
  code?: string
  description?: string
}

const SUBJECT_COLORS = [
  'from-blue-500/10 border-blue-500/20',
  'from-violet-500/10 border-violet-500/20',
  'from-emerald-500/10 border-emerald-500/20',
  'from-amber-500/10 border-amber-500/20',
  'from-rose-500/10 border-rose-500/20',
  'from-cyan-500/10 border-cyan-500/20',
]

export default function SubjectCard({ name, code, description }: SubjectCardProps) {
  // Deterministic color from name
  const idx = name.charCodeAt(0) % SUBJECT_COLORS.length
  const colorClass = SUBJECT_COLORS[idx]

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorClass} to-transparent p-5 shadow-dc-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-dc-text">{name}</h3>
          {code && (
            <span className="shrink-0 rounded border border-dc-border bg-dc-bg2/80 px-1.5 py-0.5 text-xs font-mono text-dc-subtext">
              {code}
            </span>
          )}
        </div>
        {description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-dc-subtext">{description}</p>
        )}
      </div>
    </article>
  )
}
