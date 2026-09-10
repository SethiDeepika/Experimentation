# Regulation Breach Analyzer

A small interactive demo: describe a security incident and get a full compliance breakdown —
which data-protection regulations likely apply, *why*, how it impacts your firm, and recommended
next steps — powered by [Groq](https://groq.com)'s free API.

Live example incidents you can try are built into the page (stolen laptop, phishing email, cloud
misconfiguration, ransomware).

## How it works

The incident text is sent to a small serverless proxy (`worker/index.js`, a
[Cloudflare Worker](https://workers.cloudflare.com/)) which calls Groq's free API
(`openai/gpt-oss-120b`). The model identifies which regulations plausibly apply (GDPR, CCPA/CPRA,
HIPAA, GLBA, PCI DSS, US state breach laws, FERPA) and, for each one, returns:

- **Why it applies** — the specific facts in the incident that trigger it
- **Impact on your firm** — regulatory penalties, legal exposure, and reputational/operational
  consequences
- **Recommended actions** — concrete next steps to take in response

This step sends incident text to a third party (Groq, via the proxy) — it is not processed locally.

The Groq API key can't live in the public site's JS (anyone can view source), so it's stored only as
an encrypted secret on the Cloudflare Worker, never in the repo or the client-side code. Cloudflare's
free tier (100,000 requests/day) and Groq's free tier both cost nothing at personal-portfolio traffic
levels.

It's plain HTML/CSS/JS (`index.html`, `style.css`, `app.js`), plus one small Worker file — no
frontend build step.

## Deploying the Groq analysis proxy (required)

The site won't return results until this is deployed once:

1. Create a free Groq API key at [console.groq.com/keys](https://console.groq.com/keys).
2. Create a free Cloudflare account, then install and log in to Wrangler (Cloudflare's CLI) —
   or use the Cloudflare dashboard's browser-based "Edit code" editor if you'd rather not use a
   terminal:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. From this folder (`regulation-breach-analyzer/`), store your Groq key as a Worker secret —
   **never commit it, and never paste it anywhere else**:
   ```bash
   wrangler secret put GROQ_API_KEY
   ```
4. Deploy the Worker:
   ```bash
   wrangler deploy
   ```
   Wrangler prints a URL like `https://regulation-breach-analyzer-api.<your-subdomain>.workers.dev`.
5. Put that URL (not a secret — safe to share/commit) into `GROQ_PROXY_URL` near the top of `app.js`,
   commit, and push.

**Note:** the Worker does not auto-deploy from GitHub. Any change to `worker/index.js` in this repo
(e.g. a model name update) must be re-pasted into the Cloudflare dashboard's "Edit code" screen (or
re-run via `wrangler deploy`) to take effect.

## Run locally

Just serve the folder with any static file server, e.g.:

```bash
npx serve .
```

Open the printed URL in a browser. (A plain `file://` open won't work because ES module imports
require an HTTP server.)

## Deploy for free (GitHub Pages)

This repo's `.github/workflows/deploy.yml` deploys this folder to GitHub Pages automatically on
every push to `main`.

One-time setup (only needs to be done once, by a repo admin):

1. Go to the repo's **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or merge this branch into it) — the workflow will build and publish the site.

Your site will be live at `https://<username>.github.io/<repo>/`.

## Disclaimer

Educational demo only, not legal advice. Explanations are AI-generated (by Groq's `openai/gpt-oss-120b`)
and can be wrong, oversimplified, or generic.
