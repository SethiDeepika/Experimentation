import { isAdmin } from '@/lib/auth'
import { getHackathon, listSubmissions, listJudgements } from '@/lib/data'
import { leaderboard } from '@/lib/scoring'

const cell = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(_request, { params }) {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 })
  const { slug } = await params
  const hackathon = await getHackathon(slug)
  if (!hackathon) return new Response('Not found', { status: 404 })

  const rows = leaderboard(hackathon.rubric, await listSubmissions(slug), await listJudgements(slug))
  const theme = (id) => hackathon.themes.find((t) => t.id === id)?.title || ''
  const header = [
    'Rank', 'Team', 'Project', 'Theme', 'Members', 'Contact', 'Repo', 'Demo', 'Video', 'Slides',
    ...hackathon.rubric.map((c) => `${c.name} (avg /${c.maxScore})`),
    'Judges', 'Score /100',
  ]
  const lines = rows.map((r, i) => {
    const s = r.submission
    return [
      r.average == null ? '' : i + 1, s.teamName, s.projectName, theme(s.theme),
      (s.members || '').replace(/\n/g, '; '), s.contactEmail, s.repoUrl, s.demoUrl, s.videoUrl, s.slidesUrl,
      ...hackathon.rubric.map((c) => r.perCriterion[c.id]?.toFixed(2) ?? ''),
      r.count, r.average?.toFixed(2) ?? '',
    ]
  })
  const csv = [header, ...lines].map((l) => l.map(cell).join(',')).join('\n')
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-results.csv"`,
    },
  })
}
