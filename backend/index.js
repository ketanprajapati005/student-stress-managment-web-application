import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import aiChatRouter from "./routes/aiChat.js";
import stressAIRouter from "./routes/stressAI.js";
import studyPlannerRouter from "./routes/studyPlanner.js";
import uploadsRouter from "./routes/uploads.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Stress Relief Hub API is running" });
});

// API Routes
app.use("/api/ai", aiChatRouter);
app.use("/api/ai", stressAIRouter);
app.use("/api/ai", studyPlannerRouter);
app.use("/api", uploadsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`🔑 OpenRouter API: ${process.env.OPENROUTER_API_KEY ? "✅ Configured" : "❌ Not configured"}`);
});

