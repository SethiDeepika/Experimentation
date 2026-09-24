import { useCallback, useEffect, useState } from "react";
import { demoUsAccount } from "../lib/demoData.js";
import { pct, timeAgo, usd } from "../lib/format.js";
import { portfolioStats } from "../lib/insights.js";
import { fetchUsAccount, isValidSecret, KEY_ID_RE } from "../lib/polymarketUs.js";
import { REFRESH_MS } from "../lib/useLiveEvents.js";
import { BarList, Empty, Section, Skeleton, SourceNote, StatTile } from "./ui.jsx";

export const DEMO_CREDS = { demo: true };

/** Account data for the connected keys (a sample account in demo mode). */
export const loadUsAccount = (creds) =>
  creds.demo ? Promise.resolve(demoUsAccount()) : fetchUsAccount(creds);

function looksLikeSeedPhrase(text) {
  return text.trim().split(/\s+/).length >= 12;
}

function KeysForm({ onConnect }) {
  const [keyId, setKeyId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [show, setShow] = useState(false);
  const idOk = KEY_ID_RE.test(keyId.trim());
  const secretOk = isValidSecret(secretKey);
  const seed = looksLikeSeedPhrase(secretKey) || looksLikeSeedPhrase(keyId);

  return (
    <Section title="Connect your Polymarket US account" subtitle="Uses your own API key from polymarket.us">
      <form
        className="space-y-4"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (idOk && secretOk) onConnect({ keyId: keyId.trim(), secretKey: secretKey.trim() });
        }}
      >
        <ol className="list-decimal space-y-1 rounded-xl bg-ink-50 p-3 pl-8 text-sm text-ink-700">
          <li>
            Sign in at{" "}
            <a className="font-medium text-brand-700 underline" href="https://polymarket.us/developer" target="_blank" rel="noreferrer">
              polymarket.us/developer
            </a>{" "}
            (needs a verified Polymarket US account).
          </li>
          <li>Create an API key. You'll get a <strong>Key ID</strong> and a <strong>Secret Key</strong>.</li>
          <li>Paste both below.</li>
        </ol>

        <div>
          <label htmlFor="key-id" className="mb-1 block text-sm font-medium">
            Key ID
          </label>
          <input
            id="key-id"
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            spellCheck="false"
            autoComplete="off"
            className="w-full rounded-xl border border-ink-200 px-3 py-2 font-mono text-sm outline-none focus:border-brand-400"
          />
          {keyId.trim() && !idOk && <p className="mt-1 text-sm text-rose-700">The Key ID is a UUID (8-4-4-4-12 characters).</p>}
        </div>
        <div>
          <label htmlFor="secret-key" className="mb-1 block text-sm font-medium">
            Secret Key
          </label>
          <div className="flex gap-2">
            <input
              id="secret-key"
              type={show ? "text" : "password"}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Base64 secret from the developer portal"
              spellCheck="false"
              autoComplete="new-password"
              className="w-full rounded-xl border border-ink-200 px-3 py-2 font-mono text-sm outline-none focus:border-brand-400"
            />
            <button type="button" className="btn-ghost" onClick={() => setShow((v) => !v)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {secretKey.trim() && !secretOk && !seed && (
            <p className="mt-1 text-sm text-rose-700">That doesn't look like a Polymarket US secret key (base64).</p>
          )}
          {seed && (
            <p className="mt-2 rounded-lg bg-rose-50 p-2 text-sm font-medium text-rose-800">
              That looks like a seed phrase. Never paste those anywhere — this page only needs an API key.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">Before you paste your secret key</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>A Polymarket US API key can place and cancel trades. Treat it like a password.</li>
            <li>
              This page only <em>reads</em> your positions, orders, activity and balance. It signs each request
              in your browser; the secret itself is never sent anywhere.
            </li>
            <li>Keys stay in this tab's memory only — they're gone when you reload or click Disconnect.</li>
            <li>Only use this on a device and browser you trust, and revoke the key at polymarket.us/developer when done.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={!idOk || !secretOk}>
            View my trades
          </button>
          <button type="button" className="btn-ghost" onClick={() => onConnect(DEMO_CREDS)}>
            Try a demo account
          </button>
        </div>
      </form>
    </Section>
  );
}

export default function PortfolioView({ creds, onConnect, onDisconnect }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!creds) return;
    setLoading(true);
    try {
      setData({ ...(await loadUsAccount(creds)), at: Date.now() });
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    setData(null);
    setError(null);
    refresh();
    const id = setInterval(() => document.visibilityState === "visible" && refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const header = (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Your active trades</h1>
      <p className="text-sm text-ink-500">Open positions, open orders, P&amp;L and recent activity.</p>
      <SourceNote className="mt-2">
        Account data comes from <strong>polymarket.us</strong> (Polymarket US). Trending and My Interests show
        markets from polymarket.com.
      </SourceNote>
    </div>
  );

  if (!creds) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {header}
        <KeysForm onConnect={onConnect} />
      </div>
    );
  }

  const stats = data && portfolioStats(data.positions);
  const ordersValue = data ? data.orders.reduce((s, o) => s + o.notional, 0) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {header}
        <div className="flex items-center gap-2 text-sm">
          {creds.demo && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Demo account — sample data
            </span>
          )}
          {data && <span className="text-ink-500">Updated {timeAgo(data.at)}</span>}
          <button className="btn-ghost py-1" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button className="btn-ghost py-1" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error.message} {data ? "Showing the last loaded data." : ""}
        </div>
      )}

      {!data ? (
        !error && <Skeleton rows={3} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Positions value" value={usd(stats.value)} hint={`cost basis ${usd(stats.cost)}`} />
            <StatTile
              label="Unrealised P&L"
              value={`${stats.pnl >= 0 ? "+" : "−"}${usd(Math.abs(stats.pnl))}`}
              hint={`${stats.pnl >= 0 ? "+" : "−"}${pct(Math.abs(stats.pnlPct), 1)} on cost · ${pct(stats.winRate)} of positions up`}
              tone={stats.pnl > 0 ? "up" : stats.pnl < 0 ? "down" : undefined}
            />
            <StatTile
              label="Cash"
              value={usd(data.balance.cash)}
              hint={`${usd(data.balance.buyingPower)} buying power`}
            />
            <StatTile
              label="Open orders"
              value={data.orders.length}
              hint={data.orders.length ? `${usd(ordersValue)} still to fill` : "none resting"}
            />
          </div>

          <Section title="Open orders" subtitle="Resting orders that haven't fully filled yet">
            <OrdersTable orders={data.orders} />
          </Section>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="min-w-0 lg:col-span-2">
              <Section title="Where your money is" subtitle="Current value by position">
                {data.positions.length ? (
                  <BarList
                    items={data.positions.slice(0, 8).map((p) => ({
                      key: p.id,
                      label: `${p.title} · ${p.outcome}`,
                      value: p.currentValue,
                    }))}
                    format={(v) => usd(v)}
                  />
                ) : (
                  <Empty>No open positions.</Empty>
                )}
                {stats.concentration > 0.4 && (
                  <p className="mt-4 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
                    Heads-up: {pct(stats.concentration)} of your positions' value sits in one market.
                  </p>
                )}
              </Section>
            </div>
            <div className="min-w-0 lg:col-span-3">
              <Section title="Open positions">
                <PositionsTable positions={data.positions} />
              </Section>
            </div>
          </div>

          <Section title="Recent activity" subtitle="Trades, resolutions, deposits and withdrawals">
            <ActivityList activity={data.activity} />
          </Section>
        </>
      )}
    </div>
  );
}

