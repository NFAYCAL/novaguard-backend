/**
 * NovaGuard Backend - Single file (Express) ready for Azure App Service
 * - Serves static site from /public (index.html)
 * - API endpoints: /api/health, /api/demo, /api/pricing
 * - Basic security: helmet, rate-limit, CORS
 *
 * Local:
 *   npm i
 *   npm start
 *
 * Azure App Service:
 *   Uses process.env.PORT (injected by Azure)
 *   Configure CORS_ORIGIN in App Service > Configuration
 */

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
require("dotenv").config();

const app = express();

// ---------- Config ----------
const PORT = Number(process.env.PORT || 3000);

// Set this in Azure App Service > Configuration > Application settings
// Example: https://<your-static-web-app>.azurestaticapps.net
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Static site directory (put your index.html there)
const PUBLIC_DIR = path.join(__dirname, "public");

// ---------- Middlewares ----------
app.use(helmet());
app.use(express.json({ limit: "200kb" }));

app.use(
  cors({
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN,
    methods: ["GET", "POST"],
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100, // 100 req / 15 min / IP
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// ---------- API ----------
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "novaguard-backend",
    env: process.env.NODE_ENV || "dev",
    time: new Date().toISOString(),
  });
});

// Validation schema for demo/contact request
const demoSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  company: z.string().min(2).max(120).optional(),
  message: z.string().min(10).max(1000),
  plan: z.enum(["Starter", "Pro", "Enterprise"]).optional(),
});

app.post("/api/demo", (req, res) => {
  const parsed = demoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
  }

  const payload = parsed.data;

  // TODO later (optional):
  // - Send email (Nodemailer)
  // - Save to DB (Postgres/Cosmos)
  // - Push to webhook/CRM
  console.log("📩 Demo request received:", payload);

  return res.status(201).json({
    ok: true,
    message: "Demande reçue. Nous vous contacterons rapidement.",
  });
});

app.get("/api/pricing", (req, res) => {
  res.json({
    ok: true,
    plans: [
      { name: "Starter", price: 0, currency: "EUR", included: "1 base Oracle" },
      { name: "Pro", price: 299, currency: "EUR", included: "Jusqu'à 10 bases" },
      { name: "Enterprise", price: null, currency: "EUR", included: "Sur devis" },
    ],
  });
});

// ---------- Static site ----------
app.use(express.static(PUBLIC_DIR));

// SPA fallback (if you only have index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"), (err) => {
    if (err) {
      res.status(404).json({ ok: false, error: "Not Found (no public/index.html)" });
    }
  });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`✅ NovaGuard backend running on port ${PORT}`);
  console.log(`   CORS_ORIGIN = ${CORS_ORIGIN}`);
});
