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
- **My Trades** — enter your Polymarket wallet address to see open positions, value, unrealised
  P&L, win rate, concentration and recent activity. A demo wallet is available.

## Why only a wallet address?

Polymarket positions and trades are public on-chain, so the read-only
[Data API](https://data-api.polymarket.com) needs nothing but the address. The app never asks for a
password, private key, seed phrase or CLOB API secret, and warns if something that looks like a
key is pasted. Seeing *open limit orders* would require CLOB L2 API credentials with request
signing, which should not be entered into a static web page, so that's deliberately out of scope.

## APIs used

| Endpoint | Used for |
|---|---|
| `gamma-api.polymarket.com/events?active=true&closed=false&order=volume24hr&limit=100&offset=…&tag_slug=…` | trending + per-topic feeds (paged) |
| `data-api.polymarket.com/positions?user=…` | open positions |
| `data-api.polymarket.com/activity?user=…` | recent trades |

If the Gamma API can't be reached (offline, blocked network, CORS), the Trending and Interests
views fall back to clearly labelled sample data so the analysis still renders.

## Develop

```bash
npm install
npm run dev     # API calls go through the Vite proxy (/gamma, /data), so no CORS issues
npm run build   # production build calls the APIs directly
```

Code map: `src/lib/api.js` (fetch + normalise), `src/lib/insights.js` (all analysis, pure
functions), `src/lib/useLiveEvents.js` (polling + fallback), `src/components/` (views).
