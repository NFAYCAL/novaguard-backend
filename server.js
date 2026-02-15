/**
 * NovaGuard Backend (NO DATABASE)
 * - No DB, no ORM, no connection strings
 * - Serves static site from /public (index.html)
 * - Simple API: /api/health, /api/demo, /api/pricing
 * - Azure App Service ready: listens on process.env.PORT
 */

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");

const app = express();
// ===== PRICING (NO DATABASE) =====
let pricing = [
  { name: "Starter", price: 0, currency: "EUR", note: "6 base Oracle" },
  { name: "Pro", price: 450, currency: "EUR", note: "Jusqu'à 20 bases" },
  { name: "Enterprise", price: null, currency: "EUR", note: "Sur devis" }
];

// Azure injects PORT automatically
const PORT = Number(process.env.PORT || 3000);

// Put your front URL here in Azure App Settings (recommended)
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Static content folder
const PUBLIC_DIR = path.join(__dirname, "public");

// --- Middlewares ---
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
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// --- API ---
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "novaguard-backend",
    database: "none",
    time: new Date().toISOString(),
  });
});

const demoSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  company: z.string().min(2).max(120).optional(),
  message: z.string().min(10).max(1000),
  plan: z.enum(["Starter", "Pro", "Enterprise"]).optional(),
});

// IMPORTANT: NO DATABASE
// We only validate + log the payload (or you can forward to email/webhook later)
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

  // ✅ No DB: just console log (visible in Azure Log Stream)
  console.log("📩 [NO-DB] Demo request:", {
    ...payload,
    receivedAt: new Date().toISOString(),
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  });

  return res.status(201).json({
    ok: true,
    message: "Demande reçue. (Aucune base de données utilisée)",
  });
});

app.get("/api/pricing", (req, res) => {
  res.json({
    ok: true,
    database: "none",
    plans: [
      { name: "Starter", price: 0, currency: "EUR", note: "6 base Oracle" },
      { name: "Pro", price: 450, currency: "EUR", note: "Jusqu'à 20 bases" },
      { name: "Enterprise", price: null, currency: "EUR", note: "Sur devis" },
    ],
  });
});

// --- Static site ---
app.use(express.static(PUBLIC_DIR));

// fallback to index.html (simple SPA-style)
app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"), (err) => {
    if (err) {
      res.status(404).json({
        ok: false,
        error: "Not Found (public/index.html missing)",
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ NovaGuard Backend (NO DB) running on port ${PORT}`);
  console.log(`   CORS_ORIGIN = ${CORS_ORIGIN}`);
});
