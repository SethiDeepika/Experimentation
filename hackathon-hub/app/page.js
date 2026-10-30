import Link from 'next/link'
import { listHackathons } from '@/lib/data'
import { phase } from '@/lib/util'
import LocalTime from '@/components/LocalTime'
import { PhaseBadge, SubmissionsBadge } from '@/components/ui'

export default async function Home() {
  const hackathons = await listHackathons()
  const order = { live: 0, upcoming: 1, ended: 2 }
  hackathons.sort((a, b) => order[phase(a)] - order[phase(b)])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hackathons</h1>
        <p className="mt-2 text-slate-600">
          Pick your event to see the details and themes, then submit or update your team's project.
        </p>
      </div>

      {hackathons.length === 0 ? (
        <div className="card text-center">
          <p className="text-slate-600">No hackathons yet.</p>
          <Link href="/admin/new" className="btn-primary mt-4">
            Create the first hackathon
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {hackathons.map((h) => (
            <Link
              key={h.slug}
              href={`/h/${h.slug}`}
              className="card block transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex flex-wrap gap-2">
                <PhaseBadge hackathon={h} />
                <SubmissionsBadge hackathon={h} />
              </div>
              <h2 className="mt-3 text-xl font-semibold">{h.name}</h2>
              {h.tagline && <p className="mt-1 text-sm text-slate-600">{h.tagline}</p>}
              <p className="mt-4 text-xs text-slate-500">
                <LocalTime iso={h.startDate} withTime={false} /> – <LocalTime iso={h.endDate} withTime={false} />
                {h.location ? ` · ${h.location}` : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
