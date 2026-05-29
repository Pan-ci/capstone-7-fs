import pool from "../config/db.js";
import { checkModelHealth } from "../services/predictionService.js";
import { logger } from "../utils/logger.js";

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));

export const readiness = async (req, res, next) => {
    const start = Date.now();
    try {
        // quick DB check with short timeout
        await Promise.race([pool.query("SELECT 1"), timeout(2000)]);

        // check model health but don't fail startup if not configured
        const model = await checkModelHealth();

        res.json({
            status: "ready",
            db: "ok",
            model,
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
        });
    } catch (err) {
        logger.error("Health", null, "Readiness check failed:", err.message);
        res.status(503).json({
            status: "not_ready",
            error: err.message,
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - start,
        });
    }
};
