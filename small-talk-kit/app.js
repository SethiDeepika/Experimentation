import { EVENTS, ENERGY_PLANS, SITUATIONS } from "./data.js";

// Shared Cloudflare Worker proxy (also serves Regulation Breach Analyzer) — see README.
const SMALL_TALK_URL = "https://regulation-breach-analyzer-api.deepika-sethi88.workers.dev/small-talk";
const REQUEST_TIMEOUT_MS = 30000;

const $ = (id) => document.getElementById(id);

const state = {
  eventId: EVENTS[0].id,
  energy: "medium",
  situationId: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function asList(value) {
  return Array.isArray(value) ? value.filter((v) => v && (typeof v === "string" || v.line)) : [];
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable, fine */ }
}

function setStatus(prefix, message, busy) {
  $(`${prefix}-status`).textContent = message;
  $(`${prefix}-spinner`).hidden = !busy;
}

async function callProxy(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(SMALL_TALK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    // An un-updated Worker answers /small-talk like the breach analyzer.
    if (data.mode !== payload.mode) {
      throw new Error("The AI proxy hasn't been updated for this tool yet");
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function lineItem(text) {
  return `
    <li class="line-item">
      <span class="line-text">${escapeHtml(text)}</span>
      <button type="button" class="copy-btn" data-copy="${escapeHtml(text)}" aria-label="Copy line">Copy</button>
    </li>`;
}

function section(icon, title, body, extraClass = "") {
  return `
    <article class="kit-card ${extraClass}">
      <h3><span aria-hidden="true">${icon}</span> ${title}</h3>
      ${body}
    </article>`;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function showTab(name) {
  const isPrep = name !== "rescue";
  $("tab-prep").setAttribute("aria-selected", String(isPrep));
  $("tab-rescue").setAttribute("aria-selected", String(!isPrep));
  $("panel-prep").hidden = !isPrep;
  $("panel-rescue").hidden = isPrep;
  storageSet("stk-tab", isPrep ? "prep" : "rescue");
}

$("tab-prep").addEventListener("click", () => showTab("prep"));
$("tab-rescue").addEventListener("click", () => showTab("rescue"));

// ---------------------------------------------------------------------------
// Prep mode
// ---------------------------------------------------------------------------

function renderEventChips() {
  $("event-chips").innerHTML = EVENTS.map((e) => `
    <button type="button" class="chip" role="radio" data-event="${e.id}"
      aria-checked="${e.id === state.eventId}">
      <span aria-hidden="true">${e.icon}</span> ${escapeHtml(e.label)}
    </button>`).join("");
}

$("event-chips").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-event]");
  if (!chip) return;
  state.eventId = chip.dataset.event;
  renderEventChips();
  const custom = $("event-custom");
  custom.hidden = state.eventId !== "custom";
  if (!custom.hidden) custom.focus();
});

$("energy").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-energy]");
  if (!btn) return;
  state.energy = btn.dataset.energy;
  $("energy").querySelectorAll("[data-energy]").forEach((b) => {
    b.setAttribute("aria-checked", String(b === btn));
  });
});

function currentEventDescription() {
  if (state.eventId === "custom") return $("event-custom").value.trim();
  return EVENTS.find((e) => e.id === state.eventId).label;
}

function fallbackKit() {
  const event = EVENTS.find((e) => e.id === state.eventId);
  // For a custom event, the happy-hour kit is the most general-purpose.
  const kit = event.kit || EVENTS.find((e) => e.id === "happy-hour").kit;
  return { ...kit, energy_plan: ENERGY_PLANS[state.energy] };
}

