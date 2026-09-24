# Polymarket Insights

A front-end over Polymarket's public APIs with three views:

- **Trending** — every open event ranked by 24h volume, 100 at a time ("Load more" pages
  through the rest), refreshed every minute, with KPIs, generated
  takeaways, 24h volume by topic, biggest movers, toss-up markets (40–60%) and markets closing this
  week. Filter the event grid by topic.
- **My Interests** — follow topics (popular tags plus every tag seen in the live feed, searchable).
  The app fetches *every* open event under each followed tag (paged, up to 500 per tag), runs the
  same analysis on that feed, lists all their open markets in a searchable, sortable table, and —
  if a wallet is connected — shows your open positions that fall under those topics.
  Followed topics are saved in `localStorage`.
- **My Trades** — your **Polymarket US** (polymarket.us) account: open positions, open orders,
  cash / buying power, unrealised P&L, concentration and recent activity. My Interests also shows
  which of those positions fall under your followed topics. A demo account is available.

Trending and My Interests use **polymarket.com** market data; My Trades uses **polymarket.us**
account data. The app says so on each tab.

## Polymarket US API keys

Polymarket US accounts are regular KYC'd exchange accounts, not public on-chain wallets, so account
data needs the user's own API key from [polymarket.us/developer](https://polymarket.us/developer)
(a Key ID and a base64 Ed25519 Secret Key).

- Each request is signed **in the browser** (Ed25519 over `timestamp + METHOD + path`, sent as
  `X-PM-Access-Key` / `X-PM-Timestamp` / `X-PM-Signature`), matching Polymarket's official
  [`polymarket-us`](https://www.npmjs.com/package/polymarket-us) SDK. The secret itself is never
  sent anywhere.
- Keys live in React state only — never in `localStorage`/`sessionStorage` — and are dropped on
  reload or Disconnect.
- The page only calls read endpoints, but a Polymarket US key can trade, so the UI warns users to
  treat it like a password and revoke it when done.

## APIs used

| Endpoint | Used for |
|---|---|
| `gamma-api.polymarket.com/events?active=true&closed=false&order=volume24hr&limit=100&offset=…&tag_slug=…` | trending + per-topic feeds (paged) |
| `api.polymarket.us/v1/portfolio/positions` (signed) | open positions |
| `api.polymarket.us/v1/orders/open` (signed) | open orders |
| `api.polymarket.us/v1/account/balances` (signed) | cash and buying power |
| `api.polymarket.us/v1/portfolio/activities` (signed) | recent activity |
| `gateway.polymarket.us/v1/events?slug=…` | tags of your positions' events (for My Interests) |

If the Gamma API can't be reached (offline, blocked network, CORS), the Trending and Interests
views fall back to clearly labelled sample data so the analysis still renders.

## Develop

```bash
npm install
npm run dev     # API calls go through the Vite proxy (/gamma, /pmus-api, /pmus-gateway), so no CORS issues
npm run build   # production build calls the APIs directly
```

Code map: `src/lib/api.js` (polymarket.com fetch + normalise), `src/lib/polymarketUs.js`
(Polymarket US signed client), `src/lib/insights.js` (all analysis, pure
functions), `src/lib/useLiveEvents.js` (polling + fallback), `src/components/` (views).
