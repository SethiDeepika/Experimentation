# Hackathon Hub

A small web app for running hackathons, built with Next.js and designed to run on Vercel's
**free (Hobby) plan**.

- **Event pages.** Organizers create a page per hackathon at `/h/<name>`. It shows the
  description, themes/tracks, timeline, prizes, rules and the judging criteria, plus a
  **Submit or update your project** button.
- **Team submissions.** Anyone with the link can submit under a team name. The team chooses a
  passcode, and anyone on the team can use the same team name and passcode later to update the
  submission until the deadline. Teams can add project details, theme, repo/demo/video/slides
  links, and optional file attachments.
- **Judging.** Each hackathon has a judging page at `/h/<name>/judge`. Judges log in with their
  name and the event's judge access code, then score each team on the rubric (weighted, out of
  100) and leave comments.
- **Results.** The organizer dashboard (`/admin`) ranks teams by average judge score, shows a
  per-criterion and per-judge breakdown, and exports everything to CSV.

## Deploy to Vercel (free)

1. On [vercel.com/new](https://vercel.com/new), import this GitHub repository.
2. Set **Root Directory** to `hackathon-hub`. The framework (Next.js) is detected automatically.
3. Under **Environment Variables** add:
   - `ADMIN_PASSWORD`: the organizer password for `/admin`.
   - `SESSION_SECRET`: a long random string (for example the output of `openssl rand -hex 32`).
4. Click **Deploy**.
5. Add free storage: in the project open **Storage → Create / Connect → Upstash (Redis)**, choose
   the free plan and connect it to the project. This sets `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` also work).
6. *(Optional, enables file attachments.)* **Storage → Create → Blob**, connect it to the
   project. This sets `BLOB_READ_WRITE_TOKEN`. Without it, teams paste links instead.
7. Redeploy (**Deployments → ⋯ → Redeploy**) so the new environment variables are picked up.

Then open `https://<your-project>.vercel.app/admin`, log in and click **New hackathon**.

## Running a hackathon

1. **Create the event** at `/admin → New hackathon`: name, dates, submission deadline, themes,
   prizes, rules, the rubric (criteria, weights, max score; sensible defaults are pre-filled) and
   a judge access code.
2. **Share the event page** (`/h/<name>`) with participants. Teams click *Submit or update your
   project*, pick a team name and passcode, and fill in their project.
3. **Share the judging page** (`/h/<name>/judge`) and the judge access code with judges.
4. **Watch results** on `/admin/<name>`: live leaderboard, judge breakdowns, CSV export. You can
   close submissions at any time by unticking *Accept submissions*.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Redis credentials, data is stored in `.data/db.json`, and the
organizer password defaults to `admin` unless `ADMIN_PASSWORD` is set. Copy `.env.example` to
`.env.local` to configure it.

## How it works

| Path | What |
| --- | --- |
| `app/page.js` | List of hackathons |
| `app/h/[slug]/` | Event page, submission form (`submit/`), judging (`judge/`) |
| `app/admin/` | Organizer login, dashboard, create/edit event, results |
| `app/api/upload` | Issues Vercel Blob upload tokens for attachments |
| `app/api/admin/[slug]/export` | Results CSV |
| `lib/actions.js` | Server actions (all writes and validation) |
| `lib/store.js` | Upstash Redis, or a JSON file in local dev |
| `lib/scoring.js` | Weighted scoring and leaderboard |

Security model: team passcodes and the judge access code are stored as scrypt hashes, and
organizer and judge sessions are HMAC-signed, httpOnly cookies. Team contact emails and
passcodes are never shown publicly.
