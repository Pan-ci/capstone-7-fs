import { logger } from "../utils/logger.js";
import { createErrorResponse } from "../utils/apiError.js";

const errorMiddleware = (err, req, res, next) => {

    logger.error(
        "GLOBAL_ERROR",
        req.requestId,
        err.message
    );

    // ===== STATUS =====
    const status = err.status || err.statusCode || 500;

    // ===== STRUCTURED RESPONSE =====
    const response = createErrorResponse({
        code: err.code || "INTERNAL_ERROR",
        message: err.message || "Internal Server Error",
        details: process.env.NODE_ENV !== "production"
            ? err.stack
            : null,
    });

    // ===== LEGACY FALLBACK =====
    // sementara untuk kompatibilitas lama
    if (
        err.message?.includes("Model server error") ||
        err.message?.includes("fetch failed")
    ) {
        response.error.code = "FASTAPI_UNREACHABLE";

        response.error.message =
            "Model AI tidak dapat dihubungi. Pastikan FastAPI server berjalan.";
    }

    return res.status(status).json(response);
};

export default errorMiddleware;
