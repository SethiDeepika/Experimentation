// Client for the Polymarket US API (api.polymarket.us) — the CFTC-regulated US
// exchange. Account endpoints need the user's own API key, created at
// polymarket.us/developer. Requests are signed here in the browser with Ed25519,
// following Polymarket's official SDK (npm: polymarket-us): the signature covers
// `${timestamp}${METHOD}${pathname}` and travels in X-PM-* headers. The secret key
// itself is never sent anywhere and is only held in memory.
import * as ed from "@noble/ed25519";

const API = import.meta.env.DEV ? "/pmus-api" : "https://api.polymarket.us";
const GATEWAY = import.meta.env.DEV ? "/pmus-gateway" : "https://gateway.polymarket.us";

const num = (v) => {
  const n = Number(typeof v === "object" && v !== null ? v.value : v);
  return Number.isFinite(n) ? n : 0;
};

function base64ToBytes(b64) {
  const bin = atob(b64.trim());
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...bytes));

export const KEY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates a base64 Ed25519 secret (32-byte seed or 64-byte seed+public key). */
export function isValidSecret(secret) {
  try {
    const len = base64ToBytes(secret).length;
    return len === 32 || len === 64;
  } catch {
    return false;
  }
}

async function authHeaders({ keyId, secretKey }, method, pathname) {
  const timestamp = Date.now().toString();
  const bytes = base64ToBytes(secretKey);
  const privateKey = bytes.length === 64 ? bytes.slice(0, 32) : bytes;
  const signature = await ed.signAsync(
    new TextEncoder().encode(`${timestamp}${method}${pathname}`),
    privateKey
  );
  return {
    "X-PM-Access-Key": keyId,
    "X-PM-Timestamp": timestamp,
    "X-PM-Signature": bytesToBase64(signature),
  };
}

