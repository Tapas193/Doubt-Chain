import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../layouts/AppShell'
import SubjectCard from '../components/SubjectCard'
import DoubtCard from '../components/DoubtCard'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { doubtService } from '../services/doubtService'
import { Subject, Doubt } from '../types/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { Sparkles, MessageSquare, CheckCircle, GitFork, Plus, Search, HelpCircle } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    let mounted = true
    Promise.all([doubtService.listSubjects(), doubtService.listDoubts({ limit: 6 })])
      .then(([s, d]) => {
        if (mounted) {
          setSubjects(s)
          setDoubts(d.items)
        }
      })
      .catch(err => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }

  useEffect(load, [])

  const resolvedCount = doubts.filter(d => d.isResolved).length

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
        {/* ── Spider-Verse Hero Banner ── */}
        <section className="relative overflow-hidden rounded-3xl border border-dc-border bg-dc-card p-6 sm:p-8 shadow-dc-card">
          {/* Subtle Spiderweb Corner SVG */}
          <div className="absolute top-0 right-0 pointer-events-none opacity-20 sm:opacity-30">
            <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
              <path d="M180 0 L180 180 L0 0 Z" fill="rgba(230,36,41,0.03)" />
              <line x1="180" y1="0" x2="0" y2="180" stroke="var(--dc-red)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="180" y1="0" x2="60" y2="180" stroke="var(--dc-blue)" strokeWidth="0.8" />
              <line x1="180" y1="0" x2="180" y2="120" stroke="var(--dc-text)" strokeWidth="0.8" opacity="0.4" />
              <circle cx="180" cy="0" r="50" stroke="var(--dc-red)" strokeWidth="1" fill="none" />
              <circle cx="180" cy="0" r="100" stroke="var(--dc-blue)" strokeWidth="0.8" fill="none" strokeDasharray="4 4" />
              <circle cx="180" cy="0" r="150" stroke="var(--dc-text)" strokeWidth="0.8" opacity="0.3" fill="none" />
            </svg>
          </div>

          {/* Left Superhero Red Accent Bar */}
          <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-3xl bg-gradient-to-b from-[#E62429] via-[#1677FF] to-[#E62429]" />

          <div className="relative z-10 pl-2 sm:pl-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-dc-red/40 bg-dc-red/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-dc-red">
                <Sparkles className="h-3 w-3" />
                <span>Spider-Verse Learning Hub</span>
              </div>
              <span className="text-[11px] text-dc-subtext italic">
                “With Great Knowledge Comes Great Responsibility.”
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-dc-text sm:text-3xl md:text-4xl">
              Doubt-Chain
            </h1>

            <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-dc-subtext">
              {user
                ? `${t('dashboard.welcomeBack')}, ${user.displayName}. ${t('dashboard.searchPrompt')}`
                : t('dashboard.heroSubtitle')}
            </p>

            {/* Quick Superhero Action Bar */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/doubts/new"
                className="group relative inline-flex items-center gap-2 rounded-xl bg-dc-red px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_0_15px_rgba(230,36,41,0.35)] transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
                <span>{t('doubts.askButton')}</span>
              </Link>

              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-xl border border-dc-border bg-dc-bg2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-dc-text transition-all hover:border-dc-blue hover:text-dc-blue active:scale-[0.98]"
              >
                <Search className="h-4 w-4 text-dc-blue" />
                <span>Smart Search 2.0</span>
              </Link>

              <Link
                to="/ai-assistant"
                className="inline-flex items-center gap-2 rounded-xl border border-dc-border bg-dc-bg2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-dc-text transition-all hover:border-dc-red hover:text-dc-red active:scale-[0.98]"
              >
                <HelpCircle className="h-4 w-4 text-[#FFD600]" />
                <span>AI Study Assistant</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Quick Academic Stat Badges ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-dc-border bg-dc-card p-4 transition-all hover:border-dc-blue/50 shadow-sm">
            <div className="flex items-center justify-between text-dc-subtext">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Doubts</span>
              <MessageSquare className="h-4 w-4 text-dc-blue" />
            </div>
            <div className="mt-2 text-2xl font-bold text-dc-text">
              {loading ? '...' : doubts.length}
            </div>
            <span className="text-[10px] text-dc-subtext">Discussions active</span>
          </div>

          <div className="rounded-2xl border border-dc-border bg-dc-card p-4 transition-all hover:border-dc-red/50 shadow-sm">
            <div className="flex items-center justify-between text-dc-subtext">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Solved</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-dc-text">
              {loading ? '...' : resolvedCount}
            </div>
            <span className="text-[10px] text-dc-subtext">Verified solutions</span>
          </div>

          <div className="rounded-2xl border border-dc-border bg-dc-card p-4 transition-all hover:border-dc-blue/50 shadow-sm">
            <div className="flex items-center justify-between text-dc-subtext">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Subjects</span>
              <GitFork className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-dc-text">
              {loading ? '...' : subjects.length}
            </div>
            <span className="text-[10px] text-dc-subtext">Curriculum boards</span>
          </div>

          <div className="rounded-2xl border border-dc-border bg-dc-card p-4 transition-all hover:border-dc-red/50 shadow-sm">
            <div className="flex items-center justify-between text-dc-subtext">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Network</span>
              <Sparkles className="h-4 w-4 text-[#FF4D4F]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-dc-text">100%</div>
            <span className="text-[10px] text-dc-subtext">Peer verified</span>
          </div>
        </div>

        {/* Error */}
        {error && <ErrorState message={error} onRetry={load} />}

        {/* ── Subjects Section ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-dc-text">{t('subjects.title')}</h2>
              <span className="text-xs text-dc-subtext">
                {subjects.length} {t('subjects.allSubjects')}
              </span>
            </div>
            <Link
              to="/subjects"
              className="text-xs text-dc-blue hover:underline underline-offset-4 font-semibold"
            >
              {t('subjects.allSubjects')} →
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <EmptyState
              title={t('subjects.noSubjectsFound')}
              description={t('subjects.subtitle')}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map(s => (
                <SubjectCard
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  code={s.code}
                  description={s.description ?? undefined}
                  doubtsCount={s._count?.doubts}
                  membersCount={s._count?.members}
                  isMember={s.isMember}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Discussions Section ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-dc-text">{t('dashboard.recentActivity')}</h2>
            <div className="flex items-center gap-3">
              {!loading && doubts.length > 0 && (
                <span className="text-xs text-dc-subtext">
                  {resolvedCount}/{doubts.length} {t('doubts.filterResolved')}
                </span>
              )}
              <Link
                to="/doubts"
                className="text-xs text-dc-blue hover:underline underline-offset-4 font-semibold"
              >
                {t('dashboard.viewAll')}
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !error && doubts.length === 0 ? (
            <EmptyState
              title={t('dashboard.noRecentDoubts')}
              description={t('dashboard.askFirstDoubt')}
              action={
                <Link to="/doubts/new" className="dc-btn-primary text-sm">
                  {t('doubts.askButton')}
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {doubts.map(d => (
                <Link key={d.id} to={`/doubts/${d.id}`} className="block group">
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
        </section>
      </div>
    </AppShell>
  )
}
