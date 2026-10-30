import Link from 'next/link'
import { isAdmin, adminPasswordConfigured } from '@/lib/auth'
import { listHackathons, listSubmissions, listJudgements } from '@/lib/data'
import { adminLogoutAction } from '@/lib/actions'
import AdminLogin from '@/components/AdminLogin'
import LocalTime from '@/components/LocalTime'
import { PhaseBadge, SubmissionsBadge } from '@/components/ui'

export const metadata = { title: 'Organizers' }

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin configured={adminPasswordConfigured()} />

  const hackathons = await listHackathons()
  const stats = await Promise.all(
    hackathons.map(async (h) => ({
      submissions: (await listSubmissions(h.slug)).length,
      judgements: (await listJudgements(h.slug)).length,
    }))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizer dashboard</h1>
          <p className="mt-1 text-slate-600">Each hackathon gets its own public page, submission form and judging page.</p>
        </div>
        <div className="flex gap-2">
          <form action={adminLogoutAction}>
            <button className="btn-secondary">Log out</button>
          </form>
          <Link href="/admin/new" className="btn-primary">+ New hackathon</Link>
        </div>
      </div>

      {hackathons.length === 0 ? (
        <div className="card text-center text-slate-600">No hackathons yet. Create one to get a shareable event page.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Hackathon</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3 text-right">Teams</th>
                <th className="px-4 py-3 text-right">Scores</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hackathons.map((h, i) => (
                <tr key={h.slug}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{h.name}</div>
                    <div className="text-xs text-slate-500">/h/{h.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <PhaseBadge hackathon={h} />
                      <SubmissionsBadge hackathon={h} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600"><LocalTime iso={h.submissionDeadline} /></td>
                  <td className="px-4 py-3 text-right tabular-nums">{stats[i].submissions}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{stats[i].judgements}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/h/${h.slug}`} className="btn-secondary px-3 py-1.5">View</Link>
                      <Link href={`/admin/${h.slug}`} className="btn-primary px-3 py-1.5">Manage</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
