// Cloudflare Worker: proxies incident text to Groq's free API so the API key
// never has to live in the public static site. Deploy with `wrangler deploy`
// after setting the secret with `wrangler secret put GROQ_API_KEY`.
//
// This file holds no secrets itself — env.GROQ_API_KEY is injected by
// Cloudflare at runtime from the Worker's encrypted secret store.

const GROQ_MODEL = "openai/gpt-oss-120b";
const MAX_INCIDENT_LENGTH = 4000;

const SYSTEM_PROMPT = `You are a senior data-protection and cybersecurity compliance advisor briefing \
a firm's leadership after a security incident. Given an incident description, identify which of the \
following regulations are likely implicated: GDPR, CCPA/CPRA, HIPAA, GLBA, PCI DSS, U.S. state data \
breach notification laws, FERPA. Only include a regulation if it plausibly applies to the facts \
described. Never apologize or say you cannot answer.

First write "summary": one sentence stating how many regulations are implicated and which single one \
carries the highest financial exposure, naming its headline penalty figure.

For each regulation you include, provide:
- "max_penalty": a very short (under 12 words) headline of the maximum possible fine or penalty under \
this specific regulation (e.g. "Up to EUR 20M or 4% of global annual turnover").
- "reasoning": 1-3 sentences citing the specific facts in the incident that trigger this regulation \
(what data, whose data, what happened).
- "impact": 2-4 sentences on the concrete business impact to the firm if this regulation applies — \
legal exposure, mandatory notifications, and reputational or operational consequences. Do not restate \
the penalty figure here; it belongs in max_penalty.
- "recommended_actions": an array of 3-6 short, concrete, prioritized next steps the firm should take \
right now (specific notification deadlines and recipients, remediation steps, documentation, who to \
engage).

Respond ONLY with a JSON object in this exact shape, no other text:
{"summary":"...","regulations":[{"name":"GDPR","confidence":"high","max_penalty":"...","reasoning":"...","impact":"...","recommended_actions":["...","..."]}]}`;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    // Small Talk Survival Kit shares this Worker (and its GROQ_API_KEY secret).
    if (new URL(request.url).pathname === "/small-talk") {
      return handleSmallTalk(body, env);
    }

    const incident = (body?.incident || "").toString().trim();
    if (!incident) {
      return json({ error: "Provide a non-empty incident description." }, 400);
    }
    if (incident.length > MAX_INCIDENT_LENGTH) {
      return json({ error: `Incident description must be under ${MAX_INCIDENT_LENGTH} characters.` }, 400);
    }

    if (!env.GROQ_API_KEY) {
      return json({ error: "Server is missing GROQ_API_KEY. Run: wrangler secret put GROQ_API_KEY" }, 500);
    }

    let groqResponse;
    try {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: incident },
          ],
          temperature: 0.2,
          max_tokens: 2800,
          response_format: { type: "json_object" },
        }),
      });
    } catch (err) {
      return json({ error: "Failed to reach Groq API", detail: String(err) }, 502);
    }

    if (!groqResponse.ok) {
      const detail = await groqResponse.text();
      return json({ error: "Groq API returned an error", status: groqResponse.status, detail }, 502);
    }

    const data = await groqResponse.json();
    const content = data?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return json({ regulations: [], error: "Model returned invalid JSON", raw: content });
    }

    if (!Array.isArray(parsed.regulations)) {
      parsed.regulations = [];
    }

    return json(parsed);
  },
};

// ---------------------------------------------------------------------------
// Small Talk Survival Kit (POST /small-talk)
// ---------------------------------------------------------------------------

const SMALL_TALK_MAX_FIELD = 600;

const SMALL_TALK_STYLE = `You coach introverts and socially anxious people through small talk. \
Every line you write must sound like something a real, slightly reserved person would actually say \
out loud: short (under 25 words), warm, low-pressure, no cheesy pickup-line energy, no forced \
enthusiasm, no exclamation-mark overload. Prefer open questions about the shared situation over \
personal questions. Never tell the user to "just be confident". Respect their energy level: at low \
energy, favor listening-heavy strategies and early, guilt-free exits. Never apologize or refuse.`;

const SMALL_TALK_PREP_PROMPT = `${SMALL_TALK_STYLE}

The user describes an upcoming event. Build them a small-talk kit for it. Respond ONLY with a JSON \
object in exactly this shape, no other text:
{"summary":"one encouraging, practical sentence about this specific event",
"openers":[{"line":"...","why":"under 15 words on why it works here"}],
"about_me":"a 1-2 sentence answer to 'so what do you do / how do you know the host?' they can reuse",
"follow_ups":["..."],
"rescue_lines":["lines for when the conversation stalls"],
"exits":["polite ways to leave a conversation"],
"avoid":["short topics or moves to avoid at this event"],
"energy_plan":["3-4 short, concrete steps pacing the event for their energy level, e.g. arrive, goal, break, leave"]}
Give exactly 3 openers, 4 follow_ups, 3 rescue_lines, 3 exits, 3 avoid.`;

const SMALL_TALK_RESCUE_PROMPT = `${SMALL_TALK_STYLE}

The user is in a conversation RIGHT NOW and is stuck. They will describe the moment. Give them \
things they can say in the next few seconds. Respond ONLY with a JSON object in exactly this shape:
{"lines":["3 different lines they can say right now"],"tip":"one short sentence of calm, practical advice"}`;

async function handleSmallTalk(body, env) {
  const mode = body?.mode === "rescue" ? "rescue" : "prep";
  const field = (key) => (body?.[key] || "").toString().trim().slice(0, SMALL_TALK_MAX_FIELD);

  let userMessage;
  if (mode === "rescue") {
    const situation = field("situation");
    if (!situation) {
      return json({ error: "Describe the moment you're stuck in." }, 400);
    }
    userMessage = `Event: ${field("event") || "unspecified"}\nWhat's happening right now: ${situation}`;
  } else {
    const event = field("event");
    if (!event) {
      return json({ error: "Pick or describe an event." }, 400);
    }
    userMessage = [
      `Event: ${event}`,
      `Energy level: ${field("energy") || "medium"}`,
      `Who will be there: ${field("people") || "not specified"}`,
      `Anything else: ${field("context") || "nothing"}`,
    ].join("\n");
  }

  if (!env.GROQ_API_KEY) {
    return json({ error: "Server is missing GROQ_API_KEY. Run: wrangler secret put GROQ_API_KEY" }, 500);
  }

  let groqResponse;
  try {
    groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: mode === "rescue" ? SMALL_TALK_RESCUE_PROMPT : SMALL_TALK_PREP_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: mode === "rescue" ? 900 : 2400,
        response_format: { type: "json_object" },
      }),
    });
  } catch (err) {
    return json({ error: "Failed to reach Groq API", detail: String(err) }, 502);
  }

  if (!groqResponse.ok) {
    const detail = await groqResponse.text();
    return json({ error: "Groq API returned an error", status: groqResponse.status, detail }, 502);
  }

  const data = await groqResponse.json();
  const content = data?.choices?.[0]?.message?.content || "{}";

  try {
    return json({ mode, ...JSON.parse(content) });
  } catch {
    return json({ error: "Model returned invalid JSON", raw: content }, 502);
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
