# Data Breach Classifier

A small interactive demo: describe a security incident and an open-source AI model — running
**entirely in your browser** — predicts the breach type and flags which data-protection regulations
likely apply.

Live example incidents you can try are built into the page (stolen laptop, phishing email, cloud
misconfiguration, ransomware).

## How it works

- Zero-shot text classification via [Transformers.js](https://github.com/huggingface/transformers.js)
  using the open-source [`Xenova/nli-deberta-v3-xsmall`](https://huggingface.co/Xenova/nli-deberta-v3-xsmall)
  model (DeBERTa-v3, fine-tuned on MNLI).
- The model is downloaded once from the Hugging Face Hub, cached by the browser, and every
  classification afterward runs locally — no incident text is ever sent to a server.
- No build step, no backend, no API keys. It's plain HTML/CSS/JS (`index.html`, `style.css`, `app.js`).

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

Educational demo only, not legal advice. Classification quality reflects a small open-source model
and a fixed label set, not a trained breach-notification system.
