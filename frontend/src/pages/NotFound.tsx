import AppShell from '../layouts/AppShell'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <AppShell>
      <section className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-dc-subtext">The page you are looking for does not exist.</p>
        <Link to="/" className="text-sm text-dc-blue hover:underline">
          Back to dashboard
        </Link>
      </section>
    </AppShell>
  )
}
