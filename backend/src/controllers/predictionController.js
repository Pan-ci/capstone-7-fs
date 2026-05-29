// Controller untuk prediksi pekerjaan menggunakan model AI

import { runPrediction, checkModelHealth } from "../services/predictionService.js";
import { savePrediction } from "../services/predictionHistoryService.js";
import {logger} from "../utils/logger.js";
import { AppError } from "../utils/appError.js";

/**
 * POST /api/predictions
 * Jalankan prediksi AI dan simpan hasilnya ke riwayat
 */
export const predictJob = async (req, res, next) => {
    const start = Date.now();
    try {
        const { summary, experience_desc, years_experience } = req.body;

        // Validasi: summary harus diisi
        if (!summary || summary.trim() === "") {
            throw new AppError("Harap isi rangkuman profil/CV (summary).", 400, "INVALID_INPUT");
        }

        // Validasi: experience_desc harus diisi
        if (!experience_desc || experience_desc.trim() === "") {
            throw new AppError("Harap isi deskripsi pengalaman kerja.", 400, "INVALID_INPUT");
        }

        // Validasi: years_experience harus angka valid
        if (
            years_experience === undefined ||
            years_experience === null ||
            isNaN(Number(years_experience)) ||
            Number(years_experience) < 0
        ) {
            throw new AppError("Harap isi pengalaman kerja (tahun) dengan angka yang valid (≥ 0).", 400, "INVALID_INPUT");
        }

        // Validasi: years_experience harus angka valid
        if (
            years_experience === undefined ||
            years_experience === null ||
            isNaN(Number(years_experience)) ||
            Number(years_experience) < 0
        ) {
            throw new AppError("Harap isi pengalaman kerja (tahun) dengan angka yang valid (≥ 0).", 400, "INVALID_INPUT");
        }

        const inputData = {
            summary: summary.trim(),
            experience_desc: experience_desc.trim(),
            years_experience: Number(years_experience),
        };

        // Jalankan prediksi ke model AI (FastAPI)
        const result = await runPrediction(inputData);

        // Ambil userId dari token JWT (jika login), atau null
        const userId = req.user ? req.user.id : null;

        // Simpan hasil ke PostgreSQL
        const savedRecord = await savePrediction(userId, inputData, result);

        res.status(201).json({
            status: "success",
            data: {
                id: savedRecord.id,
                createdAt: savedRecord.created_at,
                ...result,
            },
        });
    } catch (error) {
        logger.error(
            "[SINGLE PREDICTION]",
            req.requestId,
            error.message,
            "total duration",
            `${Date.now() - start}ms`
        );
        next(error);
    }
};

/**
 * GET /api/model/health
 * Cek status koneksi ke model AI server (FastAPI)
 */
export const getModelHealth = async (req, res, next) => {
    const start = Date.now();
    try {
        const health = await checkModelHealth();
        res.json({
            status: "success",
            data: health,
        });
    } catch (error) {
        logger.error(
            "[MODEL HEALTH]",
            req.requestId,
            error.message,
            "total duration",
            `${Date.now() - start}ms`
        );
        next(error);
    }
};
