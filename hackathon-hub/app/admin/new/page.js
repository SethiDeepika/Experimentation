import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import HackathonForm from '@/components/HackathonForm'

export const metadata = { title: 'New hackathon' }

export default async function NewHackathonPage() {
  if (!(await isAdmin())) redirect('/admin')
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New hackathon</h1>
        <p className="mt-1 text-slate-600">
          This creates a public event page with a submission link, plus a judging page that uses your rubric.
        </p>
      </div>
      <HackathonForm />
    </div>
  )
}
