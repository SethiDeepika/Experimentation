import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";

// Everything runs client-side: never look for local model files on a server,
// and let the browser cache the downloaded weights across visits.
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = "Xenova/nli-deberta-v3-xsmall";

const BREACH_TYPES = [
  "Ransomware attack",
  "Phishing or social engineering attack",
  "Malware or virus infection",
  "Unauthorized access or hacking",
  "Insider threat or employee misconduct",
  "Lost or stolen device",
  "Misconfigured cloud storage or database",
  "Third-party vendor or supply chain breach",
  "Physical theft or break-in",
  "Accidental disclosure or improper disposal of records",
];

const STATUTES = [
  "GDPR (EU General Data Protection Regulation)",
  "CCPA/CPRA (California Consumer Privacy Act)",
  "HIPAA (health information privacy)",
  "GLBA (Gramm-Leach-Bliley Act, financial data)",
  "PCI DSS (payment card data security)",
  "State data breach notification laws (US)",
  "FERPA (student education records)",
];

const EXAMPLES = [
  "An employee's laptop containing unencrypted customer health records was stolen from a parked car overnight.",
  "Several staff received an email impersonating IT support asking them to reset their password on a fake login page; three employees entered their credentials before it was caught.",
  "A cloud storage bucket holding customer order history and partial payment card numbers was left publicly accessible for two weeks due to a misconfigured access policy.",
  "Company file servers were encrypted overnight by an unknown attacker demanding payment in cryptocurrency; backups were also affected.",
];

let classifierPromise = null;

const incidentEl = document.getElementById("incident");
const classifyBtn = document.getElementById("classify-btn");
const statusEl = document.getElementById("status-line");
const resultsEl = document.getElementById("results");
const breachBarsEl = document.getElementById("breach-bars");
const statuteBarsEl = document.getElementById("statute-bars");

document.querySelectorAll(".example-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    incidentEl.value = EXAMPLES[Number(btn.dataset.example)];
    incidentEl.focus();
  });
});

function describeProgress(data) {
  if (data.status !== "progress" || !data.file) return null;
  const pct = Number.isFinite(data.progress) ? data.progress.toFixed(0) : 0;
  return `Downloading open-source model (${data.file})… ${pct}%`;
}

async function getClassifier() {
  if (!classifierPromise) {
    statusEl.textContent = "Loading open-source model in your browser (first time only, then cached)…";
    classifierPromise = pipeline("zero-shot-classification", MODEL_ID, {
      progress_callback: (data) => {
        const message = describeProgress(data);
        if (message) statusEl.textContent = message;
      },
    });
  }
  return classifierPromise;
}

function renderBars(container, labels, scores) {
  container.innerHTML = "";
  labels.forEach((label, i) => {
    const pct = Math.round(scores[i] * 100);
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-label"><span>${label}</span><span class="bar-pct">${pct}%</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    `;
    container.appendChild(row);
  });
}

async function classify() {
  const text = incidentEl.value.trim();
  if (!text) {
    statusEl.textContent = "Please describe an incident first.";
    return;
  }

  classifyBtn.disabled = true;
  try {
    const classifier = await getClassifier();
    statusEl.textContent = "Classifying…";

    const breachResult = await classifier(text, BREACH_TYPES, { multi_label: false });
    const statuteResult = await classifier(text, STATUTES, { multi_label: true });

    renderBars(breachBarsEl, breachResult.labels.slice(0, 4), breachResult.scores.slice(0, 4));
    renderBars(statuteBarsEl, statuteResult.labels, statuteResult.scores);

    resultsEl.hidden = false;
    statusEl.textContent = "Done — everything ran locally in your browser.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Something went wrong loading or running the model. Please try again.";
  } finally {
    classifyBtn.disabled = false;
  }
}

classifyBtn.addEventListener("click", classify);
