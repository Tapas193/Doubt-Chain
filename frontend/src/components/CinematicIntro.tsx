import { useState, useEffect, useCallback, useRef } from 'react'
import { Volume2, VolumeX, Sparkles } from 'lucide-react'
import HangingSpiderHero from './HangingSpiderHero'

export const INTRO_STORAGE_KEY = 'doubt-chain:intro-completed:v1'

export function replayIntro(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('doubt-chain:replay-intro'))
  }
}

type CinematicIntroProps = {
  onComplete?: () => void
  forceShow?: boolean
}

export default function CinematicIntro({ onComplete, forceShow = false }: CinematicIntroProps) {
  // Always initialize visible on fresh document load/refresh
  const [visible, setVisible] = useState(() => {
    if (forceShow) return true
    if (typeof window !== 'undefined') {
      try {
        // Clean up any stale persistent suppression flags
        localStorage.removeItem(INTRO_STORAGE_KEY)
        localStorage.removeItem('doubt-chain:intro-completed')
        sessionStorage.removeItem('doubt-chain:cinematic-seen')
      } catch {
        // storage access blocked
      }
      // Check prefers-reduced-motion
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        return false
      }
    }
    return true
  })

  const [currentScene, setCurrentScene] = useState<1 | 2 | 3 | 4>(1)
  const [exiting, setExiting] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
  }, [])

  const handleFinish = useCallback(() => {
    clearAllTimers()
    setExiting(true)
    const exitTimer = setTimeout(() => {
      setVisible(false)
      setExiting(false)
      onComplete?.()
    }, 450)
    timersRef.current.push(exitTimer)
  }, [clearAllTimers, onComplete])

  // Listen for manual replay events (e.g., from Settings)
  useEffect(() => {
    const handleReplay = () => {
      clearAllTimers()
      setExiting(false)
      setCurrentScene(1)
      setVisible(true)
    }

    window.addEventListener('doubt-chain:replay-intro', handleReplay)
    return () => window.removeEventListener('doubt-chain:replay-intro', handleReplay)
  }, [clearAllTimers])

  // Keyboard accessibility: Escape skips intro
  useEffect(() => {
    if (!visible) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleFinish()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, handleFinish])

  // Timed 4-Scene Progression
  useEffect(() => {
    if (!visible || exiting) return

    clearAllTimers()

    // Scene 2: Spider-web shooting & THWIP! sound badge
    const t1 = setTimeout(() => {
      setCurrentScene(prev => (prev < 2 ? 2 : prev))
    }, 2200)

    // Scene 3: Superhero branding & upside-down hero on right
    const t2 = setTimeout(() => {
      setCurrentScene(prev => (prev < 3 ? 3 : prev))
    }, 4200)

    // Scene 4: "ENTER THE SPIDER-VERSE" Action button ready
    const t3 = setTimeout(() => {
      setCurrentScene(4)
    }, 5800)

    timersRef.current.push(t1, t2, t3)

    return () => clearAllTimers()
  }, [visible, exiting, clearAllTimers])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Doubt-Chain Spider-Verse Cinematic Intro"
      className={`fixed inset-0 z-[9990] flex flex-col items-center justify-center overflow-hidden bg-[#04060A] text-white select-none transition-all duration-500 ${
        exiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* ── Atmospheric Red Moon & Deep Space Glow ── */}
      <div className="absolute top-[-10%] right-[10%] h-[420px] w-[420px] rounded-full bg-[#E62429]/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] h-[460px] w-[460px] rounded-full bg-[#1677FF]/25 blur-[140px] pointer-events-none" />

      {/* Comic Halftone Texture Grid */}
      <div className="absolute inset-0 comic-halftone opacity-25 pointer-events-none" />

      {/* Top Controls: Sound & Skip */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
        <button
          type="button"
          onClick={() => setSoundEnabled(prev => !prev)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/70 backdrop-blur-md transition hover:border-[#1677FF]/50 hover:text-white"
          title={soundEnabled ? 'Mute SFX Simulation' : 'Enable SFX Simulation'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="h-3.5 w-3.5 text-[#00E5FF] animate-pulse" />
              <span className="hidden sm:inline">SFX: Active</span>
              <span className="flex items-center gap-0.5 ml-1">
                <span className="h-2 w-0.5 bg-[#00E5FF] animate-bounce" />
                <span className="h-3 w-0.5 bg-[#E62429] animate-bounce delay-75" />
                <span className="h-2 w-0.5 bg-[#00E5FF] animate-bounce delay-150" />
              </span>
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5 text-white/50" />
              <span className="hidden sm:inline">SFX: Muted</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleFinish}
          className="group flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition-all hover:border-[#E62429] hover:bg-[#E62429]/20 hover:text-white"
          title="Skip Intro (Escape)"
        >
          <span>SKIP INTRO</span>
          <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
            ESC
          </kbd>
        </button>
      </div>

      {/* ── Scene 1: NYC Dark City Skyline SVG Layer ── */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none transition-opacity duration-1000 z-10">
        <svg
          viewBox="0 0 1440 450"
          className="w-full h-[260px] sm:h-[340px] md:h-[400px] object-cover opacity-80"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="skylineGradIntro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B1120" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#020408" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="moonGradIntro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF4D4F" />
              <stop offset="100%" stopColor="#E62429" />
            </linearGradient>
          </defs>

          {/* Deep Blood-Red Moon */}
          <circle cx="1150" cy="110" r="48" fill="url(#moonGradIntro)" opacity="0.85" filter="drop-shadow(0 0 25px #E62429)" />
          <circle cx="1150" cy="110" r="48" fill="none" stroke="#FF7875" strokeWidth="1.5" opacity="0.6" />

          {/* Distant Skyscrapers Silhouette */}
          <path
            d="M0,450 L0,320 L60,320 L60,260 L90,260 L90,290 L130,290 L130,210 L160,210 L160,190 L170,140 L180,190 L190,210 L230,210 L230,280 L290,280 L290,170 L340,170 L340,240 L410,240 L410,120 L440,120 L440,90 L445,60 L450,90 L450,120 L480,120 L480,250 L530,250 L530,190 L590,190 L590,300 L650,300 L650,140 L700,140 L700,220 L760,220 L760,110 L770,70 L780,110 L810,110 L810,240 L880,240 L880,180 L940,180 L940,290 L1010,290 L1010,130 L1050,130 L1055,80 L1065,130 L1100,130 L1100,270 L1180,270 L1180,200 L1240,200 L1240,310 L1320,310 L1320,180 L1370,180 L1370,250 L1440,250 L1440,450 Z"
            fill="url(#skylineGradIntro)"
          />

          {/* Golden & Cyan Skyscraper Windows */}
          <g fill="#FBBF24" opacity="0.65" className="animate-pulse">
            <rect x="140" y="230" width="3" height="4" />
            <rect x="150" y="240" width="3" height="4" />
            <rect x="140" y="255" width="3" height="4" />
            <rect x="305" y="200" width="3" height="4" />
            <rect x="320" y="215" width="3" height="4" />
            <rect x="425" y="150" width="3" height="5" />
            <rect x="435" y="170" width="3" height="5" />
            <rect x="465" y="190" width="3" height="5" />
            <rect x="670" y="165" width="3" height="4" />
            <rect x="685" y="180" width="3" height="4" />
            <rect x="780" y="140" width="3" height="5" />
            <rect x="795" y="160" width="3" height="5" />
            <rect x="1030" y="160" width="3" height="5" />
            <rect x="1040" y="190" width="3" height="5" />
            <rect x="1340" y="210" width="3" height="4" />
            <rect x="1355" y="230" width="3" height="4" />
          </g>
          <g fill="#38BDF8" opacity="0.7">
            <rect x="145" y="270" width="3" height="4" />
            <rect x="315" y="235" width="3" height="4" />
            <rect x="425" y="210" width="3" height="5" />
            <rect x="465" y="140" width="3" height="5" />
            <rect x="785" y="200" width="3" height="5" />
            <rect x="1035" y="220" width="3" height="5" />
          </g>
        </svg>
      </div>

      {/* ── Two-Column Cinematic Layout: Content (Left) & Upside-Down Hero (Right) ── */}
      <div className="relative z-20 flex w-full max-w-6xl items-center justify-between px-6 sm:px-12 py-10">
        {/* Left Side: Branding, Scenes 1-4 Content & CTA */}
        <div className="flex flex-col items-start text-left max-w-xl">
          {/* Animated Superhero Spider Emblem */}
          <div
            className={`relative mb-4 transition-all duration-700 transform ${
              currentScene >= 2
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-75 translate-y-6'
            }`}
          >
            {/* Pulsing Aura */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#E62429] to-[#1677FF] blur-xl opacity-60 animate-pulse" />

            {/* Geometric Spider Mask / Emblem */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-white/20 bg-gradient-to-b from-[#141C2E] to-[#080B14] p-2.5 shadow-2xl backdrop-blur-md flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_10px_#E62429]">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(230,36,41,0.3)" strokeWidth="1" />
                <line x1="50" y1="8" x2="50" y2="92" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                <line x1="8" y1="50" x2="92" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                <ellipse cx="50" cy="52" rx="7" ry="11" fill="#E62429" />
                <circle cx="50" cy="38" r="5" fill="#E62429" />
                <polygon points="46,36 49,38 46,40" fill="#FFFFFF" />
                <polygon points="54,36 51,38 54,40" fill="#FFFFFF" />
                <path d="M 48 42 Q 32 32 25 18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 52 42 Q 68 32 75 18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 47 54 Q 28 62 22 78" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 53 54 Q 72 62 78 78" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </svg>

              {/* Comic Sound Effect badge on Scene 2 */}
              {currentScene === 2 && (
                <span className="absolute -top-3 -right-6 rotate-12 rounded bg-[#E62429] px-2 py-0.5 font-black italic tracking-tighter text-white shadow-lg text-xs animate-bounce border border-white">
                  THWIP!
                </span>
              )}
            </div>
          </div>

          {/* Scene 3: Titles & Taglines */}
          <div
            className={`space-y-3 transition-all duration-700 ${
              currentScene >= 3
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Spider-Verse Edition Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E62429]/50 bg-[#E62429]/15 px-3 py-1 text-[11px] font-bold tracking-widest text-[#FF4D4F] uppercase">
              <Sparkles className="h-3 w-3" />
              <span>Spider-Verse Edition</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#1677FF] drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
              DOUBT-CHAIN
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg font-medium text-[#38BDF8]">
              Your Friendly Neighborhood Learning Network
            </p>

            {/* Tagline */}
            <p className="text-xs sm:text-sm text-slate-300 italic tracking-wide border-l-2 border-[#E62429] pl-3 py-1">
              “With Great Knowledge Comes Great Responsibility.”
            </p>

            <p className="text-xs text-slate-400">
              Every doubt has a hero. Every answer connects us.
            </p>
          </div>

          {/* Scene 4: Action Button */}
          <div
            className={`mt-6 transition-all duration-500 transform ${
              currentScene >= 4
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={handleFinish}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#E62429] via-[#D11D22] to-[#B91C1C] px-8 py-3.5 font-bold text-white shadow-[0_0_35px_rgba(230,36,41,0.6)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(230,36,41,0.9)] active:scale-95"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="tracking-wider text-sm sm:text-base font-extrabold uppercase">
                ENTER THE SPIDER-VERSE
              </span>
              <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                🕷️
              </span>
            </button>
          </div>

          {/* Scene Timeline Dots */}
          <div className="mt-8 flex items-center gap-2">
            {[1, 2, 3, 4].map(step => (
              <button
                key={step}
                type="button"
                onClick={() => setCurrentScene(step as any)}
                className={`h-1.5 transition-all rounded-full ${
                  currentScene === step
                    ? 'w-6 bg-[#E62429]'
                    : 'w-2 bg-white/25 hover:bg-white/50'
                }`}
                aria-label={`Jump to scene ${step}`}
              />
            ))}
          </div>
        </div>

        {/* ── Original Upside-Down Spider Hero Hanging on the RIGHT ── */}
        <div
          className={`hidden md:flex flex-col items-center justify-start h-full transition-all duration-1000 transform ${
            currentScene >= 3
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-12 pointer-events-none'
          }`}
        >
          <HangingSpiderHero className="w-56 lg:w-64" />
        </div>
      </div>
    </div>
  )
}
