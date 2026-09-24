import { usd } from "../lib/format.js";
import {
  biggestMovers,
  closingSoon,
  headlines,
  summarize,
  tossUps,
  volumeByTag,
} from "../lib/insights.js";
import MarketList from "./MarketList.jsx";
import { BarList, Section, StatTile } from "./ui.jsx";

/** KPI row, key takeaways, topic breakdown and market lists for a set of events. */
export default function Insights({ events, byTagTitle = "24h volume by topic", onlyTags = null }) {
  const s = summarize(events);
  const tags = volumeByTag(events, onlyTags ? onlyTags.length : 8, onlyTags);
  const lines = headlines(events);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="24h volume" value={usd(s.volume24hr)} hint="across events shown" />
        <StatTile label="Liquidity" value={usd(s.liquidity)} hint="order-book depth" />
        <StatTile label="Events" value={s.eventCount} />
        <StatTile label="Open markets" value={s.marketCount} />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-2">
        <Section title="Key insights" subtitle="Generated from the markets below">
          <ul className="space-y-2 text-sm text-ink-700">
            {lines.map((l) => (
              <li key={l} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </Section>
        </div>
        <div className="min-w-0 lg:col-span-3">
          <Section title={byTagTitle} subtitle="An event counts toward every topic it's tagged with">
            <BarList
              items={tags.map((t) => ({
                key: t.slug,
                label: t.label,
                value: t.volume24hr,
                detail: `${t.events} event${t.events === 1 ? "" : "s"}`,
              }))}
              format={(v) => usd(v)}
            />
          </Section>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Section title="Biggest movers" subtitle="Largest 24h change in implied probability">
          <MarketList markets={biggestMovers(events)} show="change" />
        </Section>
        <Section title="Toss-ups" subtitle="Binary markets priced 40–60%, by volume">
          <MarketList markets={tossUps(events)} show="volume" empty="No coin-flip markets in this set." />
        </Section>
        <Section title="Closing this week" subtitle="Resolving within 7 days, by volume">
          <MarketList markets={closingSoon(events)} show="ends" empty="Nothing resolves in the next 7 days." />
        </Section>
      </div>
    </div>
  );
}
