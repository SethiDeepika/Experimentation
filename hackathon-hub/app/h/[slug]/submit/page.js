import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getHackathon } from '@/lib/data'
import { submissionsOpen } from '@/lib/util'
import SubmitForm from '@/components/SubmitForm'
import LocalTime from '@/components/LocalTime'
import { Alert } from '@/components/ui'

export async function generateMetadata({ params }) {
  const h = await getHackathon((await params).slug)
  return { title: h ? `Submit · ${h.name}` : 'Submit' }
}

export default async function SubmitPage({ params }) {
  const { slug } = await params
  const h = await getHackathon(slug)
  if (!h) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/h/${slug}`} className="text-sm text-brand-600 hover:underline">← {h.name}</Link>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Submit your project</h1>
        {h.submissionDeadline && (
          <p className="mt-1 text-slate-600">
            Deadline: <LocalTime iso={h.submissionDeadline} />. You can update your submission as many times as you like until then.
          </p>
        )}
      </div>
      {submissionsOpen(h) ? (
        <SubmitForm hackathon={h} blobEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
      ) : (
        <Alert kind="warning">Submissions for {h.name} are closed.</Alert>
      )}
    </div>
  )
}
