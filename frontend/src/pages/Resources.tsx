import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Download, Sparkles, TerminalSquare } from 'lucide-react'
import AppShell from '../layouts/AppShell'

interface ResourceItem {
  slug: string
  title: string
  code: string
  icon: typeof BookOpen
  summary: string
  sections: Array<[string, string]>
}

const resources: ResourceItem[] = [
  {
    slug: 'recurrence-cheatsheet',
    title: 'Midterm Syllabus & Recurrence Relations Cheatsheet',
    code: 'CS201',
    icon: BookOpen,
    summary: 'A revision outline for recurrence relations and core algorithm analysis topics.',
    sections: [
      ['Recurrence models', 'Recognize common forms such as T(n)=T(n/2)+O(1), T(n)=2T(n/2)+O(n), and T(n)=T(n−1)+O(1). State base cases before solving.'],
      ['Master theorem', 'For T(n)=aT(n/b)+f(n), compare f(n) with n^(log_b a). Check the regularity condition before applying the third case.'],
      ['Recursion trees', 'Draw a level, count its subproblems and work per node, then sum across levels. Confirm the leaf cost and height.'],
      ['Recommended practice', 'Derive the recurrence from the algorithm first; then use substitution or a recursion tree to verify the asymptotic result.']
    ]
  },
  {
    slug: 'dsu-lab-kit',
    title: 'Lab 4: Disjoint Set Union Benchmarking Kit',
    code: 'CS201',
    icon: TerminalSquare,
    summary: 'A lab guide for implementing and comparing disjoint-set union strategies.',
    sections: [
      ['Implementations', 'Compare quick-find, quick-union, union by size, and union by size with path compression. Keep the API identical for each version.'],
      ['Workload', 'Use repeatable sequences of union and find operations. Include random, clustered, and adversarial input orders.'],
      ['Measurements', 'Record construction time, operation throughput, and parent-array depth. Run several trials and report medians.'],
      ['Integrity note', 'Use your course starter repository and submit your own code. This preview provides guidance only; no downloadable starter bundle is attached.']
    ]
  }
]

export default function Resources() {
  const { slug } = useParams<{ slug?: string }>()
  const item = resources.find(r => r.slug === slug)

  if (slug && !item) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <Link to="/resources" className="inline-flex items-center gap-1.5 text-xs text-dc-subtext hover:text-dc-text">
            <ArrowLeft className="h-4 w-4" /> All resources
          </Link>
          <div className="rounded-2xl border border-dc-border bg-dc-card p-8 text-center">
            <h2 className="text-lg font-bold text-dc-text">Resource not found</h2>
            <p className="mt-1 text-sm text-dc-subtext">The requested curriculum resource could not be found.</p>
            <Link to="/resources" className="dc-btn-secondary mt-4 inline-flex">
              Browse curriculum resources
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!item) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-dc-blue">
              CURRICULUM LEARNING MATERIALS
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-dc-text">
              Curriculum Resources
            </h1>
            <p className="mt-1 text-sm text-dc-subtext">
              Reference notes, syllabus guides, and lab walk-throughs aligned with your subjects.
            </p>
          </div>

          <div className="space-y-3">
            {resources.map(r => {
              const Icon = r.icon
              return (
                <Link
                  key={r.slug}
                  to={`/resources/${r.slug}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-dc-border bg-dc-card p-5 transition-all hover:border-dc-blue/40 hover:bg-dc-card/80"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dc-blue/10 text-dc-blue">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-semibold text-dc-blue">{r.code} · COURSE RESOURCE</span>
                      <h2 className="mt-0.5 text-base font-semibold text-dc-text">{r.title}</h2>
                      <p className="mt-1 text-xs text-dc-subtext">{r.summary}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-dc-subtext" />
                </Link>
              )
            })}

            <Link
              to="/ai-assistant"
              className="flex items-center justify-between gap-4 rounded-xl border border-dc-border bg-dc-card p-5 transition-all hover:border-dc-blue/40 hover:bg-dc-card/80"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs font-semibold text-purple-400">AI STUDY ASSISTANT 2.0</span>
                  <h2 className="mt-0.5 text-base font-semibold text-dc-text">AI Doubts Synthesizer & Academic Tutor</h2>
                  <p className="mt-1 text-xs text-dc-subtext">
                    Ask questions across conceptual topics with step-by-step code dry-runs in English, Hindi, and Hinglish.
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-dc-subtext" />
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  const Icon = item.icon
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        <Link to="/resources" className="inline-flex items-center gap-1.5 text-xs text-dc-subtext hover:text-dc-text">
          <ArrowLeft className="h-4 w-4" /> All resources
        </Link>

        <div className="rounded-2xl border border-dc-border bg-dc-card p-6 shadow-dc-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dc-blue/10 text-dc-blue">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <span className="font-mono text-xs font-semibold text-dc-blue">{item.code} · STUDY GUIDE</span>
              <h1 className="text-xl font-bold text-dc-text">{item.title}</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-dc-subtext">{item.summary}</p>
        </div>

        <div className="space-y-4">
          {item.sections.map(([title, text], i) => (
            <div key={title} className="rounded-xl border border-dc-border bg-dc-card p-5">
              <h2 className="text-sm font-semibold text-dc-text">
                {i + 1}. {title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-dc-subtext">{text}</p>
            </div>
          ))}
        </div>

        <p className="flex items-center gap-2 text-xs text-dc-subtext">
          <Download className="h-4 w-4 text-dc-blue" /> This is an in-app curriculum reference preview.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/faq" className="dc-btn-primary">
            Search resolved questions <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/subjects" className="dc-btn-secondary">
            Return to curriculum subjects
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
