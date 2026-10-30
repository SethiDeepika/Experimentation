'use client'

import { useState, useTransition } from 'react'
import { upload } from '@vercel/blob/client'
import { loadSubmissionAction, saveSubmissionAction } from '@/lib/actions'
import { Alert } from './ui'
import LocalTime from './LocalTime'
import useFormAction from './useFormAction'

const EMPTY = {
  members: '',
  contactEmail: '',
  projectName: '',
  theme: '',
  summary: '',
  description: '',
  repoUrl: '',
  demoUrl: '',
  videoUrl: '',
  slidesUrl: '',
  attachments: [],
}

function TextField({ label, name, values, set, hint, required, type = 'text', placeholder }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}{required && ' *'}</label>
      <input
        id={name}
        name={name}
        type={type}
        className="input"
        required={required}
        placeholder={placeholder}
        value={values[name]}
        onChange={(e) => set({ [name]: e.target.value })}
      />
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

export default function SubmitForm({ hackathon, blobEnabled }) {
  const [team, setTeam] = useState({ teamName: '', passcode: '' })
  const [step, setStep] = useState('team') // team → project
  const [existing, setExisting] = useState(null)
  const [lookupError, setLookupError] = useState(null)
  const [looking, startLookup] = useTransition()
  const [values, setValues] = useState(EMPTY)
  const set = (patch) => setValues((v) => ({ ...v, ...patch }))
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [state, onSubmit, pending] = useFormAction(saveSubmissionAction)

  const lookup = (e) => {
    e.preventDefault()
    setLookupError(null)
    if (team.passcode.length < 4) {
      setLookupError('The passcode must be at least 4 characters.')
      return
    }
    startLookup(async () => {
      const res = await loadSubmissionAction(hackathon.slug, team.teamName, team.passcode)
      if (res.error) return setLookupError(res.error)
      if (res.submission) {
        const { teamName, id, createdAt, updatedAt, ...fields } = res.submission
        setExisting(res.submission)
        setTeam((t) => ({ ...t, teamName }))
        setValues({ ...EMPTY, ...fields, attachments: fields.attachments || [] })
      } else {
        setExisting(null)
        setValues(EMPTY)
      }
      setStep('project')
    })
  }

  const attach = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const blob = await upload(`${hackathon.slug}/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: JSON.stringify({ slug: hackathon.slug, ...team }),
      })
      set({ attachments: [...values.attachments, { url: blob.url, name: file.name, size: file.size }] })
    } catch (err) {
      setUploadError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  if (step === 'team') {
    return (
      <form onSubmit={lookup} className="card max-w-lg space-y-4">
        <div>
          <h2 className="text-lg font-semibold">1. Your team</h2>
          <p className="mt-1 text-sm text-slate-600">
            New team? Choose a team name and a passcode. Already submitted? Enter the same team name and passcode to edit your submission.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="teamName">Team name *</label>
          <input id="teamName" className="input" required maxLength={60} value={team.teamName} onChange={(e) => setTeam({ ...team, teamName: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="passcode">Team passcode *</label>
          <input id="passcode" type="password" className="input" required minLength={4} value={team.passcode} onChange={(e) => setTeam({ ...team, passcode: e.target.value })} />
          <p className="hint">Share it only with your teammates. Anyone on the team can use it to update the submission.</p>
        </div>
        {lookupError && <Alert>{lookupError}</Alert>}
        <button className="btn-primary" disabled={looking}>{looking ? 'Checking…' : 'Continue'}</button>
      </form>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="slug" value={hackathon.slug} />
      <input type="hidden" name="teamName" value={team.teamName} />
      <input type="hidden" name="passcode" value={team.passcode} />
      <input type="hidden" name="attachments" value={JSON.stringify(values.attachments)} />

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          {existing ? (
            <>Editing <strong>{team.teamName}</strong>'s submission · last updated <LocalTime iso={state?.updatedAt || existing.updatedAt} /></>
          ) : (
            <>New submission for team <strong>{team.teamName}</strong></>
          )}
        </div>
        <button type="button" className="text-sm text-brand-600 hover:underline" onClick={() => setStep('team')}>
          Switch team
        </button>
      </div>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">2. Team details</h2>
        <div>
          <label className="label" htmlFor="members">Team members</label>
          <textarea id="members" name="members" rows={3} className="input" placeholder={'One per line, e.g.\nAsha Rao (asha@example.com)'} value={values.members} onChange={(e) => set({ members: e.target.value })} />
        </div>
        <TextField label="Contact email" name="contactEmail" type="email" values={values} set={set} hint="Only organizers see this." />
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">3. Your project</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Project name" name="projectName" required values={values} set={set} />
          {hackathon.themes.length > 0 && (
            <div>
              <label className="label" htmlFor="theme">Theme</label>
              <select id="theme" name="theme" className="input" value={values.theme} onChange={(e) => set({ theme: e.target.value })}>
                <option value="">Select a theme…</option>
                {hackathon.themes.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <TextField label="One-line summary" name="summary" required values={values} set={set} placeholder="What does it do, in one sentence?" />
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={6} className="input" placeholder="The problem, your solution, how it works, what you'd do next…" value={values.description} onChange={(e) => set({ description: e.target.value })} />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">4. Links & files</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Code repository" name="repoUrl" type="url" placeholder="https://github.com/…" values={values} set={set} />
          <TextField label="Live demo" name="demoUrl" type="url" placeholder="https://…" values={values} set={set} />
          <TextField label="Demo video" name="videoUrl" type="url" placeholder="https://youtu.be/…" values={values} set={set} />
          <TextField label="Slides / docs" name="slidesUrl" type="url" placeholder="https://docs.google.com/…" values={values} set={set} />
        </div>
        {blobEnabled ? (
          <div>
            <label className="label">Attachments</label>
            <ul className="mb-2 space-y-1 text-sm">
              {values.attachments.map((a) => (
                <li key={a.url} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <a href={a.url} target="_blank" rel="noreferrer" className="truncate text-brand-600 hover:underline">📎 {a.name}</a>
                  <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => set({ attachments: values.attachments.filter((x) => x.url !== a.url) })}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {values.attachments.length < 5 && (
              <label className={`btn-secondary cursor-pointer ${uploading ? 'opacity-60' : ''}`}>
                {uploading ? 'Uploading…' : '+ Attach a file'}
                <input type="file" className="hidden" disabled={uploading} onChange={attach} accept=".pdf,.zip,.ppt,.pptx,.docx,.txt,.md,image/*,video/*" />
              </label>
            )}
            <p className="hint">PDF, slides, ZIP, images or video, up to 50 MB each, max 5 files.</p>
            {uploadError && <div className="mt-2"><Alert>{uploadError}</Alert></div>}
          </div>
        ) : (
          <p className="hint">Upload files to Google Drive, GitHub or YouTube and paste the links above.</p>
        )}
      </section>

      {state?.error && <Alert>{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.message}</Alert>}
      <div className="flex justify-end">
        <button className="btn-primary px-6 py-3" disabled={pending || uploading}>
          {pending ? 'Saving…' : existing || state?.ok ? 'Save changes' : 'Submit project'}
        </button>
      </div>
    </form>
  )
}
