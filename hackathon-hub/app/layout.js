import Link from 'next/link'
import './globals.css'
import { storageMode } from '@/lib/store'
import { Alert } from '@/components/ui'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: { default: 'Hackathon Hub', template: '%s · Hackathon Hub' },
  description: 'Hackathon event pages, team submissions and judging in one place.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">⚡</span>
              Hackathon Hub
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium">
              <Link href="/" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
                Hackathons
              </Link>
              <Link href="/admin" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
                Organizers
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          {storageMode === 'unconfigured' && (
            <div className="mb-6">
              <Alert kind="warning">
                <strong>Storage is not connected.</strong> In your Vercel project, open the Storage tab, add
                Upstash Redis (free), connect it to this project and redeploy. Until then nothing can be saved.
              </Alert>
            </div>
          )}
          {storageMode === 'file' && process.env.NODE_ENV !== 'production' && (
            <div className="mb-6">
              <Alert kind="info">Local development: data is saved to .data/db.json.</Alert>
            </div>
          )}
          {children}
        </main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-slate-400">Hackathon Hub</footer>
      </body>
    </html>
  )
}
