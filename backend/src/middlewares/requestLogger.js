import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
    const rid = req.requestId || "-";

    // Log method, path, basic headers/body size info
    logger.info("HTTP", rid, `${req.method} ${req.originalUrl}`, `headers=${Object.keys(req.headers).length}`, `content-length=${req.headers["content-length"] || 0}`);

    next();
};
