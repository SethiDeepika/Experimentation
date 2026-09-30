# Small Talk Survival Kit

A small tool for introverts (and anyone who dreads small talk) to get through meetings, happy
hours, conferences, dinners and family gatherings, powered by [Groq](https://groq.com)'s free API.

The goal isn't to turn anyone into an extrovert. It gives people a few good lines, a way out of
conversations, and a plan that fits their social energy.

## Two modes

**🗓️ Prep for an event:** pick the event type (or describe your own), your energy level (low /
medium / high), and optionally who'll be there and anything else relevant. You get a kit:

- **Openers**, each with a one-line reason it works for this setting
- **A ready answer about yourself** for "so, what do you do?"
- **Follow-ups** to keep a conversation going
- **Lines for when it stalls**
- **Graceful exits**, which most small-talk advice leaves out
- **An energy plan** that paces the event to your energy level
- **Things to skip** at this kind of event

**🛟 I'm stuck right now:** tap the moment you're in (awkward silence, "what do you do?",
forgot their name, want to leave, they won't stop talking…) and three lines appear instantly from
the built-in library. You can also describe your exact moment and get lines written for it.

## How it works

Plain HTML/CSS/JS (`index.html`, `style.css`, `app.js`, `data.js`) with no build step.

AI requests go to the **same Cloudflare Worker as Regulation Breach Analyzer**
(`../regulation-breach-analyzer/worker/index.js`), on its `/small-talk` route, so it reuses the
existing `GROQ_API_KEY` Worker secret. No new key or Worker is needed. The Groq model is
`openai/gpt-oss-120b`.

`data.js` holds a hand-written library of kits for 7 event types, energy plans and 8 "stuck"
situations. It's used:

- instantly in "I'm stuck" mode (no waiting for a network request when you're mid-conversation), and
- as a **fallback** in prep mode whenever the Worker or Groq can't be reached, so the page always
  gives a useful answer.

What users type is sent to a third party (Groq, via the proxy). The page tells them not to
include names or private details.

## Enabling the AI (one-time)

The Worker doesn't auto-deploy from GitHub. After merging, copy the updated
`regulation-breach-analyzer/worker/index.js` into the Cloudflare dashboard's **Edit code** screen
for `regulation-breach-analyzer-api` and deploy (or run `wrangler deploy` from
`regulation-breach-analyzer/`). The Regulation Breach Analyzer keeps working exactly as before,
because the new code only handles requests to `/small-talk`.

Until then, the kit works fully from the built-in library.

## Run locally

Serve the repo root with any static file server and open `/small-talk-kit/`:

```bash
npx serve .
```

## Disclaimer

Suggestions are AI-generated or generic templates. Use your own judgement about what fits the
people and the moment.
