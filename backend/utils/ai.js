const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Readable messages for provider errors the user can act on.
function providerError(provider, status) {
  if (status === 402) {
    return new Error(
      `${provider} has no credits left for this API key. Add credits, or set GEMINI_API_KEY to use Google's free tier.`
    );
  }
  if (status === 429) {
    return new Error(`${provider} rate limit reached. Please wait a minute and try again.`);
  }
  if (status === 400 || status === 401 || status === 403) {
    return new Error(`${provider} rejected the request (${status}). Check that the API key is correct.`);
  }
  return new Error(`${provider} API error: ${status}`);
}

// Only well-formed user/assistant turns are kept so clients can't inject their own
// system prompts.
function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .slice(-10)
    .map(({ role, content }) => ({ role, content }));
}

async function callGemini(apiKey, prompt, systemPrompt, history) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
      contents: [
        ...history.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: prompt }] },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Gemini API error:", response.status, await response.text());
    throw providerError("Gemini", response.status);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
}

async function callOpenRouter(apiKey, prompt, systemPrompt, history) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.CORS_ORIGIN || "http://localhost:5173",
      "X-Title": "Stress Relief Hub",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...history,
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    console.error("OpenRouter API error:", response.status, await response.text());
    throw providerError("OpenRouter", response.status);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

/**
 * Get a reply from the configured AI provider. Uses Google Gemini directly when
 * GEMINI_API_KEY is set (it has a free tier), otherwise OpenRouter.
 * @param {string} prompt - The user's prompt
 * @param {string} systemPrompt - Optional system prompt
 * @param {Array} history - Optional conversation history
 * @returns {Promise<string>} - AI response text
 */
export async function callAI(prompt, systemPrompt = null, history = []) {
  const { GEMINI_API_KEY, OPENROUTER_API_KEY } = process.env;
  const turns = cleanHistory(history);

  let content;
  if (GEMINI_API_KEY) {
    content = await callGemini(GEMINI_API_KEY, prompt, systemPrompt, turns);
  } else if (OPENROUTER_API_KEY) {
    content = await callOpenRouter(OPENROUTER_API_KEY, prompt, systemPrompt, turns);
  } else {
    throw new Error("No AI key configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY.");
  }

  if (!content) {
    throw new Error("No content in AI response");
  }
  return content.trim();
}
