import 'server-only'
import { hgetall, hget, hset, hsetnx, hdel, del } from './store'

const HACKATHONS = 'hh:hackathons'
const subsKey = (slug) => `hh:subs:${slug}`
const scoresKey = (slug) => `hh:scores:${slug}`

// Secrets never leave the server.
function publicHackathon(h) {
  if (!h) return null
  const { judgeCodeHash, ...rest } = h
  return { ...rest, hasJudgeCode: Boolean(judgeCodeHash) }
}

function publicSubmission(s) {
  if (!s) return null
  const { passcodeHash, ...rest } = s
  return rest
}

// ---------- hackathons ----------

export async function listHackathons() {
  const all = Object.values(await hgetall(HACKATHONS))
  return all
    .map(publicHackathon)
    .sort((a, b) => (Date.parse(b.startDate) || 0) - (Date.parse(a.startDate) || 0))
}

export async function getHackathonRaw(slug) {
  return hget(HACKATHONS, slug)
}

export async function getHackathon(slug) {
  return publicHackathon(await getHackathonRaw(slug))
}

export async function createHackathon(h) {
  return hsetnx(HACKATHONS, h.slug, h)
}

export async function updateHackathon(h) {
  await hset(HACKATHONS, h.slug, h)
}

export async function deleteHackathon(slug) {
  await hdel(HACKATHONS, slug)
  await del(subsKey(slug))
  await del(scoresKey(slug))
}

// ---------- submissions (keyed by normalised team name) ----------

export async function listSubmissions(slug) {
  const all = Object.values(await hgetall(subsKey(slug)))
  return all.map(publicSubmission).sort((a, b) => a.teamName.localeCompare(b.teamName))
}

export async function getSubmissionRaw(slug, id) {
  return hget(subsKey(slug), id)
}

export async function getSubmission(slug, id) {
  return publicSubmission(await getSubmissionRaw(slug, id))
}

export async function createSubmission(slug, s) {
  return hsetnx(subsKey(slug), s.id, s)
}

export async function updateSubmission(slug, s) {
  await hset(subsKey(slug), s.id, s)
}

export async function deleteSubmission(slug, id) {
  await hdel(subsKey(slug), id)
  const scores = await hgetall(scoresKey(slug))
  for (const [field, j] of Object.entries(scores)) {
    if (j.submissionId === id) await hdel(scoresKey(slug), field)
  }
}

// ---------- judgements (one per submission per judge) ----------

const scoreField = (submissionId, judgeKey) => `${submissionId}::${judgeKey}`

export async function listJudgements(slug) {
  return Object.values(await hgetall(scoresKey(slug)))
}

export async function getJudgement(slug, submissionId, judgeKey) {
  return hget(scoresKey(slug), scoreField(submissionId, judgeKey))
}

export async function saveJudgement(slug, j) {
  await hset(scoresKey(slug), scoreField(j.submissionId, j.judgeKey), j)
}
