'use client'

import { useActionState } from 'react'
import { adminLoginAction } from '@/lib/actions'
import { Alert } from './ui'

export default function AdminLogin({ configured }) {
  const [state, action, pending] = useActionState(adminLoginAction, null)
  return (
    <form action={action} className="card mx-auto max-w-sm space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Organizer login</h1>
        <p className="mt-1 text-sm text-slate-600">Create hackathon pages, manage submissions and see judging results.</p>
      </div>
      {!configured && (
        <Alert kind="warning">ADMIN_PASSWORD is not set for this deployment. Add it under Settings → Environment Variables and redeploy.</Alert>
      )}
      {state?.error && <Alert>{state.error}</Alert>}
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" required autoFocus />
      </div>
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? 'Checking…' : 'Log in'}
      </button>
    </form>
  )
}
