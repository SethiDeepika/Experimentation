import { useCallback } from "react";
import { fetchTrendingEvents } from "../lib/api.js";
import { demoEvents } from "../lib/demoData.js";
import { tagsFromEvents } from "../lib/insights.js";
import useLiveEvents from "../lib/useLiveEvents.js";
import EventCard from "./EventCard.jsx";
import Insights from "./Insights.jsx";
import TagPicker from "./TagPicker.jsx";
import { Empty, Section, Skeleton, SourceBar } from "./ui.jsx";

// Fetch each followed tag's top events, then merge (an event can match several tags).
async function loadInterestEvents(tags) {
  const results = await Promise.allSettled(
    tags.map((t) => fetchTrendingEvents({ tagSlug: t.slug, limit: 25 }))
  );
  const ok = results.filter((r) => r.status === "fulfilled");
  if (!ok.length) throw results[0]?.reason || new Error("No data");
  const byId = new Map();
  for (const r of ok) for (const e of r.value) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => b.volume24hr - a.volume24hr);
}

export default function InterestsView({ interests, setInterests, trendingEvents }) {
  const key = interests.map((t) => t.slug).sort().join(",");
  const load = useCallback(
    () => (interests.length ? loadInterestEvents(interests) : Promise.resolve([])),
    [key] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const fallback = useCallback(
    () => demoEvents().filter((e) => e.tags.some((t) => interests.some((i) => i.slug === t.slug))),
    [key] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const feed = useLiveEvents(load, fallback, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your interests</h1>
          <p className="text-sm text-ink-500">
            Follow topics to build a personal feed. Saved in this browser only.
          </p>
        </div>
        {interests.length > 0 && <SourceBar {...feed} onRefresh={feed.refresh} />}
      </div>

      <Section title="Pick your topics" subtitle="Tap to follow or unfollow">
        <TagPicker
          available={tagsFromEvents(trendingEvents)}
          selected={interests}
          onChange={setInterests}
        />
      </Section>

      {!interests.length ? (
        <Empty>Follow a few topics above to see markets, movers and insights just for you.</Empty>
      ) : !feed.source ? (
        <Skeleton rows={4} />
      ) : !feed.events.length ? (
        <Empty>No open markets for these topics right now. Try following something else.</Empty>
      ) : (
        <>
          <Insights events={feed.events} byTagTitle="24h volume across your topics" />
          <Section title="Your feed" subtitle={`${feed.events.length} open events matching your topics`}>
            <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${feed.loading ? "opacity-70" : ""}`}>
              {feed.events.slice(0, 30).map((e, i) => (
                <EventCard key={e.id} event={e} rank={i + 1} />
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
