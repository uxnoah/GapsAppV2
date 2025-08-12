import Link from 'next/link'
import { getOptionalSession } from '@/lib/auth'
import LogoutButton from '@/components/logout-button'

export default async function AppHeader() {
  const session = await getOptionalSession()

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="text-sm font-semibold">
          <Link href="/" className="hover:underline" aria-label="Go to canvas">GAPS</Link>
        </div>
        <nav className="flex items-center gap-4" aria-label="Primary">
          <Link href="/" className="text-sm text-gray-700 hover:underline" aria-label="Canvas">Canvas</Link>
          <Link href="/menu" className="text-sm text-gray-700 hover:underline" aria-label="Menu">Menu</Link>
          <Link href="/settings" className="text-sm text-gray-700 hover:underline" aria-label="Settings">Settings</Link>
        </nav>
        <div className="flex items-center gap-3">
          {session?.email ? (
            <span className="text-sm text-gray-700" aria-label="Signed in user email">{session.email}</span>
          ) : (
            <span className="text-sm text-gray-500">Not signed in</span>
          )}
          {session?.email ? <LogoutButton /> : null}
        </div>
      </div>
    </header>
  )
}


