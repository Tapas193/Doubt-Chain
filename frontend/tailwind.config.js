/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        dc: {
          bg:      'var(--dc-bg)',
          bg2:     'var(--dc-bg2)',
          card:    'var(--dc-card)',
          border:  'var(--dc-border)',
          red:     'var(--dc-red)',
          blue:    'var(--dc-blue)',
          text:    'var(--dc-text)',
          subtext: 'var(--dc-subtext)',
          muted:   'var(--dc-muted)',
          success: '#22C55E',
          warning: '#F59E0B',
        }
      },
      boxShadow: {
        'dc-glow':    '0 0 40px -10px var(--dc-glow)',
        'dc-red':     '0 0 30px -8px rgba(230, 36, 41, 0.45)',
        'dc-card':    'var(--dc-card-shadow)',
        'dc-modal':   '0 20px 60px -10px rgba(0,0,0,0.7)',
      },
      animation: {
        'spin-slow':  'spin 3s linear infinite',
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'pulse-dot':  'pulseDot 1.5s ease-in-out infinite',
        'web-shoot':  'webShoot 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'hero-sway':  'heroSway 4.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' },                   to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        webShoot: { '0%': { transform: 'scale(0) rotate(-20deg)', opacity: '0' }, '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' } },
        heroSway: { '0%, 100%': { transform: 'rotate(-1.8deg)' }, '50%': { transform: 'rotate(1.8deg)' } }
      },
    },
  },
  plugins: [],
}
