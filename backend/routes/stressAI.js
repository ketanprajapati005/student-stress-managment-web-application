import express from "express";
import { callOpenRouter } from "../utils/openrouter.js";

const router = express.Router();

/**
 * POST /api/ai/stress
 * AI Stress Prediction endpoint
 */
router.post("/stress", async (req, res) => {
  try {
    const { mood, sleepHours, studyHours, anxiety } = req.body;

    // Validate inputs
    if (
      mood === undefined ||
      sleepHours === undefined ||
      studyHours === undefined ||
      anxiety === undefined
    ) {
      return res.status(400).json({
        error: "All fields are required: mood, sleepHours, studyHours, anxiety",
      });
    }

    // Calculate stress score (0-100)
    // Higher stress = lower mood, less sleep, more study hours, higher anxiety
    const moodWeight = (10 - mood) * 10; // mood is 1-10, inverted
    const sleepWeight = sleepHours < 7 ? (7 - sleepHours) * 5 : 0;
    const studyWeight = studyHours > 8 ? (studyHours - 8) * 3 : 0;
    const anxietyWeight = anxiety * 10; // anxiety is 0-10

    const stressScore = Math.min(
      100,
      Math.round((moodWeight + sleepWeight + studyWeight + anxietyWeight) / 4)
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

      res.json({
        stressScore,
        riskLevel,
        ...parsedResponse,
      });
    } catch (aiError) {
      // If AI fails, return calculated score with basic advice
      res.json({
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
    res.status(500).json({
      error: error.message || "Failed to process stress prediction",
    });
  }
});

export default router;

