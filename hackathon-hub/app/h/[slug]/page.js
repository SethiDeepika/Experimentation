import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getHackathon, listSubmissions } from '@/lib/data'
import { submissionsOpen } from '@/lib/util'
import LocalTime from '@/components/LocalTime'
import { PhaseBadge, Prose, Section, SubmissionsBadge } from '@/components/ui'

export async function generateMetadata({ params }) {
  const h = await getHackathon((await params).slug)
  return { title: h?.name || 'Hackathon', description: h?.tagline }
}

export default async function HackathonPage({ params }) {
  const { slug } = await params
  const h = await getHackathon(slug)
  if (!h) notFound()
  const submissions = await listSubmissions(slug)
  const open = submissionsOpen(h)
  const themeName = (id) => h.themes.find((t) => t.id === id)?.title

  const timeline = [
    { label: 'Hacking starts', iso: h.startDate },
    { label: 'Submission deadline', iso: h.submissionDeadline },
    { label: 'Event ends', iso: h.endDate },
  ].filter((t) => t.iso)

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-500 p-8 text-white shadow-lg sm:p-10">
        <div className="flex flex-wrap gap-2">
          <PhaseBadge hackathon={h} />
          <SubmissionsBadge hackathon={h} />
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{h.name}</h1>
        {h.tagline && <p className="mt-3 max-w-2xl text-lg text-brand-50">{h.tagline}</p>}
        <p className="mt-4 text-sm text-brand-100">
          <LocalTime iso={h.startDate} /> – <LocalTime iso={h.endDate} />
          {h.location && <> · {h.location}</>}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {open ? (
            <Link href={`/h/${slug}/submit`} className="btn bg-white px-5 py-3 text-base text-brand-700 shadow hover:bg-brand-50">
              Submit or update your project →
            </Link>
          ) : (
            <span className="rounded-lg bg-white/15 px-4 py-3 text-sm">Submissions are closed</span>
          )}
          {open && h.submissionDeadline && (
            <span className="text-sm text-brand-50">
              Deadline: <LocalTime iso={h.submissionDeadline} />
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {h.description && (
            <Section title="About">
              <Prose text={h.description} />
            </Section>
          )}

          {h.themes.length > 0 && (
            <Section title="Themes">
              <div className="grid gap-3 sm:grid-cols-2">
                {h.themes.map((t, i) => (
                  <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">Theme {i + 1}</div>
                    <div className="mt-1 font-semibold">{t.title}</div>
                    {t.description && <p className="mt-1 text-sm text-slate-600">{t.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {h.rules && (
            <Section title="Rules & requirements">
              <Prose text={h.rules} />
            </Section>
          )}

          <Section title="How projects are judged">
            <ul className="space-y-3">
              {h.rubric.map((c) => (
                <li key={c.id} className="flex gap-4">
                  <span className="w-12 shrink-0 text-right text-lg font-semibold tabular-nums text-brand-600">{c.weight}%</span>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.description && <p className="text-sm text-slate-600">{c.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="space-y-6">
          {timeline.length > 0 && (
            <Section title="Timeline">
              <ol className="space-y-3 border-l-2 border-brand-100 pl-4">
                {timeline.map((t) => (
                  <li key={t.label}>
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="text-sm text-slate-600"><LocalTime iso={t.iso} /></div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {h.prizes && (
            <Section title="Prizes">
              <Prose text={h.prizes} />
            </Section>
          )}

          <Section title={`Teams submitted (${submissions.length})`}>
            {submissions.length === 0 ? (
              <p className="text-sm text-slate-600">No submissions yet. Be the first!</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {submissions.map((s) => (
                  <li key={s.id}>
                    <div className="font-medium">{s.teamName}</div>
                    <div className="text-slate-600">
                      {s.projectName}
                      {themeName(s.theme) && <span className="text-slate-400"> · {themeName(s.theme)}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {h.contact && (
            <Section title="Questions?">
              <p className="text-sm text-slate-700">{h.contact}</p>
            </Section>
          )}

          <p className="text-center text-xs text-slate-500">
            Judging? <Link href={`/h/${slug}/judge`} className="text-brand-600 hover:underline">Go to the judging page</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
