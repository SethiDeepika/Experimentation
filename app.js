import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";

// Everything runs client-side: never look for local model files on a server,
// and let the browser cache the downloaded weights across visits.
env.allowLocalModels = false;
env.useBrowserCache = true;

const CLASSIFIER_MODEL = "Xenova/nli-deberta-v3-xsmall";
const EXPLAINER_MODEL = "Xenova/LaMini-Flan-T5-248M";

// Cloudflare Worker proxy — see README: "Optional: deeper analysis via Groq".
const GROQ_PROXY_URL = "https://regulation-breach-analyzer-api.deepika-sethi88.workers.dev";

const RELEVANCE_THRESHOLD = 0.5;
const MIN_REGULATIONS_SHOWN = 2;
const MAX_REGULATIONS_SHOWN = 3;
const HYPOTHESIS_TEMPLATE = "This incident is a violation of {}.";

const REFUSAL_PATTERN = /\b(i'?m sorry|i cannot|i can'?t|as an ai|i am unable|i'?m unable|i do not have enough information)\b/i;

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

const deepBtn = document.getElementById("deep-analyze-btn");
const deepSpinnerEl = document.getElementById("deep-spinner");
const deepStatusEl = document.getElementById("deep-status-line");
const deepResultsEl = document.getElementById("deep-results");
const deepCardsEl = document.getElementById("deep-cards");

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

function setDeepStatus(message, busy) {
  deepStatusEl.textContent = message;
  deepSpinnerEl.hidden = !busy;
}

const DEFAULT_REG_META = { label: "Regulation", full: "", icon: "⚖️", color: "#6b7280" };

function findRegMeta(name) {
  const n = (name || "").toLowerCase();
  return (
    REGULATIONS.find((r) => n.includes(r.label.toLowerCase()) || r.label.toLowerCase().includes(n)) ||
    DEFAULT_REG_META
  );
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
    `You are a data-protection compliance assistant. Never apologize and never say you cannot answer.\n\n` +
    `Incident: ${text}\n\n` +
    `In exactly one sentence, state specifically how this incident violates ${reg.label} ` +
    `(${reg.full}). Name the type of data exposed and the obligation that was broken.`
  );
}

function fallbackExplanation(reg) {
  return (
    `This incident appears to fall under ${reg.label} (${reg.full}), since it involves exposure of ` +
    `personal information the regulation is designed to protect — though the model couldn't produce a ` +
    `more specific explanation for this wording.`
  );
}

function sanitizeExplanation(raw, reg) {
  const text = (raw || "").trim();
  if (!text || text.length < 15 || REFUSAL_PATTERN.test(text)) {
    return fallbackExplanation(reg);
  }
  const firstSentence = text.match(/^[^.!?]*[.!?]/);
  return firstSentence && firstSentence[0].length > 20 ? firstSentence[0].trim() : text;
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
    const result = await classifier(text, candidateLabels, {
      multi_label: true,
      hypothesis_template: HYPOTHESIS_TEMPLATE,
    });

    const byLabel = new Map(REGULATIONS.map((reg) => [candidateLabel(reg), reg]));
    const scored = result.labels.map((label, i) => ({
      reg: byLabel.get(label),
      score: result.scores[i],
    }));

    const aboveThreshold = scored.filter((s) => s.score > RELEVANCE_THRESHOLD);
    const relevant = (aboveThreshold.length >= MIN_REGULATIONS_SHOWN ? aboveThreshold : scored)
      .slice(0, MAX_REGULATIONS_SHOWN);

    resultsEl.hidden = false;
    const cardEls = relevant.map(({ reg, score }, i) => {
      const card = createRegulationCard(reg, score, i);
      cardsEl.appendChild(card);
      return card;
    });

    const explainer = await getExplainer();

    for (let i = 0; i < relevant.length; i++) {
      setStatus(`Writing explanation ${i + 1} of ${relevant.length}…`, true);
      const reg = relevant[i].reg;
      const prompt = buildPrompt(text, reg);
      const output = await explainer(prompt, {
        max_new_tokens: 80,
        do_sample: false,
        repetition_penalty: 1.3,
        no_repeat_ngram_size: 3,
      });
      const explanation = sanitizeExplanation(output[0]?.generated_text, reg);

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

function createDeepCard(item, index) {
  const meta = findRegMeta(item.name);
  const confidence = (item.confidence || "medium").toLowerCase();
  const card = document.createElement("article");
  card.className = "reg-card";
  card.style.setProperty("--accent", meta.color);
  card.style.animationDelay = `${index * 110}ms`;
  card.innerHTML = `
    <div class="reg-card-head">
      <span class="reg-icon" aria-hidden="true">${meta.icon}</span>
      <div class="reg-title">
        <span class="reg-name">${item.name || meta.label}</span>
        <span class="reg-full">${meta.full}</span>
      </div>
      <span class="confidence-badge confidence-${confidence}">${confidence}</span>
    </div>
    <p class="reg-explanation revealed">${item.explanation || "No explanation provided."}</p>
  `;
  return card;
}

async function runDeepAnalysis() {
  const text = incidentEl.value.trim();
  if (!text) {
    setDeepStatus("Please describe an incident first.", false);
    return;
  }
  if (!GROQ_PROXY_URL) {
    setDeepStatus("Deep analysis isn't configured yet — see the README.", false);
    return;
  }

  deepBtn.disabled = true;
  deepResultsEl.hidden = true;
  deepCardsEl.innerHTML = "";
  setDeepStatus("Sending the incident to Groq (Llama 3.3 70B) for a deeper analysis…", true);

  try {
    const res = await fetch(GROQ_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incident: text }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    const regulations = Array.isArray(data.regulations) ? data.regulations : [];
    if (regulations.length === 0) {
      setDeepStatus("Groq didn't return a clear match — try adding more detail to the incident.", false);
      return;
    }

    deepResultsEl.hidden = false;
    regulations.forEach((item, i) => {
      deepCardsEl.appendChild(createDeepCard(item, i));
    });

    setDeepStatus("Done — this analysis was generated by Groq and left your browser.", false);
  } catch (err) {
    console.error(err);
    setDeepStatus("Something went wrong reaching the deep-analysis service. Please try again.", false);
  } finally {
    deepBtn.disabled = false;
  }
}

analyzeBtn.addEventListener("click", analyze);
deepBtn.addEventListener("click", runDeepAnalysis);
