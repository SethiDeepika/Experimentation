import { useCallback, useEffect, useMemo, useState } from "react";
import { dedupeEvents, fetchAllEvents } from "../lib/api.js";
import { demoEvents } from "../lib/demoData.js";
import { shortAddress } from "../lib/format.js";
import { tagsFromEvents } from "../lib/insights.js";
import useLiveEvents from "../lib/useLiveEvents.js";
import EventCard from "./EventCard.jsx";
import Insights from "./Insights.jsx";
import MarketsTable from "./MarketsTable.jsx";
import { loadPositions, PositionsTable } from "./PortfolioView.jsx";
import TagPicker from "./TagPicker.jsx";
import { Empty, Section, Skeleton, SourceBar } from "./ui.jsx";

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

/** The connected wallet's open positions that sit in one of the given events. */
function useMatchingPositions(wallet, events) {
  const [positions, setPositions] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let live = true;
    setPositions(null);
    setError(null);
    if (wallet) {
      loadPositions(wallet)
        .then((p) => live && setPositions(p))
        .catch((e) => live && setError(e));
    }
    return () => {
      live = false;
    };
  }, [wallet]);

  const slugs = useMemo(() => new Set(events.map((e) => e.slug)), [events]);
  return {
    matching: positions && positions.filter((p) => slugs.has(p.slug)),
    total: positions?.length ?? 0,
    error,
  };
}

export default function InterestsView({ interests, setInterests, trendingEvents, wallet }) {
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
  const mine = useMatchingPositions(wallet, feed.events);
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
            title="Your open positions in these topics"
            subtitle={
              wallet
                ? `Wallet ${shortAddress(wallet)}${
                    mine.matching ? ` · ${mine.matching.length} of ${mine.total} positions match` : ""
                  }`
                : undefined
            }
          >
            {!wallet ? (
              <Empty>
                <a href="#portfolio" className="font-medium text-brand-700 underline">
                  Connect your wallet in My Trades
                </a>{" "}
                to see which of your positions fall under these topics.
              </Empty>
            ) : mine.error ? (
              <p className="text-sm text-rose-700">Couldn't load your positions ({mine.error.message}).</p>
            ) : !mine.matching ? (
              <Skeleton rows={1} />
            ) : mine.matching.length ? (
              <PositionsTable positions={mine.matching} />
            ) : (
              <Empty>None of your open positions are in these topics.</Empty>
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
