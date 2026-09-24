import { useCallback, useEffect, useState } from "react";
import { eventUrl, fetchActivity, fetchPositions } from "../lib/api.js";
import { DEMO_WALLET, demoActivity, demoPositions } from "../lib/demoData.js";
import { pct, shortAddress, timeAgo, usd } from "../lib/format.js";
import { portfolioStats } from "../lib/insights.js";
import { REFRESH_MS } from "../lib/useLiveEvents.js";
import { BarList, Empty, Section, Skeleton, StatTile } from "./ui.jsx";

/** Open positions for a wallet (sample positions for the demo wallet). */
export const loadPositions = (wallet) =>
  wallet === DEMO_WALLET ? Promise.resolve(demoPositions()) : fetchPositions(wallet);

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function WalletForm({ onConnect }) {
  const [value, setValue] = useState("");
  const [remember, setRemember] = useState(true);
  const trimmed = value.trim();
  const looksLikeSecret = /^(0x)?[a-fA-F0-9]{64}$/.test(trimmed) || trimmed.split(/\s+/).length >= 12;
  const valid = ADDRESS_RE.test(trimmed);

  return (
    <Section title="Connect your Polymarket account" subtitle="Read-only — we only need your public wallet address">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onConnect(trimmed, remember);
        }}
      >
        <div>
          <label htmlFor="wallet" className="mb-1 block text-sm font-medium">
            Polymarket wallet address
          </label>
          <input
            id="wallet"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0x…"
            autoComplete="off"
            spellCheck="false"
            className="w-full rounded-xl border border-ink-200 px-3 py-2 font-mono text-sm outline-none focus:border-brand-400"
          />
          <p className="mt-1 text-xs text-ink-500">
            On polymarket.com open your profile → the address under your name (starts with 0x). Your
            positions and trades are public on-chain, so this is all we need.
          </p>
          {looksLikeSecret && (
            <p className="mt-2 rounded-lg bg-rose-50 p-2 text-sm font-medium text-rose-800">
              That looks like a private key or seed phrase. Never paste those anywhere — clear this field.
            </p>
          )}
          {trimmed && !valid && !looksLikeSecret && (
            <p className="mt-1 text-sm text-rose-700">Enter a 42-character address starting with 0x.</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember this address in this browser
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={!valid}>
            View my trades
          </button>
          <button type="button" className="btn-ghost" onClick={() => onConnect(DEMO_WALLET, false)}>
            Try a demo wallet
          </button>
        </div>
        <div className="rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
          <strong className="text-ink-800">Your keys stay yours.</strong> This page never asks for a
          password, private key, seed phrase or API secret, can't place trades, and sends your address only
          to Polymarket's public Data API.
        </div>
      </form>
    </Section>
  );
}

export default function PortfolioView({ wallet, onConnect, onDisconnect }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      if (wallet === DEMO_WALLET) {
        setData({ positions: demoPositions(), activity: demoActivity(), demo: true, at: Date.now() });
      } else {
        const [positions, activity] = await Promise.all([fetchPositions(wallet), fetchActivity(wallet)]);
        setData({ positions, activity, demo: false, at: Date.now() });
      }
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    setData(null);
    setError(null);
    refresh();
    const id = setInterval(() => document.visibilityState === "visible" && refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  if (!wallet) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your active trades</h1>
          <p className="text-sm text-ink-500">See your open positions, P&amp;L and recent trades.</p>
        </div>
        <WalletForm onConnect={onConnect} />
      </div>
    );
  }

  const stats = data && portfolioStats(data.positions);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your active trades</h1>
          <p className="text-sm text-ink-500">
            Wallet <span className="font-mono">{shortAddress(wallet)}</span>
            {data?.demo && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Demo wallet — sample data
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
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
          Couldn't load this wallet from Polymarket ({error.message}).{" "}
          {data ? "Showing the last loaded data." : "Check the address or try again shortly."}
        </div>
      )}

      {!data ? (
        !error && <Skeleton rows={3} />
      ) : !data.positions.length && !data.activity.length ? (
        <Empty>
          No open positions or recent trades for this address. Make sure it's your Polymarket profile
          address (not your deposit address from another wallet).
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Positions value" value={usd(stats.value)} hint={`cost basis ${usd(stats.cost)}`} />
            <StatTile
              label="Unrealised P&L"
              value={`${stats.pnl >= 0 ? "+" : "−"}${usd(Math.abs(stats.pnl))}`}
              hint={`${stats.pnl >= 0 ? "+" : "−"}${pct(Math.abs(stats.pnlPct), 1)} on cost`}
              tone={stats.pnl > 0 ? "up" : stats.pnl < 0 ? "down" : undefined}
            />
            <StatTile label="Open positions" value={stats.count} hint={`${pct(stats.winRate)} currently in profit`} />
            <StatTile
              label="Largest position"
              value={pct(stats.concentration)}
              hint={stats.redeemable > 0 ? `${usd(stats.redeemable)} ready to redeem` : "of portfolio value"}
            />
          </div>

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
                    Heads-up: {pct(stats.concentration)} of your portfolio sits in one position.
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

          <Section title="Recent activity" subtitle="Latest trades and redemptions">
            <ActivityList activity={data.activity} />
          </Section>
        </>
      )}
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
                <a
                  href={p.slug ? eventUrl(p.slug) : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="line-clamp-2 font-medium hover:text-brand-700"
                >
                  {p.title}
                </a>
                <span className="text-xs text-ink-500">
                  {p.outcome} · {p.size.toLocaleString(undefined, { maximumFractionDigits: 0 })} shares
                  {p.redeemable && " · redeemable"}
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

function ActivityList({ activity }) {
  if (!activity.length) return <Empty>No recent activity.</Empty>;
  return (
    <ul className="divide-y divide-ink-100">
      {activity.slice(0, 20).map((a) => {
        const label = a.type === "TRADE" ? a.side || "TRADE" : a.type;
        const tone =
          label === "BUY" ? "bg-emerald-50 text-emerald-800" : label === "SELL" ? "bg-rose-50 text-rose-800" : "bg-ink-100 text-ink-700";
        return (
          <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
            <span className={`w-20 shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-bold ${tone}`}>
              {label}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.title || "—"}</p>
              <p className="text-xs text-ink-500">
                {a.outcome && `${a.outcome} · `}
                {a.size > 0 && `${a.size.toLocaleString(undefined, { maximumFractionDigits: 0 })} @ ${Math.round(a.price * 100)}¢ · `}
                {timeAgo(a.timestamp)}
              </p>
            </div>
            <span className="shrink-0 font-semibold tabular-nums">{usd(a.usdcSize)}</span>
          </li>
        );
      })}
    </ul>
  );
}
