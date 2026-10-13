import { callOpenRouter } from "../utils/openrouter.js";

const respond = (status, body) => ({ status, body });

/**
 * POST /api/ai/stress, shared by the Express server and the Vercel function in /api
 * AI Stress Prediction endpoint
 */
export async function handleStress(body = {}) {
  try {
    const mood = Number(body.mood);
    const sleepHours = Number(body.sleepHours);
    const studyHours = Number(body.studyHours);
    const anxiety = Number(body.anxiety);

    // Validate inputs
    if (
      [mood, sleepHours, studyHours, anxiety].some((v) => !Number.isFinite(v)) ||
      mood < 1 || mood > 10 ||
      anxiety < 0 || anxiety > 10 ||
      sleepHours < 0 || sleepHours > 24 ||
      studyHours < 0 || studyHours > 24
    ) {
      return respond(400, {
        error:
          "All fields are required: mood (1-10), sleepHours (0-24), studyHours (0-24), anxiety (0-10)",
      });
    }

    // Calculate stress score (0-100) as a weighted average of 0-100 factor scores.
    // Higher stress = lower mood, less sleep, more study hours, higher anxiety
    const moodScore = ((10 - mood) / 9) * 100; // mood is 1-10, inverted
    const anxietyScore = anxiety * 10; // anxiety is 0-10
    const sleepScore = Math.min(100, Math.max(0, (7 - sleepHours) * 20)); // 2h or less = 100
    const studyScore = Math.min(100, Math.max(0, (studyHours - 8) * 12.5)); // 16h or more = 100

    const stressScore = Math.round(
      moodScore * 0.3 + anxietyScore * 0.3 + sleepScore * 0.2 + studyScore * 0.2
    );

    // Determine risk level
    let riskLevel = "low";
    if (stressScore >= 70) riskLevel = "high";
    else if (stressScore >= 40) riskLevel = "moderate";

    // Generate AI explanation and advice
    const prompt = `Based on the following student data, provide a comprehensive stress assessment and personalized advice:

- Mood Level: ${mood}/10
- Sleep Hours: ${sleepHours} hours
- Study Hours: ${studyHours} hours per day
- Anxiety Level: ${anxiety}/10
- Calculated Stress Score: ${stressScore}/100
- Risk Level: ${riskLevel}

Provide a JSON response with this structure:
{
  "explanation": "A brief explanation of why the stress score is what it is, considering all factors",
  "advice": "Personalized, actionable advice to help reduce stress and improve wellbeing",
  "immediateActions": ["Action 1", "Action 2", "Action 3"],
  "longTermTips": ["Tip 1", "Tip 2", "Tip 3"]
}

Make the advice specific, practical, and supportive. Consider sleep optimization, study-life balance, anxiety management, and overall wellness.`;

    const systemPrompt = `You are a stress management expert. Always respond with valid JSON only, no markdown formatting.`;

    let aiResponse;
    try {
      aiResponse = await callOpenRouter(prompt, systemPrompt);
      
      // Try to parse JSON response
      let parsedResponse;
      try {
        // Remove potential markdown code blocks
        let cleanResponse = aiResponse.trim();
        if (cleanResponse.startsWith("```json")) {
          cleanResponse = cleanResponse.slice(7);
        } else if (cleanResponse.startsWith("```")) {
          cleanResponse = cleanResponse.slice(3);
        }
        if (cleanResponse.endsWith("```")) {
          cleanResponse = cleanResponse.slice(0, -3);
        }
        parsedResponse = JSON.parse(cleanResponse.trim());
      } catch (parseError) {
        // If parsing fails, create structured response from text
        parsedResponse = {
          explanation: aiResponse.substring(0, 200),
          advice: aiResponse.substring(200, 500) || aiResponse,
          immediateActions: [
            "Take 5 deep breaths",
            "Step away from study for 10 minutes",
            "Drink water and stretch",
          ],
          longTermTips: [
            "Maintain consistent sleep schedule",
            "Take regular breaks during study",
            "Practice mindfulness daily",
          ],
        };
      }

      return respond(200, {
        stressScore,
        riskLevel,
        ...parsedResponse,
      });
    } catch (aiError) {
      // If AI fails, return calculated score with basic advice
      return respond(200, {
        stressScore,
        riskLevel,
        explanation: `Your stress score is ${stressScore}/100 based on your mood (${mood}/10), sleep (${sleepHours}h), study hours (${studyHours}h), and anxiety level (${anxiety}/10).`,
        advice: riskLevel === "high"
          ? "Your stress level is high. Focus on getting adequate sleep (7-9 hours), taking regular breaks, and managing anxiety through breathing exercises."
          : riskLevel === "moderate"
          ? "Your stress level is moderate. Maintain good sleep habits, balance study time with rest, and practice stress-reduction techniques."
          : "Your stress level is manageable. Keep up good habits and maintain balance.",
        immediateActions: [
          "Take 5 deep breaths",
          "Step away for a 10-minute break",
          "Drink water and stretch",
        ],
        longTermTips: [
          "Aim for 7-9 hours of sleep nightly",
          "Take breaks every 45-60 minutes of study",
          "Practice daily mindfulness or meditation",
        ],
      });
    }
  } catch (error) {
    console.error("Stress AI error:", error);
    return respond(500, {
      error: error.message || "Failed to process stress prediction",
    });
  }
}
