# Meeting Prep Generator

A tailored meeting-preparation checklist tool for Product Managers. Pick a
meeting type (Sprint Planning, Exec Update, User Research, Design Review,
1:1s, Roadmap Debate, Post-Mortem) and get an outcome statement plus a
Before / During / After checklist built for that specific room — adjustable
by meeting duration and attendee count, with a one-click copy to clipboard.

Fully static: React + Vite + Tailwind CSS + React Router. No backend, no
database, no data collection — everything lives in the codebase and in your
browser only.

## Why `HashRouter`

This app uses React Router's `HashRouter` (not `BrowserRouter`) on purpose.
GitHub Pages serves static files with no server-side route resolution, so a
`BrowserRouter` URL like `/meeting/sprint-planning` 404s on refresh or direct
link. `HashRouter` keeps all routing client-side (`/#/meeting/sprint-planning`),
which always resolves correctly on GitHub Pages.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/` (Vite dev server ignores the production
`base` path).

## Build

```bash
npm run build
```

Outputs to `dist/`. Preview the production build locally with:

```bash
npm run preview
```

## Deployment

### Where this app is deployed

This app lives in the `meeting-prep-generator/` folder of the
`Experimentation` repo, alongside another portfolio project
(`regulation-breach-analyzer/`) at the repo root. `vite.config.js` sets:

```js
base: "/Experimentation/meeting-prep-generator/"
```

so that built asset URLs resolve correctly when served at
`https://sethideepika.github.io/Experimentation/meeting-prep-generator/`.

The repo's `.github/workflows/deploy.yml` handles this automatically on
every push to `main`: it builds this app and copies the output into a
`meeting-prep-generator/` subfolder of the published Pages site, without
touching the existing root site. No manual steps are needed beyond pushing
to `main`.

### Deploying this app on its own (e.g. its own repo)

If you move this folder into its own repository named
`meeting-prep-generator` (so it becomes the *root* of that repo's GitHub
Pages site), do the following:

1. Update `vite.config.js`:
   ```js
   base: "/meeting-prep-generator/"
   ```
   (or `base: "/"` if using a custom domain / user/org root site).
2. Build and deploy with the included `gh-pages` package:
   ```bash
   npm run deploy
   ```
   This runs `vite build` then publishes `dist/` to the `gh-pages` branch of
   whatever repo this folder's git remote points to.
3. One-time repo setting (only needed once): in **Settings → Pages**, set
   **Source** to the `gh-pages` branch (or, if using GitHub Actions instead,
   set **Source** to **GitHub Actions** and use a workflow like the one in
   the parent repo, without the "assemble" step that merges in another
   project).
4. Your site will be live at `https://<username>.github.io/meeting-prep-generator/`.

## Adding a meeting type

All content lives in `src/data/meetingTypes.js` as a plain array — add an
entry there (slug, name, icon, tagline, outcome template, before/during/after
checklists, and optional large-group / short-meeting tips) and it
automatically appears on the home page grid and gets its own route at
`/meeting/<slug>`.
