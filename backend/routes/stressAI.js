import express from "express";
import { handleStress } from "../lib/stress.js";

const router = express.Router();

router.post("/stress", async (req, res) => {
  const { status, body } = await handleStress(req.body);
  res.status(status).json(body);
});

export default router;
