// Background for anyone who wants to go further than this read-only page:
// connecting an app to Polymarket US accounts to read trades and place orders.

const LINKS = [
  ["Partner Integration (ISVs & Introducing Brokers)", "https://docs.polymarket.us/partners/overview"],
  ["Polymarket US developer portal (API keys)", "https://polymarket.us/developer"],
  ["Developer resources", "https://www.polymarketexchange.com/developers.html"],
  ["Official TypeScript SDK (polymarket-us)", "https://github.com/Polymarket/polymarket-us-typescript"],
];

function Point({ children }) {
  return (
    <li className="flex gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
      <span>{children}</span>
    </li>
  );
}

export default function BuildersGuide() {
  return (
    <details className="card group p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span>
          <span className="block text-base font-bold">Building an app that trades on Polymarket US?</span>
          <span className="block text-sm text-ink-500">
            How apps can connect to users' accounts to read trades and place orders
          </span>
        </span>
        <span className="text-ink-400 transition group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>

      <div className="mt-5 space-y-6 text-sm leading-relaxed text-ink-700">
        <p>
          Polymarket US has no username/password login for apps and no public lookup of someone's trades.
          Account access goes through API keys or Polymarket's partner program.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-ink-200 p-4">
            <h3 className="font-bold text-ink-900">Option 1 — users bring their own API keys</h3>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Fine for personal tools
            </p>
            <ul className="mt-3 space-y-1.5">
              <Point>
                Each user creates a key at polymarket.us/developer and gives it to the app, which signs
                requests (this page works this way, read-only).
              </Point>
              <Point>
                The API supports trading: create, cancel, modify and preview orders, and close positions.
              </Point>
              <Point>
                <strong>No scopes:</strong> a key can do everything; there's no “read-only” or spending limit.
              </Point>
              <Point>
                <strong>Custody:</strong> trading keys don't belong in a browser. They'd have to be encrypted on
                your server, making you responsible for every user's trading access.
              </Point>
              <Point>
                <strong>Regulation:</strong> Polymarket US is CFTC-regulated. Placing trades for other people
                starts to look like regulated intermediary activity.
              </Point>
            </ul>
          </section>

          <section className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <h3 className="font-bold text-ink-900">Option 2 — Polymarket US partner program</h3>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
              The right path for a public app
            </p>
            <ul className="mt-3 space-y-1.5">
              <Point>
                An official integration for <strong>ISVs</strong> (companies that build the trading app) and{" "}
                <strong>Introducing Brokers</strong>.
              </Point>
              <Point>Apply, get approved and complete integration testing.</Point>
              <Point>Onboard and verify (KYC) users through Polymarket's flow — users never hand you personal keys.</Point>
              <Point>Fund users' trading, place orders for them and monitor activity via the partner APIs.</Point>
            </ul>
          </section>
        </div>

        <section>
          <h3 className="font-bold text-ink-900">How such an app is built (either option)</h3>
          <div className="mt-3 grid gap-2 text-center text-xs sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
            <div className="rounded-lg border border-ink-200 bg-white p-2">
              <p className="font-semibold text-ink-900">Your app</p>
              <p className="text-ink-500">UI, trade confirmations</p>
            </div>
            <span className="text-ink-400" aria-hidden="true">→</span>
            <div className="rounded-lg border border-ink-200 bg-white p-2">
              <p className="font-semibold text-ink-900">Your backend</p>
              <p className="text-ink-500">holds credentials, signs requests, risk checks, audit log</p>
            </div>
            <span className="text-ink-400" aria-hidden="true">→</span>
            <div className="rounded-lg border border-ink-200 bg-white p-2">
              <p className="font-semibold text-ink-900">Polymarket US API</p>
              <p className="text-ink-500">positions, orders, balances, trading</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5">
            <Point>
              <strong>Backend only:</strong> keep keys in a secrets manager and sign on the server. The private
              WebSocket can't be opened from a browser anyway (it needs signed headers).
            </Point>
            <Point>
              <strong>Confirm every trade:</strong> preview the order, show cost and fees, then submit.
            </Point>
            <Point>
              <strong>Guardrails:</strong> per-user size and daily limits, a kill switch, and an audit log of every
              order.
            </Point>
            <Point>
              <strong>Live updates:</strong> subscribe to the private WebSocket server-side for fills, positions and
              balance, then push them to the app.
            </Point>
            <Point>
              <strong>Rate limits:</strong> public endpoints allow about 60 requests a minute, so cache market data.
            </Point>
          </ul>
        </section>

        <section className="rounded-xl bg-ink-50 p-4">
          <h3 className="font-bold text-ink-900">Recommendation</h3>
          <ul className="mt-2 space-y-1.5">
            <Point>
              <strong>Just for yourself:</strong> Option 1, with trading done by a small server you control.
            </Point>
            <Point>
              <strong>For other people:</strong> apply to the partner program and get legal advice on CFTC rules
              before building. That shapes the architecture more than the code does.
            </Point>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-ink-900">Sources</h3>
          <ul className="mt-2 space-y-1">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <a className="text-brand-700 underline hover:text-brand-900" href={href} target="_blank" rel="noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-500">
            General information, not legal advice. Check Polymarket US's current docs and terms before building.
          </p>
        </section>
      </div>
    </details>
  );
}
