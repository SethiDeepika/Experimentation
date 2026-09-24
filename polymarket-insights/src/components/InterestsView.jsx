import { useCallback, useEffect, useMemo, useState } from "react";
import { dedupeEvents, fetchAllEvents } from "../lib/api.js";
import { demoEvents, demoUsEventTags } from "../lib/demoData.js";
import { fetchUsEventTags } from "../lib/polymarketUs.js";
import { tagsFromEvents } from "../lib/insights.js";
import useLiveEvents from "../lib/useLiveEvents.js";
import EventCard from "./EventCard.jsx";
import Insights from "./Insights.jsx";
import MarketsTable from "./MarketsTable.jsx";
import { loadUsAccount, PositionsTable } from "./PortfolioView.jsx";
import TagPicker from "./TagPicker.jsx";
import { Empty, Section, Skeleton, SourceBar, SourceNote } from "./ui.jsx";

const MAX_PER_TAG = 500;
const CARD_STEP = 30;

// Fetch every open event for each followed tag, then merge (an event can match several tags).
async function loadInterestEvents(tags) {
  const results = await Promise.allSettled(
    tags.map((t) => fetchAllEvents({ tagSlug: t.slug, max: MAX_PER_TAG }))
  );
  const ok = results.filter((r) => r.status === "fulfilled");
  if (!ok.length) throw results[0]?.reason || new Error("No data");
  return dedupeEvents(ok.map((r) => r.value));
}

/**
 * The connected Polymarket US account's positions whose event carries one of the
 * followed tags. Tags come from Polymarket US's own (public) events endpoint,
 * since US and polymarket.com events are separate listings.
 */
function useMatchingPositions(creds, tagSlugs) {
  const [state, setState] = useState({ positions: null, tags: {}, error: null });
  useEffect(() => {
    let live = true;
    setState({ positions: null, tags: {}, error: null });
    if (creds) {
      (async () => {
        const { positions } = await loadUsAccount(creds);
        const slugs = [...new Set(positions.map((p) => p.eventSlug).filter(Boolean))];
        const tags = creds.demo ? demoUsEventTags() : await fetchUsEventTags(slugs);
        if (live) setState({ positions, tags, error: null });
      })().catch((error) => live && setState({ positions: null, tags: {}, error }));
    }
    return () => {
      live = false;
    };
  }, [creds]);

  const matching =
    state.positions &&
    state.positions.filter((p) => (state.tags[p.eventSlug] || []).some((t) => tagSlugs.includes(t)));
  return { matching, total: state.positions?.length ?? 0, error: state.error };
}

export default function InterestsView({ interests, setInterests, trendingEvents, usCreds }) {
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
  const mine = useMatchingPositions(
    usCreds,
    interests.map((t) => t.slug)
  );
  const [cards, setCards] = useState(CARD_STEP);
  useEffect(() => setCards(CARD_STEP), [key]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your interests</h1>
          <p className="text-sm text-ink-500">
            Follow topics to see every open market under them. Saved in this browser only.
          </p>
          <SourceNote className="mt-2">
            Markets come from <strong>polymarket.com</strong>. Your positions below come from{" "}
            <strong>polymarket.us</strong>, matched to your topics by Polymarket US's own tags.
          </SourceNote>
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
          <Insights
            events={feed.events}
            byTagTitle="24h volume across your topics"
            onlyTags={interests.map((t) => t.slug)}
          />

          <Section
            title="Your Polymarket US positions in these topics"
            subtitle={
              usCreds && mine.matching
                ? `${mine.matching.length} of ${mine.total} open positions match`
                : undefined
            }
          >
            {!usCreds ? (
              <Empty>
                <a href="#portfolio" className="font-medium text-brand-700 underline">
                  Connect your Polymarket US account in My Trades
                </a>{" "}
                to see which of your positions fall under these topics.
              </Empty>
            ) : mine.error ? (
              <p className="text-sm text-rose-700">Couldn't load your positions: {mine.error.message}</p>
            ) : !mine.matching ? (
              <Skeleton rows={1} />
            ) : mine.matching.length ? (
              <PositionsTable positions={mine.matching} />
            ) : (
              <Empty>None of your open positions are tagged with these topics.</Empty>
            )}
          </Section>

          <Section title="All open markets in your topics" subtitle="Every market, not just the top ones">
            <MarketsTable events={feed.events} />
          </Section>

          <Section title="Your feed" subtitle={`${feed.events.length.toLocaleString()} open events`}>
            <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${feed.loading ? "opacity-70" : ""}`}>
              {feed.events.slice(0, cards).map((e, i) => (
                <EventCard key={e.id} event={e} rank={i + 1} />
              ))}
            </div>
            {feed.events.length > cards && (
              <div className="mt-5 text-center">
                <button className="btn-ghost" onClick={() => setCards((n) => n + CARD_STEP)}>
                  Show more events ({(feed.events.length - cards).toLocaleString()} left)
                </button>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
