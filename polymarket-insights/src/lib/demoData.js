// Sample data in the same shape as the live APIs, used only when Polymarket
// can't be reached (offline, blocked network, CORS) and for the demo wallet.
// Every screen that shows it says so.
import { normalizeEvent } from "./api.js";

const day = 864e5;
const inDays = (d) => new Date(Date.now() + d * day).toISOString();
const T = {
  politics: { slug: "politics", label: "Politics" },
  elections: { slug: "elections", label: "Elections" },
  crypto: { slug: "crypto", label: "Crypto" },
  bitcoin: { slug: "bitcoin", label: "Bitcoin" },
  sports: { slug: "sports", label: "Sports" },
  nba: { slug: "nba", label: "NBA" },
  soccer: { slug: "soccer", label: "Soccer" },
  economy: { slug: "economy", label: "Economy" },
  fed: { slug: "fed", label: "Fed" },
  tech: { slug: "tech", label: "Tech" },
  ai: { slug: "ai", label: "AI" },
  culture: { slug: "pop-culture", label: "Culture" },
  geopolitics: { slug: "geopolitics", label: "Geopolitics" },
};

function market(id, label, yes, change, vol, endDays, outcomes = ["Yes", "No"]) {
  return {
    id,
    question: label,
    groupItemTitle: label,
    slug: `demo-${id}`,
    outcomes: JSON.stringify(outcomes),
    outcomePrices: JSON.stringify([yes, +(1 - yes).toFixed(3)]),
    oneDayPriceChange: change,
    volume24hr: vol,
    volumeNum: vol * 18,
    liquidityNum: vol * 0.6,
    endDate: inDays(endDays),
    active: true,
    closed: false,
  };
}

function event(id, title, tags, markets) {
  const volume24hr = markets.reduce((s, m) => s + m.volume24hr, 0);
  return {
    id,
    slug: `demo-event-${id}`,
    title,
    tags,
    volume24hr,
    volume: volume24hr * 18,
    liquidity: volume24hr * 0.6,
    endDate: markets[0].endDate,
    markets,
  };
}

const RAW = [
  event(1, "Fed decision in October?", [T.economy, T.fed], [
    market(101, "No change", 0.71, 0.06, 2_850_000, 28),
    market(102, "25 bps decrease", 0.26, -0.05, 1_940_000, 28),
    market(103, "50+ bps decrease", 0.03, -0.01, 310_000, 28),
  ]),
  event(2, "Bitcoin above $150k by Dec 31?", [T.crypto, T.bitcoin], [
    market(201, "Bitcoin above $150k by Dec 31?", 0.34, 0.08, 2_210_000, 99),
  ]),
  event(3, "NBA Champion 2027", [T.sports, T.nba], [
    market(301, "Oklahoma City Thunder", 0.24, 0.01, 640_000, 270),
    market(302, "Boston Celtics", 0.16, -0.02, 420_000, 270),
    market(303, "Denver Nuggets", 0.11, 0.0, 280_000, 270),
  ]),
  event(4, "Which company has the best AI model end of October?", [T.tech, T.ai], [
    market(401, "Google", 0.48, 0.12, 1_150_000, 38),
    market(402, "OpenAI", 0.31, -0.09, 890_000, 38),
    market(403, "Anthropic", 0.17, -0.02, 520_000, 38),
  ]),
  event(5, "Ukraine x Russia ceasefire in 2026?", [T.politics, T.geopolitics], [
    market(501, "Ukraine x Russia ceasefire in 2026?", 0.18, -0.04, 960_000, 99),
  ]),
  event(6, "NYC Mayoral race: who wins?", [T.politics, T.elections], [
    market(601, "Candidate A", 0.52, 0.03, 1_320_000, 42),
    market(602, "Candidate B", 0.44, -0.03, 1_090_000, 42),
  ]),
  event(7, "Champions League: Real Madrid vs Man City", [T.sports, T.soccer], [
    market(701, "Real Madrid", 0.46, 0.04, 780_000, 2, ["Real Madrid", "Man City"]),
  ]),
  event(8, "US recession in 2026?", [T.economy], [
    market(801, "US recession in 2026?", 0.21, -0.01, 410_000, 99),
  ]),
  event(9, "Ethereum above $5k on Friday?", [T.crypto], [
    market(901, "Ethereum above $5k on Friday?", 0.57, 0.11, 870_000, 3),
  ]),
  event(10, "Top Spotify artist this week", [T.culture], [
    market(1001, "Taylor Swift", 0.62, 0.05, 190_000, 5),
    market(1002, "Bad Bunny", 0.22, -0.04, 120_000, 5),
  ]),
  event(11, "Government shutdown by Oct 1?", [T.politics, T.economy], [
    market(1101, "Government shutdown by Oct 1?", 0.49, 0.14, 1_520_000, 6),
  ]),
  event(12, "Apple announces foldable iPhone in 2026?", [T.tech], [
    market(1201, "Apple announces foldable iPhone in 2026?", 0.09, -0.02, 150_000, 99),
  ]),
];

