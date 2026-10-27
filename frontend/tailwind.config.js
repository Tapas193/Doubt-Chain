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
          bg:      '#080B14',
          bg2:     '#0D1322',
          card:    '#111827',
          border:  'rgba(148, 163, 184, 0.14)',
          red:     '#E62429',
          blue:    '#1677FF',
          text:    '#F1F5F9',
          subtext: '#64748B',
          muted:   '#334155',
          success: '#22C55E',
          warning: '#F59E0B',
        }
      },
      boxShadow: {
        'dc-glow':    '0 0 40px -10px rgba(22, 119, 255, 0.35)',
        'dc-red':     '0 0 30px -8px rgba(230, 36, 41, 0.45)',
        'dc-card':    '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        'dc-modal':   '0 20px 60px -10px rgba(0,0,0,0.7)',
      },
      animation: {
        'spin-slow':  'spin 3s linear infinite',
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'pulse-dot':  'pulseDot 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' },                   to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
      },
    },
  },
  plugins: [],
}
