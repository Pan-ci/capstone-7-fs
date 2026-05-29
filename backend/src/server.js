import "dotenv/config";
import express from "express";
import cors from "cors";

import routes from "./routes/routes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import { purgeExpiredBatchJobs } from "./services/batchPredictionService.js";
import { logger } from "./utils/logger.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";

logger.info("Server starting...");

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL;
const isProd = process.env.NODE_ENV === "production";

if (isProd && !FRONTEND_URL) {
    logger.error(null, "FRONTEND_URL must be set in production. Exiting.");
    process.exit(1);
}

// Validate critical environment variables early (fail fast with clear message)
if (isProd) {
    const missing = [];
    if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
    if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");

    if (missing.length > 0) {
        logger.error(null, `Missing required env vars in production: ${missing.join(", ")}`);
        process.exit(1);
    }
}

app.use(cors({
    origin: isProd ? FRONTEND_URL : true,
    credentials: !isProd,
}));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(requestIdMiddleware);
app.use("/api", routes);

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