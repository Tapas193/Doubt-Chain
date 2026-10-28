import { ReactNode, useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import MobileNavigation from '../components/MobileNavigation'
import CommandPalette from '../components/CommandPalette'

type AppShellProps = { children: ReactNode }

export default function AppShell({ children }: AppShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
      // '/' when not in an input/textarea
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative flex min-h-screen bg-dc-bg text-dc-text">
      <div className="dc-grid-bg" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <TopBar onOpenPalette={() => setPaletteOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 lg:px-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
      <MobileNavigation />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
