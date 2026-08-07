import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stress_score, risk_level, sleep_hours, study_hours, mood } = await req.json();

    // Provider selection: prefer Lovable gateway, then OpenRouter, then direct Gemini
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const useLovable = Boolean(LOVABLE_API_KEY);
    const useOpenRouter = !useLovable && Boolean(OPENROUTER_API_KEY);
    const useDirectGemini = !useLovable && !useOpenRouter && Boolean(GEMINI_API_KEY);

    if (!useLovable && !useOpenRouter && !useDirectGemini) {
      throw new Error("LOVABLE_API_KEY or OPENROUTER_API_KEY or GEMINI_API_KEY must be configured");
    }

    const apiKey = useLovable ? LOVABLE_API_KEY! : useOpenRouter ? OPENROUTER_API_KEY! : GEMINI_API_KEY!;
    const useDirectGemini = !useLovable && !useOpenRouter;
    
    const model = useLovable
      ? "google/gemini-2.5-flash"
      : useOpenRouter
        ? "google/gemini-flash-1.5-8b"
        : "gemini-2.0-flash-exp";

    console.log(
      "ai-recommendations provider",
      useLovable ? "lovable" : useOpenRouter ? "openrouter" : "direct_gemini",
      "model",
      model
    );

    const prompt = `You are a comprehensive student wellness AI counselor. Based on the following data, provide personalized recommendations covering multiple aspects of student life.

Student Data:
- Stress Score: ${stress_score}/100
- Risk Level: ${risk_level}
- Sleep Hours (last logged): ${sleep_hours}h
- Study Hours (last logged): ${study_hours}h
- Mood Level: ${mood}/10

Please provide a JSON response with the following structure:
{
  "summary": "A brief 2-3 sentence summary covering the student's overall wellness state (stress, academic performance, lifestyle balance)",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4"],
  "breathing_exercise": "A specific breathing exercise technique with step-by-step instructions",
  "lifestyle_tip": "A practical lifestyle tip tailored to their current situation",
  "study_tip": "A study technique or productivity tip based on their study hours and stress level",
  "wellness_activity": "A wellness activity suggestion (exercise, mindfulness, social, etc.)",
  "time_management": "A time management or scheduling tip if relevant"
}

Make your recommendations specific, actionable, and supportive. Consider ALL aspects:
- Stress management and mental health
- Sleep quality and rest optimization
- Study efficiency and academic performance
- Work-life balance and time management
- Physical wellness and activity
- Social connections and relationships
- Motivation and goal achievement

Specific considerations:
- If sleep is below 7 hours, prioritize sleep recommendations
- If study hours are above 8, suggest break strategies and time management
- If mood is below 5, include emotional support tips and wellness activities
- For high stress scores, include calming techniques AND study strategies
- Consider productivity tips if study hours are low but stress is high
- Include social/relationship advice if mood is low`;

    console.log("Calling AI provider with stress data:", { stress_score, risk_level, sleep_hours, study_hours, mood });

    let response: Response;
    let content: string;

    if (useDirectGemini) {
      // Direct Gemini API format
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: "You are a supportive AI stress counselor. Always respond with valid JSON only, no markdown formatting.\n\n" + prompt }]
          }]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      // OpenAI-compatible API (Lovable or OpenRouter)
      const apiUrl = useLovable
        ? "https://ai.gateway.lovable.dev/v1/chat/completions"
        : "https://openrouter.ai/api/v1/chat/completions";

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
          messages: [
            {
              role: "system",
              content: "You are a supportive AI stress counselor. Always respond with valid JSON only, no markdown formatting."
            },
            {
              role: "user",
              content: prompt
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Usage limit reached. Please add credits." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      content = data.choices?.[0]?.message?.content;
    }

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI Response content:", content);

    // Parse the JSON response, handling potential markdown code blocks
    let parsedContent;
    try {
      // Remove potential markdown code blocks
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      parsedContent = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Provide a fallback response
      parsedContent = {
        summary: "Based on your current stress levels, it's important to focus on self-care and balance.",
        recommendations: [
          "Take short breaks every 45 minutes of study",
          "Practice deep breathing when feeling overwhelmed",
          "Maintain a consistent sleep schedule",
          "Connect with friends or family for support"
        ],
        breathing_exercise: "Try the 4-7-8 technique: Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. Repeat 4 times.",
        lifestyle_tip: "Consider adding a 15-minute walk to your daily routine to help clear your mind and reduce stress."
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-recommendations function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