export const demoEvents = () =>
  RAW.map(normalizeEvent).sort((a, b) => b.volume24hr - a.volume24hr);

// A sample Polymarket US account, already in the shape fetchUsAccount() returns.
export function demoUsAccount() {
  const positions = [
    ["Fed decision in October? — No change", "demo-event-1", "Long · Yes", 1800, 0.58, 0.71],
    ["Bitcoin above $150k by Dec 31?", "demo-event-2", "Short · No", 1200, 0.61, 0.66],
    ["Best AI model end of October — OpenAI", "demo-event-4", "Long · Yes", 900, 0.44, 0.31],
    ["Government shutdown by Oct 1?", "demo-event-11", "Long · Yes", 650, 0.38, 0.49],
    ["Top Spotify artist this week — Bad Bunny", "demo-event-10", "Long · Yes", 400, 0.3, 0.22],
  ].map(([title, eventSlug, outcome, size, avgPrice, curPrice], i) => {
    const initialValue = size * avgPrice;
    const currentValue = size * curPrice;
    return {
      id: `demo-${i}`,
      marketSlug: `demo-market-${i}`,
      eventSlug,
      title,
      outcome,
      size,
      avgPrice,
      curPrice,
      initialValue,
      currentValue,
      cashPnl: currentValue - initialValue,
      percentPnl: ((currentValue - initialValue) / initialValue) * 100,
      realized: 0,
      expired: false,
    };
  });
  const orders = [
    ["Ethereum above $5k on Friday?", "Buy Yes", true, 0.52, 500, 120, 1],
    ["NYC Mayoral race — Candidate A", "Buy Yes", true, 0.48, 300, 0, 3],
    ["Fed decision in October? — No change", "Sell Yes", false, 0.8, 600, 0, 20],
  ].map(([title, action, isBuy, price, quantity, filled, hoursAgo], i) => ({
    id: `demo-order-${i}`,
    title,
    outcome: "",
    action,
    isBuy,
    type: "limit",
    tif: "good till cancel",
    state: filled ? "partially filled" : "new",
    price,
    quantity,
    filled,
    remaining: quantity - filled,
    notional: price * (quantity - filled),
    createdAt: Date.now() - hoursAgo * 36e5,
  }));
  const activity = [
    ["TRADE", "Government shutdown by Oct 1?", "650 @ 38¢", 247, 0.2],
    ["TRADE", "Fed decision in October? — No change", "600 @ 62¢", 372, 1.5],
    ["DEPOSIT", "Account deposit", "completed", 2000, 2],
    ["TRADE", "Top Spotify artist this week — Bad Bunny", "400 @ 30¢", 120, 3],
    ["RESOLVED", "Champions League: Real Madrid vs Man City", "", null, 5],
    ["TRADE", "Bitcoin above $150k by Dec 31?", "1,200 @ 61¢", 732, 9],
  ].map(([label, title, detail, amount, daysAgo], i) => ({
    id: `demo-act-${i}`,
    label,
    title,
    detail,
    amount,
    timestamp: Date.now() - daysAgo * day,
  }));
  return { positions, orders, activity, balance: { cash: 1840.5, buyingPower: 1606.5, inOpenOrders: 234 } };
}

/** Tags for the demo account's events, mirroring fetchUsEventTags(). */
export const demoUsEventTags = () =>
  Object.fromEntries(RAW.map((e) => [`demo-event-${e.id}`, e.tags.map((t) => t.slug)]));
