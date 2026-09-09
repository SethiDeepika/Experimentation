// Cloudflare Worker: proxies incident text to Groq's free API so the API key
// never has to live in the public static site. Deploy with `wrangler deploy`
// after setting the secret with `wrangler secret put GROQ_API_KEY`.
//
// This file holds no secrets itself — env.GROQ_API_KEY is injected by
// Cloudflare at runtime from the Worker's encrypted secret store.

const GROQ_MODEL = "openai/gpt-oss-120b";
const MAX_INCIDENT_LENGTH = 4000;

const SYSTEM_PROMPT = `You are a data-protection compliance analyst. Given a security incident \
description, identify which of the following regulations are likely implicated: GDPR, CCPA/CPRA, \
HIPAA, GLBA, PCI DSS, U.S. state data breach notification laws, FERPA. Only include a regulation if \
it plausibly applies to the facts described. For each one you include, write a clear, specific \
paragraph (2-4 sentences) explaining exactly how it was violated, referencing the actual facts in \
the incident — what data was exposed, who was affected, and which obligation was broken. Never \
apologize or say you cannot answer.

Respond ONLY with a JSON object in this exact shape, no other text:
{"regulations":[{"name":"GDPR","confidence":"high","explanation":"..."}]}`;

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
          temperature: 0.3,
          max_tokens: 1000,
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
