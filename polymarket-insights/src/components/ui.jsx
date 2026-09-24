import { pts, timeAgo } from "../lib/format.js";

export function StatTile({ label, value, hint, tone }) {
  const toneClass =
    tone === "up" ? "text-emerald-700" : tone === "down" ? "text-rose-700" : "text-ink-900";
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function Section({ title, subtitle, action, children }) {
  return (
    <section className="card min-w-0 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Single-series horizontal bars: one hue, value in ink, native tooltip on hover. */
export function BarList({ items, format }) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.key} title={`${i.label}: ${format(i.value)}${i.detail ? ` · ${i.detail}` : ""}`}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink-800">{i.label}</span>
            <span className="shrink-0 tabular-nums text-ink-600">{format(i.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-100">
            <div
              className="h-2 rounded-full bg-brand-500"
              style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Implied probability as a thin meter. */
export function ProbBar({ value }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-ink-100" aria-hidden="true">
      <div
        className="h-1.5 rounded-full bg-brand-500"
        style={{ width: `${Math.min(100, Math.max(1, value * 100))}%` }}
      />
    </div>
  );
}

export function Change({ delta }) {
  if (!delta) return <span className="text-xs text-ink-400">—</span>;
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold tabular-nums ${
        up ? "text-emerald-700" : "text-rose-700"
      }`}
    >
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      {pts(delta)}
    </span>
  );
}

export function Empty({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
      {children}
    </div>
  );
}

export function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />
      ))}
    </div>
  );
}

/** Tells the user whether they're looking at live or sample data, and when it refreshed. */
export function SourceBar({ source, error, updatedAt, onRefresh, loading }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {source === "live" && (
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live from Polymarket
        </span>
      )}
      {source === "demo" && (
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800">
          Sample data — Polymarket API unreachable
        </span>
      )}
      {updatedAt && <span className="text-ink-500">Updated {timeAgo(updatedAt)}</span>}
      {error && source === "live" && (
        <span className="text-rose-700">Last refresh failed; showing previous data.</span>
      )}
      <button className="btn-ghost py-1" onClick={onRefresh} disabled={loading}>
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

/** Small "where this data comes from" note. */
export function SourceNote({ children, className = "" }) {
  return (
    <p className={`inline-flex items-start gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs text-brand-900 ${className}`}>
      <span aria-hidden="true">ⓘ</span>
      <span>{children}</span>
    </p>
  );
}
