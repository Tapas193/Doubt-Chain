import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

type SubjectCardProps = {
  id?: string
  name: string
  code?: string
  description?: string
  doubtsCount?: number
  membersCount?: number
  isMember?: boolean
  onJoinClick?: () => void
}

const SUBJECT_COLORS = [
  'from-blue-500/10 border-blue-500/20 text-blue-400',
  'from-violet-500/10 border-violet-500/20 text-violet-400',
  'from-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'from-amber-500/10 border-amber-500/20 text-amber-400',
  'from-rose-500/10 border-rose-500/20 text-rose-400',
  'from-cyan-500/10 border-cyan-500/20 text-cyan-400'
]

export default function SubjectCard({
  id,
  name,
  code,
  description,
  doubtsCount,
  membersCount,
  isMember
}: SubjectCardProps) {
  const { t } = useLanguage()
  const idx = name.charCodeAt(0) % SUBJECT_COLORS.length
  const colorClass = SUBJECT_COLORS[idx]

  const content = (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-gradient-to-br ${colorClass} to-transparent p-5 shadow-dc-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-dc-text group-hover:text-white">
              {name}
            </h3>
            {code && (
              <span className="mt-1 inline-block rounded border border-dc-border bg-dc-bg2/80 px-1.5 py-0.5 font-mono text-xs text-dc-subtext">
                {code}
              </span>
            )}
          </div>
          {isMember && (
            <span className="shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
              {t('subjects.joinedBadge')}
            </span>
          )}
        </div>
        {description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-dc-subtext">{description}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-dc-border/60 pt-3 text-xs text-dc-subtext">
        <div className="flex items-center gap-3">
          {typeof doubtsCount === 'number' && (
            <span>
              <strong className="text-dc-text">{doubtsCount}</strong> {doubtsCount === 1 ? 'doubt' : 'doubts'}
            </span>
          )}
          {typeof membersCount === 'number' && (
            <span>
              <strong className="text-dc-text">{membersCount}</strong> {membersCount === 1 ? 'member' : 'members'}
            </span>
          )}
        </div>
        <span className="font-medium text-dc-blue group-hover:underline underline-offset-2">
          {t('common.search')} →
        </span>
      </div>
    </article>
  )

  if (id) {
    return <Link to={`/subjects/${id}`} className="block">{content}</Link>
  }

  return content
}
