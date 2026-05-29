// Routing utama API backend

import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { predictJob, getModelHealth } from "../controllers/predictionController.js";
import { readiness } from "../controllers/healthController.js";
import {
    getAll,
    getById,
    deleteById,
    deleteAll,
} from "../controllers/predictionHistoryController.js";
import {
    downloadTemplate,
    uploadBatch,
    listBatchJobs,
    getBatchJob,
    downloadBatchResults,
    deleteBatchJob,
} from "../controllers/batchPredictionController.js";
import { register, login, getMe } from "../controllers/authController.js";
import { batchUpload, handleMulterError } from "../middlewares/uploadMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// ===== Health Check =====
// GET /api/health — cek koneksi FE-BE
router.get("/health", (req, res) => {
    res.json({
        status: "success",
        message: "Backend is running and connected!",
        timestamp: new Date().toISOString(),
    });
});

// GET /api/model/health — cek status model AI (FastAPI)
router.get("/model/health", getModelHealth);

// GET /api/ready — readiness check (DB + model)
router.get("/ready", readiness);

// ===== Auth =====
// POST /api/auth/register
router.post("/auth/register", register);

// POST /api/auth/login
router.post("/auth/login", login);

// GET /api/auth/me — ambil profil user yang login
router.get("/auth/me", authMiddleware, getMe);

// ===== Batch Predictions =====
router.get("/batch/template", downloadTemplate);
router.post(
    "/batch/predictions",
    authMiddleware,
    (req, res, next) => {
        batchUpload(req, res, (err) => {
            if (err) return handleMulterError(err, req, res, next);
            next();
        });
    },
    uploadBatch
);
router.get("/batch/predictions", authMiddleware, listBatchJobs);
router.get("/batch/predictions/:id/download", authMiddleware, downloadBatchResults);
router.get("/batch/predictions/:id", authMiddleware, getBatchJob);
router.delete("/batch/predictions/:id", authMiddleware, deleteBatchJob);

// ===== Predictions (RESTful CRUD) =====
// POST /api/predictions — buat prediksi baru + simpan ke riwayat
router.post(
    "/predictions",
    authMiddleware,
    predictJob
);

// GET /api/predictions — ambil riwayat prediksi (per-user)
router.get(
    "/predictions",
    authMiddleware,
    getAll
);

// GET /api/predictions/:id
router.get(
    "/predictions/:id",
    authMiddleware,
    getById
);

// DELETE /api/predictions/:id
router.delete(
    "/predictions/:id",
    authMiddleware,
    deleteById
);

// DELETE /api/predictions
router.delete(
    "/predictions",
    authMiddleware,
    deleteAll
);

export default router;