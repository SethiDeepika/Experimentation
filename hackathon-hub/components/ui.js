import { phase, submissionsOpen } from '@/lib/util'

export function Alert({ kind = 'error', children }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-brand-100 bg-brand-50 text-brand-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  }
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[kind]}`}>{children}</div>
}

export function PhaseBadge({ hackathon }) {
  const p = phase(hackathon)
  const styles = {
    upcoming: 'bg-sky-100 text-sky-800',
    live: 'bg-emerald-100 text-emerald-800',
    ended: 'bg-slate-200 text-slate-700',
  }
  const label = { upcoming: 'Upcoming', live: 'Live', ended: 'Ended' }[p]
  return <span className={`badge ${styles[p]}`}>{label}</span>
}

export function SubmissionsBadge({ hackathon }) {
  return submissionsOpen(hackathon) ? (
    <span className="badge bg-brand-100 text-brand-700">Submissions open</span>
  ) : (
    <span className="badge bg-slate-100 text-slate-600">Submissions closed</span>
  )
}

export function Section({ title, children, action }) {
  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Prose({ text }) {
  if (!text) return null
  return <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{text}</div>
}
