'use client'

import { judgeLoginAction } from '@/lib/actions'
import { Alert } from './ui'
import useFormAction from './useFormAction'

export default function JudgeLogin({ slug, name }) {
  const [state, onSubmit, pending] = useFormAction(judgeLoginAction)
  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-sm space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <h1 className="text-xl font-semibold">Judge login</h1>
        <p className="mt-1 text-sm text-slate-600">{name}</p>
      </div>
      {state?.error && <Alert>{state.error}</Alert>}
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input id="name" name="name" className="input" required autoFocus />
        <p className="hint">Your scores are saved under this name. Use the same name each time.</p>
      </div>
      <div>
        <label className="label" htmlFor="code">Judge access code</label>
        <input id="code" name="code" type="password" className="input" required />
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Checking…' : 'Start judging'}</button>
    </form>
  )
}
