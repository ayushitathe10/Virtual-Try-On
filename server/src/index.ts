import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createDecartClient } from "@decartai/sdk";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const DECART_API_KEY = process.env.DECART_API_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "*";

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like background workers, curl, or extension requests)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS === "*" || ALLOWED_ORIGINS.trim() === "") {
        return callback(null, true);
      }

      const allowedList = ALLOWED_ORIGINS.split(",").map((s) => s.trim());
      const isAllowed =
        allowedList.includes(origin) ||
        origin.startsWith("chrome-extension://") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1");

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Serve static test fashion catalog for easy local testing
app.use("/test", express.static(path.join(__dirname, "../public")));
app.use("/public", express.static(path.join(__dirname, "../public")));

// Basic rate limiting: max 60 token minting requests per 15 minutes per IP
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many token requests from this IP, please try again after 15 minutes.",
  },
});

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "TryOn Live Token Server",
    model: "lucy-vton-3.5",
    hasApiKey: Boolean(DECART_API_KEY && DECART_API_KEY !== "your_decart_api_key_here"),
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/token
 * Calls Decart's official SDK to mint a short-lived client token.
 * Never exposes DECART_API_KEY to the extension frontend.
 */
app.post("/api/token", tokenLimiter, async (req: Request, res: Response) => {
  try {
    if (!DECART_API_KEY || DECART_API_KEY.trim() === "" || DECART_API_KEY === "your_decart_api_key_here") {
      console.error("[Token Error] DECART_API_KEY is not configured in server/.env");
      return res.status(500).json({
        error: "Server misconfiguration: DECART_API_KEY is not set. Please add your key to server/.env",
      });
    }

    console.log("[Token Server] Minting short-lived client token for Lucy V-TON session...");

    // Initialize Decart SDK client on server with long-lived key
    const serverClient = createDecartClient({
      apiKey: DECART_API_KEY,
    });

    // Create ephemeral client token (default 10 mins = 600 seconds)
    // Allowed models restricted to virtual try-on
    const tokenResponse = await serverClient.tokens.create({
      expiresIn: 600,
      allowedModels: ["lucy-vton-3.5", "lucy-vton-latest"],
    });

    console.log(`[Token Server] Successfully minted client token. Expires at: ${tokenResponse.expiresAt}`);

    // Return client token details to extension
    return res.json({
      apiKey: tokenResponse.apiKey,
      expiresAt: tokenResponse.expiresAt,
      model: "lucy-vton-3.5",
    });
  } catch (error: any) {
    console.error("[Token Server Error]", error?.message || error);
    return res.status(502).json({
      error: "Failed to mint Decart client token: " + (error?.message || "Unknown Decart API error"),
      details: error?.response?.data || error?.details || undefined,
    });
  }
});

// Root redirect to /test if opened in browser
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/test");
});

// Generic 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Server Error]", err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  TryOn Live Server running on port ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Test Store  : http://localhost:${PORT}/test`);
  console.log(`  Token Route : POST http://localhost:${PORT}/api/token`);
  console.log(`  Decart Key  : ${DECART_API_KEY ? "CONFIGURED" : "MISSING (Set in .env)"}`);
  console.log(`===============================================`);
});
