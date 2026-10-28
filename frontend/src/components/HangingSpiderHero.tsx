type HangingSpiderHeroProps = {
  className?: string
  scale?: number
}

export default function HangingSpiderHero({
  className = '',
  scale = 1
}: HangingSpiderHeroProps) {
  return (
    <div
      className={`relative flex flex-col items-center pointer-events-none select-none ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      aria-hidden="true"
    >
      {/* ── Spotlights & Atmospheric Auras ── */}
      <div className="absolute top-24 -left-12 h-64 w-64 rounded-full bg-[#E62429]/20 blur-[80px]" />
      <div className="absolute top-48 -right-8 h-64 w-64 rounded-full bg-[#1677FF]/25 blur-[90px]" />

      {/* ── The Hanging Superhero SVG Figure ── */}
      <svg
        viewBox="0 0 280 520"
        className="w-full h-auto max-h-[500px] overflow-visible drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-hero-sway"
      >
        <defs>
          {/* Suit Gradients */}
          <linearGradient id="suitRed" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF333A" />
            <stop offset="60%" stopColor="#E62429" />
            <stop offset="100%" stopColor="#990B10" />
          </linearGradient>

          <linearGradient id="suitBlue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="40%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#090D1A" />
          </linearGradient>

          <linearGradient id="suitBlueAccent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#1677FF" />
          </linearGradient>

          <linearGradient id="whiteWebGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#E0F2FE" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </linearGradient>

          {/* Eye Glow Filter */}
          <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── 1. The White Spiderweb Hanging Strand from Top ── */}
        <g>
          {/* Glow strand */}
          <line
            x1="140"
            y1="0"
            x2="140"
            y2="175"
            stroke="#38BDF8"
            strokeWidth="3.5"
            strokeOpacity="0.4"
          />
          {/* Main crisp white web thread */}
          <line
            x1="140"
            y1="0"
            x2="140"
            y2="175"
            stroke="url(#whiteWebGlow)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Micro web nodes along the line */}
          <circle cx="140" cy="40" r="1.8" fill="#FFFFFF" opacity="0.9" />
          <circle cx="140" cy="85" r="2" fill="#FFFFFF" opacity="0.95" />
          <circle cx="140" cy="130" r="2.2" fill="#FFFFFF" />
          <circle cx="140" cy="170" r="3" fill="#FFFFFF" filter="url(#eyeGlow)" />
        </g>

        {/* ── 2. Upper Body: Feet / Knees holding the Web (Inverted Pose) ── */}
        <g id="legs-inverted">
          {/* Web wrapped around boots */}
          <path
            d="M 132 165 C 136 158 144 158 148 165 C 150 172 130 172 132 165"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* Left Boot & Lower Leg */}
          <path
            d="M 138 168 L 126 195 L 118 245 L 128 248 L 140 200 L 142 168 Z"
            fill="url(#suitRed)"
            stroke="#080B14"
            strokeWidth="1.2"
          />
          {/* Right Boot & Lower Leg (Slightly bent pose) */}
          <path
            d="M 142 168 L 154 195 L 164 240 L 154 245 L 144 200 L 138 168 Z"
            fill="url(#suitRed)"
            stroke="#080B14"
            strokeWidth="1.2"
          />

          {/* Webbing details on boots */}
          <path d="M 124 205 L 140 205 M 122 220 L 136 220 M 120 235 L 132 235" stroke="#080B14" strokeWidth="0.8" />
          <path d="M 144 205 L 158 205 M 146 220 L 160 220 M 148 235 L 160 235" stroke="#080B14" strokeWidth="0.8" />

          {/* Thighs (Deep Navy Blue Suit Panels) */}
          <path
            d="M 118 245 L 105 315 L 128 325 L 136 250 Z"
            fill="url(#suitBlue)"
            stroke="#080B14"
            strokeWidth="1.2"
          />
          <path
            d="M 164 240 L 175 310 L 152 322 L 144 248 Z"
            fill="url(#suitBlue)"
            stroke="#080B14"
            strokeWidth="1.2"
          />

          {/* Blue Accent Trim */}
          <path d="M 118 245 L 128 325" stroke="url(#suitBlueAccent)" strokeWidth="1.8" />
          <path d="M 164 240 L 152 322" stroke="url(#suitBlueAccent)" strokeWidth="1.8" />

          {/* Pelvis / Hip (Inverted) */}
          <path
            d="M 105 315 L 175 310 L 165 345 L 115 345 Z"
            fill="url(#suitBlue)"
            stroke="#080B14"
            strokeWidth="1.5"
          />
          {/* Red Hip V-Panel */}
          <polygon points="125,320 155,320 148,345 132,345" fill="url(#suitRed)" stroke="#080B14" strokeWidth="1" />
        </g>

        {/* ── 3. Torso (Upside-Down Muscular Frame) ── */}
        <g id="torso-inverted">
          {/* Blue Side Rib Panels */}
          <path
            d="M 115 345 L 100 405 L 115 425 L 122 345 Z"
            fill="url(#suitBlue)"
            stroke="#080B14"
            strokeWidth="1.2"
          />
          <path
            d="M 165 345 L 180 405 L 165 425 L 158 345 Z"
            fill="url(#suitBlue)"
            stroke="#080B14"
            strokeWidth="1.2"
          />

          {/* Center Red Chest & Abdominal Panel */}
          <path
            d="M 122 345 L 115 425 L 165 425 L 158 345 Z"
            fill="url(#suitRed)"
            stroke="#080B14"
            strokeWidth="1.5"
          />

          {/* Geometric Comic Web Lines on Chest */}
          <line x1="140" y1="345" x2="140" y2="425" stroke="#080B14" strokeWidth="1.2" />
          <path d="M 120 365 Q 140 375 160 365" fill="none" stroke="#080B14" strokeWidth="1" />
          <path d="M 118 385 Q 140 398 162 385" fill="none" stroke="#080B14" strokeWidth="1" />
          <path d="M 116 405 Q 140 418 164 405" fill="none" stroke="#080B14" strokeWidth="1" />

          {/* Upside-Down Doubt-Chain Spider Emblem on Chest */}
          <g transform="translate(130, 375) scale(0.25)" fill="#080B14">
            <ellipse cx="40" cy="40" rx="14" ry="20" />
            <path d="M 38 20 Q 15 5 2 40" fill="none" stroke="#080B14" strokeWidth="7" strokeLinecap="round" />
            <path d="M 42 20 Q 65 5 78 40" fill="none" stroke="#080B14" strokeWidth="7" strokeLinecap="round" />
            <path d="M 36 30 Q 5 25 0 65" fill="none" stroke="#080B14" strokeWidth="6" strokeLinecap="round" />
            <path d="M 44 30 Q 75 25 80 65" fill="none" stroke="#080B14" strokeWidth="6" strokeLinecap="round" />
            <path d="M 36 50 Q 8 65 10 95" fill="none" stroke="#080B14" strokeWidth="6" strokeLinecap="round" />
            <path d="M 44 50 Q 72 65 70 95" fill="none" stroke="#080B14" strokeWidth="6" strokeLinecap="round" />
          </g>
        </g>

        {/* ── 4. Arms Folded in Athletic Heroic Pose ── */}
        <g id="arms-inverted">
          {/* Left Shoulder & Bicep */}
          <path
            d="M 100 405 L 75 425 L 88 450 L 115 425 Z"
            fill="url(#suitBlue)"
            stroke="#080B14"
            strokeWidth="1.2"
          />
          {/* Left Forearm (Red Gauntlet) */}
          <path
            d="M 88 450 L 112 462 L 125 448 L 102 438 Z"
            fill="url(#suitRed)"
            stroke="#080B14"
            strokeWidth="1.2"
          />
          {/* Left Hand */}
          <circle cx="120" cy="452" r="7" fill="url(#suitRed)" stroke="#080B14" strokeWidth="1" />

          {/* Right Shoulder & Bicep */}
          <path
            d="M 180 405 L 205 425 L 192 450 L 165 425 Z"
            fill="url(#suitBlue)"
            stroke="#080B14"
            strokeWidth="1.2"
          />
          {/* Right Forearm (Red Gauntlet) */}
          <path
            d="M 192 450 L 168 462 L 155 448 L 178 438 Z"
            fill="url(#suitRed)"
            stroke="#080B14"
            strokeWidth="1.2"
          />
          {/* Right Hand */}
          <circle cx="160" cy="452" r="7" fill="url(#suitRed)" stroke="#080B14" strokeWidth="1" />
        </g>

        {/* ── 5. Inverted Superhero Head & Mask (Hanging at Bottom) ── */}
        <g id="mask-inverted">
          {/* Neck */}
          <path d="M 128 425 L 152 425 L 148 440 L 132 440 Z" fill="url(#suitRed)" />

          {/* Mask Contour (Oval pointing downward) */}
          <ellipse
            cx="140"
            cy="472"
            rx="24"
            ry="30"
            fill="url(#suitRed)"
            stroke="#080B14"
            strokeWidth="1.8"
          />

          {/* Mask Webbing Lines (Radiating from nose bridge) */}
          <line x1="140" y1="444" x2="140" y2="502" stroke="#080B14" strokeWidth="1" opacity="0.8" />
          <line x1="118" y1="472" x2="162" y2="472" stroke="#080B14" strokeWidth="0.8" opacity="0.8" />
          <path d="M 124 458 Q 140 464 156 458" fill="none" stroke="#080B14" strokeWidth="0.8" />
          <path d="M 120 475 Q 140 484 160 475" fill="none" stroke="#080B14" strokeWidth="0.8" />
          <path d="M 124 490 Q 140 496 156 490" fill="none" stroke="#080B14" strokeWidth="0.8" />

          {/* ── Iconic Glowing Superhero Eyes (Inverted Angle) ── */}
          {/* Left Eye Frame (Black Outer Edge) */}
          <polygon
            points="120,466 136,462 134,478 122,476"
            fill="#080B14"
          />
          {/* Left Eye Core (Glowing White Lens) */}
          <polygon
            points="122,468 134,464 132,475 124,474"
            fill="#FFFFFF"
            filter="url(#eyeGlow)"
          />

          {/* Right Eye Frame (Black Outer Edge) */}
          <polygon
            points="160,466 144,462 146,478 158,476"
            fill="#080B14"
          />
          {/* Right Eye Core (Glowing White Lens) */}
          <polygon
            points="158,468 146,464 148,475 156,474"
            fill="#FFFFFF"
            filter="url(#eyeGlow)"
          />
        </g>
      </svg>
    </div>
  )
}
