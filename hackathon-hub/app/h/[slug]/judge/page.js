import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getJudge } from '@/lib/auth'
import { getHackathon, listSubmissions, listJudgements } from '@/lib/data'
import { judgeLogoutAction } from '@/lib/actions'
import { nameKey } from '@/lib/util'
import { weightedTotal, fmt } from '@/lib/scoring'
import JudgeLogin from '@/components/JudgeLogin'
import { Section } from '@/components/ui'

export async function generateMetadata({ params }) {
  const h = await getHackathon((await params).slug)
  return { title: h ? `Judging · ${h.name}` : 'Judging' }
}

export default async function JudgePage({ params }) {
  const { slug } = await params
  const h = await getHackathon(slug)
  if (!h) notFound()
  const judge = await getJudge(slug)
  if (!judge) return <JudgeLogin slug={slug} name={h.name} />

  const judgeKey = nameKey(judge.name)
  const [submissions, judgements] = await Promise.all([listSubmissions(slug), listJudgements(slug)])
  const mine = Object.fromEntries(judgements.filter((j) => j.judgeKey === judgeKey).map((j) => [j.submissionId, j]))
  const done = submissions.filter((s) => mine[s.id]).length
  const themeName = (id) => h.themes.find((t) => t.id === id)?.title

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/h/${slug}`} className="text-sm text-brand-600 hover:underline">← {h.name}</Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Judging</h1>
          <p className="mt-1 text-slate-600">Signed in as <strong>{judge.name}</strong></p>
        </div>
        <form action={judgeLogoutAction}>
          <input type="hidden" name="slug" value={slug} />
          <button className="btn-secondary">Log out</button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Your progress</span>
          <span className="tabular-nums text-slate-600">{done} / {submissions.length} scored</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${submissions.length ? (done / submissions.length) * 100 : 0}%` }} />
        </div>
      </div>

      <Section title="Submissions">
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-600">No submissions yet. Check back after teams submit.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {submissions.map((s) => {
              const j = mine[s.id]
              return (
                <li key={s.id}>
                  <Link href={`/h/${slug}/judge/${s.id}`} className="-mx-3 flex items-center justify-between gap-4 rounded-lg px-3 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="font-medium">{s.projectName} <span className="font-normal text-slate-500">by {s.teamName}</span></div>
                      <div className="truncate text-sm text-slate-600">{s.summary}</div>
                      {themeName(s.theme) && <div className="mt-1 text-xs text-slate-500">{themeName(s.theme)}</div>}
                    </div>
                    {j ? (
                      <span className="badge shrink-0 bg-emerald-100 text-emerald-800">Scored · {fmt(weightedTotal(h.rubric, j.scores))}</span>
                    ) : (
                      <span className="badge shrink-0 bg-amber-100 text-amber-900">To score</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section title="Rubric">
        <ul className="space-y-2 text-sm">
          {h.rubric.map((c) => (
            <li key={c.id}>
              <span className="font-medium">{c.name}</span>
              <span className="text-slate-500"> · {c.weight}% · scored 0–{c.maxScore}</span>
              {c.description && <p className="text-slate-600">{c.description}</p>}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
