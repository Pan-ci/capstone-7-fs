// Service yang berkomunikasi dengan FastAPI (model AI server)
// Fix: payload sesuai skema FastAPI (summary, experience_desc, years_experience)

import { logger } from "../utils/logger.js";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

/**
 * Kirim request ke FastAPI untuk prediksi
 * @param {object} data — { summary, experience_desc, years_experience }
 */
/**
 * Helper: extract requestId (optional)
 */
const getRequestId = () => {
    return globalThis?.requestId || null;
};

/**
 * Helper: structured log
 */

const log = (level, message, meta = {}) => {
    const requestId = getRequestId();
    const scope = `PredictionService${requestId ? `:req:${requestId}` : ""}`;

    if (level === "ERROR") {
        logger.error(scope, message, Object.keys(meta).length ? meta : undefined);
    } else {
        logger.info(scope, message, Object.keys(meta).length ? meta : undefined);
    }
};

/**
 * Standard error wrapper (Batch 3 style)
 */
const createError = (code, message, details = null, status = 500) => {
    const err = new Error(message);
    err.code = code;
    err.status = status;
    err.details = details;
    return err;
};

/**
 * Kirim request ke FastAPI untuk prediksi
 */
export const runPrediction = async (data) => {
    const summary = (data.summary || "").trim();
    const experience_desc = (data.experience_desc || "").trim();
    const years_experience = Number(data.years_experience) || 0;

    const requestId = getRequestId();

    log("INFO", "Sending prediction request", {
        url: FASTAPI_URL,
        summaryLength: summary.length,
        experienceLength: experience_desc.length,
        years_experience,
    });

    let response;

    try {
        response = await fetch(`${FASTAPI_URL}/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(requestId ? { "x-request-id": requestId } : {}),
            },
            body: JSON.stringify({
                summary,
                experience_desc,
                years_experience,
            }),
            signal: AbortSignal.timeout(30000),
        });
    } catch (err) {
        log("ERROR", "Network failure to FastAPI", {
            error: err.message,
        });

        throw createError(
            "FASTAPI_UNREACHABLE",
            `Tidak dapat menghubungi model AI server di ${FASTAPI_URL}`,
            err.message,
            503
        );
    }

    let raw;

    try {
        raw = await response.json();
    } catch {
        const text = await response.text();
        log("ERROR", "Invalid JSON from FastAPI", { text });

        throw createError(
            "FASTAPI_INVALID_RESPONSE",
            "Response dari model server tidak valid",
            text,
            502
        );
    }

    if (!response.ok) {
        log("ERROR", "FastAPI returned error", {
            status: response.status,
            body: raw,
        });

        throw createError(
            "FASTAPI_ERROR",
            raw?.detail || raw?.message || "Model server error",
            raw,
            response.status
        );
    }

    log("INFO", "Prediction success", {
        predicted_job: raw.predicted_job,
        confidence: raw.confidence,
    });

    return {
        predicted_job: raw.predicted_job,
        confidence: raw.confidence,
        low_confidence: raw.low_confidence,
        prediction_gap: raw.prediction_gap,
        top_predictions: raw.top_predictions,
        probabilities: raw.probabilities,
    };
};

/**
 * Cek kesehatan koneksi ke FastAPI
 */
export const checkModelHealth = async () => {
    try {
        const response = await fetch(`${FASTAPI_URL}/health`, {
            method: "GET",
            signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
            const data = await response.json();
            return {
                status: "connected",
                model_server: FASTAPI_URL,
                model_loaded: data.model_loaded || false,
            };
        }

        return {
            status: "disconnected",
            model_server: FASTAPI_URL,
            model_response: false,
        };
    } catch (error) {
        return {
            status: "disconnected",
            model_server: FASTAPI_URL,
            error: error.message,
        };
    }
};