import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">That hackathon or submission doesn't exist (or was deleted).</p>
      <Link href="/" className="btn-primary mt-4">See all hackathons</Link>
    </div>
  )
}
