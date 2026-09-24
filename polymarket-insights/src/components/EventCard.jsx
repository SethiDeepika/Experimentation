import { eventUrl } from "../lib/api.js";
import { pct, timeUntil, usd } from "../lib/format.js";
import { isTopicTag } from "../lib/insights.js";
import { Change, ProbBar } from "./ui.jsx";

export default function EventCard({ event, rank }) {
  // Multi-outcome events: show the three most likely outcomes.
  const markets = [...event.markets].sort((a, b) => b.yes - a.yes).slice(0, 3);
  const single = event.markets.length === 1 ? event.markets[0] : null;

  return (
    <a
      href={eventUrl(event.slug)}
      target="_blank"
      rel="noreferrer"
      className="card flex flex-col gap-3 p-4 transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {event.image ? (
          <img src={event.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
            {rank ?? "•"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug">{event.title}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {event.tags.filter(isTopicTag).slice(0, 3).map((t) => (
              <span key={t.slug} className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600">
                {t.label}
              </span>
            ))}
          </div>
        </div>
        {single && (
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold tabular-nums">{pct(single.yes)}</p>
            <p className="text-[11px] text-ink-500">{single.outcomes[0] || "Yes"}</p>
          </div>
        )}
      </div>

      {single ? (
        <div className="flex items-center gap-3">
          <ProbBar value={single.yes} />
          <Change delta={single.change24h} />
        </div>
      ) : (
        <ul className="space-y-1.5">
          {markets.map((m) => (
            <li key={m.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm">
              <span className="truncate text-ink-700">{m.label}</span>
              <Change delta={m.change24h} />
              <span className="w-10 text-right font-semibold tabular-nums">{pct(m.yes)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex justify-between border-t border-ink-100 pt-2 text-xs text-ink-500">
        <span>{usd(event.volume24hr)} 24h vol</span>
        <span>{usd(event.liquidity)} liquidity</span>
        <span>{timeUntil(event.endDate)}</span>
      </div>
    </a>
  );
}