function OrdersTable({ orders }) {
  if (!orders.length) return <Empty>No open orders.</Empty>;
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
            <th className="px-5 py-2 font-semibold">Market</th>
            <th className="px-2 py-2 font-semibold">Order</th>
            <th className="px-2 py-2 text-right font-semibold">Price</th>
            <th className="px-2 py-2 text-right font-semibold">Filled</th>
            <th className="px-5 py-2 text-right font-semibold">To fill</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="max-w-[280px] px-5 py-2.5">
                <span className="line-clamp-2 font-medium">{o.title}</span>
                <span className="text-xs text-ink-500">
                  {o.state}
                  {o.createdAt && ` · placed ${timeAgo(o.createdAt)}`}
                </span>
              </td>
              <td className="px-2 py-2.5">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    o.isBuy ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                  }`}
                >
                  {o.action}
                </span>
                <span className="block text-xs text-ink-500">
                  {o.type} · {o.tif}
                </span>
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums">{Math.round(o.price * 100)}¢</td>
              <td className="px-2 py-2.5 text-right tabular-nums text-ink-600">
                {o.filled.toLocaleString()} / {o.quantity.toLocaleString()}
              </td>
              <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{usd(o.notional)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PositionsTable({ positions }) {
  if (!positions.length) return <Empty>No open positions.</Empty>;
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
            <th className="px-5 py-2 font-semibold">Market</th>
            <th className="px-2 py-2 text-right font-semibold">Avg → Now</th>
            <th className="px-2 py-2 text-right font-semibold">Value</th>
            <th className="px-5 py-2 text-right font-semibold">P&amp;L</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {positions.map((p) => (
            <tr key={p.id}>
              <td className="max-w-[260px] px-5 py-2.5">
                <span className="line-clamp-2 font-medium">{p.title}</span>
                <span className="text-xs text-ink-500">
                  {p.outcome} · {p.size.toLocaleString(undefined, { maximumFractionDigits: 0 })} contracts
                </span>
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums text-ink-600">
                {Math.round(p.avgPrice * 100)}¢ → {Math.round(p.curPrice * 100)}¢
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums">{usd(p.currentValue)}</td>
              <td
                className={`px-5 py-2.5 text-right font-semibold tabular-nums ${
                  p.cashPnl > 0 ? "text-emerald-700" : p.cashPnl < 0 ? "text-rose-700" : ""
                }`}
              >
                {p.cashPnl >= 0 ? "+" : "−"}
                {usd(Math.abs(p.cashPnl))}
                <span className="block text-xs font-normal">
                  {p.percentPnl >= 0 ? "+" : "−"}
                  {Math.abs(p.percentPnl).toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LABEL_TONE = {
  TRADE: "bg-brand-50 text-brand-800",
  DEPOSIT: "bg-emerald-50 text-emerald-800",
  WITHDRAW: "bg-rose-50 text-rose-800",
};

function ActivityList({ activity }) {
  if (!activity.length) return <Empty>No recent activity.</Empty>;
  return (
    <ul className="divide-y divide-ink-100">
      {activity.slice(0, 25).map((a) => (
        <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
          <span
            className={`w-20 shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-bold ${
              LABEL_TONE[a.label] || "bg-ink-100 text-ink-700"
            }`}
          >
            {a.label}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{a.title || "—"}</p>
            <p className="text-xs text-ink-500">
              {[a.detail, a.timestamp && timeAgo(a.timestamp)].filter(Boolean).join(" · ")}
            </p>
          </div>
          {a.amount !== null && <span className="shrink-0 font-semibold tabular-nums">{usd(a.amount)}</span>}
        </li>
      ))}
    </ul>
  );
}
