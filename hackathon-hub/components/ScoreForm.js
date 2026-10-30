'use client'

import Link from 'next/link'
import { useState } from 'react'
import { saveScoreAction } from '@/lib/actions'
import { weightedTotal, fmt } from '@/lib/scoring'
import { Alert } from './ui'
import useFormAction from './useFormAction'

function ScorePicker({ criterion, value, onChange }) {
  const { id, maxScore } = criterion
  if (maxScore > 10) {
    return (
      <input type="number" min={0} max={maxScore} step="any" className="input w-28" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} aria-label={criterion.name} />
    )
  }
  return (
    <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={criterion.name}>
      {Array.from({ length: maxScore + 1 }, (_, n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          id={n === 0 ? `score-${id}` : undefined}
          onClick={() => onChange(n)}
          className={`h-9 w-9 rounded-lg border text-sm font-semibold tabular-nums transition ${
            value === n ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-500'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export default function ScoreForm({ slug, submissionId, rubric, existing, nextId }) {
  const [scores, setScores] = useState(existing?.scores || {})
  const [comments, setComments] = useState(existing?.comments || '')
  const [state, onSubmit, pending] = useFormAction(saveScoreAction)
  const complete = rubric.every((c) => scores[c.id] !== undefined)

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="submissionId" value={submissionId} />
      {rubric.map((c) => (
        <input key={c.id} type="hidden" name={`score_${c.id}`} value={scores[c.id] ?? ''} />
      ))}

      {rubric.map((c) => (
        <div key={c.id} className="border-b border-slate-100 pb-4">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor={`score-${c.id}`} className="font-medium">{c.name}</label>
            <span className="text-xs text-slate-500">{c.weight}% · 0–{c.maxScore}</span>
          </div>
          {c.description && <p className="mb-2 text-sm text-slate-600">{c.description}</p>}
          <ScorePicker criterion={c} value={scores[c.id]} onChange={(v) => setScores({ ...scores, [c.id]: v })} />
        </div>
      ))}

      <div>
        <label className="label" htmlFor="comments">Comments & feedback</label>
        <textarea id="comments" name="comments" rows={4} className="input" placeholder="Strengths, concerns, questions for the team…" value={comments} onChange={(e) => setComments(e.target.value)} />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
        <span className="text-sm font-medium text-brand-700">Weighted score</span>
        <span className="text-2xl font-bold tabular-nums text-brand-700">
          {complete ? fmt(weightedTotal(rubric, scores)) : '—'}
          <span className="text-sm font-normal"> / 100</span>
        </span>
      </div>

      {state?.error && <Alert>{state.error}</Alert>}
      {state?.ok && (
        <Alert kind="success">
          Score saved.{' '}
          {nextId ? (
            <Link href={`/h/${slug}/judge/${nextId}`} className="font-semibold underline">Next unscored team →</Link>
          ) : (
            <Link href={`/h/${slug}/judge`} className="font-semibold underline">Back to all submissions</Link>
          )}
        </Alert>
      )}
      <button className="btn-primary w-full py-3" disabled={pending || !complete}>
        {pending ? 'Saving…' : existing || state?.ok ? 'Update score' : 'Save score'}
      </button>
      {!complete && <p className="hint text-center">Score every criterion to save.</p>}
    </form>
  )
}
