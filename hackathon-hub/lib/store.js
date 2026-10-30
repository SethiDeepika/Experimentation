import 'server-only'
import { Redis } from '@upstash/redis'
import { promises as fs } from 'fs'
import path from 'path'

// A tiny hash-based key/value store. In production it talks to Upstash Redis
// (free tier, added from the Vercel Storage tab). In local development without
// Redis credentials it falls back to a JSON file under .data/.

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

export const storageMode = redis ? 'redis' : process.env.VERCEL ? 'unconfigured' : 'file'

export class StorageError extends Error {}

function parse(value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

// ---------- file fallback (local dev only) ----------

const DB_FILE = path.join(process.cwd(), '.data', 'db.json')
let writeChain = Promise.resolve()

async function readDb() {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function mutateDb(fn) {
  const run = writeChain.then(async () => {
    const db = await readDb()
    const result = fn(db)
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true })
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2))
    return result
  })
  writeChain = run.catch(() => {})
  return run
}

function requireWritable() {
  if (storageMode === 'unconfigured') {
    throw new StorageError(
      'Storage is not configured. Add Upstash Redis from the Vercel Storage tab and redeploy.'
    )
  }
}

// ---------- public API ----------

export async function hgetall(key) {
  if (redis) {
    const all = (await redis.hgetall(key)) || {}
    return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, parse(v)]))
  }
  if (storageMode === 'unconfigured') return {}
  const db = await readDb()
  return { ...(db[key] || {}) }
}

export async function hget(key, field) {
  if (redis) return parse(await redis.hget(key, field)) ?? null
  if (storageMode === 'unconfigured') return null
  const db = await readDb()
  return db[key]?.[field] ?? null
}

export async function hset(key, field, value) {
  requireWritable()
  if (redis) return redis.hset(key, { [field]: JSON.stringify(value) })
  return mutateDb((db) => {
    db[key] = { ...(db[key] || {}), [field]: value }
  })
}

// Sets the field only if it does not exist yet. Returns true when it was set.
export async function hsetnx(key, field, value) {
  requireWritable()
  if (redis) return (await redis.hsetnx(key, field, JSON.stringify(value))) === 1
  return mutateDb((db) => {
    if (db[key]?.[field] !== undefined) return false
    db[key] = { ...(db[key] || {}), [field]: value }
    return true
  })
}

export async function hdel(key, field) {
  requireWritable()
  if (redis) return redis.hdel(key, field)
  return mutateDb((db) => {
    if (db[key]) delete db[key][field]
  })
}

export async function del(key) {
  requireWritable()
  if (redis) return redis.del(key)
  return mutateDb((db) => {
    delete db[key]
  })
}
