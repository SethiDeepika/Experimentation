import { eventUrl } from "../lib/api.js";
import { pct, timeUntil, usd } from "../lib/format.js";
import { Change, Empty } from "./ui.jsx";

/** Compact list of individual markets (used for movers, toss-ups, closing soon). */
export default function MarketList({ markets, show = "change", empty = "Nothing here right now." }) {
  if (!markets.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-ink-100">
      {markets.map((m) => {
        const sameTitle = m.label === m.event.title;
        return (
          <li key={m.id}>
            <a
              href={eventUrl(m.event.slug)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 py-2.5 hover:bg-ink-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.label}</p>
                {!sameTitle && <p className="truncate text-xs text-ink-500">{m.event.title}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums">{pct(m.yes)}</p>
                {show === "change" && <Change delta={m.change24h} />}
                {show === "volume" && <p className="text-xs text-ink-500">{usd(m.volume24hr)} 24h</p>}
                {show === "ends" && <p className="text-xs text-ink-500">{timeUntil(m.endDate)}</p>}
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
