// Scores are normalised to 0–100: each criterion contributes
// (score / maxScore) × weight, divided by the sum of all weights.

export function weightedTotal(rubric, scores = {}) {
  const totalWeight = rubric.reduce((sum, c) => sum + Number(c.weight || 0), 0)
  if (!totalWeight) return 0
  const points = rubric.reduce((sum, c) => {
    const raw = Math.min(Math.max(Number(scores[c.id] ?? 0), 0), c.maxScore)
    return sum + (raw / c.maxScore) * Number(c.weight || 0)
  }, 0)
  return (points / totalWeight) * 100
}

export function leaderboard(rubric, submissions, judgements) {
  const rows = submissions.map((submission) => {
    const mine = judgements.filter((j) => j.submissionId === submission.id)
    const totals = mine.map((j) => weightedTotal(rubric, j.scores))
    const perCriterion = Object.fromEntries(
      rubric.map((c) => [
        c.id,
        mine.length ? mine.reduce((s, j) => s + Number(j.scores?.[c.id] ?? 0), 0) / mine.length : null,
      ])
    )
    return {
      submission,
      judgements: mine.map((j, i) => ({ ...j, total: totals[i] })),
      count: mine.length,
      average: mine.length ? totals.reduce((a, b) => a + b, 0) / mine.length : null,
      perCriterion,
    }
  })
  rows.sort((a, b) => (b.average ?? -1) - (a.average ?? -1))
  return rows
}

export const fmt = (n, digits = 1) => (n == null ? '—' : Number(n).toFixed(digits))
