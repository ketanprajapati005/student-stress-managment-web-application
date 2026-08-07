import fetch from "node-fetch";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Call OpenRouter API with a prompt
 * @param {string} prompt - The user's prompt
 * @param {string} systemPrompt - Optional system prompt
 * @param {Array} history - Optional conversation history
 * @returns {Promise<string>} - AI response text
 */
export async function callOpenRouter(prompt, systemPrompt = null, history = []) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  // Add conversation history
  if (history.length > 0) {
    messages.push(...history);
  }

  // Add current user message
  messages.push({
    role: "user",
    content: prompt,
  });

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.CORS_ORIGIN || "http://localhost:5173",
        "X-Title": "Stress Relief Hub",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    return content.trim();
  } catch (error) {
    console.error("Error calling OpenRouter:", error);
    throw error;
  }
}

