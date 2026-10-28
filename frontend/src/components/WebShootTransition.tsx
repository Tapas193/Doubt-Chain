import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function WebShootTransition() {
  const { isWebShooting, webShootDirection, completeWebShoot } = useTheme()
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!isWebShooting) {
      setAnimating(false)
      return
    }

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      completeWebShoot()
      return
    }

    setAnimating(true)
    const timer = setTimeout(() => {
      setAnimating(false)
      completeWebShoot()
    }, 700)

    return () => clearTimeout(timer)
  }, [isWebShooting, completeWebShoot])

  if (!animating && !isWebShooting) return null

  const isDarkTarget = webShootDirection === 'to-dark'
  const primaryStroke = isDarkTarget ? '#E62429' : '#0284C7'
  const secondaryStroke = isDarkTarget ? '#1677FF' : '#00E5FF'
  const webColor = isDarkTarget ? '#FFFFFF' : '#38BDF8'

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden transition-opacity duration-300"
    >
      {/* Shockwave ripple */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isDarkTarget ? 'bg-black/30' : 'bg-white/20'
        }`}
      />

      {/* Spiderweb Geometric SVG Shooter */}
      <svg
        viewBox="0 0 1000 1000"
        className="absolute inset-0 h-full w-full object-cover animate-web-shoot"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="spiderGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primaryStroke} stopOpacity="0.8" />
            <stop offset="40%" stopColor={secondaryStroke} stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id="webGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Central burst shockwave */}
        <circle cx="500" cy="500" r="160" fill="url(#spiderGlow)" className="animate-pulse" />

        {/* Center Spider Emblem Icon */}
        <g transform="translate(485, 485) scale(0.65)" fill={primaryStroke}>
          <path d="M23 12c-1.5 0-3-1-3-2.5S21.5 7 23 7s3 1 3 2.5-1.5 2.5-3 2.5zm-5 13c-.6 0-1-.4-1-1 0-3.3-2.7-6-6-6s-6 2.7-6 6c0 .6-.4 1-1 1s-1-.4-1-1c0-4.4 3.6-8 8-8s8 3.6 8 8c0 .6-.4 1-1 1zm-8.8-17C10.6 6.9 12 5.6 13.8 5c.5-.2.8-.7.7-1.2s-.7-.8-1.2-.7c-2.4.8-4.2 2.5-5.2 4.7-.2.5 0 1.1.5 1.3.5.2 1.1 0 1.3-.5.3-.6.5-1.1.9-1.6zm13.6 0c.4.5.6 1 .9 1.6.2.5.8.7 1.3.5.5-.2.7-.8.5-1.3-1-2.2-2.8-3.9-5.2-4.7-.5-.2-1.1.1-1.2.7s.1 1.1.7 1.2c1.8.6 3.2 1.9 4.6 3z" />
        </g>

        {/* Concentric Web Arcs */}
        {[80, 160, 260, 380, 520, 680].map((radius, i) => (
          <polygon
            key={`ring-${i}`}
            points={Array.from({ length: 12 })
              .map((_, idx) => {
                const angle = (idx * Math.PI) / 6
                // Introduce slight comic curve
                const r = radius * (1 + 0.05 * Math.sin(idx * 2))
                return `${500 + r * Math.cos(angle)},${500 + r * Math.sin(angle)}`
              })
              .join(' ')}
            fill="none"
            stroke={webColor}
            strokeWidth={i % 2 === 0 ? '2' : '1.2'}
            strokeOpacity={0.85 - i * 0.1}
            filter="url(#webGlow)"
            strokeDasharray="12 6"
          />
        ))}

        {/* 12 Radial Web Strands */}
        {Array.from({ length: 12 }).map((_, idx) => {
          const angle = (idx * Math.PI) / 6
          const x2 = 500 + 800 * Math.cos(angle)
          const y2 = 500 + 800 * Math.sin(angle)
          return (
            <line
              key={`spoke-${idx}`}
              x1="500"
              y1="500"
              x2={x2}
              y2={y2}
              stroke={idx % 3 === 0 ? primaryStroke : webColor}
              strokeWidth={idx % 3 === 0 ? '2.5' : '1.5'}
              strokeOpacity="0.8"
              filter="url(#webGlow)"
            />
          )
        })}

        {/* Energy particle zaps */}
        <line x1="500" y1="500" x2="120" y2="80" stroke={primaryStroke} strokeWidth="2.5" strokeDasharray="8 8" />
        <line x1="500" y1="500" x2="880" y2="920" stroke={secondaryStroke} strokeWidth="2.5" strokeDasharray="8 8" />
        <line x1="500" y1="500" x2="90" y2="780" stroke={primaryStroke} strokeWidth="2.5" strokeDasharray="8 8" />
        <line x1="500" y1="500" x2="910" y2="140" stroke={secondaryStroke} strokeWidth="2.5" strokeDasharray="8 8" />
      </svg>
    </div>
  )
}
