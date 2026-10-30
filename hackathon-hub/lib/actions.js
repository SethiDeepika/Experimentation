'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  checkAdminPassword,
  loginAdmin,
  logoutAdmin,
  isAdmin,
  loginJudge,
  logoutJudge,
  getJudge,
  hashSecret,
  verifySecret,
} from './auth'
import {
  getHackathonRaw,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  getSubmissionRaw,
  getSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  saveJudgement,
} from './data'
import { StorageError } from './store'
import { slugify, nameKey, isHttpUrl, newId, submissionsOpen } from './util'

const str = (fd, name, max = 5000) => String(fd.get(name) ?? '').trim().slice(0, max)

function jsonField(fd, name) {
  try {
    const v = JSON.parse(String(fd.get(name) || '[]'))
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function isoOrNull(value) {
  if (!value) return null
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

function storageFailure(err) {
  if (err instanceof StorageError) return { error: err.message }
  throw err
}

// ---------- organizer ----------

export async function adminLoginAction(_prev, fd) {
  if (!checkAdminPassword(str(fd, 'password'))) return { error: 'Incorrect password.' }
  await loginAdmin()
  redirect('/admin')
}

export async function adminLogoutAction() {
  await logoutAdmin()
  redirect('/admin')
}

export async function saveHackathonAction(_prev, fd) {
  if (!(await isAdmin())) return { error: 'Your organizer session expired. Log in again.' }

  const editing = str(fd, 'originalSlug')
  const name = str(fd, 'name', 120)
  const slug = editing || slugify(str(fd, 'slug', 60) || name)
  if (!name) return { error: 'Give the hackathon a name.' }
  if (!slug) return { error: 'The page URL needs at least one letter or number.' }

  const themes = jsonField(fd, 'themes')
    .map((t) => ({
      id: String(t.id || newId()),
      title: String(t.title || '').trim().slice(0, 120),
      description: String(t.description || '').trim().slice(0, 1000),
    }))
    .filter((t) => t.title)

  const rubric = jsonField(fd, 'rubric')
    .map((c) => ({
      id: String(c.id || newId()),
      name: String(c.name || '').trim().slice(0, 120),
      description: String(c.description || '').trim().slice(0, 1000),
      weight: Math.max(0, Number(c.weight) || 0),
      maxScore: Math.min(100, Math.max(1, Math.round(Number(c.maxScore) || 10))),
    }))
    .filter((c) => c.name)
  if (!rubric.length) return { error: 'Add at least one rubric criterion.' }
  if (!rubric.some((c) => c.weight > 0)) return { error: 'At least one criterion needs a weight above 0.' }

  const startDate = isoOrNull(str(fd, 'startDate'))
  const endDate = isoOrNull(str(fd, 'endDate'))
  if (startDate && endDate && endDate < startDate) return { error: 'The end date is before the start date.' }

  const judgeCode = str(fd, 'judgeCode', 200)
  if (judgeCode && judgeCode.length < 4) return { error: 'The judge access code must be at least 4 characters.' }

  const existing = editing ? await getHackathonRaw(editing) : null
  if (editing && !existing) return { error: 'This hackathon no longer exists.' }
  if (!editing && !judgeCode) return { error: 'Set a judge access code so judges can log in.' }

  const now = new Date().toISOString()
  const hackathon = {
    slug,
    name,
    tagline: str(fd, 'tagline', 200),
    description: str(fd, 'description', 10000),
    location: str(fd, 'location', 200),
    startDate,
    endDate,
    submissionDeadline: isoOrNull(str(fd, 'submissionDeadline')),
    acceptingSubmissions: fd.get('acceptingSubmissions') === 'on',
    themes,
    prizes: str(fd, 'prizes', 5000),
    rules: str(fd, 'rules', 5000),
    contact: str(fd, 'contact', 200),
    rubric,
    judgeCodeHash: judgeCode ? hashSecret(judgeCode) : existing?.judgeCodeHash,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }

  try {
    if (editing) {
      await updateHackathon(hackathon)
    } else if (!(await createHackathon(hackathon))) {
      return { error: `The URL /h/${slug} is already taken. Choose a different page URL.` }
    }
  } catch (err) {
    return storageFailure(err)
  }

  revalidatePath('/', 'layout')
  redirect(`/admin/${slug}?saved=1`)
}

export async function deleteHackathonAction(fd) {
  if (!(await isAdmin())) redirect('/admin')
  await deleteHackathon(str(fd, 'slug'))
  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function deleteSubmissionAction(fd) {
  if (!(await isAdmin())) redirect('/admin')
  const slug = str(fd, 'slug')
  await deleteSubmission(slug, str(fd, 'id'))
  revalidatePath('/', 'layout')
  redirect(`/admin/${slug}`)
}

// ---------- teams ----------

export async function loadSubmissionAction(slug, teamName, passcode) {
  const existing = await getSubmissionRaw(slug, nameKey(teamName))
  if (!existing) return { notFound: true }
  if (!verifySecret(String(passcode || ''), existing.passcodeHash)) {
    return { error: 'That passcode does not match this team.' }
  }
  return { submission: await getSubmission(slug, existing.id) }
}

export async function saveSubmissionAction(_prev, fd) {
  const slug = str(fd, 'slug')
  const hackathon = await getHackathonRaw(slug)
  if (!hackathon) return { error: 'This hackathon does not exist.' }
  if (!submissionsOpen(hackathon)) return { error: 'Submissions for this hackathon are closed.' }

  const teamName = str(fd, 'teamName', 60)
  const id = nameKey(teamName)
  const passcode = String(fd.get('passcode') ?? '')
  if (!id) return { error: 'Enter your team name.' }
  if (passcode.length < 4) return { error: 'The team passcode must be at least 4 characters.' }

  const projectName = str(fd, 'projectName', 120)
  const summary = str(fd, 'summary', 300)
  if (!projectName) return { error: 'Enter your project name.' }
  if (!summary) return { error: 'Add a one-line summary of your project.' }

  const links = {
    repoUrl: str(fd, 'repoUrl', 500),
    demoUrl: str(fd, 'demoUrl', 500),
    videoUrl: str(fd, 'videoUrl', 500),
    slidesUrl: str(fd, 'slidesUrl', 500),
  }
  for (const [field, value] of Object.entries(links)) {
    if (!isHttpUrl(value)) return { error: `"${value}" is not a valid link (${field.replace('Url', '')}). Links must start with https://` }
  }

  const theme = str(fd, 'theme', 60)
  const attachments = jsonField(fd, 'attachments')
    .filter((a) => a && isHttpUrl(a.url) && a.url)
    .slice(0, 5)
    .map((a) => ({ url: String(a.url), name: String(a.name || 'file').slice(0, 200), size: Number(a.size) || 0 }))

  const now = new Date().toISOString()
  const existing = await getSubmissionRaw(slug, id)
  if (existing && !verifySecret(passcode, existing.passcodeHash)) {
    return {
      error: `A team called "${existing.teamName}" has already submitted. Enter that team's passcode to update it, or pick a different team name.`,
    }
  }

  const submission = {
    id,
    teamName,
    members: str(fd, 'members', 2000),
    contactEmail: str(fd, 'contactEmail', 200),
    projectName,
    theme: hackathon.themes.some((t) => t.id === theme) ? theme : '',
    summary,
    description: str(fd, 'description', 10000),
    ...links,
    attachments,
    passcodeHash: existing?.passcodeHash || hashSecret(passcode),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }

  try {
    if (existing) {
      await updateSubmission(slug, submission)
    } else if (!(await createSubmission(slug, submission))) {
      return { error: 'Another team just registered that name. Pick a different team name.' }
    }
  } catch (err) {
    return storageFailure(err)
  }

  revalidatePath(`/h/${slug}`)
  return {
    ok: true,
    updatedAt: now,
    message: existing
      ? 'Your submission was updated.'
      : 'Your submission is in. Keep your team name and passcode to update it later.',
  }
}

// ---------- judges ----------

export async function judgeLoginAction(_prev, fd) {
  const slug = str(fd, 'slug')
  const name = str(fd, 'name', 80)
  const hackathon = await getHackathonRaw(slug)
  if (!hackathon) return { error: 'This hackathon does not exist.' }
  if (!nameKey(name)) return { error: 'Enter your name so your scores are recorded under it.' }
  if (!verifySecret(str(fd, 'code', 200), hackathon.judgeCodeHash)) {
    return { error: 'Incorrect judge access code.' }
  }
  await loginJudge(slug, name)
  redirect(`/h/${slug}/judge`)
}

export async function judgeLogoutAction(fd) {
  const slug = str(fd, 'slug')
  await logoutJudge(slug)
  redirect(`/h/${slug}/judge`)
}

export async function saveScoreAction(_prev, fd) {
  const slug = str(fd, 'slug')
  const judge = await getJudge(slug)
  if (!judge) return { error: 'Your judge session expired. Log in again.' }

  const hackathon = await getHackathonRaw(slug)
  const submissionId = str(fd, 'submissionId')
  if (!hackathon || !(await getSubmissionRaw(slug, submissionId))) {
    return { error: 'This submission no longer exists.' }
  }

  const scores = {}
  for (const c of hackathon.rubric) {
    const raw = fd.get(`score_${c.id}`)
    const value = Number(raw)
    if (raw === null || raw === '' || Number.isNaN(value)) return { error: `Give a score for "${c.name}".` }
    if (value < 0 || value > c.maxScore) return { error: `"${c.name}" must be between 0 and ${c.maxScore}.` }
    scores[c.id] = value
  }

  const now = new Date().toISOString()
  try {
    await saveJudgement(slug, {
      submissionId,
      judgeKey: nameKey(judge.name),
      judgeName: judge.name,
      scores,
      comments: str(fd, 'comments', 5000),
      updatedAt: now,
    })
  } catch (err) {
    return storageFailure(err)
  }

  revalidatePath(`/h/${slug}/judge`)
  return { ok: true, updatedAt: now }
}
