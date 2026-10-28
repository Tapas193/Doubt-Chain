import { Sparkles, ShieldCheck, Zap, Network } from 'lucide-react'
import HangingSpiderHero from './HangingSpiderHero'

type AuthHeroPanelProps = {
  headline?: string
  subtitle?: string
}

export default function AuthHeroPanel({
  headline = 'Every Hero Starts With a Question.',
  subtitle = 'Join the network where students connect, solve doubts, and level up together.'
}: AuthHeroPanelProps) {
  return (
    <div className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#060913] p-10 text-white shadow-2xl">
      {/* ── Atmospheric Glows ── */}
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[#E62429]/25 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-[#1677FF]/25 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 comic-halftone opacity-20 pointer-events-none" />

      {/* ── Top-Right Hanging Upside-Down Spider Hero ── */}
      <div className="absolute top-0 right-3 w-40 pointer-events-none z-10 hidden xl:block opacity-95">
        <HangingSpiderHero scale={0.75} />
      </div>

      {/* ── Top Brand Bar ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-b from-[#1E293B] to-[#0F172A] p-2 shadow-lg">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
              <ellipse cx="50" cy="52" rx="7" ry="11" fill="#E62429" />
              <circle cx="50" cy="38" r="5" fill="#E62429" />
              <polygon points="46,36 49,38 46,40" fill="#FFFFFF" />
              <polygon points="54,36 51,38 54,40" fill="#FFFFFF" />
              <path d="M 48 42 Q 32 32 24 20" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
              <path d="M 52 42 Q 68 32 76 20" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
              <path d="M 47 54 Q 28 62 20 80" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
              <path d="M 53 54 Q 72 62 80 80" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold tracking-[0.25em] text-[#FF4D4F] uppercase">Doubt-Chain</span>
            <div className="text-[11px] text-slate-400 font-medium">Spider-Verse Edition</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-[#38BDF8]" />
          <span>Academic Universe</span>
        </div>
      </div>

      {/* ── Center Content: Mascot / Emblem & Taglines ── */}
      <div className="relative z-10 my-auto py-8 max-w-sm">
        {/* Glowing Badge Emblem */}
        <div className="mb-6 inline-flex items-center justify-center">
          <div className="relative h-20 w-20 rounded-3xl border border-[#E62429]/40 bg-gradient-to-b from-[#182136] to-[#0A0E1A] p-2.5 shadow-[0_0_30px_rgba(230,36,41,0.35)]">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="26" fill="none" stroke="rgba(230,36,41,0.25)" strokeWidth="1" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
              <ellipse cx="50" cy="52" rx="8" ry="12" fill="#E62429" />
              <circle cx="50" cy="37" r="5.5" fill="#E62429" />
              <polygon points="45,35 49,37 45,39" fill="#FFFFFF" />
              <polygon points="55,35 51,37 55,39" fill="#FFFFFF" />
              <path d="M 48 42 Q 30 30 20 18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 52 42 Q 70 30 80 18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 46 48 Q 24 44 14 36" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 54 48 Q 76 44 86 36" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 46 56 Q 26 66 18 82" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 54 56 Q 74 66 82 82" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
          {headline}
        </h2>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          {subtitle}
        </p>

        {/* Feature Badges */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
            <Zap className="h-3.5 w-3.5 text-[#FFD600]" />
            <span>AI Study Assistant 2.0</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
            <Network className="h-3.5 w-3.5 text-[#00E5FF]" />
            <span>Smart Semantic Search</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
            <ShieldCheck className="h-3.5 w-3.5 text-[#4ADE80]" />
            <span>Peer Verified Answers</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Quote ── */}
      <div className="relative z-10 border-t border-white/10 pt-4">
        <p className="text-xs italic text-slate-400">
          “With Great Knowledge Comes Great Responsibility.”
        </p>
        <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
          Every doubt has a hero. Every answer connects us.
        </span>
      </div>
    </div>
  )
}