function renderKit(kit, source) {
  const openers = asList(kit.openers);
  const plan = asList(kit.energy_plan).length ? asList(kit.energy_plan) : ENERGY_PLANS[state.energy];

  const html = `
    ${kit.summary ? `<div class="summary-banner">${escapeHtml(kit.summary)}</div>` : ""}
    <p class="source-note">${source}</p>
    <div class="kit-grid">
      ${section("👋", "Openers", `
        <ul class="line-list">
          ${openers.map((o) => {
            const line = typeof o === "string" ? o : o.line;
            const why = typeof o === "string" ? "" : o.why;
            return `${lineItem(line)}${why ? `<li class="why">${escapeHtml(why)}</li>` : ""}`;
          }).join("")}
        </ul>`, "span-2")}
      ${kit.about_me ? section("🙋", "Your ready answer about yourself", `<ul class="line-list">${lineItem(kit.about_me)}</ul>`, "span-2") : ""}
      ${section("🔁", "Keep it going", `<ul class="line-list">${asList(kit.follow_ups).map(lineItem).join("")}</ul>`)}
      ${section("🛟", "If it stalls", `<ul class="line-list">${asList(kit.rescue_lines).map(lineItem).join("")}</ul>`)}
      ${section("🚪", "Graceful exits", `<ul class="line-list">${asList(kit.exits).map(lineItem).join("")}</ul>`, "accent-exit")}
      ${section("🔋", `Energy plan · ${state.energy}`, `<ol class="plan-list">${plan.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ol>`, "accent-energy")}
      ${asList(kit.avoid).length ? section("🚫", "Skip these", `<ul class="avoid-list">${asList(kit.avoid).map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`, "span-2") : ""}
    </div>`;

  $("prep-empty").hidden = true;
  const results = $("prep-results");
  results.innerHTML = html;
  results.hidden = false;
  if (window.matchMedia("(max-width: 900px)").matches) {
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function buildKit() {
  const event = currentEventDescription();
  if (!event) {
    setStatus("prep", "Describe your event first.", false);
    $("event-custom").focus();
    return;
  }

  const btn = $("prep-btn");
  btn.disabled = true;
  setStatus("prep", "Writing lines for your event…", true);

  try {
    const kit = await callProxy({
      mode: "prep",
      event,
      energy: state.energy,
      people: $("people").value.trim(),
      context: $("context").value.trim(),
    });
    if (!asList(kit.openers).length) throw new Error("The AI returned an empty kit");
    renderKit(kit, "✨ Written for your event by Groq (openai/gpt-oss-120b).");
    setStatus("prep", "Done. Tap Copy on any line to save it to your notes.", false);
  } catch (err) {
    console.error(err);
    renderKit(fallbackKit(), "📚 From the built-in library. Replace the [brackets] with your own details.");
    setStatus("prep", "The AI isn't available right now, so here's a ready-made kit instead.", false);
  } finally {
    btn.disabled = false;
  }
}

$("prep-btn").addEventListener("click", buildKit);

// ---------------------------------------------------------------------------
// Rescue mode
// ---------------------------------------------------------------------------

function renderSituations() {
  $("situation-grid").innerHTML = SITUATIONS.map((s) => `
    <button type="button" class="situation-btn" data-situation="${s.id}"
      aria-pressed="${s.id === state.situationId}">
      <span class="situation-icon" aria-hidden="true">${s.icon}</span>
      <span>${escapeHtml(s.label)}</span>
    </button>`).join("");
}

function renderRescue({ title, lines, tip, source, canTailor }) {
  const card = $("rescue-results");
  card.innerHTML = `
    <h2 class="panel-title">${escapeHtml(title)}</h2>
    <p class="panel-hint">Say one of these:</p>
    <ul class="line-list big">${asList(lines).map(lineItem).join("")}</ul>
    ${tip ? `<p class="tip"><strong>Tip:</strong> ${escapeHtml(tip)}</p>` : ""}
    <p class="source-note">${source}</p>
    ${canTailor ? `<button type="button" class="ghost-btn" id="tailor-btn">✨ Make these fit my situation</button>` : ""}`;
  card.hidden = false;
  if (window.matchMedia("(max-width: 900px)").matches) {
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

$("situation-grid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-situation]");
  if (!btn) return;
  state.situationId = btn.dataset.situation;
  renderSituations();
  const s = SITUATIONS.find((x) => x.id === state.situationId);
  setStatus("rescue", "", false);
  renderRescue({
    title: `${s.icon} ${s.label}`,
    lines: s.lines,
    tip: s.tip,
    source: "📚 From the built-in library, shown instantly.",
    canTailor: true,
  });
});

async function aiRescue(situation, title) {
  setStatus("rescue", "Finding the right words…", true);
  try {
    const data = await callProxy({
      mode: "rescue",
      situation,
      event: state.eventId === "custom" ? $("event-custom").value.trim() : currentEventDescription(),
    });
    if (!asList(data.lines).length) throw new Error("The AI returned no lines");
    renderRescue({ title, lines: data.lines, tip: data.tip, source: "✨ Written by Groq (openai/gpt-oss-120b).", canTailor: false });
    setStatus("rescue", "", false);
  } catch (err) {
    console.error(err);
    setStatus("rescue", "The AI isn't available right now. Try one of the situations above instead.", false);
  }
}

$("rescue-results").addEventListener("click", (e) => {
  if (e.target.id !== "tailor-btn") return;
  const s = SITUATIONS.find((x) => x.id === state.situationId);
  const extra = $("rescue-text").value.trim();
  const details = document.querySelector(".custom-rescue");
  if (!extra) {
    details.open = true;
    $("rescue-text").focus();
    setStatus("rescue", "Add a detail or two below, then click Get lines.", false);
    return;
  }
  aiRescue(`${s.label}. ${extra}`, `${s.icon} ${s.label}`);
});

$("rescue-btn").addEventListener("click", () => {
  const text = $("rescue-text").value.trim();
  if (!text) {
    setStatus("rescue", "Describe the moment first.", false);
    $("rescue-text").focus();
    return;
  }
  const s = SITUATIONS.find((x) => x.id === state.situationId);
  aiRescue(s ? `${s.label}. ${text}` : text, s ? `${s.icon} ${s.label}` : "🛟 Your moment");
});

// ---------------------------------------------------------------------------
// Copy buttons (both modes)
// ---------------------------------------------------------------------------

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".copy-btn");
  if (!btn) return;
  try {
    await navigator.clipboard.writeText(btn.dataset.copy);
    btn.textContent = "Copied";
  } catch {
    btn.textContent = "Couldn't copy";
  }
  setTimeout(() => { btn.textContent = "Copy"; }, 1400);
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

renderEventChips();
renderSituations();
showTab(new URLSearchParams(location.search).get("mode") || storageGet("stk-tab") || "prep");
