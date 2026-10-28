import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react'
import { doubtService } from '../services/doubtService'
import { Doubt } from '../types/api'

type CommandPaletteProps = {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
      if (!query.trim()) {
        // Fetch recent doubts from backend
        doubtService.listDoubts({ limit: 5 })
          .then(res => setResults(res.items))
          .catch(() => setResults([]))
      }
    } else {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const trimmed = query.trim()
    if (!trimmed) {
      doubtService.listDoubts({ limit: 5 })
        .then(res => setResults(res.items))
        .catch(() => setResults([]))
      return
    }

    const timer = setTimeout(() => {
      setLoading(true)
      doubtService.searchDoubts(trimmed, { limit: 6 })
        .then(res => {
          setResults(res.items)
          setActiveIndex(0)
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)

    return () => clearTimeout(timer)
  }, [query, isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (results.length ? Math.min(i + 1, results.length - 1) : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) {
        navigate(`/doubts/${results[activeIndex].id}`)
        onClose()
      } else if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`)
        onClose()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm animate-fade-in"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-title"
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-dc-border bg-dc-card shadow-2xl transition-all"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-dc-border px-4 py-3.5">
          <Search className="h-5 w-5 text-dc-subtext" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search doubts, subjects, or academic topics..."
            aria-label="Search questions"
            className="flex-1 bg-transparent text-sm text-dc-text outline-none placeholder:text-dc-subtext"
          />
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-dc-blue border-t-transparent" />}
          <kbd className="hidden rounded bg-dc-bg2 px-2 py-0.5 text-[11px] font-mono font-medium text-dc-subtext sm:inline-block border border-dc-border">
            ESC
          </kbd>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between bg-dc-bg2/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-dc-subtext">
          <span id="command-title">{query ? 'Search Results' : 'Recent Academic Questions'}</span>
          <span>Use ↑ ↓ to navigate · Enter to open</span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length > 0 ? (
            results.map((d, i) => (
              <button
                key={d.id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  navigate(`/doubts/${d.id}`)
                  onClose()
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === activeIndex ? 'bg-dc-blue/10 text-dc-text' : 'text-dc-subtext hover:bg-dc-bg2 hover:text-dc-text'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-dc-blue">
                      {d.subject?.code || 'ACAD'}
                    </span>
                    <span className="truncate text-sm font-medium text-dc-text">{d.title}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-dc-subtext">
                    {d.content.slice(0, 90)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  {d.isResolved && (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                      Resolved
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-dc-subtext/60" />
              <p className="mt-2 text-sm font-medium text-dc-text">No matching doubts found</p>
              <p className="mt-1 text-xs text-dc-subtext">
                Try searching for another topic or course code, or post a new question.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  to="/doubts/new"
                  onClick={onClose}
                  className="dc-btn-primary px-3 py-1.5 text-xs"
                >
                  Ask a new doubt <ArrowRight className="ml-1 h-3.5 w-3.5 inline" />
                </Link>
                <Link
                  to="/search"
                  onClick={onClose}
                  className="dc-btn-secondary px-3 py-1.5 text-xs"
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5 inline text-dc-blue" />
                  Smart Search 2.0
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex flex-wrap items-center justify-between border-t border-dc-border bg-dc-bg2/60 px-4 py-2.5 text-xs text-dc-subtext">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-dc-border bg-dc-bg2 px-1 py-0.5 font-mono text-[10px]">↑</kbd>
              <kbd className="rounded border border-dc-border bg-dc-bg2 px-1 py-0.5 font-mono text-[10px]">↓</kbd> Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> Open
            </span>
          </div>
          <Link
            to="/search"
            onClick={onClose}
            className="text-dc-blue hover:underline"
          >
            Advanced Smart Search →
          </Link>
        </div>
      </div>
    </div>
  )
}
