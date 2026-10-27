import { useState } from 'react'

type SearchPanelProps = {
  placeholder?: string
}

export default function SearchPanel({ placeholder = 'Search doubts before posting...' }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [scanning, setScanning] = useState(false)

  const handleChange = (value: string) => {
    setQuery(value)
    if (value.trim().length > 0) {
      setScanning(true)
      const timeout = setTimeout(() => setScanning(false), 600)
      return () => clearTimeout(timeout)
    }
    setScanning(false)
  }

  return (
    <div className="rounded-xl border border-dc-border bg-dc-card/80 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Search-Before-Posting</h2>
          <p className="text-sm text-dc-subtext">Let Spider-Sense check for existing answers first.</p>
        </div>
        <span className="text-xs text-dc-subtext">Powered by knowledge retrieval</span>
      </div>
      <div className="relative mt-4">
        <input
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-dc-border bg-dc-bg2/60 px-4 py-2.5 text-sm text-dc-text placeholder:text-dc-subtext focus:border-dc-blue/70 focus:outline-none"
          aria-label="Search doubts"
        />
        {scanning ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-dc-blue" />
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-dc-subtext">
        <span className="rounded-full border border-dc-border px-2 py-0.5">Subject filter ready</span>
        <span className="rounded-full border border-dc-border px-2 py-0.5">FAQ priority</span>
      </div>
    </div>
  )
}
