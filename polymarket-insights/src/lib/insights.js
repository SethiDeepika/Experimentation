// Pure analysis over normalised events/positions (see api.js). No fetching here.

// Housekeeping tags Polymarket attaches for its own UI, not real topics.
const NOISE_TAG = /^(all|hide from new|featured|recurring|earn \d+%|parent for derivative)$/i;
export const isTopicTag = (t) => !NOISE_TAG.test(t.label);

export function summarize(events) {
  const markets = events.flatMap((e) => e.markets);
  return {
    eventCount: events.length,
    marketCount: markets.length,
    volume24hr: events.reduce((s, e) => s + e.volume24hr, 0),
    liquidity: events.reduce((s, e) => s + e.liquidity, 0),
  };
}

/** 24h volume per tag. An event counts toward every topic tag it carries. */
export function volumeByTag(events, topN = 8) {
  const byTag = new Map();
  for (const e of events) {
    for (const t of e.tags.filter(isTopicTag)) {
      const cur = byTag.get(t.slug) || { ...t, volume24hr: 0, events: 0 };
      cur.volume24hr += e.volume24hr;
      cur.events += 1;
      byTag.set(t.slug, cur);
    }
  }
  return [...byTag.values()].sort((a, b) => b.volume24hr - a.volume24hr).slice(0, topN);
}

/** Tags seen across events, most common first — used to seed the interest picker. */
export function tagsFromEvents(events) {
  const counts = new Map();
  for (const e of events) {
    for (const t of e.tags.filter(isTopicTag)) {
      const cur = counts.get(t.slug) || { ...t, n: 0 };
      cur.n += 1;
      counts.set(t.slug, cur);
    }
  }
  return [...counts.values()].sort((a, b) => b.n - a.n);
}

function flatMarkets(events) {
  return events.flatMap((e) =>
    e.markets.map((m) => ({ ...m, event: { slug: e.slug, title: e.title, image: e.image } }))
  );
}

const MIN_ACTIVITY = 1000; // ignore thinly traded markets when ranking moves

export function biggestMovers(events, n = 6) {
  return flatMarkets(events)
    .filter((m) => m.volume24hr >= MIN_ACTIVITY && m.change24h !== 0)
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, n);
}

export function tossUps(events, n = 6) {
  return flatMarkets(events)
    .filter((m) => m.outcomes.length === 2 && m.yes >= 0.4 && m.yes <= 0.6)
    .sort((a, b) => b.volume24hr - a.volume24hr)
    .slice(0, n);
}

export function closingSoon(events, n = 6, days = 7) {
  const now = Date.now();
  const horizon = now + days * 864e5;
  return flatMarkets(events)
    .filter((m) => {
      const t = new Date(m.endDate).getTime();
      return t > now && t <= horizon;
    })
    .sort((a, b) => b.volume24hr - a.volume24hr)
    .slice(0, n);
}

/** One-line takeaways for the top of a feed. */
export function headlines(events) {
  const out = [];
  const s = summarize(events);
  const tags = volumeByTag(events, 1);
  if (tags[0] && s.volume24hr > 0) {
    out.push(
      `${tags[0].label} is the hottest topic — its events carry ${Math.round(
        (tags[0].volume24hr / s.volume24hr) * 100
      )}% of 24h volume in this feed.`
    );
  }
  const top = [...events].sort((a, b) => b.volume24hr - a.volume24hr)[0];
  if (top) out.push(`Most traded event right now: “${top.title}”.`);
  const mover = biggestMovers(events, 1)[0];
  if (mover) {
    out.push(
      `Biggest 24h swing: “${mover.label}” moved ${Math.abs(mover.change24h * 100).toFixed(1)} pts ${
        mover.change24h > 0 ? "up" : "down"
      } to ${Math.round(mover.yes * 100)}%.`
    );
  }
  const coin = tossUps(events, 100).length;
  if (coin) out.push(`${coin} binary market${coin === 1 ? " is" : "s are"} a toss-up (40–60%).`);
  return out;
}

export function portfolioStats(positions) {
  const value = positions.reduce((s, p) => s + p.currentValue, 0);
  const cost = positions.reduce((s, p) => s + p.initialValue, 0);
  const pnl = positions.reduce((s, p) => s + p.cashPnl, 0);
  const winners = positions.filter((p) => p.cashPnl > 0).length;
  const redeemable = positions.filter((p) => p.redeemable).reduce((s, p) => s + p.currentValue, 0);
  const largest = positions.reduce((m, p) => (p.currentValue > (m?.currentValue ?? -1) ? p : m), null);
  return {
    value,
    cost,
    pnl,
    pnlPct: cost > 0 ? pnl / cost : 0,
    count: positions.length,
    winRate: positions.length ? winners / positions.length : 0,
    redeemable,
    largest,
    concentration: value > 0 && largest ? largest.currentValue / value : 0,
  };
}
