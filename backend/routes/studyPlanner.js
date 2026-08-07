import express from "express";
import { callOpenRouter } from "../utils/openrouter.js";

const router = express.Router();

/**
 * POST /api/ai/study-plan
 * AI Study Planner endpoint
 */
router.post("/study-plan", async (req, res) => {
  try {
    const { subject, hoursPerDay, goal, currentLevel, deadline } = req.body;

    if (!subject || !hoursPerDay || !goal) {
      return res.status(400).json({
        error: "subject, hoursPerDay, and goal are required",
      });
    }

    const prompt = `Create a comprehensive study plan for a student with the following requirements:

- Subject/Topic: ${subject}
- Hours Available Per Day: ${hoursPerDay} hours
- Goal: ${goal}
${currentLevel ? `- Current Level: ${currentLevel}` : ""}
${deadline ? `- Deadline: ${deadline}` : ""}

Provide a JSON response with this structure:
{
  "planOverview": "A brief overview of the study plan strategy",
  "weeklySchedule": {
    "monday": ["Task 1", "Task 2"],
    "tuesday": ["Task 1", "Task 2"],
    "wednesday": ["Task 1", "Task 2"],
    "thursday": ["Task 1", "Task 2"],
    "friday": ["Task 1", "Task 2"],
    "saturday": ["Task 1", "Task 2"],
    "sunday": ["Task 1", "Task 2"]
  },
  "studyTechniques": ["Technique 1", "Technique 2", "Technique 3"],
  "milestones": ["Milestone 1", "Milestone 2", "Milestone 3"],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}

Make the plan realistic, actionable, and tailored to the available hours. Include effective study techniques, clear milestones, and practical tips.`;

    const systemPrompt = `You are an expert study planner and academic coach. Always respond with valid JSON only, no markdown formatting. Create realistic, actionable study plans.`;

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
        // If parsing fails, create structured response
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const weeklySchedule = {};
        days.forEach((day) => {
          weeklySchedule[day] = [
            `Review ${subject} concepts (${Math.floor(hoursPerDay * 0.4)}h)`,
            `Practice problems (${Math.floor(hoursPerDay * 0.4)}h)`,
            `Review and notes (${Math.floor(hoursPerDay * 0.2)}h)`,
          ];
        });

        parsedResponse = {
          planOverview: `A structured ${hoursPerDay}-hour daily study plan for ${subject} to achieve: ${goal}`,
          weeklySchedule,
          studyTechniques: [
            "Active recall and spaced repetition",
            "Pomodoro technique (25 min study, 5 min break)",
            "Practice testing and self-quizzing",
          ],
          milestones: [
            "Week 1: Master fundamentals",
            "Week 2: Apply concepts",
            "Week 3: Advanced topics and review",
          ],
          tips: [
            "Take regular breaks to maintain focus",
            "Review previous material daily",
            "Track your progress and adjust as needed",
          ],
        };
      }

      res.json(parsedResponse);
    } catch (aiError) {
      console.error("Study planner AI error:", aiError);
      res.status(500).json({
        error: "Failed to generate study plan. Please try again.",
      });
    }
  } catch (error) {
    console.error("Study planner error:", error);
    res.status(500).json({
      error: error.message || "Failed to process study plan request",
    });
  }
});

export default router;

