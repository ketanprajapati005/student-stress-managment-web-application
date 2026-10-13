import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, images, and text files
    const allowedTypes = {
      ".jpg": ["image/jpeg"],
      ".jpeg": ["image/jpeg"],
      ".png": ["image/png"],
      ".gif": ["image/gif"],
      ".pdf": ["application/pdf"],
      ".txt": ["text/plain"],
      ".doc": ["application/msword"],
      ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes[ext]?.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, images, and documents are allowed."));
    }
  },
});

/**
 * POST /api/upload
 * File upload endpoint
 */
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error.message || "Failed to upload file",
    });
  }
});

/**
 * GET /api/upload/:filename
 * Serve uploaded files
 */
router.get("/upload/:filename", (req, res) => {
  try {
    // Express decodes %2F in params, so strip any directory parts to keep
    // requests like "..%2F.env" inside the uploads directory.
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("File serve error:", error);
    res.status(500).json({ error: "Failed to serve file" });
  }
});

export default router;

