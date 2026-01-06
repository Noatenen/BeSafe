import OpenAI from "openai";

export function isAiEnabled() {
  return process.env.AI_CAPTIONS_ENABLED === "true" && !!process.env.OPENAI_API_KEY;
}

export function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
