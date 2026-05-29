// Service untuk job prediksi batch (storage terpisah dari riwayat tunggal)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "../data/batchJobs.json");

export const BATCH_RETENTION_MS = Number(process.env.BATCH_RETENTION_MS) || 3600000;
export const BATCH_MAX_ROWS = Number(process.env.BATCH_MAX_ROWS) || 500;

let jobs = [];

const loadFromFile = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, "utf-8");
            jobs = JSON.parse(raw);
            if (!Array.isArray(jobs)) jobs = [];
            logger.info("BatchService", null, `Loaded ${jobs.length} batch job(s).`);
        } else {
            jobs = [];
        }
    } catch (err) {
        logger.error("BatchService", null, "Gagal memuat file batch:", err.message);
        jobs = [];
    }
};

const saveToFile = () => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2), "utf-8");
    } catch (err) {
        logger.error("BatchService", null, "Gagal menyimpan file batch:", err.message);
    }
};

loadFromFile();

const generateId = () =>
    `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const computeExpiresAt = (createdAt = new Date()) =>
    new Date(new Date(createdAt).getTime() + BATCH_RETENTION_MS).toISOString();

export const isJobExpired = (job) => {
    if (!job?.expiresAt) return true;
    return new Date(job.expiresAt).getTime() <= Date.now();
};

/**
 * Buat job batch baru
 */
export const createBatchJob = (fileName, totalRows) => {
    const createdAt = new Date().toISOString();
    const job = {
        id: generateId(),
        fileName: fileName || "upload.csv",
        status: "processing",
        createdAt,
        expiresAt: computeExpiresAt(createdAt),
        totalRows,
        processedRows: 0,
        results: [],
    };

    jobs.unshift(job);
    saveToFile();
    logger.info("BatchService", null, `Created job ${job.id} (${totalRows} rows)`);
    return job;
};

/**
 * Update progress setelah satu baris selesai
 */
export const appendBatchResult = (jobId, rowResult) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;

    job.results.push(rowResult);
    job.processedRows = job.results.length;
    saveToFile();
    return job;
};

/**
 * Tandai job selesai atau gagal
 */
export const finalizeBatchJob = (jobId, status, errorMessage = null) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;

    job.status = status;
    if (errorMessage) job.error = errorMessage;
    saveToFile();
    logger.info("BatchService", null, `Job ${jobId} → ${status}`);
    return job;
};

/**
 * Ambil job by id (termasuk yang expired — caller harus cek)
 */
export const getBatchJobById = (id) => jobs.find((j) => j.id === id) || null;

/**
 * Daftar job yang belum expired
 */
export const getActiveBatchJobs = () =>
    jobs.filter((j) => !isJobExpired(j));

/**
 * Hapus satu job
 */
export const deleteBatchJobById = (id) => {
    const index = jobs.findIndex((j) => j.id === id);
    if (index === -1) return false;
    jobs.splice(index, 1);
    saveToFile();
    logger.info("BatchService", null, `Deleted job ${id}`);
    return true;
};

/**
 * Hapus semua job yang sudah kedaluwarsa
 * @returns {number} jumlah yang dihapus
 */
export const purgeExpiredBatchJobs = () => {
    const before = jobs.length;
    jobs = jobs.filter((j) => !isJobExpired(j));
    const removed = before - jobs.length;
    if (removed > 0) {
        saveToFile();
        logger.info("BatchService", null, `Purged ${removed} expired job(s).`);
    }
    return removed;
};

/**
 * Untuk testing: set expiresAt ke masa lalu
 */
export const setJobExpiresAt = (id, expiresAt) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return null;
    job.expiresAt = expiresAt;
    saveToFile();
    return job;
};
