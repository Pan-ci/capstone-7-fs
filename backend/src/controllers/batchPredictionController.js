// Controller prediksi batch (upload CSV/XLSX)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";

import { runPrediction } from "../services/predictionService.js";
import {
    createBatchJob,
    appendBatchResult,
    finalizeBatchJob,
    getBatchJobById,
    getActiveBatchJobs,
    deleteBatchJobById,
    isJobExpired,
} from "../services/batchPredictionService.js";
import { parseBatchFile, validateBatchRow } from "../utils/batchFileParser.js";
import { buildCsvBuffer, buildXlsxBuffer } from "../utils/batchExport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, "../data/batch_template.csv");

const expiredResponse = (res) => {
    throw new AppError(
        "Hasil batch sudah dihapus karena melewati batas waktu penyimpanan (1 jam). Silakan unggah ulang file.",
        410,
        "JOB_EXPIRED"
    );
}

const getJobOrRespond = (req, res) => {
    const job = getBatchJobById(req.params.id);
    if (!job) {
        throw new AppError(`Batch job '${req.params.id}' tidak ditemukan.`, 404, "JOB_NOT_FOUND");
    }
    if (isJobExpired(job)) {
        expiredResponse(res);
        return null;
    }
    return job;
};

/**
 * GET /api/batch/template
 */
export const downloadTemplate = (req, res) => {
    if (!fs.existsSync(TEMPLATE_PATH)) {
        throw new AppError("Template batch tidak ditemukan.", 404, "TEMPLATE_NOT_FOUND");
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
        "Content-Disposition",
        'attachment; filename="batch_template.csv"'
    );
    fs.createReadStream(TEMPLATE_PATH).pipe(res);
};

/**
 * POST /api/batch/predictions
 */
export const uploadBatch = async (req, res, next) => {
    const start = Date.now();
    logger.info(
        "[BATCH] upload request received",
        "total duration",
        `${Date.now() - start}ms`
    );

    try {
        if (!req.file) {
            throw new AppError("File wajib diunggah (field: file).", 400, "INVALID_INPUT");
        }

        let parsed;
        try {
            parsed = await parseBatchFile(req.file.buffer, req.file.originalname);
        } catch (parseErr) {
            logger.error(
                "[BATCH]",
                req.requestId,
                parseErr.message,
                "total duration",
                `${Date.now() - start}ms`
            );
            throw new AppError(parseErr.message, 400, "INVALID_INPUT");
        }

        const job = createBatchJob(req.file.originalname, parsed.totalRows);

        res.status(202).json({
            status: "success",
            message: "Batch job dibuat. Pemrosesan berjalan di background.",
            data: {
                id: job.id,
                status: job.status,
                totalRows: job.totalRows,
                processedRows: job.processedRows,
                createdAt: job.createdAt,
                expiresAt: job.expiresAt,
            },
        });

        setImmediate(() => {
            processBatchJob(job.id, parsed.rows, req.requestId, start).catch((err) => {
                logger.error(
                    `[BATCH] Job ${job.id} failed:`,
                    req.requestId,
                    err.message,
                    "total duration",
                    `${Date.now() - start}ms`
                );
                finalizeBatchJob(job.id, "failed", err.message);
            });
        });
    } catch (error) {
        logger.error(
            "[BATCH]",
            req.requestId,
            error.message,
            "total duration",
            `${Date.now() - start}ms`
        );
        next(error);
    }
};

