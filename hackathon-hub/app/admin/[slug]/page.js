import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { getHackathon, listSubmissions, listJudgements } from '@/lib/data'
import { deleteHackathonAction, deleteSubmissionAction } from '@/lib/actions'
import { leaderboard, fmt } from '@/lib/scoring'
import HackathonForm from '@/components/HackathonForm'
import LocalTime from '@/components/LocalTime'
import ConfirmButton from '@/components/ConfirmButton'
import { Alert, PhaseBadge, Section, SubmissionsBadge } from '@/components/ui'

export const metadata = { title: 'Manage hackathon' }

export default async function ManageHackathonPage({ params, searchParams }) {
  if (!(await isAdmin())) redirect('/admin')
  const { slug } = await params
  const { saved } = await searchParams
  const hackathon = await getHackathon(slug)
  if (!hackathon) notFound()

  const [submissions, judgements] = await Promise.all([listSubmissions(slug), listJudgements(slug)])
  const rows = leaderboard(hackathon.rubric, submissions, judgements)
  const judges = [...new Set(judgements.map((j) => j.judgeName))]
  const themeName = (id) => hackathon.themes.find((t) => t.id === id)?.title || '—'

  const links = [
    { label: 'Event page', href: `/h/${slug}` },
    { label: 'Submission form', href: `/h/${slug}/submit` },
    { label: 'Judging page', href: `/h/${slug}/judge` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-brand-600 hover:underline">← All hackathons</Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{hackathon.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <PhaseBadge hackathon={hackathon} />
            <SubmissionsBadge hackathon={hackathon} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="btn-secondary" target="_blank">
              {l.label} ↗
            </Link>
          ))}
        </div>
      </div>

      {saved && <Alert kind="success">Saved. Share the event page link with participants and the judging page link plus access code with judges.</Alert>}

      <Section
        title={`Results (${submissions.length} teams, ${judges.length} judges)`}
        action={
          submissions.length > 0 && (
            <a href={`/api/admin/${slug}/export`} className="btn-secondary px-3 py-1.5">Export CSV</a>
          )
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-slate-600">No submissions yet.</p>
        ) : (
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-2">#</th>
                  <th className="px-2 py-2">Team / project</th>
                  {hackathon.rubric.map((c) => (
                    <th key={c.id} className="px-2 py-2 text-right" title={c.name}>
                      {c.name.split(' ')[0]}
                      <div className="font-normal normal-case text-slate-400">/{c.maxScore} · {c.weight}%</div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-right">Judges</th>
                  <th className="px-6 py-2 text-right">Score /100</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.submission.id} className="border-b border-slate-100 align-top">
                    <td className="px-6 py-3 font-semibold text-slate-400">{r.average == null ? '–' : i + 1}</td>
                    <td className="px-2 py-3">
                      <div className="font-medium">{r.submission.teamName}</div>
                      <div className="text-slate-600">{r.submission.projectName}</div>
                      {r.judgements.length > 0 && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-brand-600">Judge breakdown</summary>
                          <ul className="mt-2 space-y-2">
                            {r.judgements.map((j) => (
                              <li key={j.judgeKey} className="rounded-lg bg-slate-50 p-2">
                                <div className="font-medium">
                                  {j.judgeName}: {fmt(j.total)}
                                  <span className="font-normal text-slate-500">
                                    {' '}({hackathon.rubric.map((c) => `${c.name.split(' ')[0]} ${j.scores?.[c.id] ?? '–'}`).join(', ')})
                                  </span>
                                </div>
                                {j.comments && <p className="mt-1 whitespace-pre-wrap text-slate-600">{j.comments}</p>}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    {hackathon.rubric.map((c) => (
                      <td key={c.id} className="px-2 py-3 text-right tabular-nums">{fmt(r.perCriterion[c.id])}</td>
                    ))}
                    <td className="px-2 py-3 text-right tabular-nums">{r.count}</td>
                    <td className="px-6 py-3 text-right text-base font-semibold tabular-nums">{fmt(r.average)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Submissions">
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-600">No submissions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {submissions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-start justify-between gap-4 py-3">
                <div className="min-w-0 text-sm">
                  <div className="font-medium">{s.teamName} — {s.projectName}</div>
                  <div className="text-slate-600">{s.summary}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Theme: {themeName(s.theme)} · Updated <LocalTime iso={s.updatedAt} />
                    {s.contactEmail && <> · {s.contactEmail}</>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    {[['Repo', s.repoUrl], ['Demo', s.demoUrl], ['Video', s.videoUrl], ['Slides', s.slidesUrl]]
                      .filter(([, u]) => u)
                      .map(([label, u]) => (
                        <a key={label} href={u} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{label} ↗</a>
                      ))}
                    {s.attachments?.map((a) => (
                      <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">📎 {a.name}</a>
                    ))}
                  </div>
                </div>
                <form action={deleteSubmissionAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton message={`Delete ${s.teamName}'s submission and its scores?`} className="btn-danger px-3 py-1.5">Delete</ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div>
        <h2 className="mb-3 text-xl font-semibold">Edit event page</h2>
        <HackathonForm hackathon={hackathon} />
      </div>

      <Section title="Danger zone">
        <form action={deleteHackathonAction} className="flex flex-wrap items-center justify-between gap-4">
          <input type="hidden" name="slug" value={slug} />
          <p className="text-sm text-slate-600">Deletes the event page, every submission and every score. This can't be undone.</p>
          <ConfirmButton message={`Delete ${hackathon.name} and all of its data?`} className="btn-danger">Delete hackathon</ConfirmButton>
        </form>
      </Section>
    </div>
  )
}
