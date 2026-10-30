// Helpers shared by server and client code.

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// Team and judge names are matched case- and punctuation-insensitively.
export const nameKey = slugify

export function newId() {
  return Math.random().toString(36).slice(2, 10)
}

export function isHttpUrl(value) {
  if (!value) return true
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export const DEFAULT_RUBRIC = [
  {
    id: 'innovation',
    name: 'Innovation & Creativity',
    description: 'How original is the idea? Does it approach the problem in a new way?',
    weight: 25,
    maxScore: 10,
  },
  {
    id: 'technical',
    name: 'Technical Execution',
    description: 'Quality, complexity and completeness of the implementation. Does it work?',
    weight: 25,
    maxScore: 10,
  },
  {
    id: 'impact',
    name: 'Impact & Usefulness',
    description: 'How important is the problem, and how well does the solution address it?',
    weight: 20,
    maxScore: 10,
  },
  {
    id: 'design',
    name: 'Design & User Experience',
    description: 'Is it intuitive, polished and pleasant to use?',
    weight: 15,
    maxScore: 10,
  },
  {
    id: 'presentation',
    name: 'Presentation',
    description: 'Clarity of the demo, pitch and documentation.',
    weight: 15,
    maxScore: 10,
  },
]

// Status of a hackathon relative to now.
export function phase(h, now = Date.now()) {
  const start = h.startDate ? Date.parse(h.startDate) : null
  const end = h.endDate ? Date.parse(h.endDate) : null
  if (start && now < start) return 'upcoming'
  if (end && now > end) return 'ended'
  return 'live'
}

export function submissionsOpen(h, now = Date.now()) {
  if (!h.acceptingSubmissions) return false
  if (h.submissionDeadline && now > Date.parse(h.submissionDeadline)) return false
  return true
}
