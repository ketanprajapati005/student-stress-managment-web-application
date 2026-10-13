import express from "express";
import { handleChat } from "../lib/chat.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { status, body } = await handleChat(req.body);
  res.status(status).json(body);
});

export default router;
