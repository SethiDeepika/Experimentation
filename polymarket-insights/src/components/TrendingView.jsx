import { useMemo, useState } from "react";
import { isTopicTag } from "../lib/insights.js";
import EventCard from "./EventCard.jsx";
import Insights from "./Insights.jsx";
import { Section, Skeleton, SourceBar, SourceNote } from "./ui.jsx";

export default function TrendingView({ feed, onLoadMore }) {
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
          <p className="text-sm text-ink-500">
            Every open Polymarket event, ranked by 24h trading volume. Load more to go deeper.
          </p>
          <SourceNote className="mt-2">
            Market data from <strong>polymarket.com</strong> (international). Some markets may not be
            tradable on polymarket.us.
          </SourceNote>
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
            subtitle={`${shown.length} of ${events.length} loaded event${events.length === 1 ? "" : "s"}${
              tag === "all" ? "" : " match this topic"
            }`}
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
              {shown.map((e, i) => (
                <EventCard key={e.id} event={e} rank={i + 1} />
              ))}
            </div>
            <div className="mt-5 flex flex-col items-center gap-1">
              {feed.hasMore ? (
                <button className="btn-ghost" onClick={onLoadMore} disabled={loading}>
                  {loading ? "Loading…" : "Load 100 more events"}
                </button>
              ) : (
                source === "live" && (
                  <p className="text-sm text-ink-500">That's every open event on Polymarket.</p>
                )
              )}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
