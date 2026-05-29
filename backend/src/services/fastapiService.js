import axios from "axios";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";

const FASTAPI_URL = process.env.FASTAPI_URL;

if (process.env.NODE_ENV === "production" && !FASTAPI_URL) {
    throw new Error("FASTAPI_URL must be set in production environment");
}

export const predictBatch = async (payload, requestId) => {
    try {
        logger.info("[FASTAPI]", requestId, "sending request");

        const start = Date.now();

        const response = await axios.post(
            `${FASTAPI_URL}/predict/batch`,
            payload,
            {
                timeout: 30000,
            }
        );

        const duration = Date.now() - start;

        logger.info(
            "[FASTAPI]",
            requestId,
            "response received",
            `status=${response.status}`,
            `duration=${duration}ms`
        );

        return response.data;
    } catch (err) {
        logger.error("[FASTAPI]", requestId, "request failed", err.message);

        if (err.response) {
            logger.error(
                "[FASTAPI RESPONSE]",
                requestId,
                "status=",
                err.response.status,
                "data=",
                err.response.data
            );
        } else if (err.request) {
            logger.error("[FASTAPI NO RESPONSE]", requestId, err.message);
        } else {
            logger.error("[FASTAPI UNKNOWN]", requestId, err.message);
        }

        throw new AppError(
            err.response?.data?.detail ||
            err.message,
            err.response?.status || 500,
            "FASTAPI_ERROR"
        );
    }
};
