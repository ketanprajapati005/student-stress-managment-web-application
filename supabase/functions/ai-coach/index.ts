import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type HistoryMessage = { role: "user" | "assistant"; content: string };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [], context } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // API key can be Lovable gateway (preferred), OpenRouter, or direct Gemini
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const useLovable = Boolean(LOVABLE_API_KEY);
    const useOpenRouter = !useLovable && Boolean(OPENROUTER_API_KEY);
    const useDirectGemini = !useLovable && !useOpenRouter && Boolean(GEMINI_API_KEY);

    if (!useLovable && !useOpenRouter && !useDirectGemini) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY or OPENROUTER_API_KEY or GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = useLovable ? LOVABLE_API_KEY! : useOpenRouter ? OPENROUTER_API_KEY! : GEMINI_API_KEY!;
    const useDirectGemini = !useLovable && !useOpenRouter;
    
    const model = useLovable
      ? "google/gemini-2.5-flash"
      : useOpenRouter
        ? "google/gemini-flash-1.5-8b"
        : "gemini-2.0-flash-exp";

    console.log(
      "ai-coach provider",
      useLovable ? "lovable" : useOpenRouter ? "openrouter" : "direct_gemini",
      "model",
      model
    );

    const contextText = context
      ? `User context:\n- Stress: ${context.stress_score ?? "n/a"}/100 (${context.risk_level ?? "n/a"})\n- Sleep: ${context.sleep_hours ?? "n/a"}h\n- Study: ${context.study_hours ?? "n/a"}h\n- Mood: ${context.mood ?? "n/a"}/10`
      : "User context: not provided.";

    let response: Response;
    let content: string;

    if (useDirectGemini) {
      // Direct Gemini API format
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      // Convert messages to Gemini format
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      
      // Comprehensive system prompt for student wellness coach
      const systemPrompt = `You are a comprehensive student wellness and life coach powered by Gemini AI. You help students with:

**Core Topics:**
- Stress Management & Mental Health
- Study Techniques & Academic Performance  
- Productivity & Time Management
- Sleep & Rest Optimization
- Motivation & Procrastination
- Work-Life Balance
- Healthy Habits & Wellness
- Exam Preparation & Test Anxiety
- Focus & Concentration
- Goal Setting & Achievement
- Social Connections & Relationships
- Career Planning & Future Goals
- Nutrition & Physical Health
- Mindfulness & Meditation

**Your Approach:**
- Provide personalized, actionable advice based on the user's context
- Be supportive, empathetic, and encouraging
- Give practical tips and micro-actions they can take immediately
- Adapt your style to the user's needs (concise, detailed, step-by-step, etc.)
- Use the user's stress, sleep, study, and mood data to tailor responses
- Address multiple aspects of student life, not just stress

**Response Format:**
- Keep responses conversational and natural
- Include 2-3 actionable tips
- Suggest 2-3 micro-actions for the next hour
- Add a brief encouragement
- Keep responses under 200 words unless the user asks for more detail
- No markdown formatting, plain text only`;

      // Add system instruction as first user message
      contents.push({
        role: "user",
        parts: [{ text: systemPrompt + "\n\n" + contextText + "\n\nRemember: Address the user's question comprehensively, considering all aspects of student wellness and life, not just stress management." }]
      });
      
      // Add conversation history
      for (const msg of history.slice(-6)) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }
      
      // Add current message
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
        }),
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error("Gemini API error", response.status, txt);
        return new Response(
          JSON.stringify({ error: `Gemini API error ${response.status}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = await response.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("No content in Gemini response");
      }
    } else {
      // OpenAI-compatible API (Lovable or OpenRouter)
      const apiUrl = useLovable
        ? "https://ai.gateway.lovable.dev/v1/chat/completions"
        : "https://openrouter.ai/api/v1/chat/completions";

      const systemPrompt = `You are a comprehensive student wellness and life coach. You help students with stress management, study techniques, productivity, time management, sleep, motivation, work-life balance, healthy habits, exam prep, focus, goal setting, relationships, career planning, nutrition, and mindfulness.

Provide personalized, actionable advice. Be supportive and encouraging. Give practical tips and micro-actions. Use the user's context data to tailor responses. Address all aspects of student life, not just stress.

Keep responses conversational, include 2-3 actionable tips, suggest 2-3 micro-actions, add encouragement. Keep under 200 words unless more detail is requested. No markdown, plain text only.`;

      const messages: HistoryMessage[] = [
        {
          role: "assistant",
          content: systemPrompt,
        },
        {
          role: "user",
          content:
            `${contextText}\n\nRemember: Address the user's question comprehensively, considering all aspects of student wellness and life, not just stress management.`,
        },
        ...history.slice(-6) as HistoryMessage[],
        { role: "user", content: message },
      ];

      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(useOpenRouter
            ? {
                "HTTP-Referer": req.headers.get("Origin") ?? "https://localhost",
                "X-Title": "Stress Relief Hub",
              }
            : {}),
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      });

      if (!response.ok) {
        const txt = await response.text();
        console.error("ai-coach error", response.status, txt);
        return new Response(
          JSON.stringify({ error: `AI error ${response.status}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = await response.json();
      content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content in AI response");
      }
    }

    return new Response(JSON.stringify({ reply: content.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-coach function error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

