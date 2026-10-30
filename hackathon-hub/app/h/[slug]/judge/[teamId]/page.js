import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getJudge } from '@/lib/auth'
import { getHackathon, getSubmission, listSubmissions, listJudgements } from '@/lib/data'
import { nameKey } from '@/lib/util'
import ScoreForm from '@/components/ScoreForm'
import LocalTime from '@/components/LocalTime'
import { Prose, Section } from '@/components/ui'

export const metadata = { title: 'Score submission' }

export default async function ScorePage({ params }) {
  const { slug, teamId } = await params
  const h = await getHackathon(slug)
  if (!h) notFound()
  const judge = await getJudge(slug)
  if (!judge) redirect(`/h/${slug}/judge`)
  const s = await getSubmission(slug, teamId)
  if (!s) notFound()

  const judgeKey = nameKey(judge.name)
  const [submissions, judgements] = await Promise.all([listSubmissions(slug), listJudgements(slug)])
  const scored = new Set(judgements.filter((j) => j.judgeKey === judgeKey).map((j) => j.submissionId))
  const existing = judgements.find((j) => j.judgeKey === judgeKey && j.submissionId === s.id)
  const index = submissions.findIndex((x) => x.id === s.id)
  const next = [...submissions.slice(index + 1), ...submissions.slice(0, index)].find((x) => !scored.has(x.id))
  const theme = h.themes.find((t) => t.id === s.theme)?.title

  const links = [
    ['Code repository', s.repoUrl],
    ['Live demo', s.demoUrl],
    ['Demo video', s.videoUrl],
    ['Slides / docs', s.slidesUrl],
  ].filter(([, u]) => u)

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/h/${slug}/judge`} className="text-sm text-brand-600 hover:underline">← All submissions</Link>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{s.projectName}</h1>
        <p className="mt-1 text-slate-600">
          by <strong>{s.teamName}</strong>
          {theme && <> · {theme}</>} · updated <LocalTime iso={s.updatedAt} />
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Section title="Project">
            <p className="font-medium">{s.summary}</p>
            <div className="mt-3"><Prose text={s.description} /></div>
          </Section>
          {(links.length > 0 || s.attachments?.length > 0) && (
            <Section title="Links & files">
              <ul className="space-y-2 text-sm">
                {links.map(([label, u]) => (
                  <li key={label}>
                    <span className="text-slate-500">{label}: </span>
                    <a href={u} target="_blank" rel="noreferrer" className="break-all text-brand-600 hover:underline">{u}</a>
                  </li>
                ))}
                {s.attachments?.map((a) => (
                  <li key={a.url}>
                    <a href={a.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">📎 {a.name}</a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {s.members && (
            <Section title="Team">
              <Prose text={s.members} />
            </Section>
          )}
        </div>
        <div className="lg:col-span-2">
          <div className="card lg:sticky lg:top-6">
            <h2 className="mb-4 text-lg font-semibold">Your score</h2>
            <ScoreForm slug={slug} submissionId={s.id} rubric={h.rubric} existing={existing} nextId={next?.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
