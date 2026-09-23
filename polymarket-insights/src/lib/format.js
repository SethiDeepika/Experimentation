export function usd(n, { compact = true } = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact && Math.abs(n) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: compact && Math.abs(n) >= 10_000 ? 1 : 2,
  }).format(n || 0);
}

export const pct = (p, digits = 0) => `${((p || 0) * 100).toFixed(digits)}%`;

/** Price change in percentage points, e.g. +0.05 → "+5.0 pts". */
export function pts(delta) {
  const v = (delta || 0) * 100;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)} pts`;
}

export function timeUntil(date) {
  if (!date) return "";
  const ms = new Date(date).getTime() - Date.now();
  if (!Number.isFinite(ms)) return "";
  if (ms <= 0) return "ended";
  const h = ms / 36e5;
  if (h < 24) return `${Math.max(1, Math.round(h))}h left`;
  const d = h / 24;
  if (d < 60) return `${Math.round(d)}d left`;
  return `${Math.round(d / 30)}mo left`;
}

export function timeAgo(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export const shortAddress = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
