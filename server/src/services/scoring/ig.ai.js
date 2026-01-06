// server/src/services/scoring/ig.ai.js
import { getOpenAiClient, isAiEnabled } from "../ai/openai.client.js";

export async function analyzeCaptionsAi(captions, { username } = {}) {
  // Feature flag / env guard
  if (!isAiEnabled()) return null;

  const client = getOpenAiClient();
  if (!client) return null;

  const clean = (captions || [])
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .filter(Boolean)
    .slice(0, 20);

  if (clean.length === 0) return null;

  const prompt = [
    "You help detect suspicious Instagram accounts.",
  "Given captions from recent posts, estimate how suspicious they are (0..1) for being fake or low-authenticity.",
  "Consider indicators such as:",
  "- unnatural repetition",
  "- weird or inconsistent grammar",
  "- inconsistent voice or tone",
  "- spammy or excessive promotional patterns",

  "IMPORTANT:",
  "The output is shown directly to an end user (non-technical).",
  "Write reasons in clear, friendly, and neutral language.",
  "Do NOT use technical or AI-related terms.",
  "Do NOT sound judgmental or accusatory.",
  "Each reason should explain *what was observed*, not *what the model thinks*.",
  "Reasons should be short, understandable, and customer-facing.",

  "Return STRICT JSON with the following keys only:",
  "- suspiciousness (number between 0 and 1)",
  "- reasons (array of short strings)",

  `Username: ${username || "unknown"}`,
    clean.map((c, i) => `${i + 1}. ${c}`).join("\n"),
  ].join("\n");

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const text = resp.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);

    const suspiciousnessRaw = parsed?.suspiciousness;
    const reasonsRaw = parsed?.reasons;

    const suspiciousness = Number.isFinite(Number(suspiciousnessRaw))
      ? Math.max(0, Math.min(1, Number(suspiciousnessRaw)))
      : 0;

    const reasons = Array.isArray(reasonsRaw)
      ? reasonsRaw
          .map((r) => (typeof r === "string" ? r.trim() : ""))
          .filter(Boolean)
          .slice(0, 5)
      : [];

    return { suspiciousness, reasons };
  } catch {
    // If OpenAI fails, don't break scoring — return a safe fallback
    return { suspiciousness: 0, reasons: ["AI analysis failed"] };
  }
}
