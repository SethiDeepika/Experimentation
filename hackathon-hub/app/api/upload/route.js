import { handleUpload } from '@vercel/blob/client'
import { getHackathonRaw, getSubmissionRaw } from '@/lib/data'
import { verifySecret } from '@/lib/auth'
import { nameKey, submissionsOpen } from '@/lib/util'

// Issues short-lived tokens so browsers can upload attachments straight to
// Vercel Blob (this keeps large files off the serverless function).
export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: 'File uploads are not enabled.' }, { status: 400 })
  }
  const body = await request.json()
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const { slug, teamName, passcode } = JSON.parse(clientPayload || '{}')
        const hackathon = await getHackathonRaw(slug)
        if (!hackathon || !submissionsOpen(hackathon)) throw new Error('Submissions are closed.')
        if (!nameKey(teamName) || String(passcode || '').length < 4) {
          throw new Error('Enter your team name and passcode before attaching files.')
        }
        const existing = await getSubmissionRaw(slug, nameKey(teamName))
        if (existing && !verifySecret(passcode, existing.passcodeHash)) {
          throw new Error('That passcode does not match this team.')
        }
        return {
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: true,
          allowedContentTypes: [
            'application/pdf',
            'application/zip',
            'application/x-zip-compressed',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/*',
            'video/*',
            'text/plain',
            'text/markdown',
          ],
        }
      },
      onUploadCompleted: async () => {},
    })
    return Response.json(result)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
