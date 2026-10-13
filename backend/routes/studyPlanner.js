import express from "express";
import { handleStudyPlan } from "../lib/studyPlan.js";

const router = express.Router();

router.post("/study-plan", async (req, res) => {
  const { status, body } = await handleStudyPlan(req.body);
  res.status(status).json(body);
});

export default router;
