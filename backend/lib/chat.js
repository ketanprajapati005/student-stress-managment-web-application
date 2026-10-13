import { callOpenRouter } from "../utils/openrouter.js";

const respond = (status, body) => ({ status, body });

/**
 * POST /api/ai/chat, shared by the Express server and the Vercel function in /api
 * AI Chat Assistant endpoint
 */
export async function handleChat(body = {}) {
  try {
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return respond(400, { error: "Message is required" });
    }

    const systemPrompt = `You are a comprehensive student wellness and life coach. You help students with stress management, study techniques, productivity, time management, sleep, motivation, work-life balance, healthy habits, exam prep, focus, goal setting, relationships, career planning, nutrition, and mindfulness.

Provide personalized, actionable advice. Be supportive and encouraging. Give practical tips and micro-actions. Keep responses conversational, include 2-3 actionable tips, suggest 2-3 micro-actions, add encouragement. Keep under 200 words unless more detail is requested. No markdown, plain text only.`;

    const reply = await callOpenRouter(message, systemPrompt, history);

    return respond(200, { reply });
  } catch (error) {
    console.error("AI Chat error:", error);
    return respond(500, {
      error: error.message || "Failed to get AI response",
    });
  }
}
