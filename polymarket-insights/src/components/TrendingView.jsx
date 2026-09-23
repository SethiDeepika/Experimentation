import { useMemo, useState } from "react";
import { isTopicTag } from "../lib/insights.js";
import EventCard from "./EventCard.jsx";
import Insights from "./Insights.jsx";
import { Section, Skeleton, SourceBar } from "./ui.jsx";

export default function TrendingView({ feed }) {
  const [tag, setTag] = useState("all");
  const { events, loading, source } = feed;

  const topTags = useMemo(() => {
    const seen = new Map();
    for (const e of events) for (const t of e.tags.filter(isTopicTag)) seen.set(t.slug, t);
    return [...seen.values()].slice(0, 10);
  }, [events]);

  const shown = tag === "all" ? events : events.filter((e) => e.tags.some((t) => t.slug === tag));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Trending markets</h1>
          <p className="text-sm text-ink-500">Open Polymarket events ranked by 24h trading volume.</p>
        </div>
        <SourceBar {...feed} onRefresh={feed.refresh} />
      </div>

      {!source ? (
        <Skeleton rows={4} />
      ) : (
        <>
          <Insights events={events} />
          <Section
            title="Top events"
            subtitle={`${shown.length} event${shown.length === 1 ? "" : "s"}`}
            action={
              <div className="flex flex-wrap gap-1.5">
                {[{ slug: "all", label: "All" }, ...topTags].map((t) => (
                  <button
                    key={t.slug}
                    onClick={() => setTag(t.slug)}
                    className={`chip py-0.5 ${
                      tag === t.slug
                        ? "border-ink-900 bg-ink-900 text-white"
                        : "border-ink-200 text-ink-600 hover:bg-ink-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-70" : ""}`}>
              {shown.slice(0, 30).map((e, i) => (
                <EventCard key={e.id} event={e} rank={i + 1} />
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
