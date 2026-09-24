// Thin client for Polymarket's public, read-only APIs.
//   Gamma API — markets, events and tags:        https://gamma-api.polymarket.com
//   Data API  — a wallet's positions & activity: https://data-api.polymarket.com
// Neither needs an API key. In dev they go through the Vite proxy (vite.config.js).

const GAMMA = import.meta.env.DEV ? "/gamma" : "https://gamma-api.polymarket.com";
const DATA = import.meta.env.DEV ? "/data" : "https://data-api.polymarket.com";

async function getJson(base, path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const res = await fetch(`${base}${path}?${qs}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Polymarket API ${res.status} on ${path}`);
  return res.json();
}

// Gamma returns some array fields as JSON-encoded strings ("[\"Yes\",\"No\"]").
function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function normalizeMarket(m) {
  const outcomes = parseList(m.outcomes);
  const prices = parseList(m.outcomePrices).map(num);
  return {
    id: String(m.id),
    question: m.question || "",
    label: m.groupItemTitle || m.question || "",
    slug: m.slug,
    outcomes,
    prices,
    yes: prices[0] ?? num(m.lastTradePrice),
    change24h: num(m.oneDayPriceChange),
    volume24hr: num(m.volume24hr),
    volume: num(m.volumeNum ?? m.volume),
    liquidity: num(m.liquidityNum ?? m.liquidity),
    endDate: m.endDate || null,
    open: m.active !== false && m.closed !== true,
  };
}

export function normalizeEvent(e) {
  const markets = (e.markets || []).map(normalizeMarket).filter((m) => m.open);
  return {
    id: String(e.id),
    slug: e.slug,
    title: e.title || "",
    image: e.icon || e.image || "",
    volume24hr: num(e.volume24hr),
    volume: num(e.volume),
    liquidity: num(e.liquidity),
    endDate: e.endDate || null,
    tags: (e.tags || [])
      .filter((t) => t && t.slug && t.label)
      .map((t) => ({ slug: t.slug, label: t.label })),
    markets,
  };
}

export const PAGE_SIZE = 100;

// One page of open events ranked by 24h volume. `full` says whether the API
// returned a whole page (i.e. there may be more after it).
async function fetchEventPage({ tagSlug, offset = 0 }) {
  const raw = await getJson(GAMMA, "/events", {
    active: true,
    closed: false,
    archived: false,
    order: "volume24hr",
    ascending: false,
    limit: PAGE_SIZE,
    offset,
    tag_slug: tagSlug,
  });
  const list = Array.isArray(raw) ? raw : [];
  return {
    events: list.map(normalizeEvent).filter((e) => e.markets.length),
    full: list.length === PAGE_SIZE,
  };
}

// Rankings can shift between page requests, so the same event may appear twice.
export function dedupeEvents(lists) {
  const byId = new Map();
  for (const list of lists) for (const e of list) if (!byId.has(e.id)) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => b.volume24hr - a.volume24hr);
}

/** The first `pages` pages of trending events (all tags), fetched in parallel. */
export async function fetchTrendingPages(pages) {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) => fetchEventPage({ offset: i * PAGE_SIZE }))
  );
  return {
    events: dedupeEvents(results.map((r) => r.events)),
    hasMore: results[results.length - 1].full,
  };
}

/** Every open event carrying a tag, page by page, up to `max` events. */
export async function fetchAllEvents({ tagSlug, max = 1000 }) {
  const lists = [];
  for (let offset = 0; offset < max; offset += PAGE_SIZE) {
    const page = await fetchEventPage({ tagSlug, offset });
    lists.push(page.events);
    if (!page.full) break;
  }
  return dedupeEvents(lists);
}

/** A wallet's open positions (public, keyed by address). */
export async function fetchPositions(address) {
  const raw = await getJson(DATA, "/positions", {
    user: address,
    sizeThreshold: 0.1,
    limit: 200,
    sortBy: "CURRENT",
    sortDirection: "DESC",
  });
  return (Array.isArray(raw) ? raw : []).map((p) => ({
    id: `${p.conditionId}-${p.outcomeIndex}`,
    title: p.title || "",
    slug: p.eventSlug || p.slug,
    icon: p.icon || "",
    outcome: p.outcome || "",
    size: num(p.size),
    avgPrice: num(p.avgPrice),
    curPrice: num(p.curPrice),
    initialValue: num(p.initialValue),
    currentValue: num(p.currentValue),
    cashPnl: num(p.cashPnl),
    percentPnl: num(p.percentPnl),
    redeemable: Boolean(p.redeemable),
    endDate: p.endDate || null,
  }));
}

/** A wallet's recent on-chain activity (trades, redemptions, …). */
export async function fetchActivity(address, limit = 50) {
  const raw = await getJson(DATA, "/activity", { user: address, limit });
  return (Array.isArray(raw) ? raw : []).map((a, i) => ({
    id: a.transactionHash ? `${a.transactionHash}-${i}` : String(i),
    type: a.type || "TRADE",
    side: a.side || "",
    title: a.title || "",
    slug: a.eventSlug || a.slug,
    outcome: a.outcome || "",
    price: num(a.price),
    size: num(a.size),
    usdcSize: num(a.usdcSize),
    timestamp: num(a.timestamp) * 1000,
  }));
}

export const eventUrl = (slug) => `https://polymarket.com/event/${slug}`;
