'use client'

import { useEffect, useState } from 'react'
import { saveHackathonAction } from '@/lib/actions'
import { DEFAULT_RUBRIC, newId, slugify } from '@/lib/util'
import { Alert } from './ui'
import useFormAction from './useFormAction'

// <input type="datetime-local"> works in the browser's time zone; the server
// stores ISO timestamps.
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toIso = (local) => (local ? new Date(local).toISOString() : '')

function DateField({ name, label, iso, hint }) {
  const [local, setLocal] = useState('')
  useEffect(() => setLocal(toLocalInput(iso)), [iso])
  return (
    <div>
      <label className="label" htmlFor={`${name}-local`}>{label}</label>
      <input id={`${name}-local`} type="datetime-local" className="input" value={local} onChange={(e) => setLocal(e.target.value)} />
      <input type="hidden" name={name} value={toIso(local)} />
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

function ListEditor({ items, setItems, render, blank, addLabel }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const move = (index, dir) => {
    const next = [...items]
    const [it] = next.splice(index, 1)
    next.splice(index + dir, 0, it)
    setItems(next)
  }
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={it.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          {render(it, (patch) => update(it.id, patch))}
          <div className="mt-3 flex justify-end gap-2 text-xs">
            <button type="button" className="btn-secondary px-2 py-1" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button type="button" className="btn-secondary px-2 py-1" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button type="button" className="btn-danger px-2 py-1" onClick={() => remove(it.id)}>Remove</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={() => setItems([...items, { ...blank, id: newId() }])}>
        + {addLabel}
      </button>
    </div>
  )
}

export default function HackathonForm({ hackathon }) {
  const editing = Boolean(hackathon)
  const [state, onSubmit, pending] = useFormAction(saveHackathonAction)
  const [name, setName] = useState(hackathon?.name || '')
  const [slug, setSlug] = useState(hackathon?.slug || '')
  const [slugTouched, setSlugTouched] = useState(editing)
  const [themes, setThemes] = useState(hackathon?.themes || [])
  const [rubric, setRubric] = useState(hackathon?.rubric || DEFAULT_RUBRIC)

  const totalWeight = rubric.reduce((s, c) => s + (Number(c.weight) || 0), 0)
  const shownSlug = slugTouched ? slug : slugify(name)

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {editing && <input type="hidden" name="originalSlug" value={hackathon.slug} />}
      <input type="hidden" name="themes" value={JSON.stringify(themes)} />
      <input type="hidden" name="rubric" value={JSON.stringify(rubric)} />

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Event details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Hackathon name *</label>
            <input id="name" name="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring Build Week 2026" />
          </div>
          <div>
            <label className="label" htmlFor="slug">Page URL</label>
            <div className="flex items-center rounded-lg border border-slate-300 bg-white text-sm shadow-sm focus-within:border-brand-500">
              <span className="pl-3 text-slate-400">/h/</span>
              <input
                id="slug"
                name="slug"
                className="w-full rounded-r-lg bg-transparent px-1 py-2 focus:outline-none disabled:text-slate-500"
                value={shownSlug}
                disabled={editing}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
              />
            </div>
            <p className="hint">{editing ? 'The URL cannot change after creation.' : 'Generated from the name; you can edit it.'}</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="tagline">Tagline</label>
          <input id="tagline" name="tagline" className="input" defaultValue={hackathon?.tagline} placeholder="48 hours to build something people love" />
        </div>
        <div>
          <label className="label" htmlFor="description">About the event</label>
          <textarea id="description" name="description" rows={6} className="input" defaultValue={hackathon?.description} placeholder="What is this hackathon about, who can take part, schedule highlights…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="location">Location / format</label>
            <input id="location" name="location" className="input" defaultValue={hackathon?.location} placeholder="Online, or Bengaluru office" />
          </div>
          <div>
            <label className="label" htmlFor="contact">Contact for questions</label>
            <input id="contact" name="contact" className="input" defaultValue={hackathon?.contact} placeholder="#hackathon Slack channel or email" />
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Dates & submissions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <DateField name="startDate" label="Starts" iso={hackathon?.startDate} />
          <DateField name="endDate" label="Ends" iso={hackathon?.endDate} />
          <DateField name="submissionDeadline" label="Submission deadline" iso={hackathon?.submissionDeadline} hint="Teams can't submit or edit after this." />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="acceptingSubmissions" defaultChecked={hackathon ? hackathon.acceptingSubmissions : true} className="h-4 w-4 rounded border-slate-300" />
          Accept submissions (untick to close submissions at any time)
        </label>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Themes / tracks</h2>
          <p className="text-sm text-slate-600">Teams pick one when they submit.</p>
        </div>
        <ListEditor
          items={themes}
          setItems={setThemes}
          blank={{ title: '', description: '' }}
          addLabel="Add theme"
          render={(t, set) => (
            <div className="grid gap-3">
              <input className="input" placeholder="Theme title, e.g. AI for Good" value={t.title} onChange={(e) => set({ title: e.target.value })} />
              <textarea className="input" rows={2} placeholder="What kind of projects fit this theme?" value={t.description} onChange={(e) => set({ description: e.target.value })} />
            </div>
          )}
        />
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Prizes & rules</h2>
        <div>
          <label className="label" htmlFor="prizes">Prizes</label>
          <textarea id="prizes" name="prizes" rows={3} className="input" defaultValue={hackathon?.prizes} placeholder={'1st place: …\n2nd place: …\nBest in theme: …'} />
        </div>
        <div>
          <label className="label" htmlFor="rules">Rules & submission requirements</label>
          <textarea id="rules" name="rules" rows={4} className="input" defaultValue={hackathon?.rules} placeholder={'Teams of up to 4\nInclude a repo link and a 3-minute demo video\nCode must be written during the event'} />
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Judging rubric</h2>
            <p className="text-sm text-slate-600">Judges score each criterion; totals are weighted and shown out of 100.</p>
          </div>
          <span className={`badge ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
            Total weight: {totalWeight}%
          </span>
        </div>
        <ListEditor
          items={rubric}
          setItems={setRubric}
          blank={{ name: '', description: '', weight: 10, maxScore: 10 }}
          addLabel="Add criterion"
          render={(c, set) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_7rem_7rem]">
              <input className="input" placeholder="Criterion, e.g. Innovation" value={c.name} onChange={(e) => set({ name: e.target.value })} />
              <label className="text-xs text-slate-500">
                Weight %
                <input type="number" min={0} max={100} className="input mt-0.5" value={c.weight} onChange={(e) => set({ weight: e.target.value })} />
              </label>
              <label className="text-xs text-slate-500">
                Max score
                <input type="number" min={1} max={100} className="input mt-0.5" value={c.maxScore} onChange={(e) => set({ maxScore: e.target.value })} />
              </label>
              <textarea className="input sm:col-span-3" rows={2} placeholder="What should judges look for?" value={c.description} onChange={(e) => set({ description: e.target.value })} />
            </div>
          )}
        />
        {totalWeight !== 100 && <p className="hint">Weights don't have to add up to 100. They're used relative to each other, but 100 is easier to read.</p>}
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Judge access</h2>
        <div className="max-w-sm">
          <label className="label" htmlFor="judgeCode">Judge access code {editing ? '' : '*'}</label>
          <input id="judgeCode" name="judgeCode" className="input" autoComplete="off" placeholder={editing ? 'Leave blank to keep the current code' : 'e.g. judge-2026'} />
          <p className="hint">Share this code with your judges. They log in on the judging page with their name and this code.</p>
        </div>
      </section>

      {state?.error && <Alert>{state.error}</Alert>}
      <div className="flex justify-end">
        <button className="btn-primary" disabled={pending}>
          {pending ? 'Saving…' : editing ? 'Save changes' : 'Create hackathon page'}
        </button>
      </div>
    </form>
  )
}
