# Experimentation

Personal site and a collection of small projects and demos.

- **Home page** (`index.html`, `style.css`, `assets/`) — a resume/portfolio landing page linking
  out to the projects below, GitHub, and Medium. Live at
  https://sethideepika.github.io/Experimentation/.
- [`regulation-breach-analyzer/`](./regulation-breach-analyzer) — describe a security incident and
  get a full compliance breakdown (which regulations apply, why, business impact, recommended
  actions), powered by Groq. Live at
  https://sethideepika.github.io/Experimentation/regulation-breach-analyzer/.
- [`meeting-prep-generator/`](./meeting-prep-generator) — a tailored meeting-preparation checklist
  tool for Product Managers (React + Vite + Tailwind + React Router). Live at
  https://sethideepika.github.io/Experimentation/meeting-prep-generator/.

## Home page

Plain static HTML/CSS, no build step. `.github/workflows/deploy.yml` builds Meeting Prep
Generator, then assembles the deployed site as:

```
_site/
├── index.html, style.css, assets/     ← this home page (site root)
├── regulation-breach-analyzer/        ← copied as-is (no build step)
└── meeting-prep-generator/            ← built output (npm run build)
```

`assets/DeepikaSethi_Resume.pdf` is a public-facing copy of the résumé with phone number and
email address redacted (a GitHub link is included instead). Update the `data-medium-placeholder`
link in `index.html` once a Medium profile URL is available.
