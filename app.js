import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";

// Everything runs client-side: never look for local model files on a server,
// and let the browser cache the downloaded weights across visits.
env.allowLocalModels = false;
env.useBrowserCache = true;

const CLASSIFIER_MODEL = "Xenova/nli-deberta-v3-xsmall";
const EXPLAINER_MODEL = "Xenova/LaMini-Flan-T5-248M";

const RELEVANCE_THRESHOLD = 0.5;
const MAX_REGULATIONS_SHOWN = 3;

const REGULATIONS = [
  { label: "GDPR", full: "EU General Data Protection Regulation", icon: "🇪🇺", color: "#6366f1" },
  { label: "CCPA/CPRA", full: "California Consumer Privacy Act", icon: "🌴", color: "#8b5cf6" },
  { label: "HIPAA", full: "U.S. health information privacy law", icon: "🏥", color: "#d946ef" },
  { label: "GLBA", full: "Gramm-Leach-Bliley Act, covering financial data", icon: "🏦", color: "#f43f5e" },
  { label: "PCI DSS", full: "payment card data security standard", icon: "💳", color: "#f59e0b" },
  { label: "State breach notification laws", full: "U.S. state data breach notification laws", icon: "🗽", color: "#10b981" },
  { label: "FERPA", full: "U.S. student education records law", icon: "🎓", color: "#06b6d4" },
];

const EXAMPLES = [
  "An employee's laptop containing unencrypted customer health records was stolen from a parked car overnight.",
  "Several staff received an email impersonating IT support asking them to reset their password on a fake login page; three employees entered their credentials before it was caught.",
  "A cloud storage bucket holding customer order history and partial payment card numbers was left publicly accessible for two weeks due to a misconfigured access policy.",
  "Company file servers were encrypted overnight by an unknown attacker demanding payment in cryptocurrency; backups were also affected.",
];

let classifierPromise = null;
let explainerPromise = null;

const incidentEl = document.getElementById("incident");
const analyzeBtn = document.getElementById("analyze-btn");
const spinnerEl = document.getElementById("spinner");
const statusEl = document.getElementById("status-line");
const resultsEl = document.getElementById("results");
const cardsEl = document.getElementById("regulation-cards");

document.querySelectorAll(".example-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    incidentEl.value = EXAMPLES[Number(btn.dataset.example)];
    incidentEl.focus();
  });
});

function setStatus(message, busy) {
  statusEl.textContent = message;
  spinnerEl.hidden = !busy;
}

function candidateLabel(reg) {
  return `${reg.label} (${reg.full})`;
}

function describeProgress(data) {
  if (data.status !== "progress" || !data.file) return null;
  const pct = Number.isFinite(data.progress) ? data.progress.toFixed(0) : 0;
  return `Downloading ${data.file}… ${pct}%`;
}

async function getClassifier() {
  if (!classifierPromise) {
    setStatus("Loading the regulation-matching model (first time only, then cached)…", true);
    classifierPromise = pipeline("zero-shot-classification", CLASSIFIER_MODEL, {
      progress_callback: (data) => {
        const message = describeProgress(data);
        if (message) setStatus(message, true);
      },
    });
  }
  return classifierPromise;
}

async function getExplainer() {
  if (!explainerPromise) {
    setStatus("Loading the explanation model (first time only, then cached)…", true);
    explainerPromise = pipeline("text2text-generation", EXPLAINER_MODEL, {
      progress_callback: (data) => {
        const message = describeProgress(data);
        if (message) setStatus(message, true);
      },
    });
  }
  return explainerPromise;
}

function buildPrompt(text, reg) {
  return (
    `Explain in one specific sentence how the incident below violates ${reg.label} ` +
    `(${reg.full}). Name what data was exposed and which obligation was broken.\n\n` +
    `Incident: ${text}`
  );
}

function createRegulationCard(reg, score, index) {
  const pct = Math.round(score * 100);
  const card = document.createElement("article");
  card.className = "reg-card";
  card.style.setProperty("--accent", reg.color);
  card.style.animationDelay = `${index * 110}ms`;
  card.innerHTML = `
    <div class="reg-card-head">
      <span class="reg-icon" aria-hidden="true">${reg.icon}</span>
      <div class="reg-title">
        <span class="reg-name">${reg.label}</span>
        <span class="reg-full">${reg.full}</span>
      </div>
      <span class="reg-score">0%</span>
    </div>
    <div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>
    <p class="reg-explanation">
      <span class="dot-loader"><span></span><span></span><span></span></span>
      Writing explanation…
    </p>
  `;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      card.querySelector(".bar-fill").style.width = `${pct}%`;
      animateNumber(card.querySelector(".reg-score"), pct);
    });
  });

  return card;
}

function animateNumber(el, target, duration = 700) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = `${Math.round(progress * target)}%`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

async function analyze() {
  const text = incidentEl.value.trim();
  if (!text) {
    setStatus("Please describe an incident first.", false);
    return;
  }

  analyzeBtn.disabled = true;
  resultsEl.hidden = true;
  cardsEl.innerHTML = "";

  try {
    const classifier = await getClassifier();
    setStatus("Scanning the incident against known data-protection regulations…", true);

    const candidateLabels = REGULATIONS.map(candidateLabel);
    const result = await classifier(text, candidateLabels, { multi_label: true });

    const byLabel = new Map(REGULATIONS.map((reg) => [candidateLabel(reg), reg]));
    const scored = result.labels.map((label, i) => ({
      reg: byLabel.get(label),
      score: result.scores[i],
    }));

    let relevant = scored.filter((s) => s.score > RELEVANCE_THRESHOLD).slice(0, MAX_REGULATIONS_SHOWN);
    if (relevant.length === 0) relevant = scored.slice(0, 1);

    resultsEl.hidden = false;
    const cardEls = relevant.map(({ reg, score }, i) => {
      const card = createRegulationCard(reg, score, i);
      cardsEl.appendChild(card);
      return card;
    });

    const explainer = await getExplainer();

    for (let i = 0; i < relevant.length; i++) {
      setStatus(`Writing explanation ${i + 1} of ${relevant.length}…`, true);
      const prompt = buildPrompt(text, relevant[i].reg);
      const output = await explainer(prompt, { max_new_tokens: 60 });
      const explanation =
        (output[0]?.generated_text || "").trim() ||
        "Could not generate a specific explanation for this regulation.";

      const p = cardEls[i].querySelector(".reg-explanation");
      p.textContent = explanation;
      p.classList.add("revealed");
    }

    setStatus("Done — everything ran locally in your browser.", false);
  } catch (err) {
    console.error(err);
    setStatus("Something went wrong loading or running the models. Please try again.", false);
  } finally {
    analyzeBtn.disabled = false;
  }
}

analyzeBtn.addEventListener("click", analyze);
