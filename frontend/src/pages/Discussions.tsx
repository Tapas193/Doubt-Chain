import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Sparkles, Plus } from 'lucide-react'
import AppShell from '../layouts/AppShell'
import DoubtCard from '../components/DoubtCard'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { doubtService } from '../services/doubtService'
import { Doubt, Subject } from '../types/api'
import { useLanguage } from '../i18n/LanguageContext'
import { useAuth } from '../context/AuthContext'

type DiscussionsProps = {
  mode?: 'explore' | 'mine' | 'saved' | 'requests'
}

export default function Discussions({ mode = 'explore' }: DiscussionsProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const queryParam = searchParams.get('q') || ''

  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState(searchParams.get('subject') || '')
  const [isResolved, setIsResolved] = useState<'' | 'true' | 'false'>(
    mode === 'requests' ? 'false' : (searchParams.get('status') as any) || ''
  )
  const [query, setQuery] = useState(queryParam)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getPageInfo = () => {
    switch (mode) {
      case 'mine':
        return {
          title: 'My Doubts',
          subtitle: 'All academic questions posted by your account across subjects.'
        }
      case 'saved':
        return {
          title: 'Saved Questions',
          subtitle: 'Questions you have bookmarked for future reference.'
        }
      case 'requests':
        return {
          title: 'Unanswered Questions',
          subtitle: 'Open doubts requiring answers and peer explanations.'
        }
      default:
        return {
          title: t('nav.discussions'),
          subtitle: t('doubts.subtitle')
        }
    }
  }

  const load = () => {
    setLoading(true)
    setError(null)

    if (query.trim()) {
      doubtService
        .searchDoubts(query.trim(), {
          subjectId: subjectId || undefined,
          isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
          limit: 30
        })
        .then(res => {
          let items = res.items
          if (mode === 'mine' && user) {
            items = items.filter(d => d.authorId === user.id)
          } else if (mode === 'requests') {
            items = items.filter(d => !d.isResolved)
          }
          setDoubts(items)
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    } else {
      doubtService
        .listDoubts({
          limit: 30,
          authorId: mode === 'mine' && user ? user.id : undefined,
          subjectId: subjectId || undefined,
          isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined
        })
        .then(res => {
          let items = res.items
          if (mode === 'saved') {
            try {
              const savedIds: string[] = JSON.parse(localStorage.getItem('doubt-chain:saved-ids') || '[]')
              items = items.filter(d => savedIds.includes(d.id))
            } catch {
              // empty
            }
          }
          setDoubts(items)
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => {
    doubtService.listSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    load()
  }, [subjectId, isResolved, query, mode, user])

  const info = getPageInfo()

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        {/* Header + CTA */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-dc-text">{info.title}</h1>
            <p className="mt-0.5 text-sm text-dc-subtext">{info.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/search" className="dc-btn-secondary shrink-0 text-xs">
              <Sparkles className="mr-1 h-3.5 w-3.5 inline text-dc-blue" />
              Smart Search 2.0
            </Link>
            <Link to="/doubts/new" className="dc-btn-primary shrink-0 text-xs">
              <Plus className="mr-1 h-3.5 w-3.5 inline" />
              {t('doubts.askButton')}
            </Link>
          </div>
        </div>

        {/* Filters and search input */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dc-border bg-dc-card p-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-dc-subtext" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search in questions..."
              className="dc-input pl-9 text-xs"
            />
          </div>

          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
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

          {mode !== 'requests' && (
            <select
              value={isResolved}
              onChange={e => setIsResolved(e.target.value as typeof isResolved)}
              aria-label="Filter by status"
              className="dc-input w-auto flex-none text-xs"
            >
              <option value="">{t('doubts.filterAll')}</option>
              <option value="false">{t('doubts.filterUnresolved')}</option>
              <option value="true">{t('doubts.filterResolved')}</option>
            </select>
          )}
        </div>

        {/* List of doubts */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : doubts.length === 0 ? (
          <EmptyState
            title={mode === 'mine' ? 'No doubts posted yet' : t('doubts.noDoubtsFound')}
            description={
              mode === 'mine'
                ? 'Questions you create will appear here and in course discussions.'
                : t('doubts.askQuestionPrompt')
            }
            action={
              <Link to="/doubts/new" className="dc-btn-primary text-sm">
                {t('doubts.askButton')}
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {doubts.map(d => (
              <Link key={d.id} to={`/doubts/${d.id}`} className="block">
                <DoubtCard
                  title={d.title}
                  excerpt={d.content.slice(0, 140)}
                  subject={d.subject?.name}
                  status={d.isResolved ? 'resolved' : 'unresolved'}
                  meta={d._count ? `${d._count.answers} ${t('detail.replies')}` : undefined}
                  author={d.author?.displayName}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
