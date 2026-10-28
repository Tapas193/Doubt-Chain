import { Link } from 'react-router-dom'
import { ArrowRight, Search, Users, BookOpen, Sparkles, Network } from 'lucide-react'
import AppShell from '../layouts/AppShell'

export default function LandingPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-12 py-6 animate-fade-in">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-dc-border bg-gradient-to-b from-dc-card to-dc-bg p-8 sm:p-12 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-dc-blue/10 text-dc-blue">
            <Network className="h-8 w-8" />
          </div>

          <div className="mt-4">
            <span className="rounded-full border border-dc-blue/30 bg-dc-blue/10 px-3 py-1 text-xs font-semibold tracking-widest text-dc-blue uppercase">
              DOUBT-CHAIN · ACADEMIC KNOWLEDGE PROTOCOL
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-dc-text sm:text-5xl">
            Good questions should <br />
            <span className="bg-gradient-to-r from-dc-blue via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              never get lost.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-dc-subtext sm:text-lg">
            A trusted platform to ask, explain, and discover academic doubts—organized by the subjects you study, powered by semantic hybrid search, and never buried in fleeting group chats.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/subjects" className="dc-btn-primary px-6 py-3 text-sm font-semibold">
              Explore Subjects <ArrowRight className="h-4 w-4 ml-1 inline" />
            </Link>
            <Link to="/search" className="dc-btn-secondary px-6 py-3 text-sm font-semibold">
              <Sparkles className="mr-1.5 h-4 w-4 inline text-dc-blue" /> Smart Search 2.0
            </Link>
            <Link to="/login" className="dc-btn-ghost px-5 py-3 text-sm font-semibold">
              Sign In
            </Link>
          </div>
        </div>

        {/* Pillars / Values */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-dc-border bg-dc-card p-6 transition-all hover:border-dc-blue/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dc-blue/10 text-dc-blue">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-dc-text">Search First</h3>
            <p className="mt-2 text-xs leading-relaxed text-dc-subtext">
              Discover verified solutions instantly before posting duplicate questions, powered by hybrid semantic cosine embeddings.
            </p>
          </div>

          <div className="rounded-2xl border border-dc-border bg-dc-card p-6 transition-all hover:border-dc-blue/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-dc-text">Peer & Faculty Learning</h3>
            <p className="mt-2 text-xs leading-relaxed text-dc-subtext">
              Get peer explanations, faculty reviews, and collaborative upvotes within your active academic cohort.
            </p>
          </div>

          <div className="rounded-2xl border border-dc-border bg-dc-card p-6 transition-all hover:border-dc-blue/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-dc-text">Keep Knowledge Active</h3>
            <p className="mt-2 text-xs leading-relaxed text-dc-subtext">
              Turn resolved questions into a permanent course FAQ that stays accessible to future students across all terms.
            </p>
          </div>
        </div>

        {/* AI Study Assistant Feature Highlight */}
        <div className="rounded-2xl border border-dc-border bg-dc-card p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                POWERED BY GEMINI 2.5
              </span>
              <h2 className="text-xl font-bold text-dc-text">AI Study Assistant 2.0</h2>
              <p className="max-w-xl text-xs text-dc-subtext leading-relaxed">
                Step-by-step conceptual explanations, code dry-runs, and multilingual explanations in English, Hindi, and Hinglish grounded directly in verified Doubt-Chain solutions.
              </p>
            </div>
            <Link to="/ai-assistant" className="dc-btn-primary shrink-0 px-5 py-2.5 text-xs font-semibold">
              Try AI Assistant <ArrowRight className="h-3.5 w-3.5 ml-1 inline" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
