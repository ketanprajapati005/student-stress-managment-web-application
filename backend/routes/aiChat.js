import express from "express";
import { callOpenRouter } from "../utils/openrouter.js";

const router = express.Router();

/**
 * POST /api/ai/chat
 * AI Chat Assistant endpoint
 */
router.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemPrompt = `You are a comprehensive student wellness and life coach. You help students with stress management, study techniques, productivity, time management, sleep, motivation, work-life balance, healthy habits, exam prep, focus, goal setting, relationships, career planning, nutrition, and mindfulness.

Provide personalized, actionable advice. Be supportive and encouraging. Give practical tips and micro-actions. Keep responses conversational, include 2-3 actionable tips, suggest 2-3 micro-actions, add encouragement. Keep under 200 words unless more detail is requested. No markdown, plain text only.`;

    const reply = await callOpenRouter(message, systemPrompt, history);

    res.json({ reply });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.status(500).json({
      error: error.message || "Failed to get AI response",
    });
  }
});

export default router;