async function request(base, path, { query, creds } = {}) {
  // In dev `base` is a same-origin proxy prefix (see vite.config.js).
  const url = new URL((base.startsWith("http") ? base : window.location.origin + base) + path);
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null) continue;
    for (const item of [].concat(v)) url.searchParams.append(k, String(item));
  }
  const headers = { Accept: "application/json" };
  // Sign the real API path (without the dev proxy prefix).
  if (creds) Object.assign(headers, await authHeaders(creds, "GET", path));

  let res;
  try {
    res = await fetch(url, { headers });
  } catch {
    throw new Error(
      "Couldn't reach Polymarket US from this browser (network or cross-origin block)."
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("Polymarket US rejected these API keys. Check the Key ID and Secret Key.");
  }
  if (res.status === 429) throw new Error("Polymarket US rate limit hit — try again in a minute.");
  if (!res.ok) throw new Error(`Polymarket US API error ${res.status}.`);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

const get = (path, creds, query) => request(API, path, { creds, query });

// Positions are keyed by market slug and paged with a cursor.
async function fetchPositions(creds) {
  const all = {};
  let cursor;
  for (let page = 0; page < 10; page++) {
    const r = await get("/v1/portfolio/positions", creds, { limit: 100, cursor });
    Object.assign(all, r.positions || {});
    if (r.eof || !r.nextCursor) break;
    cursor = r.nextCursor;
  }
  return Object.entries(all)
    .map(([slug, p]) => {
      const net = num(p.netPosition);
      const size = Math.abs(net);
      const cost = num(p.cost);
      const value = num(p.cashValue);
      const meta = p.marketMetadata || {};
      return {
        id: slug,
        marketSlug: meta.slug || slug,
        eventSlug: meta.eventSlug || "",
        title: meta.title || slug,
        outcome: `${net >= 0 ? "Long" : "Short"}${meta.outcome ? ` · ${meta.outcome}` : ""}`,
        size,
        avgPrice: size ? cost / size : 0,
        curPrice: size ? value / size : 0,
        initialValue: cost,
        currentValue: value,
        cashPnl: value - cost,
        percentPnl: cost ? ((value - cost) / cost) * 100 : 0,
        realized: num(p.realized),
        expired: Boolean(p.expired),
      };
    })
    .filter((p) => p.size > 0 && !p.expired)
    .sort((a, b) => b.currentValue - a.currentValue);
}

const INTENT = {
  ORDER_INTENT_BUY_LONG: "Buy Yes",
  ORDER_INTENT_SELL_LONG: "Sell Yes",
  ORDER_INTENT_BUY_SHORT: "Buy No",
  ORDER_INTENT_SELL_SHORT: "Sell No",
};
const pretty = (enumValue, prefix) =>
  (enumValue || "").replace(prefix, "").replace(/_/g, " ").toLowerCase();

async function fetchOpenOrders(creds) {
  const r = await get("/v1/orders/open", creds);
  return (r.orders || []).map((o) => {
    const meta = o.marketMetadata || {};
    const price = num(o.price);
    return {
      id: o.id,
      title: meta.title || o.marketSlug,
      outcome: meta.outcome || "",
      action: INTENT[o.intent] || (o.side === "ORDER_SIDE_SELL" ? "Sell" : "Buy"),
      isBuy: (o.intent || o.side || "").includes("BUY"),
      type: pretty(o.type, "ORDER_TYPE_"),
      tif: pretty(o.tif, "TIME_IN_FORCE_"),
      state: pretty(o.state, "ORDER_STATE_"),
      price,
      quantity: num(o.quantity),
      filled: num(o.cumQuantity),
      remaining: num(o.leavesQuantity),
      notional: price * num(o.leavesQuantity),
      createdAt: Date.parse(o.createTime || o.insertTime) || null,
    };
  });
}

async function fetchActivity(creds, titles) {
  const r = await get("/v1/portfolio/activities", creds, {
    limit: 50,
    sortOrder: "SORT_ORDER_DESCENDING",
  });
  return (r.activities || []).map((a, i) => {
    const kind = pretty(a.type, "ACTIVITY_TYPE_");
    if (a.trade) {
      const t = a.trade;
      const price = num(t.price);
      const qty = num(t.qty);
      return {
        id: t.id || String(i),
        label: "TRADE",
        title: titles[t.marketSlug] || t.marketSlug,
        detail: `${qty.toLocaleString()} @ ${Math.round(price * 100)}¢`,
        amount: price * qty,
        timestamp: Date.parse(t.createTime || t.updateTime) || null,
      };
    }
    if (a.positionResolution) {
      const p = a.positionResolution;
      return {
        id: `${p.tradeId || i}-res`,
        label: "RESOLVED",
        title: titles[p.marketSlug] || p.marketSlug,
        detail: p.side || "",
        amount: null,
        timestamp: Date.parse(p.updateTime) || null,
      };
    }
    const tx = a.accountBalanceChange?.transactions?.[0];
    return {
      id: tx?.transactionId || `${i}-acct`,
      label: kind.includes("withdrawal") ? "WITHDRAW" : kind.includes("deposit") ? "DEPOSIT" : kind.toUpperCase(),
      title: kind.replace(/^\w/, (c) => c.toUpperCase()),
      detail: tx?.status ? pretty(tx.status, /^[A-Z]+_STATUS_/) : "",
      amount: tx ? num(tx.amount) : null,
      timestamp: Date.parse(tx?.createTime || tx?.updateTime) || null,
    };
  });
}

async function fetchBalance(creds) {
  const r = await get("/v1/account/balances", creds);
  const b = (r.balances || [])[0] || {};
  return {
    cash: num(b.currentBalance),
    buyingPower: num(b.buyingPower),
    inOpenOrders: num(b.openOrders),
  };
}

/** Everything My Trades needs, in one call. */
export async function fetchUsAccount(creds) {
  const [positions, orders, balance] = await Promise.all([
    fetchPositions(creds),
    fetchOpenOrders(creds),
    fetchBalance(creds),
  ]);
  const titles = Object.fromEntries(positions.map((p) => [p.marketSlug, p.title]));
  const activity = await fetchActivity(creds, titles);
  return { positions, orders, balance, activity };
}

/** Topic tags of Polymarket US events (public endpoint), keyed by event slug. */
export async function fetchUsEventTags(eventSlugs) {
  if (!eventSlugs.length) return {};
  const r = await request(GATEWAY, "/v1/events", { query: { slug: eventSlugs, limit: eventSlugs.length } });
  return Object.fromEntries(
    (r.events || []).map((e) => [e.slug, (e.tags || []).map((t) => t.slug)])
  );
}
