import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import multer from "multer";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for Render deployment (behind reverse proxy)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 8080;
const SITE_ORIGIN = process.env.SITE_ORIGIN || `http://localhost:${PORT}`;

const UPLOAD_DIR = path.join(__dirname, "uploads");
const DATA_DIR = path.join(__dirname, "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.jsonl");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(
  "/api/",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(
  cors({
    origin: SITE_ORIGIN,
  })
);

app.use(express.json({ limit: "1mb" }));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
});

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

app.post("/api/tasks", upload.array("photos", 6), async (req, res) => {
  try {
    if (req.body.company && String(req.body.company).trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    const payload = {
      id: `TA-${Date.now()}`,
      createdAt: new Date().toISOString(),
      category: req.body.category || "",
      title: req.body.title || "",
      description: req.body.description || "",
      suburb: req.body.suburb || "",
      postcode: req.body.postcode || "",
      address: req.body.address || "",
      timing: req.body.timing || "",
      budget: req.body.budget || "",
      name: req.body.name || "",
      mobile: req.body.mobile || "",
      email: req.body.email || "",
      contactPref: req.body.contactPref || "",
      files: (req.files || []).map((f) => ({
        filename: f.filename,
        originalname: f.originalname,
        size: f.size,
      })),
      userAgent: req.headers["user-agent"] || "",
      ip:
        (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
        req.socket.remoteAddress ||
        "",
    };

    const required = ["category", "title", "description", "suburb", "postcode", "name", "mobile", "email", "contactPref", "timing"];
    for (const k of required) {
      if (!String(payload[k] || "").trim()) {
        return res.status(400).json({ ok: false, error: `Missing ${k}` });
      }
    }

    fs.appendFileSync(SUBMISSIONS_FILE, JSON.stringify(payload) + "\n");

    const transporter = getTransporter();
    const to = process.env.NOTIFY_EMAIL_TO;
    const from = process.env.NOTIFY_EMAIL_FROM || "TaskAid <no-reply@taskaid.com.au>";

    if (transporter && to) {
      const fileList = payload.files.length
        ? payload.files.map((f) => `• ${f.originalname} (${Math.round(f.size / 1024)} KB)`).join("\n")
        : "None";

      const text =
        `New TaskAid task received (${payload.id})

Category: ${payload.category}
Title: ${payload.title}
Description: ${payload.description}

Location: ${payload.suburb} ${payload.postcode}
Address: ${payload.address || "(not provided)"}
Timing: ${payload.timing}
Budget: ${payload.budget || "(not provided)"}

Customer:
Name: ${payload.name}
Mobile: ${payload.mobile}
Email: ${payload.email}
Preferred contact: ${payload.contactPref}

Photos:
${fileList}

Submitted at: ${payload.createdAt}
`;

      // Send email without blocking the response
      transporter.sendMail({
        from,
        to,
        subject: `New TaskAid Task: ${payload.title} (${payload.suburb})`,
        text,
      }).catch(err => {
        console.error('Email sending failed:', err.message);
      });
    }

    return res.status(200).json({ ok: true, id: payload.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`TaskAid API running on http://localhost:${PORT}`);
});
