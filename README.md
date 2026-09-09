# Regulation Breach Analyzer

A small interactive demo: describe a security incident and open-source AI models — running
**entirely in your browser** — figure out which data-protection regulations were likely triggered and
explain, in a generated sentence, *specifically how* each one was breached.

Live example incidents you can try are built into the page (stolen laptop, phishing email, cloud
misconfiguration, ransomware).

## How it works

Two small open-source models run back to back, entirely on your device, via
[Transformers.js](https://github.com/huggingface/transformers.js):

1. **Matching** — a zero-shot classifier
   ([`Xenova/nli-deberta-v3-xsmall`](https://huggingface.co/Xenova/nli-deberta-v3-xsmall), DeBERTa-v3
   fine-tuned on MNLI) scores how well the incident entails each candidate regulation (GDPR, CCPA,
   HIPAA, GLBA, PCI DSS, US state breach laws, FERPA), without ever being trained on breach examples.
2. **Explaining** — for every regulation that scores above the relevance threshold, a small
   instruction-tuned generative model
   ([`Xenova/LaMini-Flan-T5-248M`](https://huggingface.co/Xenova/LaMini-Flan-T5-248M)) writes a
   sentence explaining exactly how that regulation appears to have been violated.

Both models are downloaded once from the Hugging Face Hub, cached by the browser, and every run
afterward happens locally — no incident text is ever sent to a server for this default analysis. No
build step, no backend, no API keys required to use the site as-is.

### Optional: deeper analysis via Groq (free)

There's also an optional **"Get deeper analysis"** button that sends the incident text to a much
larger model (Llama 3.3 70B) via [Groq](https://groq.com)'s free API, for longer and more specific
explanations than the small local model can produce. This is off by default — the button tells
visitors it isn't configured yet until you deploy the piece below.

The Groq API key can't live in the public site's JS (anyone can view source), so a small serverless
proxy (`worker/index.js`, a [Cloudflare Worker](https://workers.cloudflare.com/)) holds it instead.
Cloudflare's free tier (100,000 requests/day) and Groq's free tier both cost nothing at
personal-portfolio traffic levels.

To turn this feature on:

1. Create a free Groq API key at [console.groq.com/keys](https://console.groq.com/keys).
2. Create a free Cloudflare account, then install and log in to Wrangler (Cloudflare's CLI):
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. From the repo root, store your Groq key as a Worker secret — **never commit it, and never paste
   it anywhere else**:
   ```bash
   wrangler secret put GROQ_API_KEY
   ```
4. Deploy the Worker:
   ```bash
   wrangler deploy
   ```
   Wrangler prints a URL like `https://regulation-breach-analyzer-api.<your-subdomain>.workers.dev`.
5. Put that URL (not a secret — safe to share/commit) into `GROQ_PROXY_URL` near the top of `app.js`,
   commit, and push. The "Get deeper analysis" button will then work for every visitor.

It's plain HTML/CSS/JS (`index.html`, `style.css`, `app.js`), plus the one optional Worker file.

## Run locally

Just serve the folder with any static file server, e.g.:

```bash
npx serve .
```

Open the printed URL in a browser. (A plain `file://` open won't work because ES module imports
require an HTTP server.)

## Deploy for free (GitHub Pages)

This repo includes `.github/workflows/deploy.yml`, which deploys the site to GitHub Pages
automatically on every push to `main`.

One-time setup (only needs to be done once, by a repo admin):

1. Go to the repo's **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or merge this branch into it) — the workflow will build and publish the site.

Your site will be live at `https://<username>.github.io/<repo>/`.

## Disclaimer

Educational demo only, not legal advice. Explanations are AI-generated (by a small local model, or by
Groq's Llama 3.3 70B if you enable deep analysis) and can be wrong, oversimplified, or generic.
