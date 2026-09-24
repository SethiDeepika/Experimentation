import { useMemo, useState } from "react";
import { eventUrl } from "../lib/api.js";
import { pct, timeUntil, usd } from "../lib/format.js";
import { Change, Empty } from "./ui.jsx";

const SORTS = {
  volume: { label: "24h volume", fn: (a, b) => b.volume24hr - a.volume24hr },
  move: { label: "Biggest 24h move", fn: (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h) },
  ending: {
    label: "Ending soonest",
    fn: (a, b) => (Date.parse(a.endDate) || Infinity) - (Date.parse(b.endDate) || Infinity),
  },
  likely: { label: "Most likely", fn: (a, b) => b.yes - a.yes },
};
const STEP = 50;

/** Every open market across the given events, searchable and sortable. */
export default function MarketsTable({ events }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("volume");
  const [limit, setLimit] = useState(STEP);

  const markets = useMemo(
    () => events.flatMap((e) => e.markets.map((m) => ({ ...m, event: e }))),
    [events]
  );
  const q = query.trim().toLowerCase();
  const rows = useMemo(() => {
    const hit = q
      ? markets.filter((m) => `${m.label} ${m.event.title}`.toLowerCase().includes(q))
      : markets;
    return [...hit].sort(SORTS[sort].fn);
  }, [markets, q, sort]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(STEP);
          }}
          placeholder="Search markets…"
          className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400 sm:w-64"
        />
        <label className="flex items-center gap-2 text-sm text-ink-600">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-ink-200 bg-white px-2 py-2 text-sm"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-ink-500">
          {rows.length.toLocaleString()} open market{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {!rows.length ? (
        <Empty>No markets match “{query}”.</Empty>
      ) : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="px-5 py-2 font-semibold">Market</th>
                <th className="px-2 py-2 text-right font-semibold">Yes</th>
                <th className="px-2 py-2 text-right font-semibold">24h</th>
                <th className="px-2 py-2 text-right font-semibold">24h vol</th>
                <th className="px-5 py-2 text-right font-semibold">Ends</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.slice(0, limit).map((m) => (
                <tr key={m.id} className="hover:bg-ink-50">
                  <td className="max-w-[320px] px-5 py-2">
                    <a
                      href={eventUrl(m.event.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium hover:text-brand-700"
                    >
                      {m.label}
                    </a>
                    {m.label !== m.event.title && (
                      <span className="block truncate text-xs text-ink-500">{m.event.title}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">{pct(m.yes)}</td>
                  <td className="px-2 py-2 text-right">
                    <Change delta={m.change24h} />
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-ink-600">{usd(m.volume24hr)}</td>
                  <td className="px-5 py-2 text-right text-ink-600">{timeUntil(m.endDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > limit && (
        <div className="mt-4 text-center">
          <button className="btn-ghost" onClick={() => setLimit((n) => n + STEP)}>
            Show {Math.min(STEP, rows.length - limit)} more ({(rows.length - limit).toLocaleString()} left)
          </button>
        </div>
      )}
    </div>
  );
}
