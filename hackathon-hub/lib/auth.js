import 'server-only'
import crypto from 'crypto'
import { cookies } from 'next/headers'

const isProd = process.env.NODE_ENV === 'production'
const SECRET =
  process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || (isProd ? '' : 'dev-only-secret')

// ---------- signed cookie sessions ----------

function sign(payload) {
  if (!SECRET) throw new Error('Set SESSION_SECRET or ADMIN_PASSWORD to enable logins.')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${mac}`
}

function verify(token) {
  if (!token || !SECRET) return null
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

const ADMIN_COOKIE = 'hh_admin'
const judgeCookie = (slug) => `hh_judge_${slug}`
const WEEK = 60 * 60 * 24 * 7

async function setCookie(name, payload, maxAge) {
  const store = await cookies()
  store.set(name, sign({ ...payload, exp: Date.now() + maxAge * 1000 }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge,
  })
}

async function readCookie(name) {
  const store = await cookies()
  return verify(store.get(name)?.value)
}

// ---------- organizer ----------

export function adminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD) || !isProd
}

export function checkAdminPassword(password) {
  // Local development without ADMIN_PASSWORD accepts "admin".
  const expected = process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin')
  if (!expected || typeof password !== 'string') return false
  const a = crypto.createHash('sha256').update(password).digest()
  const b = crypto.createHash('sha256').update(expected).digest()
  return crypto.timingSafeEqual(a, b)
}

export async function loginAdmin() {
  await setCookie(ADMIN_COOKIE, { role: 'admin' }, WEEK)
}

export async function logoutAdmin() {
  ;(await cookies()).delete(ADMIN_COOKIE)
}

export async function isAdmin() {
  return (await readCookie(ADMIN_COOKIE))?.role === 'admin'
}

// ---------- judges ----------

export async function loginJudge(slug, name) {
  await setCookie(judgeCookie(slug), { role: 'judge', slug, name }, WEEK)
}

export async function logoutJudge(slug) {
  ;(await cookies()).delete(judgeCookie(slug))
}

export async function getJudge(slug) {
  const session = await readCookie(judgeCookie(slug))
  return session?.role === 'judge' && session.slug === slug ? { name: session.name } : null
}

// ---------- secrets (team passcodes, judge access codes) ----------

export function hashSecret(secret) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(secret, salt, 32).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifySecret(secret, stored) {
  if (!stored || typeof secret !== 'string') return false
  const [, salt, hash] = stored.split('$')
  if (!salt || !hash) return false
  const actual = crypto.scryptSync(secret, salt, 32)
  const expected = Buffer.from(hash, 'hex')
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}
