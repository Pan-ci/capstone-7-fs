import "dotenv/config";
import express from "express";
import cors from "cors";

import routes from "./routes/routes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import { purgeExpiredBatchJobs } from "./services/batchPredictionService.js";
import { logger } from "./utils/logger.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { requestLogger } from "./middlewares/requestLogger.js";

logger.info("Server starting...");

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL;
const isProd = process.env.NODE_ENV === "production";
const isDebug = process.env.DEBUG === "true" || (!isProd && process.env.DEBUG !== "false");
// Accept legacy/mistyped env name as a fallback: FAST_API_URL
const FASTAPI_URL_RESOLVED = process.env.FASTAPI_URL || process.env.FAST_API_URL || null;

if (isProd && !FRONTEND_URL) {
    logger.error(null, "FRONTEND_URL must be set in production. Exiting.");
    process.exit(1);
}

// Validate critical environment variables early (fail fast with clear message)
if (isProd) {
    const missing = [];
    if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
    if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
    if (!FASTAPI_URL_RESOLVED) missing.push("FASTAPI_URL");

    if (missing.length > 0) {
        logger.error(null, `Missing required env vars in production: ${missing.join(", ")}`);
        process.exit(1);
    }
}

    // Emit detailed env status (mask secrets)
    logger.info("Server", null, "Env status:",
        `DATABASE_URL=${process.env.DATABASE_URL ? 'set' : 'unset'}`,
        `DB_SSL=${process.env.DB_SSL || 'false'}`,
        `FASTAPI_URL_resolved=${FASTAPI_URL_RESOLVED ? 'set' : 'unset'}`,
        `FASTAPI_URL_env=${process.env.FASTAPI_URL ? 'set' : 'unset'}`,
        `FAST_API_URL_env=${process.env.FAST_API_URL ? 'set' : 'unset'}`,
        `JWT_SECRET=${process.env.JWT_SECRET ? 'set' : 'unset'}`,
        `DEBUG=${isDebug ? 'enabled' : 'disabled'}`
    );

// Non-blocking startup check for FastAPI health endpoint to help detect misconfiguration
if (FASTAPI_URL_RESOLVED) {
    (async () => {
        try {
            const url = `${FASTAPI_URL_RESOLVED.replace(/\/$/, '')}/health`;
            const resp = await fetch(url, { method: 'GET' });
            if (resp.ok) {
                const data = await resp.json();
                logger.info(null, `FastAPI health check ok: ${url} -> ${JSON.stringify(data)}`);
            } else {
                logger.error(null, `FastAPI health check returned ${resp.status} at ${url}. This often means FASTAPI_URL is incorrect or points to the backend instead of the model server.`);
            }
        } catch (err) {
            logger.error(null, `FastAPI health check failed for ${FASTAPI_URL_RESOLVED}: ${err.message}`);
        }
    })();
} else {
    logger.warn(null, "FASTAPI_URL not configured (no FASTAPI_URL or FAST_API_URL provided). In production this will fail.");
}

app.use(cors({
    origin: isProd ? FRONTEND_URL : true,
    credentials: !isProd,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use("/api", routes);
logger.info(null, "Routes mounted at /api");

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
const CLEANUP_INTERVAL_MS =
    Number(process.env.BATCH_CLEANUP_INTERVAL_MS) || 300000;

app.listen(PORT, '0.0.0.0', () => {
    logger.info(null, `Server running on port ${PORT}`);

    purgeExpiredBatchJobs();
    setInterval(() => {
        purgeExpiredBatchJobs();
    }, CLEANUP_INTERVAL_MS);
    logger.info(null, `[BatchCleanup] Scheduled every ${CLEANUP_INTERVAL_MS / 1000}s (retention 1h)`);
});