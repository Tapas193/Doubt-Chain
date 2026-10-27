import { ReactNode } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import MobileNavigation from '../components/MobileNavigation'

type AppShellProps = { children: ReactNode }

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen bg-dc-bg text-dc-text">
      <div className="dc-grid-bg" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 lg:px-6 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
      <MobileNavigation />
    </div>
  )
}