async function processBatchJob(jobId, rows, requestId, start) {
    logger.info(
        `[BATCH] Job ${jobId} started`,
        requestId,
        `rows=${rows.length}`,
        "total duration",
        `${Date.now() - start}ms`
    );

    for (const row of rows) {
        logger.info(
            `[BATCH] Job ${jobId} processing row ${row.rowIndex}/${rows.length}`,
            requestId,
            "total duration",
            `${Date.now() - start}ms`
        );

        const validationError = validateBatchRow(row);
        if (validationError) {
            appendBatchResult(jobId, {
                row: row.rowIndex,
                input: { text: row.text, num: row.num },
                experienceDesc: row.experienceDesc,
                cvSummary: row.cvSummary,
                error: validationError,
            });
            continue;
        }

        try {
            const result = await runPrediction({
                summary: row.cvSummary || row.text || "N/A",
                experience_desc: row.experienceDesc || row.text || "N/A",
                years_experience: row.num,
            });
            appendBatchResult(jobId, {
                row: row.rowIndex,
                input: { text: row.text, num: row.num },
                experienceDesc: row.experienceDesc,
                cvSummary: row.cvSummary,
                predicted_job: result.predicted_job,
                confidence: result.confidence,
                low_confidence: result.low_confidence,
                prediction_gap: result.prediction_gap,
                top_predictions: result.top_predictions,
                probabilities: result.probabilities,
            });
            logger.info(
                `[BATCH] Job ${jobId} finished row ${row.rowIndex}/${rows.length}`,
                requestId,
                "total duration",
                `${Date.now() - start}ms`
            );
        } catch (err) {
            logger.error(
                `[BATCH] Prediction failed for job ${jobId}, row ${row.rowIndex}:`,
                requestId,
                err.message,
                "total duration",
                `${Date.now() - start}ms`
            );
            appendBatchResult(jobId, {
                row: row.rowIndex,
                input: { text: row.text, num: row.num },
                experienceDesc: row.experienceDesc,
                cvSummary: row.cvSummary,
                error: err.message,
            });
        }
    }

    finalizeBatchJob(jobId, "completed");
    logger.info(
        `[BATCH] Job ${jobId} completed`,
        requestId,
        "total duration",
        `${Date.now() - start}ms`
    );
}

/**
 * GET /api/batch/predictions
 */
export const listBatchJobs = (req, res) => {
    const active = getActiveBatchJobs();
    res.json({
        status: "success",
        count: active.length,
        data: active.map((j) => ({
            id: j.id,
            fileName: j.fileName,
            status: j.status,
            totalRows: j.totalRows,
            processedRows: j.processedRows,
            createdAt: j.createdAt,
            expiresAt: j.expiresAt,
        })),
    });
};

/**
 * GET /api/batch/predictions/:id
 */
export const getBatchJob = (req, res) => {
    const job = getJobOrRespond(req, res);
    if (!job) return;

    res.json({
        status: "success",
        data: {
            id: job.id,
            fileName: job.fileName,
            status: job.status,
            totalRows: job.totalRows,
            processedRows: job.processedRows,
            createdAt: job.createdAt,
            expiresAt: job.expiresAt,
            error: job.error || null,
            results: job.results,
        },
    });
};

/**
 * GET /api/batch/predictions/:id/download
 */
export const downloadBatchResults = async (req, res) => {
    const start = Date.now();
    const job = getJobOrRespond(req, res);
    if (!job) return;

    logger.info(
        `[BATCH] Download request for job ${job.id}`,
        req.requestId,
        "status",
        job.status,
        "total duration",
        `${Date.now() - start}ms`
    );
    if (job.status === "processing") {
        throw new AppError("Job masih diproses. Tunggu hingga selesai sebelum mengunduh.", 409, "JOB_PROCESSING");
    }

    const format = (req.query.format || "csv").toLowerCase();
    const baseName = (job.fileName || "batch_results").replace(/\.[^.]+$/, "");

    if (format === "xlsx") {
        const buffer = await buildXlsxBuffer(job);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${baseName}_results.xlsx"`
        );
        return res.send(buffer);
    }

    const buffer = buildCsvBuffer(job);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${baseName}_results.csv"`
    );
    return res.send(buffer);
};

/**
 * DELETE /api/batch/predictions/:id
 */
export const deleteBatchJob = (req, res) => {
    const job = getBatchJobById(req.params.id);
    if (!job) {
        throw new AppError(`Batch job '${req.params.id}' tidak ditemukan.`, 404, "JOB_NOT_FOUND");
    }

    deleteBatchJobById(req.params.id);
    res.json({
        status: "success",
        message: `Batch job '${req.params.id}' berhasil dihapus.`,
    });
};
