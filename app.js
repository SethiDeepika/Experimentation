// Cloudflare Worker proxy — see README: "Deploying the Groq analysis proxy".
const GROQ_PROXY_URL = "https://regulation-breach-analyzer-api.deepika-sethi88.workers.dev";

const REGULATIONS = [
  { label: "GDPR", full: "EU General Data Protection Regulation", icon: "🇪🇺", color: "#6366f1" },
  { label: "CCPA/CPRA", full: "California Consumer Privacy Act", icon: "🌴", color: "#8b5cf6" },
  { label: "HIPAA", full: "U.S. health information privacy law", icon: "🏥", color: "#d946ef" },
  { label: "GLBA", full: "Gramm-Leach-Bliley Act, covering financial data", icon: "🏦", color: "#f43f5e" },
  { label: "PCI DSS", full: "payment card data security standard", icon: "💳", color: "#f59e0b" },
  { label: "State breach notification laws", full: "U.S. state data breach notification laws", icon: "🗽", color: "#10b981" },
  { label: "FERPA", full: "U.S. student education records law", icon: "🎓", color: "#06b6d4" },
];

const DEFAULT_REG_META = { label: "Regulation", full: "", icon: "⚖️", color: "#6b7280" };

const EXAMPLES = [
  "An employee's laptop containing unencrypted customer health records was stolen from a parked car overnight.",
  "Several staff received an email impersonating IT support asking them to reset their password on a fake login page; three employees entered their credentials before it was caught.",
  "A cloud storage bucket holding customer order history and partial payment card numbers was left publicly accessible for two weeks due to a misconfigured access policy.",
  "Company file servers were encrypted overnight by an unknown attacker demanding payment in cryptocurrency; backups were also affected.",
];

const incidentEl = document.getElementById("incident");
const analyzeBtn = document.getElementById("analyze-btn");
const spinnerEl = document.getElementById("spinner");
const statusEl = document.getElementById("status-line");
const emptyStateEl = document.getElementById("empty-state");
const resultsEl = document.getElementById("results");
const summaryBannerEl = document.getElementById("summary-banner");
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

function findRegMeta(name) {
  const n = (name || "").toLowerCase();
  return (
    REGULATIONS.find((r) => n.includes(r.label.toLowerCase()) || r.label.toLowerCase().includes(n)) ||
    DEFAULT_REG_META
  );
}

function createRegulationCard(item, index) {
  const meta = findRegMeta(item.name);
  const confidence = (item.confidence || "medium").toLowerCase();
  const actions = Array.isArray(item.recommended_actions) ? item.recommended_actions : [];

  const card = document.createElement("article");
  card.className = "reg-card";
  card.style.setProperty("--accent", meta.color);
  card.style.animationDelay = `${index * 90}ms`;
  card.innerHTML = `
    <div class="reg-card-head">
      <span class="reg-icon" aria-hidden="true">${meta.icon}</span>
      <div class="reg-title">
        <span class="reg-name">${item.name || meta.label}</span>
        <span class="reg-full">${meta.full}</span>
      </div>
      <span class="confidence-badge confidence-${confidence}">${confidence}</span>
    </div>
    ${
      item.max_penalty
        ? `<div class="penalty-stat"><span aria-hidden="true">⚠️</span><span>${item.max_penalty}</span></div>`
        : ""
    }
    <div class="reg-section">
      <h3>Why this applies</h3>
      <p>${item.reasoning || "No reasoning provided."}</p>
    </div>
    <div class="reg-section">
      <h3>Impact on your firm</h3>
      <p>${item.impact || "No impact analysis provided."}</p>
    </div>
    ${
      actions.length
        ? `<div class="reg-section">
            <h3>Recommended actions</h3>
            <ul class="action-list">${actions.map((a) => `<li>${a}</li>`).join("")}</ul>
          </div>`
        : ""
    }
  `;
  return card;
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
  setStatus("Sending the incident to Groq (openai/gpt-oss-120b) for analysis…", true);

  try {
    const res = await fetch(GROQ_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incident: text }),
    });

    const data = await res.json();
    if (!res.ok) {
      const upstreamDetail = data?.detail ? ` — ${String(data.detail).slice(0, 200)}` : "";
      throw new Error((data?.error || `Request failed (${res.status})`) + upstreamDetail);
    }

    const regulations = Array.isArray(data.regulations) ? data.regulations : [];
    if (regulations.length === 0) {
      setStatus("No clear regulatory match found — try adding more detail to the incident.", false);
      return;
    }

    emptyStateEl.hidden = true;
    resultsEl.hidden = false;

    if (data.summary) {
      summaryBannerEl.textContent = data.summary;
      summaryBannerEl.hidden = false;
    } else {
      summaryBannerEl.hidden = true;
    }

    regulations.forEach((item, i) => {
      cardsEl.appendChild(createRegulationCard(item, i));
    });

    setStatus("Done.", false);
  } catch (err) {
    console.error(err);
    const detail = err?.message ? `: ${err.message}` : "";
    setStatus(`Analysis failed${detail}`, false);
  } finally {
    analyzeBtn.disabled = false;
  }
}

analyzeBtn.addEventListener("click", analyze);
