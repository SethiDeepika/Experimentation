import { useCallback, useEffect, useState } from "react";
import InterestsView from "./components/InterestsView.jsx";
import PortfolioView from "./components/PortfolioView.jsx";
import TrendingView from "./components/TrendingView.jsx";
import { fetchTrendingPages } from "./lib/api.js";
import { demoEvents } from "./lib/demoData.js";
import { load, save } from "./lib/storage.js";
import useLiveEvents from "./lib/useLiveEvents.js";

const TABS = [
  { id: "trending", label: "Trending" },
  { id: "interests", label: "My Interests" },
  { id: "portfolio", label: "My Trades" },
];
const WALLET_KEY = "pm-insights:wallet";
const tabFromHash = () => {
  const id = window.location.hash.replace("#", "");
  return TABS.some((t) => t.id === id) ? id : "trending";
};

export default function App() {
  const [tab, setTab] = useState(tabFromHash);
  const [interests, setInterestsState] = useState(() => load("pm-insights:interests", []));
  // Shared by My Trades and My Interests (which shows your positions under followed tags).
  const [wallet, setWallet] = useState(() => load(WALLET_KEY, null));
  const connectWallet = (address, remember) => {
    save(WALLET_KEY, remember ? address : null);
    setWallet(address);
  };

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setInterests = (tags) => {
    setInterestsState(tags);
    save("pm-insights:interests", tags);
  };

  // The trending feed is loaded once here so it keeps polling across tabs and
  // seeds the interest picker with real tags. "Load more" adds a page; each
  // refresh re-fetches every loaded page so the whole list stays live.
  const [pages, setPages] = useState(1);
  const loadTrending = useCallback(() => fetchTrendingPages(pages), [pages]);
  const trending = useLiveEvents(loadTrending, demoEvents, [loadTrending], { keepOnChange: true });
  const loadMore = () => setPages((n) => n + 1);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <a href="#trending" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">◆</span>
            Polymarket Insights
          </a>
          <nav className="flex gap-1 rounded-xl bg-ink-100 p-1" aria-label="Sections">
            {TABS.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                aria-current={tab === t.id ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  tab === t.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
                }`}
              >
                {t.label}
                {t.id === "interests" && interests.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-xs text-brand-800">
                    {interests.length}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === "trending" && <TrendingView feed={trending} onLoadMore={loadMore} />}
        {tab === "interests" && (
          <InterestsView
            interests={interests}
            setInterests={setInterests}
            trendingEvents={trending.events}
            wallet={wallet}
          />
        )}
        {tab === "portfolio" && <PortfolioView wallet={wallet} onConnect={connectWallet} onDisconnect={() => connectWallet(null, false)} />}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-ink-500">
        Data from Polymarket's public Gamma and Data APIs, refreshed every minute. Not affiliated with
        Polymarket. Prices are implied probabilities, not advice. ·{" "}
        <a className="underline" href="../">
          More projects
        </a>
      </footer>
    </div>
  );
}
