'use client'

// Renders a timestamp in the viewer's own time zone.
export default function LocalTime({ iso, withTime = true }) {
  if (!iso) return <span>TBA</span>
  const d = new Date(iso)
  const text = d.toLocaleString(undefined, {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  })
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  )
}
